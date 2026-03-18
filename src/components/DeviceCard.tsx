import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Thermometer, Droplets, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { translateSector } from '../utils/translations';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Legend, BarChart, Bar, Cell, Tooltip 
} from 'recharts';

export function DeviceCard({ device, startDate, endDate }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [statsTemp, setStatsTemp] = useState({ min: null, max: null, mean: null });
  const [statsHum, setStatsHum] = useState({ min: null, max: null, mean: null });
  const [ncChartData, setNcChartData] = useState<any[]>([]);
  const [percentageTrend, setPercentageTrend] = useState<{ val: string; up: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Busca leituras (Temperatura e Umidade)
  const fetchReadings = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const s = new Date(startDate).toISOString();
      const e = new Date(endDate).toISOString();
      const params = `?start=${s}&end=${e}`;

      const results = await Promise.allSettled([
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

      const tHis = getData(results[0]) || [];
      const hHis = getData(results[1]) || [];
      const hMap = new Map(hHis.map((i: any) => [i.timestamp, i.value]));
      
      const formatted = tHis.map((t: any) => ({
        time: new Date(t.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: t.timestamp,
        temp: t.value,
        hum: hMap.get(t.timestamp) ?? null
      })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setChartData(formatted);
      setStatsTemp({ min: parseStat(getData(results[2])), max: parseStat(getData(results[3])), mean: parseStat(getData(results[4])) });
      setStatsHum({ min: parseStat(getData(results[5])), max: parseStat(getData(results[6])), mean: parseStat(getData(results[7])) });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [device.id, startDate, endDate]);

  // 2. Busca Não Conformidades (3 meses fechados do calendário)
  const fetchNonConformities = useCallback(async () => {
    try {
      const token = localStorage.getItem('@App:token');
      //const user = JSON.parse(localStorage.getItem('@App:user') || '{}');
      
      const now = new Date();
      // Início de 2 meses atrás (Ex: se hoje é 16/Março, pega 01/Janeiro)
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      
      const response = await axios.post('http://192.168.1.3:8087/api/nonconformities/resolved/no-action', {
        sector: device.sector,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Filtra apenas as NCs deste dispositivo específico
      const ncs = response.data.filter((nc: any) => nc.device.id === device.id);
      
      const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      // Gera a estrutura dos últimos 3 meses
      const last3 = [2, 1, 0].map(offset => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return {
          month: d.getMonth(),
          year: d.getFullYear(),
          name: monthsLabels[d.getMonth()],
          count: 0
        };
      });

      ncs.forEach((nc: any) => {
        const ncDate = new Date(nc.createdAt || nc.startTimestamp);
        const mIdx = last3.find(x => x.month === ncDate.getMonth() && x.year === ncDate.getFullYear());
        if (mIdx) mIdx.count++;
      });

      // Cálculo da tendência (Mês Atual vs Anterior)
      const current = last3[2].count;
      const previous = last3[1].count;
      if (previous > 0) {
        const diff = ((current - previous) / previous) * 100;
        setPercentageTrend({ val: Math.abs(diff).toFixed(0), up: diff > 0 });
      } else if (current > 0) {
        setPercentageTrend({ val: '100', up: true });
      } else {
        setPercentageTrend(null);
      }

      setNcChartData(last3);
    } catch (err) {
      console.error("Erro NC:", err);
    }
  }, [device.id, device.sector]);

  useEffect(() => {
    fetchReadings();
    fetchNonConformities();
  }, [fetchReadings, fetchNonConformities]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 relative min-h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]">
          <Activity className="animate-spin text-primary" />
        </div>
      )}
      
      {/* HEADER */}
      <div>
        <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 uppercase leading-none">{device.equipment}</h3>
        <p className="text-md font-semibold text-primary dark:text-secondary tracking-widest">{device.name} • {translateSector(device.sector)}</p>
      </div>

      {/* LINHA 1: STATS TEMPERATURA E UMIDADE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/10">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase italic">
            <Thermometer size={16} /> Temperatura (°C)
          </div>
          <div className="flex justify-around">
            <StatItem label="Mínima" value={statsTemp.min} unit="°C" />
            <StatItem label="Média" value={statsTemp.mean} unit="°C" />
            <StatItem label="Máxima" value={statsTemp.max} unit="°C" />
          </div>
        </div>
        <div className="bg-blue-50/50 dark:bg-blue-500/5 p-5 rounded-[2rem] border border-blue-100 dark:border-blue-500/10">
          <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-black text-xs uppercase italic">
            <Droplets size={16} /> Umidade (%)
          </div>
          <div className="flex justify-around">
            <StatItem label="Mínima" value={statsHum.min} unit="%" />
            <StatItem label="Média" value={statsHum.mean} unit="%" />
            <StatItem label="Máxima" value={statsHum.max} unit="%" />
          </div>
        </div>
      </div>
      {/* LINHA 3: GRÁFICO DE ÁREA (TEMPO REAL/SELECIONADO) */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} style={{ pointerEvents: 'none' }}>
            <defs>
              <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} minTickGap={60} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#10b981', fontWeight: 'bold'}} unit="°C" />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#3b82f6', fontWeight: 'bold'}} unit="%" />
            <Legend verticalAlign="top" height={36}/>
            <Area yAxisId="left" type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorT)" name="Temperatura" activeDot={false} isAnimationActive={false} />
            <Area yAxisId="right" type="monotone" dataKey="hum" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorH)" name="Umidade" activeDot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* LINHA 2: GRÁFICO DE BARRAS DE NÃO CONFORMIDADES (MESES DO CALENDÁRIO) */}
      <div className="bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-black text-xs uppercase italic">
            <AlertTriangle size={16} /> Histórico de Inconformidades (Trimestre)
          </div>
          {percentageTrend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${percentageTrend.up ? 'text-red-500' : 'text-emerald-500'}`}>
              {percentageTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {percentageTrend.val}% vs mês anterior
            </div>
          )}
        </div>
        
        <div className="h-32 w-full">
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
                  backgroundColor: '#18181b', // Força um fundo escuro elegante (zinco-900)
                  color: '#fff'               // Força o texto geral para branco
                }}
                labelStyle={{ color: '#a1a1aa' }} // Cor do título do mês (zinco-400)
                itemStyle={{ color: '#eb4034' }}  // Cor do valor (Qtd) em âmbar/laranja
              />
              <Bar dataKey="count" name="Qtd" radius={[6, 6, 0, 0]} barSize={40}>
                {ncChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 2 ? '#eb4034' : '#3f3f46'} fillOpacity={index === 2 ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, unit }: any) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{label}</p>
      <p className="text-xl font-black text-zinc-800 dark:text-zinc-100">
        {value !== null && value !== undefined ? `${Number(value).toFixed(1)}${unit}` : '--'}
      </p>
    </div>
  );
}