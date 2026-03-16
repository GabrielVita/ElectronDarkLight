import { useState, useEffect } from 'react';
import { Search, Eye, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { ModalDetails } from '../components/ModalDetails';
import { TitleBar } from '../components/TitleBar';

// Interface com os campos necessários para verificação
export interface NonConformity {
  id: string;
  startTimestamp: string;
  endTimestamp: string;
  averageValueNonConformity: number;
  savedIn: Date;
  type: string; // "TEMPERATURE" ou "HUMIDITY"
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
  equipment: z.string(),
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

  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { 
        equipment: 'todos',
        dateInit: '2026-01-01',
        dateEnd: today
    }
  });

  // Função para retornar unidade e estilo com base no tipo
  const getMeasurementDetails = (item: NonConformity) => {
    const isHumidity = item.type === 'HUMIDITY' || item.device.function === 'HUMIDITY';
    
    return {
      unit: isHumidity ? '%' : '°C',
      label: isHumidity ? 'Umidade' : 'Temperatura',
      // Estilo visual: Azul para umidade, Vermelho para temperatura
      styles: isHumidity 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' 
        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    };
  };

  const fetchData = async (data: FilterFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      const savedUser = localStorage.getItem('@App:user');

      if (!token || !savedUser) return;

      const user = JSON.parse(savedUser);

      const response = await axios.post(
        'http://192.168.1.3:8087/api/nonconformities/resolved/no-action', 
        {
          sector: user.sector,
          startDate: data.dateInit,
          endDate: data.dateEnd
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAllInconformidades(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar inconformidades:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedEquipment = watch('equipment');

  useEffect(() => {
    if (selectedEquipment === 'todos') {
      setFilteredData(allInconformidades);
    } else {
      setFilteredData(allInconformidades.filter(item => item.device.equipment === selectedEquipment));
    }
  }, [selectedEquipment, allInconformidades]);

  useEffect(() => {
    fetchData({ equipment: 'todos', dateInit: '2026-01-01', dateEnd: today });
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
           <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Inconformidades</h1>
        </header>

        {/* FILTROS */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 mx-7">
            <form onSubmit={handleSubmit(fetchData)} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Equipamento</label>
                    <select {...register('equipment')} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 cursor-pointer focus:ring-primary transition-all">
                        <option value="todos">Todos os equipamentos</option>
                        {uniqueEquipments.map((name, idx) => (
                            <option key={idx} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Início em:</label>
                  <input type="date" {...register('dateInit')} onClick={(e) => e.currentTarget.showPicker()} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none cursor-pointer appearance-none block" />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Término em:</label>
                    <input type="date" {...register('dateEnd')} onClick={(e) => e.currentTarget.showPicker()} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none cursor-pointer" />
                </div>

                <button type="submit" disabled={loading} className="bg-primary dark:bg-secondary xl:transition xl:duration-700 xl:ease-in-out xl:hover:scale-105 cursor-pointer text-white dark:text-zinc-900 py-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    <Search size={18} />
                    {loading ? "Buscando..." : "Pesquisar"}
                </button>
            </form>
        </section>

        {/* CONTADOR */}
        <div className="mx-7 mb-4">
            <span className="bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary px-4 py-1.5 rounded-full text-xs font-bold border border-primary/20">
                {filteredData.length} registros encontrados
            </span>
        </div>

        {/* TABELA */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-l-3xl rounded-tr-sm mx-7 shadow-sm mb-10 overflow-y-auto max-h-600px
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
                      <th className="px-6 py-4 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">Início</th>
                      <th className="px-6 py-4 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fim</th>
                      <th className="px-6 py-4 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase text-center tracking-wider">Média</th>
                      <th className="px-6 py-4 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">Equipamento</th>
                      <th className="px-6 py-4 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 uppercase text-right tracking-wider">Ação</th>
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
                                <span className={`px-3 py-1 rounded-md transition-colors ${
                                  item.device.isBeingUsed 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                }`}>
                                  {item.device.equipment}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleOpenPopup(item)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:bg-primary dark:hover:bg-secondary hover:text-white dark:hover:text-zinc-800 transition-all cursor-pointer">
                                      <Eye size={16} />
                                  </button>
                              </td>
                          </tr>
                        );
                    })}
                </tbody>
            </table>

            {filteredData.length === 0 && !loading && (
                <div className="p-20 text-center text-zinc-400">
                    <AlertCircle size={40} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum dado encontrado.</p>
                </div>
            )}
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