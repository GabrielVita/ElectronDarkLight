import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';
import axios from 'axios';
import { 
  Loader2, 
  Check, 
  RefreshCw, 
  UserCheck, 
  Image as ImageIcon,
  QrCode as QrIcon,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ConfigData {
  technicianSignatureForReports: string;
  technicianSignatureId: string;
}

interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
}

interface SignatureData {
  name: string;
  fileName: string;
  encodedSignature: string;
}

export function Config() {
  const [isOpen, setIsOpen] = useState(true);
  
  // Estados de Configuração e Assinatura Atual
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [currentSignature, setCurrentSignature] = useState<SignatureData | null>(null);
  
  // Estados para Seleção de Nova Assinatura
  const [usersWithSignature, setUsersWithSignature] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [previewSignature, setPreviewSignature] = useState<SignatureData | null>(null);
  
  // WhatsApp
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  // Loaders e Erros
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);

  const token = localStorage.getItem('@App:token');
  const api = axios.create({
    baseURL: 'http://192.168.1.3:8087/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // 1. Carregar Configurações Iniciais e Filtrar Usuários
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Busca configuração do sistema
      const configRes = await api.get('/configurations');
      const configData = configRes.data;
      setConfig(configData);

      // Busca assinatura atual se houver ID
      if (configData.technicianSignatureId) {
        const sigRes = await api.get(`/users/${configData.technicianSignatureId}/signatures`);
        setCurrentSignature(Array.isArray(sigRes.data) ? sigRes.data[0] : sigRes.data);
      }

      // Busca todos os usuários para filtrar
      const usersRes = await api.get('/users');
      const allUsers: UserListItem[] = usersRes.data;

      // Filtra usuários: Só mantém os que retornam algo no endpoint de assinatura
      // Nota: Em produção, o ideal seria o backend já ter um filtro. 
      // Aqui fazemos um Promise.all para validar quem tem assinatura.
      const filtered = await Promise.all(
        allUsers.map(async (user) => {
          try {
            const check = await api.get(`/users/${user.id}/signatures`);
            return check.data && check.data.length > 0 ? user : null;
          } catch { return null; }
        })
      );
      
      setUsersWithSignature(filtered.filter((u): u is UserListItem => u !== null));

    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // 2. Preview ao trocar no Select
  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setPreviewSignature(null);
      return;
    }
    try {
      const res = await api.get(`/users/${userId}/signatures`);
      setPreviewSignature(Array.isArray(res.data) ? res.data[0] : res.data);
    } catch (err) {
      setPreviewSignature(null);
    }
  };

  // 3. Atualizar Assinatura Padrão (PUT)
  const handleUpdateSignature = async () => {
    if (!previewSignature || !currentSignature) return;
    
    setUpdating(true);
    try {
      // Usamos o 'name' da assinatura atual na URL e o 'name' da nova no body
      await api.put(`/configurations/${currentSignature.name}`, {
        technicianSignatureName: previewSignature.name
      });
      alert("Assinatura atualizada com sucesso!");
      loadInitialData(); // Recarrega para atualizar o "Atual"
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar.");
    } finally {
      setUpdating(false);
    }
  };

  // 4. Reiniciar WhatsApp
  const handleRestartWpp = async () => {
    setLoadingQr(true);
    setQrCodeData(null);
    try {
      const res = await api.get('/configurations/restartWppSession/getQrCode/image');
      // Assume-se que a API retorna a string pura do QR ou um objeto
      setQrCodeData(res.data); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-terciary dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="flex-1 pt-4 flex flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        <header className="p-8">
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            Configurações do Sistema
          </h1>
        </header>

        <section className="p-8 pt-0 overflow-y-auto space-y-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD: ASSINATURA ATUAL */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <UserCheck size={16} /> Assinatura Atual
              </h2>
              <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-dashed border-zinc-300 dark:border-zinc-700">
                {currentSignature ? (
                  <img src={currentSignature.encodedSignature} alt="Atual" className="max-h-full object-contain p-4" />
                ) : (
                  <span className="text-xs text-zinc-500">Nenhuma assinatura configurada</span>
                )}
              </div>
              <p className="mt-4 text-xs font-bold text-zinc-500 truncate">
                ID: {config?.technicianSignatureId || '---'}
              </p>
            </div>

            {/* CARD: ALTERAR ASSINATURA */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col">
              <h2 className="text-sm font-black uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <ImageIcon size={16} /> Alterar para Nova
              </h2>
              
              <select 
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold uppercase mb-4 dark:text-white outline-none focus:ring-2 ring-primary"
              >
                <option value="">Selecionar Usuário Disponível</option>
                {usersWithSignature.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                ))}
              </select>

              <div className="flex-1 h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {previewSignature ? (
                  <img src={previewSignature.encodedSignature} alt="Preview" className="max-h-full object-contain p-2 bg-zinc-200" />
                ) : (
                  <div className="text-[10px] text-zinc-400 uppercase font-black">Preview da Seleção</div>
                )}
              </div>

              <button 
                onClick={handleUpdateSignature}
                disabled={!selectedUserId || updating}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-xs"
              >
                {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Salvar Nova Assinatura
              </button>
            </div>

            {/* CARD: WHATSAPP */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm md:col-span-2 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-sm font-black uppercase text-zinc-400 mb-2 flex items-center gap-2">
                  <QrIcon size={16} /> Conexão WhatsApp
                </h2>
                <p className="text-xs text-zinc-500 mb-6">
                  Se a integração estiver instável, reinicie a sessão para gerar um novo QR Code de autenticação.
                </p>
                <button 
                  onClick={handleRestartWpp}
                  className="bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <RefreshCw size={16} className={loadingQr ? 'animate-spin' : ''} />
                  Reiniciar e Gerar QR Code
                </button>
              </div>

              <div className="w-48 h-48 bg-white p-4 rounded-2xl border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                {loadingQr ? (
                  <Loader2 className="animate-spin text-primary" size={32} />
                ) : qrCodeData ? (
                  <QRCodeSVG value={qrCodeData} size={160} />
                ) : (
                  <div className="text-center opacity-20 flex flex-col items-center">
                    <QrIcon size={40} />
                    <span className="text-[8px] font-black uppercase mt-2">Aguardando</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}