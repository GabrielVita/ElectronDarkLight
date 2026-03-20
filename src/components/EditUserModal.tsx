import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, ShieldCheck, Cpu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserData, Device } from '../pages/User';
import { translateSector} from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  allDevices: Device[];
}

export function EditUserModal({ isOpen, onClose, user, allDevices }: Props) {
  // Inicializamos o estado com os dados do usuário atual
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    otherPermittedDevicesIds: user.otherPermittedDevicesIds || []
  });
  const [loading, setLoading] = useState(false);

  // Garante que o modal resete se trocarmos de usuário sem fechar o modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        otherPermittedDevicesIds: user.otherPermittedDevicesIds || []
      });
    }
  }, [user, isOpen]);

  // Filtra dispositivos que NÃO pertencem ao setor base do usuário
  const availableExtraDevices = allDevices.filter(device => {
    const isDifferentSector = device.sector !== user.sector;
    const isAlreadyPermitted = user.otherPermittedDevicesIds?.includes(device.id);
    
    return isDifferentSector || isAlreadyPermitted;
  });

  const toggleDevice = (deviceId: string) => {
    setFormData(prev => {
      // Garantimos que trabalhamos com um array, mesmo que venha null
      const currentIds = prev.otherPermittedDevicesIds || [];
      const exists = currentIds.includes(deviceId);
      
      if (exists) {
        return { 
          ...prev, 
          otherPermittedDevicesIds: currentIds.filter(id => id !== deviceId) 
        };
      }
      return { 
        ...prev, 
        otherPermittedDevicesIds: [...currentIds, deviceId] 
      };
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('@App:token');
      
      // CORREÇÃO: Usamos user.login (o login do usuário editado) no endpoint
      const endpoint = `http://192.168.1.3:8087/api/users/${user.login}`;
      
      await axios.put(endpoint, 
        { 
          ...user,      // Mantém campos fixos como ID e Login original
          ...formData   // Sobrescreve com as alterações do formulário
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Usuário atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">Editar Usuário</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Login: {user.login}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Cargo</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-sm font-bold outline-none border-2 border-transparent focus:border-primary/30 transition-all"
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Setor Base</label>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-bold text-zinc-400 cursor-not-allowed">
                {translateSector(user.sector)} (Inalterável)
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase ml-1 flex items-center gap-2">
              <Cpu size={14} /> Acesso a Sensores de Outros Setores
            </label>
            <div className="grid grid-cols-1 gap-2 border border-zinc-100 dark:border-zinc-800 p-2 rounded-2xl max-h-60 overflow-y-auto custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/30">
              {availableExtraDevices.length === 0 ? (
                <p className="text-center py-8 text-xs text-zinc-500 font-semibold italic">Nenhum sensor de outro setor disponível para vinculação.</p>
              ) : (
                availableExtraDevices.map(device => {
                  const isSelected = formData.otherPermittedDevicesIds.includes(device.id);
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => toggleDevice(device.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/50 text-primary dark:border-secondary/50 dark:text-secondary' 
                          : 'bg-white dark:bg-zinc-800 border-transparent text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">{device.equipment}</p>
                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">{translateSector(device.sector)}</p>
                      </div>
                      <div className={`p-1.5 rounded-lg transition-all ${isSelected ? 'bg-primary text-white dark:bg-secondary dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-300'}`}>
                        <ShieldCheck size={14} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary dark:bg-secondary text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : <><Save size={18} /> Salvar Alterações</>}
          </button>
        </form>
      </div>
    </div>
  );
}