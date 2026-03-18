import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Thermometer, Droplets, Activity, AlertTriangle, TrendingUp, TrendingDown, ClipboardCheck } from 'lucide-react';
import { translateSector } from '../utils/translations';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Legend, BarChart, Bar, Cell, Tooltip,
  PieChart, Pie
} from 'recharts';

export function DeviceCard({ device, startDate, endDate }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [statsTemp, setStatsTemp] = useState({ min: null, max: null, mean: null });
  const [statsHum, setStatsHum] = useState({ min: null, max: null, mean: null });
  const [ncChartData, setNcChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [percentageTrend, setPercentageTrend] = useState<{ val: string; up: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Busca leituras (Mantido conforme original)
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

  // 2. Busca Não Conformidades (BarChart + PieChart)
  
  const fetchNonConformities = useCallback(async () => {
    try {
      const token = localStorage.getItem('@App:token');
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      
      const payload = {
        sector: device.sector,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [respNoAction, respTotal] = await Promise.all([
        axios.post('http://192.168.1.3:8087/api/nonconformities/resolved/no-action', payload, config),
        axios.post('http://192.168.1.3:8087/api/nonconformities/period', payload, config)
      ]);

      const ncsNoAction = respNoAction.data.filter((nc: any) => nc.device.id === device.id && nc.endTimestamp !== null);
      const ncsTotal = respTotal.data.filter((nc: any) => nc.device.id === device.id && nc.endTimestamp !== null);

      // --- Lógica BarChart ---
      const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const last3 = [2, 1, 0].map(offset => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return { month: d.getMonth(), year: d.getFullYear(), name: monthsLabels[d.getMonth()], count: 0 };
      });

      ncsNoAction.forEach((nc: any) => {
        const ncDate = new Date(nc.createdAt || nc.startTimestamp);
        const mIdx = last3.find(x => x.month === ncDate.getMonth() && x.year === ncDate.getFullYear());
        if (mIdx) mIdx.count++;
      });

      // --- Lógica PieChart Corrigida ---
      const noActionCount = ncsNoAction.length;
      const withActionCount = Math.max(0, ncsTotal.length - noActionCount);
      const totalPeriod = withActionCount + noActionCount;

      setPieData([
        { name: 'Com Plano', value: withActionCount, color: '#10b981', total: totalPeriod },
        { name: 'Sem Plano', value: noActionCount, color: '#eb4034', total: totalPeriod },
      ]);

      // Tendência
      const current = last3[2].count;
      const previous = last3[1].count;
      if (previous > 0) {
        const diff = ((current - previous) / previous) * 100;
        setPercentageTrend({ val: Math.abs(diff).toFixed(0), up: diff > 0 });
      } else {
        setPercentageTrend(current > 0 ? { val: '100', up: true } : null);
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

      {/* LINHA 1: STATS (TEMPERATURA E UMIDADE) */}
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

      {/* LINHA 2: GRÁFICO DE ÁREA */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            /* 1. Desativa eventos de mouse no gráfico */
            style={{ pointerEvents: 'none' }} 
          >
            <defs>
              <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#10b981', fontWeight: 'bold'}} unit="°C" />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#3b82f6', fontWeight: 'bold'}} unit="%" />
            
            {/* 2. Remova o Tooltip se ele estiver presente aqui */}
            
            <Legend verticalAlign="top" height={36}/>
            
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="temp" 
              stroke="#10b981" 
              strokeWidth={3} 
              fill="url(#colorT)" 
              name="Temperatura" 
              /* 3. Desativa o ponto que aparece no hover */
              activeDot={false} 
              isAnimationActive={false} 
            />
            <Area 
              yAxisId="right" 
              type="monotone" 
              dataKey="hum" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              fill="url(#colorH)" 
              name="Umidade" 
              /* 4. Desativa o ponto que aparece no hover */
              activeDot={false} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* LINHA 3: DUO CHART (BARRAS + PIZZA) */}
      <div className="bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-black text-xs uppercase italic">
            <AlertTriangle size={16} className="text-red-500" /> Visão de Não Conformidades
          </div>
          {percentageTrend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${percentageTrend.up ? 'text-red-500' : 'text-emerald-500'}`}>
              {percentageTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {percentageTrend.val}% pendências vs mês anterior
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center h-40">
          {/* Gráfico de Barras - Histórico */}
          <div className="lg:col-span-2 h-full">
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

          {/* Gráfico de Pizza - Eficiência */}
          <div className="h-full flex flex-col items-center justify-center border-l border-zinc-200 dark:border-zinc-700">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  // Corrigindo o erro de Tipagem do TS
                  formatter={(value: any) => {
                    const val = Number(value);
                    const total = pieData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                    
                    if (total === 0) return ["0%", "Proporção"];
                    
                    const percentage = ((val / total) * 100).toFixed(0);
                    return [`${percentage}%`, "Status"];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    backgroundColor: '#18181b', 
                    color: '#fff',
                    fontSize: '11px'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-[9px] font-bold uppercase tracking-tighter">
              <span className="flex items-center gap-1 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Planos OK</span>
              <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"/> Pendentes</span>
            </div>
          </div>
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