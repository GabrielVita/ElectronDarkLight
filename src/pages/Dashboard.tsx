import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios, { AxiosError } from 'axios';
import { DeviceDetailsModal } from '../components/DeviceDetailsModal';
import { translateSector, SECTOR_TRANSLATIONS } from '../utils/translations'; // Certifique-se que SECTOR_TRANSLATIONS existe
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TitleBar } from '../components/TitleBar';

interface Device {
  id: string;
  name: string;
  equipment: string;
  isBeingUsed: boolean;
  sector: string;
  branch: string;
  function: string;
  deviceType: string;
  sensor: string;
  ip: string;
  patrimony: number;
  tag: string;
  minWorkingTemp: number | null;
  maxWorkingTemp: number | null;
  minWorkingHumidity: number | null;
  maxWorkingHumidity: number | null;
}

interface ReadingData {
  temperature: number | null;
  humidity: number | null;
  isTempOk: boolean;
  isHumidityOk: boolean;
}

interface ChartData {
  name: string;
  count: number;
}

export function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readings, setReadings] = useState<Record<string, ReadingData>>({});
  const [ncChartData, setNcChartData] = useState<ChartData[]>([]);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para buscar inconformidades por setor no mês atual
  const fetchNonConformities = useCallback(async (token: string) => {
    try {
      const now = new Date();
      
      // Formatação segura YYYY-MM-DD (Evita problemas de fuso horário do toISOString)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const firstDay = `${year}-${month}-01`; // Início do mês atual
      const lastDay = `${year}-${month}-${day}`;  // Data atual de acesso

      const sectors = Object.keys(SECTOR_TRANSLATIONS);

      console.log(`Buscando dados de ${firstDay} até ${lastDay}`);

      const promises = sectors.map(async (sectorKey) => {
        try {
          const response = await axios.post(
            `http://192.168.1.3:8087/api/nonconformities/period`, 
            {
              sector: sectorKey,
              startDate: firstDay,
              endDate: lastDay
            }, 
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          return {
            name: translateSector(sectorKey),
            count: Array.isArray(response.data) ? response.data.length : 0
          };
        } catch (err: any) {
          // Log detalhado para capturar se o backend enviar alguma mensagem de erro no corpo
          console.error(`Erro no setor ${sectorKey}:`, err.response?.data || err.message);
          return { name: translateSector(sectorKey), count: 0 };
        }
      });

      const results = await Promise.all(promises);
      
      // Atualiza o gráfico apenas com setores que têm dados
      const filteredResults = results.filter(item => item.count > 0);
      setNcChartData(filteredResults);
      
    } catch (error) {
      console.error('Erro ao buscar inconformidades para o gráfico:', error);
    }
  }, []);

  const fetchReadingType = async (deviceId: string, type: 'TEMPERATURE' | 'HUMIDITY', token: string) => {
    try {
      const response = await axios.get(`http://192.168.1.3:8087/api/devices/${deviceId}/readings/moment?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.value;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 404) return null;
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedUser = localStorage.getItem('@App:user');
      const token = localStorage.getItem('@App:token');

      if (!savedUser || !token) {
        setIsLoading(false);
        return;
      }

      // Busca dados do gráfico
      await fetchNonConformities(token);

      const response = await axios.get(`http://192.168.1.3:8087/api/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      
      if (Array.isArray(data)) {
        setDevices(data); 
        setDeviceCount(data.length);
        setUsedCount(data.filter((device: Device) => device.isBeingUsed).length);

        const readingsMap: Record<string, ReadingData> = {};

        const promises = data.map(async (device: Device) => {
          const temp = await fetchReadingType(device.id, 'TEMPERATURE', token);
          let hum = device.function === 'ROOM' ? await fetchReadingType(device.id, 'HUMIDITY', token) : null;

          let tempOk = true;
          if (temp !== null && device.minWorkingTemp !== null && device.maxWorkingTemp !== null) {
            tempOk = temp >= device.minWorkingTemp && temp <= device.maxWorkingTemp;
          }

          let humOk = true;
          if (hum !== null && device.minWorkingHumidity !== null && device.maxWorkingHumidity !== null) {
            humOk = hum >= device.minWorkingHumidity && hum <= device.maxWorkingHumidity;
          }
          
          readingsMap[device.id] = { 
            temperature: temp, 
            humidity: hum,
            isTempOk: tempOk,
            isHumidityOk: humOk
          };
        });

        await Promise.all(promises);
        setReadings(readingsMap); 
      }
    } catch (error: any) {
      console.error('Erro geral na requisição:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNonConformities]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const equipamentosFiltrados = devices.filter(item => {
    if (filter === 'Todos') return true;
    if (filter === 'Ativos') return item.isBeingUsed === true;
    if (filter === 'Inconformes') {
      const r = readings[item.id];
      return r && (!r.isTempOk || !r.isHumidityOk);
    }
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 flex flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        
        <header className="p-8">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Sensores e informações gerais
          </h1>
          <p className="text-zinc-500">Monitoramento em tempo real</p>
        </header>

        <section className="p-8 pt-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Equipamentos */}
            <div className="text-xl gap-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col items-start justify-between text-zinc-800 dark:text-zinc-400">
                <div>Equipamentos</div>
                <div className='flex flex-row w-full justify-between items-center text-sm font-semibold text-zinc-500'>
                  <div>Totais</div>
                  <div>Ativos</div>
                </div>
                {(deviceCount !== null) && (
                <div className='flex flex-row w-full justify-between items-center'>
                  <div className='text-4xl text-blue-500 font-bold'>{deviceCount}</div>
                  <div className='text-4xl text-green-500 font-bold'>{usedCount}</div>
                </div>
                )}
            </div>

            {/* Gráfico: Ocupa 2 grids (md:col-span-2) */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col justify-between">
              <div className="text-sm font-bold uppercase text-zinc-500 mb-2">Inconformidades por Setor (Mês Atual)</div>
              
              <div className="h-32 w-full">
                {ncChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ncChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} 
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          fontWeight: 'bold',
                          backgroundColor: '#18181b', 
                          color: '#fff'
                        }}
                        labelStyle={{ color: '#a1a1aa' }}
                        itemStyle={{ color: '#eb4034' }}
                      />
                      <Bar dataKey="count" name="Qtd" radius={[6, 6, 0, 0]} barSize={40}>
                        {ncChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#eb4034' : '#3f3f46'} fillOpacity={1} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">
                    Nenhuma inconformidade registrada este mês.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

          <div className="px-8 pb-6 flex flex-wrap items-center gap-4">
            <div className='font-semibold text-zinc-800 dark:text-zinc-100'>Filtrar por: </div>
            {/* Filtro de Status */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
              {['Todos', 'Ativos', 'Inconformes'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer
                    ${filter === status 
                      ? 'bg-primary/30 text-primary dark:bg-secondary/10 dark:text-secondary rounded-lg shadow-sm' 
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        
          <div className="mt-6 mx-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-l-3xl rounded-tr-sm shadow-sm flex-1 mb-8 relative overflow-y-auto 
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-zinc-300
            dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Equipamento
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider text-center">
                    Setor
                  </th>
                  {/* <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider text-center">
                    Inconformidades
                  </th> */}
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Temp. Recente
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Umidade Recente
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 ">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 animate-pulse">Carregando sensores...</td>
                  </tr>
                ) : equipamentosFiltrados.map((item) => {
                    // --- LÓGICA DE EXIBIÇÃO ---
                    const reading = readings[item.id];
                    const tempClass = reading?.temperature !== null && !reading.isTempOk 
                      ? 'text-red-600 dark:text-red-400 font-bold' 
                      : 'text-zinc-600 dark:text-zinc-400';
                    
                    const humClass = reading?.humidity !== null && !reading.isHumidityOk 
                      ? 'text-red-600 dark:text-red-400 font-bold' 
                      : 'text-zinc-600 dark:text-zinc-400';

                    const tempDisplay = reading?.temperature !== null ? `${reading.temperature}°C` : '--';
                    const humDisplay = item.function === 'ROOM' 
                      ? (reading?.humidity !== null ? `${reading.humidity}%` : '--')
                      : '--';

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group ">
                        <td className="px-6 py-4 font-bold text-sm">
                          <span className={`px-2 py-1 rounded-md ${
                            item.isBeingUsed 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                          }`}>
                            {item.equipment}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2 py-1 text-center bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 ">
                            {translateSector(item.sector)}
                          </span>
                        </td>
                        {/* <td className="px-6 py-4 text-center">
                          --
                        </td> */}
                        <td className={`px-6 py-4 text-base ${tempClass}`}>
                          {tempDisplay}
                        </td>
                        <td className={`px-6 py-4 text-base ${humClass}`}>
                          {humDisplay}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedDevice(item);
                              setIsModalOpen(true);
                            }}
                            className="bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-zinc-900 transition-all cursor-pointer"
                          >
                            Ver mais
                          </button>
                        </td>
                      </tr>
                    );
                })}
                
                {!isLoading && equipamentosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                      Nenhum sensor encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
        <DeviceDetailsModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          device={selectedDevice} 
        />

      </main>
    </div>
  );
}