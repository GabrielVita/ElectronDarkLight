import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  X, Laptop, User, HelpCircle, Thermometer, 
  Save, Trash2, AlertTriangle, Loader2 
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { HelpModal } from './HelpModal';

// --- Constantes e Tipagens ---
const SECTORS = {
    LABORATORY: 'Laboratório',
    SURGICAL_CENTER: 'Centro Cirúrgico',
    BLOOD_BANK: 'Banco de Sangue',
    IESG: 'IESG',
    ONCOLOGY: 'Oncologia',
    NUTRITION: 'Nutrição',
    UTI_A: 'UTI A',
    HEMODYNAMICS: 'Hemodinâmica',
    RESONANCE: 'Ressonância',
    MAINTENANCE: 'Manutenção',
    CLINICAL_ENGINEERING: 'Engenharia Clínica',
};

const FUNCTIONS = {
    EQUIPMENT: 'Equipamento',
    ROOM: 'Ambiente',
};

interface DeviceFormData {
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
  minWorkingHumidity: number;
  maxWorkingHumidity: number;
  isBeingUsed: boolean;
}

interface DeviceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
}

// --- Componente Principal ---
export function DeviceEditModal({ isOpen, onClose, deviceId }: DeviceEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [helpTarget, setHelpTarget] = useState<{ title: string; options: string[] } | null>(null);
  
  // Guardará o estado original para comparação (diff)
  const [initialData, setInitialData] = useState<DeviceFormData | null>(null);

  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    branch: 'HEC',
    function: 'EQUIPMENT',
    deviceType: '',
    sensor: '',
    equipment: '',
    tag: '',
    sector: '',
    ip: '',
    patrimony: 0,
    minWorkingTemp: 0,
    maxWorkingTemp: 0,
    minWorkingHumidity: 0,
    maxWorkingHumidity: 0,
    isBeingUsed: true
  });

  // 1. Carregar dados do dispositivo
  const fetchDevice = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      const response = await axios.get(`http://192.168.1.3:8087/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData(response.data);
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do dispositivo");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [deviceId, onClose]);

  useEffect(() => {
    if (isOpen && deviceId) {
      fetchDevice();
    }
  }, [isOpen, deviceId, fetchDevice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: DeviceFormData) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // 2. Atualizar Dispositivo (PUT com lógica de Diff)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('@App:token');

      // LÓGICA DE DIFF: Envia apenas o que mudou
      const updatedFields = Object.keys(formData).reduce((acc: any, key) => {
        const field = key as keyof DeviceFormData;
        if (formData[field] !== initialData[field]) {
          acc[field] = formData[field];
        }
        return acc;
      }, {});

      if (Object.keys(updatedFields).length === 0) {
        toast.error("Nenhuma alteração detectada.");
        setLoading(false);
        return;
      }

      await axios.put(
        `http://192.168.1.3:8087/api/devices/${deviceId}`, 
        updatedFields, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Dispositivo atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar dispositivo");
    } finally {
      setLoading(false);
    }
  };

  // 3. Excluir Dispositivo (DELETE)
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('@App:token');
      await axios.delete(`http://192.168.1.3:8087/api/devices/${deviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Dispositivo removido permanentemente");
      onClose();
    } catch (error) {
      toast.error("Erro ao excluir dispositivo");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  // Verifica se houve mudanças para habilitar o botão
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <Toaster position="top-right" />
      
      <div onClick={(e) => e.stopPropagation()} className="bg-white mt-10 2xl:mt-36 dark:bg-zinc-900 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200 my-auto relative">
        
        {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-3xl">
              <Loader2 className="animate-spin text-primary mb-2" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Buscando dados...</p>
            </div>
        )}

        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-300/50 dark:bg-amber-500/10 rounded-xl text-primary dark:text-secondary">
                  <Laptop size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-primary dark:text-secondary uppercase tracking-tighter">Editar Dispositivo</h2>
                </div>
            </div>
          <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 ">
                <span className={`text-xs font-semibold tracking-wider ${formData.isBeingUsed ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    {formData.isBeingUsed ? 'Ativo' : 'Inativo'}
                </span>
                
                <button
                    type="button"
                    onClick={() => setFormData((prev: DeviceFormData) => ({ ...prev, isBeingUsed: !prev.isBeingUsed }))}
                    className={`relative cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formData.isBeingUsed ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                    }`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isBeingUsed ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                </div>

                <button onClick={onClose} className="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                  <X size={24} />
                </button>
            </div>
        </div>

        <form onSubmit={handleUpdate} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          
          <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-2 text-primary dark:text-secondary">
            <Laptop size={16} />
            <h2 className="font-black uppercase text-xs tracking-widest">Identificação</h2>
          </div>

          <div className="col-span-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Equipamento</label>
              <input name="equipment" value={formData.equipment} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary h-[46px]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Setor</label>
              <select name="sector" value={formData.sector} onChange={handleChange} className="bg-zinc-100 cursor-pointer dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary h-[46px]">
                {Object.entries(SECTORS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Filial</label>
                <select name="branch" value={formData.branch} onChange={handleChange} className="bg-zinc-100 cursor-pointer dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary h-[46px]">
                  <option value="HEC">HEC</option>
                  <option value="HMG">HMG</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Patrimônio</label>
                <input type="number" name="patrimony" value={formData.patrimony} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary h-[46px]" />
              </div>
            </div>
          </div>

          <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 mt-4 flex items-center gap-2 text-primary dark:text-secondary">
            <User size={16} />
            <h2 className="font-black uppercase text-xs tracking-widest">Técnico e Rede</h2>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome Dispositivo</label>
            <input name="name" value={formData.name} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">IP</label>
            <input name="ip" value={formData.ip} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Tag</label>
            <input name="tag" value={formData.tag} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between px-1 items-center">
              <label className="text-xs font-bold text-zinc-500 uppercase">Modelo Device</label>
              <button type="button" onClick={() => setHelpTarget({ title: 'Dispositivos', options: ['THR316', 'THR316D', 'TH16RF', 'TH'] })} className="text-primary dark:text-secondary cursor-pointer"><HelpCircle size={14}/></button>
            </div>
            <select name="deviceType" value={formData.deviceType} onChange={handleChange} className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]">
              {['THR316', 'THR316D', 'TH16RF', 'TH'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between px-1 items-center">
              <label className="text-xs font-bold text-zinc-500 uppercase">Modelo Sensor</label>
              <button type="button" onClick={() => setHelpTarget({ title: 'Sensores', options: ['DS18B20', 'AM2301', 'SI7021', 'WTS01', 'DHT11'] })} className="text-primary dark:text-secondary cursor-pointer"><HelpCircle size={14}/></button>
            </div>
            <select name="sensor" value={formData.sensor} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px] cursor-pointer">
              {['DS18B20', 'AM2301', 'SI7021', 'WTS01', 'DHT11'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Função sensor</label>
            <select name="function" value={formData.function} onChange={handleChange} className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary h-[46px]">
            {Object.entries(FUNCTIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 mt-4 flex items-center gap-2 text-primary dark:text-secondary">
            <Thermometer size={16} />
            <h2 className="font-black uppercase text-xs tracking-widest">Limites de Trabalho</h2>
          </div>

          <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Temp. Mín (°C)</label>
              <input type="number" name="minWorkingTemp" value={formData.minWorkingTemp} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Temp. Máx (°C)</label>
              <input type="number" name="maxWorkingTemp" value={formData.maxWorkingTemp} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Hum. Mín (%)</label>
              <input type="number" name="minWorkingHumidity" value={formData.minWorkingHumidity} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Hum. Máx (%)</label>
              <input type="number" name="maxWorkingHumidity" value={formData.maxWorkingHumidity} onChange={handleChange} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-semibold h-[46px]" />
            </div>
          </div>

          <div className="col-span-full flex flex-col md:flex-row justify-between items-center gap-4 mt-1 2xl:mt-8 pt-1 2xl:pt-6 2xl:border-t 2xl:border-zinc-100 2xl:dark:border-zinc-800">
            
            {!showDeleteConfirm ? (
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 cursor-pointer text-red-500 font-black uppercase text-xs hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all"
              >
                <Trash2 size={18} /> Excluir Sensor
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 p-2 rounded-2xl border border-red-200 dark:border-red-500/20 animate-in slide-in-from-left-2">
                <span className="text-[10px] font-black text-red-600 uppercase px-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Tem certeza?
                </span>
                <button type="button" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-600">
                  {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-zinc-500 px-3 py-2 text-xs font-bold uppercase">Cancelar</button>
              </div>
            )}

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 cursor-pointer md:flex-none px-8 py-3 rounded-xl font-black uppercase text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading || !hasChanges}
                className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 bg-primary dark:bg-secondary text-white dark:text-zinc-900 px-10 py-3 rounded-xl font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Atualizar</>}
              </button>
            </div>
          </div>
        </form>

        {helpTarget && (
          <HelpModal 
            title={helpTarget.title} 
            options={helpTarget.options} 
            onClose={() => setHelpTarget(null)} 
          />
        )}
      </div>
    </div>
  );
}