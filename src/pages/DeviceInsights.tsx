import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';
import { DeviceCard } from '../components/DeviceCard';
import { Calendar, LayoutDashboard, RefreshCcw } from 'lucide-react';

export function DeviceInsights() {
  const [isOpen, setIsOpen] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // 1. Calculamos as datas iniciais de forma estável
  const initialDates = useMemo(() => {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - (120 * 60 * 1000));
    return {
      start: twoHoursAgo.toISOString().slice(0, 16),
      end: now.toISOString().slice(0, 16)
    };
  }, []);

  // 2. Inicializamos os estados JÁ COM OS VALORES das últimas 2h
  const [tempStartDate, setTempStartDate] = useState(initialDates.start);
  const [tempEndDate, setTempEndDate] = useState(initialDates.end);
  const [appliedDates, setAppliedDates] = useState(initialDates);

  const handleApplyFilter = () => {
    setAppliedDates({
      start: tempStartDate,
      end: tempEndDate
    });
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const savedUser = localStorage.getItem('@App:user');
        const token = localStorage.getItem('@App:token');
        if (!savedUser || !token) return;
        const user = JSON.parse(savedUser);
        const response = await axios.get(`http://192.168.1.3:8087/api/devices/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDevices(response.data.filter((d: any) => d.isBeingUsed));
      } catch (error) {
        console.error("Erro ao buscar devices", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchDevices();
  }, []);

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
        <header className="p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none">Insights</h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dados em tempo real</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 pl-4 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
              <Calendar size={16} className="text-primary" />
              <div className="flex items-center gap-2">
                <input type="datetime-local" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="bg-transparent text-[11px] font-black outline-none dark:text-zinc-100 cursor-pointer" />
                <span className="text-[10px] font-black text-zinc-400">ATÉ</span>
                <input type="datetime-local" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="bg-transparent text-[11px] font-black outline-none dark:text-zinc-100 cursor-pointer" />
              </div>
            </div>
            <button onClick={handleApplyFilter} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all active:scale-95 shadow-lg shadow-primary/20 group">
              <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Atualizar Insights
            </button>
          </div>
        </header>

        <div className="px-8 pb-10 grid grid-cols-1 gap-8 max-w-7xl mx-auto w-full">
          {!isInitialLoading && devices.map((device) => (
            <DeviceCard 
              key={device.id} 
              device={device} 
              startDate={appliedDates.start} 
              endDate={appliedDates.end} 
            />
          ))}
        </div>
      </main>
    </div>
  );
}