import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Thermometer, Droplets, MapPin, Activity, Clock, RefreshCw, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
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

interface DeviceGraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export function DeviceGraphicModal({ isOpen, onClose, device }: DeviceGraphicModalProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentHum, setCurrentHum] = useState<number | null>(null);
  const [statsTemp, setStatsTemp] = useState({ min: null, max: null, mean: null });
  const [statsHum, setStatsHum] = useState({ min: null, max: null, mean: null });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setChartData([]);
    setCurrentTemp(null);
    setCurrentHum(null);
    setStatsTemp({ min: null, max: null, mean: null });
    setStatsHum({ min: null, max: null, mean: null });
  }, [device?.id, isOpen]);

  const fetchData = useCallback(async () => {
    if (!device?.id) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('@App:token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - (360 * 60 * 1000));
      const params = `?start=${twoHoursAgo.toISOString()}&end=${now.toISOString()}`;

      const results = await Promise.allSettled([
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/moment?type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/moment?type=HUMIDITY`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings${params}&type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings${params}&type=HUMIDITY`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/min${params}&type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/max${params}&type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/mean${params}&type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/min${params}&type=HUMIDITY`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/max${params}&type=HUMIDITY`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${device.id}/readings/mean${params}&type=HUMIDITY`, config),
      ]);

      const getData = (res: any) => res.status === 'fulfilled' ? res.value.data : null;
      const parseStat = (data: any) => (data?.value !== undefined ? data.value : data);

      // Atualiza Estados
      const tMom = getData(results[0]);
      if (tMom) setCurrentTemp(tMom.value ?? tMom);
      
      const hMom = getData(results[1]);
      if (hMom) setCurrentHum(hMom.value ?? hMom);

      setStatsTemp({
        min: parseStat(getData(results[4])),
        max: parseStat(getData(results[5])),
        mean: parseStat(getData(results[6])),
      });

      setStatsHum({
        min: parseStat(getData(results[7])),
        max: parseStat(getData(results[8])),
        mean: parseStat(getData(results[9])),
      });

      const tempHis = getData(results[2]) || [];
      const humHis = getData(results[3]) || [];

      const formatted = tempHis.map((tItem: any) => {
        const hMatch = Array.isArray(humHis) ? humHis.find((h: any) => h.timestamp === tItem.timestamp) : null;
        return {
          time: new Date(tItem.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          fullTime: new Date(tItem.timestamp).toLocaleTimeString('pt-BR'),
          temp: tItem.value,
          hum: hMatch ? hMatch.value : null
        };
      }).reverse();

      setChartData(formatted);
    } catch (error) {
      console.error("Erro na telemetria:", error);
    } finally {
      setIsLoading(false);
    }
  }, [device?.id]);

  useEffect(() => { if (isOpen) fetchData(); }, [isOpen, fetchData]);

  if (!isOpen || !device) return null;

  const minT = device.minWorkingTemp ?? 0;
  const maxT = device.maxWorkingTemp ?? 0;
  const margin = 1.5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="py-2 px-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Activity size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Painel de Telemetria</h2>
              <p className="text-sm text-zinc-500">{device.equipment} • ID: {device.id.split('-')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><X size={24} /></button>
          </div>
        </div>

        <div className="p-3 space-y-6">
          {isLoading && chartData.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-zinc-500">
              <RefreshCw className="animate-spin text-emerald-500" size={32} />
              <p className="text-sm font-medium animate-pulse">Sincronizando estatísticas...</p>
            </div>
          ) : (
            <>
              {/* CARDS PRINCIPAIS (Mantidos conforme solicitado) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-md font-bold text-emerald-600 dark:text-emerald-400 uppercase">Temperatura Atual</span>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold text-zinc-800 dark:text-white">{currentTemp !== null ? `${Number(currentTemp).toFixed(1)}°C` : '--'}</p>
                    <Thermometer size={18} className="text-emerald-500" />
                  </div>
                </div>

                {currentHum !== null && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                    <span className="text-md font-bold text-blue-600 dark:text-blue-400 uppercase">Umidade Atual</span>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-zinc-800 dark:text-white">{Number(currentHum).toFixed(1)}%</p>
                      <Droplets size={18} className="text-blue-500" />
                    </div>
                  </div>
                )}

                <div className={`${currentHum !== null ? 'col-span-2' : 'col-span-3'} p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin size={14}/> 
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                        {translateSector(device.sector)}
                      </p>
                    </div>
                    {/* Renderização condicional dos limites */}
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        Temp: <span className="text-zinc-800 dark:text-zinc-200">{minT}°C a {maxT}°C</span>
                      </p>
                      {device.minWorkingHumidity !== null && device.maxWorkingHumidity !== null && (
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          Umid: <span className="text-zinc-800 dark:text-zinc-200">{device.minWorkingHumidity}% a {device.maxWorkingHumidity}%</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${device.isBeingUsed ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {device.isBeingUsed ? 'SENSOR ATIVO' : 'INATIVO'}
                  </div>
                </div>
              </div>

              {/* ESTATÍSTICAS DETALHADAS (Novas seções) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Temp */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase">
                    <TrendingUp size={20} /> Desempenho Térmico
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="Mínima" value={statsTemp.min} unit="°C" color="emerald" />
                    <MiniStat label="Média" value={statsTemp.mean} unit="°C" color="emerald" />
                    <MiniStat label="Máxima" value={statsTemp.max} unit="°C" color="emerald" />
                  </div>
                </div>

                {/* Stats Hum (Só aparece se houver umidade) */}
                {currentHum !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                      <Droplets size={20} /> Desempenho Umidade 
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="Mínima" value={statsHum.min} unit="%" color="blue" />
                      <MiniStat label="Média" value={statsHum.mean} unit="%" color="blue" />
                      <MiniStat label="Máxima" value={statsHum.max} unit="%" color="blue" />
                    </div>
                  </div>
                )}
              </div>

              {/* Gráfico */}
              <div className=" h-48 xl:h-64 2xl:h-80 w-full bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                    <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} minTickGap={30} />
                    <YAxis yAxisId="left" fontSize={10} axisLine={false} tickLine={false} unit="°C" domain={[minT - 3, maxT + 3]} />
                    {currentHum !== null && <YAxis yAxisId="right" orientation="right" fontSize={10} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />}
                    
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      labelFormatter={(val, payload) => payload[0]?.payload?.fullTime || val}
                    />

                    <ReferenceArea yAxisId="left" y1={maxT + margin} y2={maxT + 30} fill="#ef4444" fillOpacity={0.08} />
                    <ReferenceArea yAxisId="left" y1={maxT} y2={maxT + margin} fill="#f59e0b" fillOpacity={0.08} />
                    <ReferenceArea yAxisId="left" y1={minT} y2={maxT} fill="#10b981" fillOpacity={0.05} />
                    <ReferenceArea yAxisId="left" y1={minT - margin} y2={minT} fill="#f59e0b" fillOpacity={0.08} />
                    <ReferenceArea yAxisId="left" y1={minT - 30} y2={minT - margin} fill="#ef4444" fillOpacity={0.08} />

                    <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={3} dot={false} name="Temp" />
                    {currentHum !== null && <Line yAxisId="right" type="monotone" dataKey="hum" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Umid" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
        
        {/* Footer com legenda curta */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium italic">
            <Clock size={12} />
            <span>Relatório gerado em tempo real para o intervalo de 6 horas.</span>
          </div>
          <button onClick={onClose} className="px-8 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95">
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-componente interno para economizar espaço
function MiniStat({ label, value, unit, color }: any) {
  const isEmerald = color === 'emerald';
  return (
    <div className="bg-zinc-100/50 dark:bg-zinc-800/40 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col items-center">
      <span className="text-xs font-bold uppercase text-zinc-400">{label}</span>
      <span className={`text-base font-bold ${isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
        {value !== null ? `${Number(value).toFixed(1)}${unit}` : '--'}
      </span>
    </div>
  );
}