import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { 
  Thermometer, 
  RefreshCw, 
  Search, 
  Settings, 
  Database,
  FlaskConical, // Ícone para Laboratory
  Activity
} from 'lucide-react';

// INTERFACE ATUALIZADA COM SEU JSON
interface Device {
  id: string;
  name: string;
  branch: string;
  function: string;
  deviceType: string;
  sensor: string;
  equipment: string;
  tag: string;
  sector: string;
  ip: string;
  patrimony: number;
  minWorkingTemp: number;
  maxWorkingTemp: number;
  isBeingUsed: boolean;
}

export function Test() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://192.168.1.3:8087/api/devices', config);
      
      // Se a resposta vier direto como array, setDevices(response.data)
      // Se vier dentro de um objeto, ajuste para response.data.content ou similar
      setDevices(Array.isArray(response.data) ? response.data : []);
      
    } catch (error: any) {
      console.error("Erro na requisição:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDevices();
  }, [fetchAllDevices]);

  const filteredDevices = devices.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <Settings className="text-primary" size={24} /> Gerenciamento de Sensores
            </h1>
            <p className="text-sm text-zinc-500 font-medium">Lista de dispositivos cadastrados no sistema</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, tag ou setor..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchAllDevices}
              className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-all cursor-pointer"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <section className="flex-1 p-8 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <div 
                key={device.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-primary/50 transition-all"
              >
                {/* Topo do Card: Identificação */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                      <FlaskConical className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-100 leading-none">{device.name}</h3>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">{device.tag}</span>
                    </div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${device.isBeingUsed ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                </div>

                {/* Conteúdo: Info Técnica */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Setor</span>
                    <p className="text-sm dark:text-zinc-200 font-medium">{device.sector}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Patrimônio</span>
                    <p className="text-sm dark:text-zinc-200 font-medium">{device.patrimony}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Hardware</span>
                    <p className="text-sm dark:text-zinc-200 font-medium">{device.deviceType} / {device.sensor}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">IP</span>
                    <p className="text-sm dark:text-zinc-200 font-mono">{device.ip}</p>
                  </div>
                </div>

                {/* Rodapé: Limites de Operação */}
                <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                   <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-red-400 uppercase font-bold">Max</span>
                        <span className="text-sm font-bold dark:text-white">{device.maxWorkingTemp}°C</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-blue-400 uppercase font-bold">Min</span>
                        <span className="text-sm font-bold dark:text-white">{device.minWorkingTemp}°C</span>
                      </div>
                   </div>
                   <button className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer">
                      <Activity size={14} />
                      Logs
                   </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fallback se não houver dados */}
          {filteredDevices.length === 0 && !isLoading && (
             <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                <Database size={40} className="mb-2 opacity-20" />
                <p>Nenhum dado recebido do endpoint.</p>
             </div>
          )}
        </section>
      </main>
    </div>
  );
}