import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios, { AxiosError } from 'axios'; // 1. Importe AxiosError
import { TitleBar } from '../components/TitleBar';
import { DeviceNCModal } from '../components/DeviceNCModal';
import { DeviceGraphicModal } from '../components/DeviceGraphicModal';
import { ChartLine } from 'lucide-react';
import { translateSector } from '../utils/translations';

interface Device {
  id: string;
  equipment: string;
  isBeingUsed: boolean;
  sector: string;
  branch: string;
  function: string;
  minWorkingTemp: number | null;
  maxWorkingTemp: number | null;
  minWorkingHumidity: number | null;
  maxWorkingHumidity: number | null;
}

interface NonConformity {
  id: string;
  sector: string;
  startTimestamp: Date,
  endTimestamp: Date,
  averageValueNonConformity: number,
  type: string,
  device: {
    id: string;
    equipment: string;
  };
  
}

// 2. Interface para guardar as leituras temporariamente
interface ReadingData {
  temperature: number | null;
  humidity: number | null;
  isTempOk: boolean;
  isHumidityOk: boolean;
}

export function Menu() {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readings, setReadings] = useState<Record<string, ReadingData>>({});

  const [totalNonConformities, setTotalNonConformities] = useState(0);
  const [deviceNCMap, setDeviceNCMap] = useState<Record<string, number>>({});

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allNonConformities, setAllNonConformities] = useState<NonConformity[]>([]);
  const [isGraphicModalOpen, setIsGraphicModalOpen] = useState(false);
  const [userSector, setUserSector] = useState<string | null>(null);

  const fetchReadingType = async (deviceId: string, type: 'TEMPERATURE' | 'HUMIDITY', token: string) => {
    try {
      const response = await axios.get(`http://192.168.1.3:8087/api/devices/${deviceId}/readings/moment?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.value; // Retorna o valor numérico
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 404) {
        return null;
      }
      console.error(`Erro ao buscar ${type} para ${deviceId}:`, axiosError.message);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const savedUser = localStorage.getItem('@App:user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserSector(userData.sector); // Armazena o setor do admin/user logado
    }
    try {
      const savedUser = localStorage.getItem('@App:user');
      const token = localStorage.getItem('@App:token');
      if (!savedUser || !token) return;

      const user = JSON.parse(savedUser);
      const { id: userId, role: userRole, sector: userSector } = user;
      
      const today = new Date().toISOString().split('T')[0];
      const startOfYear = "2026-01-01";
      
      // Cálculo de 8 dias atrás
      const eightDaysAgoDate = new Date();
      eightDaysAgoDate.setDate(eightDaysAgoDate.getDate() - 8);
      const eightDaysAgo = eightDaysAgoDate.toISOString().split('T')[0];

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // --- REQUISIÇÃO 1: TODOS OS DISPOSITIVOS ---
      const deviceRoute = userRole === "ADMIN" 
        ? `http://192.168.1.3:8087/api/devices/user/${userId}`
        : `http://192.168.1.3:8087/api/devices/user/${userId}`;
      
      const deviceRes = await axios.get(deviceRoute, config);
      const devicesData = deviceRes.data;

      // --- REQUISIÇÃO 2: INCONFORMIDADES DO ANO (Para o Card) ---
      const ncYearRes = await axios.post('http://192.168.1.3:8087/api/nonconformities/resolved/no-action', {
        sector: userSector,
        startDate: startOfYear,
        endDate: today
      }, config);
      setTotalNonConformities(ncYearRes.data.length);

      // --- REQUISIÇÃO 3: INCONFORMIDADES 8 DIAS (Para a Tabela) ---
      const ncEightDaysRes = await axios.post('http://192.168.1.3:8087/api/nonconformities/resolved/no-action', {
        sector: userSector,
        startDate: eightDaysAgo,
        endDate: today
      }, config);

      setAllNonConformities(ncEightDaysRes.data);

      // Criar mapa de contagem por dispositivo
      const countMap: Record<string, number> = {};
      ncEightDaysRes.data.forEach((nc: NonConformity) => {
        const dId = nc.device.id;
        countMap[dId] = (countMap[dId] || 0) + 1;
      });
      setDeviceNCMap(countMap);

      // --- PROCESSAMENTO DE LEITURAS (MANTIDO) ---
      if (Array.isArray(devicesData)) {
        setDevices(devicesData);
        setDeviceCount(devicesData.length);
        setUsedCount(devicesData.filter((d: Device) => d.isBeingUsed).length);

        const readingsMap: Record<string, ReadingData> = {};
        await Promise.all(devicesData.map(async (device: Device) => {
          const temp = await fetchReadingType(device.id, 'TEMPERATURE', token);
          let hum = device.function === 'ROOM' ? await fetchReadingType(device.id, 'HUMIDITY', token) : null;

          readingsMap[device.id] = {
            temperature: temp,
            humidity: hum,
            isTempOk: temp !== null && device.minWorkingTemp !== null && device.maxWorkingTemp !== null 
                      ? (temp >= device.minWorkingTemp && temp <= device.maxWorkingTemp) : true,
            isHumidityOk: hum !== null && device.minWorkingHumidity !== null && device.maxWorkingHumidity !== null
                      ? (hum >= device.minWorkingHumidity && hum <= device.maxWorkingHumidity) : true
          };
        }));
        setReadings(readingsMap);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // LÓGICA DE FILTRAGEM DOS DADOS REAIS
  const equipamentosFiltrados = devices
    // 1. Apenas ativos
    .filter(item => item.isBeingUsed)
    // 2. Filtro de UI (Todos vs Inconformes)
    .filter(item => {
      if (filter === 'Todos') return true;
      const reading = readings[item.id];
      const ncCount = deviceNCMap[item.id] || 0;
      const isOutOfRange = (reading?.temperature !== null && !reading?.isTempOk) || 
                           (reading?.humidity !== null && !reading?.isHumidityOk);
      
      return isOutOfRange || ncCount > 0;
    })
    // 3. Ordenação por Hierarquia
    .sort((a, b) => {
      const readingA = readings[a.id];
      const readingB = readings[b.id];
      const ncCountA = deviceNCMap[a.id] || 0;
      const ncCountB = deviceNCMap[b.id] || 0;

      // Critério 1: Está fora da faixa agora? (Prioridade Máxima)
      const isCriticalA = (readingA?.temperature !== null && !readingA?.isTempOk) || (readingA?.humidity !== null && !readingA?.isHumidityOk);
      const isCriticalB = (readingB?.temperature !== null && !readingB?.isTempOk) || (readingB?.humidity !== null && !readingB?.isHumidityOk);

      if (isCriticalA !== isCriticalB) return isCriticalA ? -1 : 1;

      // Critério 2: Possui histórico de inconformidades (Contagem)
      if (ncCountA !== ncCountB) return ncCountB - ncCountA;

      // Critério 3: Priorizar quem tem medição (não é null)
      const hasDataA = readingA?.temperature !== null || readingA?.humidity !== null;
      const hasDataB = readingB?.temperature !== null || readingB?.humidity !== null;

      if (hasDataA !== hasDataB) return hasDataA ? -1 : 1;

      // Critério 4: Ordem alfabética (desempate final)
      return a.equipment.localeCompare(b.equipment);
    });

  return (
    <div className="flex  h-screen w-full bg-terciary dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen}  />
        <main className="flex-1 pt-4 flex flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        
          <header className="p-8">
            <h1 className="text-2xl font-bold text-zinc-100">
              Sensores e informações gerais
            </h1>
            <p className="text-zinc-300 dark:text-zinc-500">Monitoramento em tempo real</p>
          </header>

          <section className="p-8 pt-0 overflow-y-auto">
            <div className="grid grid-cols-3 2xl:grid-cols-4 gap-6">
              <div className="text-xl gap-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col items-start justify-between text-zinc-800 dark:text-zinc-400">
                  <div>Equipamentos ativos</div>
                  <div className='text-4xl text-emerald-700 dark:text-emerald-500 font-bold'>{usedCount}</div>
              </div>
              <div className="text-xl gap-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col items-start justify-between text-zinc-800 dark:text-zinc-400">
                  <div>
                    <div>Inconformidades SPA</div>
                    <div className='text-lg text-zinc-600 dark:text-zinc-600'>(Sem plano de ação)</div>  
                  </div>
                  <div className='flex justify-between items-end w-full'>
                    <div className='text-4xl text-red-500 font-bold'>{totalNonConformities}</div>
                    <div className='text-lg text-zinc-600 dark:text-zinc-600'>No ano</div>   
                  </div>
                  
              </div>
            </div>
          </section>

          <div className="px-8 pb-6 flex flex-wrap items-center gap-4">
            <div className='font-semibold text-zinc-100'>Filtrar por: </div>
            {/* Filtro de Status */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
              {['Todos', 'Inconformes'].map((status) => (
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
                    Inconformidades spa.
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Temp. Recente
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Umidade Recente
                  </th>
                  <th className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider text-center">
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
                    const ncCount = deviceNCMap[item.id] || 0;
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
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-1 rounded-md ${
                              item.isBeingUsed 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            }`}>
                              {item.equipment}
                            </span>
                            
                            {/* TAG DE SETOR DIFERENTE: Aparece apenas se o sensor não for do setor do usuário */}
                            {userSector && item.sector !== userSector && (
                              <span className="text-center bg-zinc-100 dark:bg-zinc-800  text-zinc-500 text-[10px] px-1.5 py-0.5 rounded  uppercase tracking-tighter">
                                Setor: {translateSector(item.sector)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${ncCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`}>
                            {ncCount > 0 ? ncCount : '--'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-base ${tempClass}`}>
                          {tempDisplay}
                        </td>
                        <td className={`px-6 py-4 text-base ${humClass}`}>
                          {humDisplay}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botão Ver Mais */}
                            <button 
                              onClick={() => {
                                setSelectedDevice(item);
                                setIsModalOpen(true);
                              }}
                              className="h-8 px-4 flex items-center justify-center bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary rounded-lg text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-zinc-900 transition-all cursor-pointer whitespace-nowrap"
                            >
                              Ver mais
                            </button>

                            {/* Botão de Gráfico/Propriedades */}
                            <button 
                              onClick={() => {
                                setSelectedDevice(item);
                                setIsGraphicModalOpen(true);
                              }}
                              className="h-8 w-8 flex items-center justify-center bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary rounded-lg hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-zinc-900 transition-all cursor-pointer"
                              title="Propriedades do Sensor"
                            >
                              <ChartLine size={16} />
                            </button>
                          </div>
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

      </main>

      <DeviceNCModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deviceName={selectedDevice?.equipment || ''}
        nonConformities={allNonConformities.filter(nc => nc.device.id === selectedDevice?.id)}
      />
      <DeviceGraphicModal 
        isOpen={isGraphicModalOpen}
        onClose={() => setIsGraphicModalOpen(false)}
        device={selectedDevice}
      />
    </div>
  );

  
}

