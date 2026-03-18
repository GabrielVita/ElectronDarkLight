import { X, Monitor, FlaskConical, ShieldCheck, Database, Activity, Droplets, Thermometer } from 'lucide-react';
import { translateSector , translateDeviceFunction } from '../utils/translations';

// 1. Atualize a interface para aceitar umidade
export interface Device {
  id: string;
  name: string;
  equipment: string;
  sector: string;
  deviceType: string;
  sensor: string;
  ip: string;
  patrimony: number;
  tag: string;
  function: string; // Adicionado para saber se é ROOM
  minWorkingTemp: number | null;
  maxWorkingTemp: number | null;
  minWorkingHumidity: number | null; // Adicionado
  maxWorkingHumidity: number | null; // Adicionado
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export function DeviceDetailsModal({ isOpen, onClose, device }: ModalProps) {
  if (!isOpen || !device) return null;

  // Verifica se deve exibir umidade (geralmente quando function é 'ROOM')
  const hasHumidity = device.minWorkingHumidity !== null || device.maxWorkingHumidity !== null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 dark:text-zinc-100">{device.name || device.equipment}</h3>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{device.tag}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-400">
            <X size={20} />
          </button>
        </div>

        {/* Grid de Informações */}
        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
            {/* Localização e Inventário */}
            <InfoItem 
                label="Equipamento" 
                value={device.equipment} 
                icon={<Monitor size={14}/>} 
            />
            <InfoItem 
                label="Setor" 
                value={translateSector(device.sector)} 
                icon={<FlaskConical size={14}/>} 
            />
            <InfoItem 
                label="Patrimônio" 
                value={device.patrimony} 
                icon={<ShieldCheck size={14}/>} 
            />

            {/* Especificações Técnicas (Hardware + Função) */}
            <InfoItem 
                label="Hardware / Função" 
                value={`${device.deviceType} - ${translateDeviceFunction(device.function)}`} 
                icon={<Database size={14}/>} 
            />

            {/* Conectividade (ID + IP) */}
            <div className="col-span-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 gap-4">
                <InfoItem 
                label="ID" 
                value={device.id} 
                icon={<Activity size={14}/>} 
                />
                <InfoItem 
                label="Endereço IP" 
                value={device.ip} 
                icon={<Activity size={14}/>} 
                />
            </div>
            </div>

        {/* Seção de Limites Operacionais */}
        <div className="px-6 pb-6 space-y-4">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Limites de Operação</span>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Card Temperatura */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Thermometer size={18} className="text-orange-500" />
                <span className="text-xs font-bold text-zinc-500">Temperatura</span>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-blue-400 uppercase">Min</p>
                  <p className="text-sm font-black dark:text-white">{device.minWorkingTemp ?? '--'}°C</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-red-400 uppercase">Max</p>
                  <p className="text-sm font-black dark:text-white">{device.maxWorkingTemp ?? '--'}°C</p>
                </div>
              </div>
            </div>

            {/* Card Umidade (Só aparece se houver dados) */}
            {hasHumidity && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <Droplets size={18} className="text-blue-500" />
                  <span className="text-xs font-bold text-zinc-500">Umidade</span>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-blue-400 uppercase">Min</p>
                    <p className="text-sm font-black dark:text-white">{device.minWorkingHumidity ?? '--'}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-red-400 uppercase">Max</p>
                    <p className="text-sm font-black dark:text-white">{device.maxWorkingHumidity ?? '--'}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 flex gap-3">
          <button className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer">
            Ver Relatórios Completos
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1.5">
        {icon} {label}
      </span>
      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{value}</p>
    </div>
  );
}