import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Thermometer, History, RefreshCw, Clock } from 'lucide-react';
// Importações do Recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';

export function Test() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [momentLog, setMomentLog] = useState<string>('');
  const [historyLog, setHistoryLog] = useState<string>('');
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  // Novo estado para o gráfico
  const [chartData, setChartData] = useState<any[]>([]);

  const deviceId = "febf1956-d084-4fa0-8e25-fc2f4fc1551d";

  const handleTestRequest = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('@App:token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const now = new Date();
      // Ajuste para 30 minutos
      const tempo = new Date(now.getTime() - (120 * 60 * 1000));

      const endIso = now.toISOString();       
      const startIso = tempo.toISOString();

      console.log("Sincronizando últimos 30min (UTC):", startIso, "até", endIso);

      const [momentRes, historyRes] = await Promise.all([
        axios.get(`http://192.168.1.3:8087/api/devices/${deviceId}/readings/moment?type=TEMPERATURE`, config),
        axios.get(`http://192.168.1.3:8087/api/devices/${deviceId}/readings?type=TEMPERATURE&start=${startIso}&end=${endIso}`, config)
      ]);

      // Atualiza o Card Principal
      const mValue = momentRes.data.value !== undefined ? momentRes.data.value : momentRes.data;
      setCurrentTemp(mValue);
      setMomentLog(JSON.stringify(momentRes.data, null, 2));

      // Formata os dados para o Gráfico (Recharts)
      const formattedHistory = historyRes.data.map((item: any) => {
        const dateObj = new Date(item.timestamp);
        return {
          ...item,
          // Esta será a string exibida no Eixo X
          eixoFormatado: dateObj.toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          dataCompleta: dateObj.toLocaleString('pt-BR', { 
            day: '2-digit', month: '2-digit', year: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          }),
          temperature: item.value
        };
      }).reverse();

      setChartData(formattedHistory);
      setHistoryLog(JSON.stringify(formattedHistory, null, 2));

    } catch (error: any) {
      console.error("Erro na requisição:", error);
      setHistoryLog(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    handleTestRequest();
  }, [handleTestRequest]);

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        <header className="p-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Série Histórica</h1>
            <p className="text-sm text-zinc-500 font-mono">{deviceId}</p>
          </div>
          <button 
            onClick={handleTestRequest}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 hover:border-primary transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar Dados
          </button>
        </header>

        <section className="flex-1 px-8 pb-8 overflow-y-auto grid grid-cols-1 gap-6">
          
          {/* CARD DE TEMPERATURA ATUAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <Thermometer className='text-red-500' size={18}/>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Leitura Atual</span>
                  </div>
                  <p className="text-4xl font-bold text-zinc-900 dark:text-white">
                    {currentTemp !== null ? `${currentTemp}°C` : '--'}
                  </p>
                </div>
                <Clock className="text-zinc-200 dark:text-zinc-800" size={48} />
             </div>
          </div>

          {/* GRÁFICO DE LINHA */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[450px]">
            <div className='flex items-center gap-3 mb-6'>
              <History className='text-primary' size={24}/>
              <h2 className="text-lg font-semibold dark:text-zinc-100">Variação das últimas 24h</h2>
            </div>

            <div className="flex-1 w-full h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="eixoFormatado" // Agora usa "13/03 14:30"
                    stroke="#888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    // Aumentamos o intervalo para não encavalar os textos, já que agora são maiores
                    interval={Math.floor(chartData.length / 6)} 
                  />

                  <Tooltip 
                    labelFormatter={(value, payload) => {
                      // Exibe a data completa com segundos no topo do balão
                      if (payload && payload.length > 0) {
                        return payload[0].payload.dataCompleta;
                      }
                      return value;
                    }}
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  
                  {/* FAIXAS DE CORES (EXEMPLO) */}
                  <ReferenceArea y1={23} y2={25} fill="red" fillOpacity={0.1} />
                  <ReferenceArea y1={20} y2={23} fill="green" fillOpacity={0.1} />
                  <ReferenceArea y1={18} y2={20} fill="orange" fillOpacity={0.1} />

                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}