import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';
import { DeviceCard } from '../components/DeviceCard';
import { Calendar, LayoutDashboard, RefreshCcw, Filter } from 'lucide-react';
import { SECTOR_TRANSLATIONS } from '../utils/translations';

export function DeviceInsights() {
  const [isOpen, setIsOpen] = useState(true);
  const [allDevices, setAllDevices] = useState<any[]>([]); // Todos os devices vindos da API
  const [filteredDevices, setFilteredDevices] = useState<any[]>([]); // Devices após filtros de UI
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const userRaw = localStorage.getItem('@App:user');
  const user = useMemo(() => (userRaw ? JSON.parse(userRaw) : null), [userRaw]);
  const isAdmin = user?.role === 'ADMIN';

  // Filtros de UI
  const [selectedSector, setSelectedSector] = useState(isAdmin ? 'LABORATORY' : user?.sector);
  const [selectedEquipment, setSelectedEquipment] = useState('todos');

  const initialDates = useMemo(() => {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - (120 * 60 * 1000));
    return {
      start: twoHoursAgo.toISOString().slice(0, 16),
      end: now.toISOString().slice(0, 16)
    };
  }, []);

  const [tempStartDate, setTempStartDate] = useState(initialDates.start);
  const [tempEndDate, setTempEndDate] = useState(initialDates.end);
  const [appliedDates, setAppliedDates] = useState(initialDates);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      if (!token || !user) return;

      // Se for Admin, buscamos os dispositivos do setor selecionado via parâmetro (se a API suportar)
      // Caso a API /api/devices não aceite filtro de setor, filtramos no front.
      const url = isAdmin 
        ? `http://192.168.1.3:8087/api/devices` 
        : `http://192.168.1.3:8087/api/devices/user/${user.id}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activeDevices = response.data.filter((d: any) => d.isBeingUsed);
      setAllDevices(activeDevices);
    } catch (error) {
      console.error("Erro ao buscar devices", error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [isAdmin, user]);

  // Busca inicial
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Lógica de filtragem em cascata (Setor -> Equipamento)
  useEffect(() => {
    let result = allDevices;

    // 1. Filtrar por Setor (apenas se for Admin, pois user normal já recebe filtrado)
    if (isAdmin && selectedSector) {
      result = result.filter(d => d.sector === selectedSector);
    }

    // 2. Filtrar por Equipamento
    if (selectedEquipment !== 'todos') {
      result = result.filter(d => d.equipment === selectedEquipment);
    }

    setFilteredDevices(result);
  }, [allDevices, selectedSector, selectedEquipment, isAdmin]);

  // Resetar equipamento ao mudar de setor
  useEffect(() => {
    setSelectedEquipment('todos');
  }, [selectedSector]);

  const uniqueEquipments = useMemo(() => 
    Array.from(new Set(allDevices.filter(d => !isAdmin || d.sector === selectedSector).map(d => d.equipment))),
    [allDevices, selectedSector, isAdmin]
  );

  const handleApplyFilter = () => {
    setAppliedDates({ start: tempStartDate, end: tempEndDate });
    fetchDevices(); // Recarrega para garantir dados frescos
  };

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <main className="flex-1 pt-4 flex flex-col relative overflow-y-auto bg-primary/15 dark:bg-zinc-950
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-zinc-300
      dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400
      dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
        <header className="p-8 flex flex-col gap-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary dark:bg-secondary rounded-2xl text-white shadow-lg">
                <LayoutDashboard className='text-white dark:text-zinc-900' size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none">Insights</h1>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Análise de Ativos</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 pl-4 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                {/* <Calendar size={16} className="text-primary" /> */}
                <div className="flex items-center gap-2">
                  <input type="datetime-local" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="bg-transparent text-md font-bold outline-none dark:text-zinc-100 cursor-pointer" />
                  <span className="text-xs font-black text-zinc-400">ATÉ</span>
                  <input type="datetime-local" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="bg-transparent text-md font-bold outline-none dark:text-zinc-100 cursor-pointer" />
                </div>
              </div>
              <button onClick={handleApplyFilter} disabled={loading} className="flex items-center gap-2 bg-primary dark:bg-secondary hover:bg-primary/90 dark:hover:bg-secondary/90 text-white dark:text-zinc-900 cursor-pointer px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all active:scale-95 shadow-lg group">
                <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 text-white dark:text-zinc-900`} />
                {loading ? 'Buscando...' : 'Atualizar'}
              </button>
            </div>
          </div>

          {/* Barra de Filtros Adicionais (Setor e Equipamento) */}
          <div className="flex flex-wrap gap-4 items-center bg-white/50 dark:bg-zinc-900/50 p-2 rounded-xl border border-white dark:border-zinc-800 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Filtros:</span>
            </div>

            {isAdmin && (
              <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-white dark:bg-zinc-800 text-[11px] font-bold px-4 py-2 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 dark:text-zinc-100 cursor-pointer"
              >
                {Object.entries(SECTOR_TRANSLATIONS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            )}

            <select 
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="bg-white dark:bg-zinc-800 text-[11px] font-bold px-4 py-2 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 dark:text-zinc-100 cursor-pointer"
            >
              <option value="todos">Todos Equipamentos</option>
              {uniqueEquipments.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="px-8 pb-10 grid grid-cols-1 gap-8 max-w-7xl mx-auto w-full">
          {!isInitialLoading && filteredDevices.length > 0 ? (
            filteredDevices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                startDate={appliedDates.start} 
                endDate={appliedDates.end} 
              />
            ))
          ) : (
            !isInitialLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 italic">
                Nenhum dispositivo encontrado para este filtro.
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}