import { useState, useEffect } from 'react';
import { Search, Eye, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { ModalDetails } from '../components/ModalDetails';
import { TitleBar } from '../components/TitleBar';
import { SECTOR_TRANSLATIONS } from '../utils/translations';

export interface NonConformity {
  id: string;
  startTimestamp: string;
  endTimestamp: string;
  averageValueNonConformity: number;
  savedIn: Date;
  type: string;
  device: {
    equipment: string;
    name: string;
    tag: string;
    isBeingUsed: boolean;
    id: string;
    function: string;
  };
}

const filterSchema = z.object({
  equipment: z.string().optional(),
  sector: z.string().optional(),
  dateInit: z.string().min(1, "Data inicial obrigatória"),
  dateEnd: z.string().min(1, "Data final obrigatória"),
});

type FilterFormData = z.infer<typeof filterSchema>;

export function Inconformes() {
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInconformity, setSelectedInconformity] = useState<NonConformity | null>(null);
  const [allInconformidades, setAllInconformidades] = useState<NonConformity[]>([]);
  const [filteredData, setFilteredData] = useState<NonConformity[]>([]);
  const [loading, setLoading] = useState(false);

  const userRaw = localStorage.getItem('@App:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user?.role === 'ADMIN';

  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const today = new Date().toISOString().split('T')[0];

  // Adicionado setValue para poder resetar campos programaticamente
  const { register, handleSubmit, watch, setValue } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { 
        equipment: 'todos',
        sector: 'LABORATORY',
        dateInit: '2026-01-01',
        dateEnd: today
    }
  });

  const watchedSector = watch('sector');
  const selectedEquipment = watch('equipment');

  const getMeasurementDetails = (item: NonConformity) => {
    const isHumidity = item.type === 'HUMIDITY' || item.device.function === 'HUMIDITY';
    return {
      unit: isHumidity ? '%' : '°C',
      styles: isHumidity 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' 
        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    };
  };

  const fetchData = async (formData: FilterFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      if (!token || !user) return;

      const url = isAdmin 
        ? 'http://192.168.1.3:8087/api/nonconformities/period'
        : 'http://192.168.1.3:8087/api/nonconformities/resolved/no-action';

      const payload = {
        sector: isAdmin ? formData.sector : user.sector,
        startDate: formData.dateInit,
        endDate: formData.dateEnd
      };

      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllInconformidades(response.data);
    } catch (error) {
      console.error("Erro ao buscar inconformidades:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. EFEITO PARA ADMIN: Quando trocar o setor, busca novos dados e reseta o select de equipamento
  useEffect(() => {
    if (isAdmin && watchedSector) {
      setValue('equipment', 'todos'); // Reseta o filtro de aparelhos para não conflitar
      fetchData(watch());
    }
  }, [watchedSector]);

  // 2. FILTRO LOCAL: Atualiza a tabela baseada no select de equipamento
  useEffect(() => {
    if (selectedEquipment === 'todos') {
      setFilteredData(allInconformidades);
    } else {
      setFilteredData(allInconformidades.filter(item => item.device.equipment === selectedEquipment));
    }
  }, [selectedEquipment, allInconformidades]);

  // Busca inicial
  useEffect(() => {
    fetchData(watch());
  }, []);

  const handleOpenPopup = (item: NonConformity) => {
    setSelectedInconformity(item);
    setIsModalOpen(true);
  };

  const uniqueEquipments = Array.from(new Set(allInconformidades.map(item => item.device.equipment)));

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="flex-1 pt-4 flex flex-col relative overflow-y-auto bg-primary/15 dark:bg-zinc-950">
        <header className="p-8">
           <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
             Inconformidades {isAdmin && <span className="text-sm font-normal opacity-60">(Painel Admin)</span>}
           </h1>
        </header>

        <section className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 mx-7">
          <form onSubmit={handleSubmit(fetchData)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            {isAdmin && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Setor</label>
                <select 
                  {...register('sector')} 
                  className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 cursor-pointer focus:ring-primary transition-all text-sm"
                >
                  <option value="todos">Todos os setores</option>
                  {Object.entries(SECTOR_TRANSLATIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Equipamento</label>
              <select 
                {...register('equipment')} 
                disabled={loading} // Desabilita enquanto carrega o novo setor
                className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 cursor-pointer focus:ring-primary transition-all text-sm disabled:opacity-50"
              >
                <option value="todos">Todos equipamentos</option>
                {uniqueEquipments.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Início</label>
              <input type="date" {...register('dateInit')} onClick={(e) => e.currentTarget.showPicker()} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none cursor-pointer text-sm" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Término</label>
              <input type="date" {...register('dateEnd')} onClick={(e) => e.currentTarget.showPicker()} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none cursor-pointer text-sm" />
            </div>

            <button type="submit" disabled={loading} className="bg-primary dark:bg-secondary xl:transition xl:duration-700 xl:ease-in-out xl:hover:scale-105 cursor-pointer text-white dark:text-zinc-900 py-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 h-[44px]">
              <Search size={18} />
              {loading ? "..." : "Pesquisar"}
            </button>
          </form>
        </section>

        {/* ... restante do código (Tabela e Modal) permanece igual ... */}
        <div className="mx-7 mb-4">
            <span className="bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary px-4 py-1.5 rounded-full text-xs font-bold border border-primary/20">
                {filteredData.length} registros encontrados
            </span>
        </div>

        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-l-3xl rounded-tr-sm mx-7 shadow-sm mb-10 overflow-y-auto max-h-[600px]
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-zinc-300
          dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400
          dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
          <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Início</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Fim</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-center">Média</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Equipamento</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ação</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredData.map((item) => {
                        const details = getMeasurementDetails(item);
                        return (
                          <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="px-6 py-4 text-sm">{dateFormatter.format(new Date(item.startTimestamp))}</td>
                              <td className="px-6 py-4 text-sm">{dateFormatter.format(new Date(item.endTimestamp))}</td>
                              <td className="px-6 py-4 text-center">
                                  <span className={`${details.styles} px-3 py-1 rounded-lg text-xs font-bold`}>
                                      {item.averageValueNonConformity.toFixed(1)}{details.unit}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold">
                                <span className={`px-3 py-1 rounded-md ${item.device.isBeingUsed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-blue-100 text-blue-700'}`}>
                                  {item.device.equipment}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleOpenPopup(item)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:bg-primary dark:hover:bg-secondary transition-all cursor-pointer">
                                      <Eye size={16} />
                                  </button>
                              </td>
                          </tr>
                        );
                    })}
                </tbody>
            </table>
        </section>

        <ModalDetails 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          data={selectedInconformity} 
          onSuccess={() => fetchData(watch())} 
        />
      </main>
    </div>
  );
}