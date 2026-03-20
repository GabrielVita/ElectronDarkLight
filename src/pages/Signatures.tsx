import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';
import { Signature, User, Trash2, Save, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { translateSector } from '../utils/translations';

interface UserData {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: string;
  sector: string;
}

export function Signatures() {
  const [isOpen, setIsOpen] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  
  const sigCanvas = useRef<SignatureCanvas>(null);

  // 1. Buscar lista de usuários ao carregar a página
  useEffect(() => {
    async function loadUsers() {
      try {
        const token = localStorage.getItem('@App:token');
        const response = await axios.get(`http://192.168.1.3:8087/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(response.data);
      } catch (error) {
        toast.error('Erro ao carregar lista de usuários');
      } finally {
        setFetchingUsers(false);
      }
    }
    loadUsers();
  }, []);

  // 2. Limpar o canvas
  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  // 3. Salvar e Enviar
  const handleSaveSignature = async () => {
    if (!selectedUserId) {
      toast.error('Por favor, selecione um usuário.');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error('A assinatura está vazia.');
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    setLoading(true);

    try {
      // Pega o base64 com o cabeçalho (data:image/png;base64,...)
      const base64Data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

      const payload = {
        encodedSignature: base64Data,
        fileName: `${selectedUser.firstName.toLowerCase()}signs.png`,
        name: `${selectedUser.firstName} ${selectedUser.lastName}`
      };

      await axios.post(
        `http://192.168.1.3:8087/api/users/${selectedUserId}/signatures/upload`,
        payload
      );

      toast.success('Assinatura enviada com sucesso!');
      clearSignature();
      setSelectedUserId('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer upload da assinatura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500 overflow-hidden">
      <Toaster position="top-right" />
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <main className="flex-1 pt-4 flex flex-col relative overflow-y-auto bg-primary/15 dark:bg-zinc-950
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-zinc-300
      dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
      [&::-webkit-scrollbar-thumb]:rounded-full">
        
        <header className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary dark:bg-secondary rounded-2xl text-white shadow-lg">
              <Signature className='text-white dark:text-zinc-900' size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none">Cadastro de Assinaturas</h1>
              
            </div>
          </div>
        </header>

        <div className="px-8 pb-10 max-w-4xl w-full mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-8">
            
            {/* Seleção de Usuário */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary dark:text-secondary mb-1">
                <User size={18} />
                <h2 className="font-black uppercase text-sm tracking-widest">Selecionar Usuário</h2>
              </div>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={fetchingUsers}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl p-4 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-bold text-lg appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled>
                  {fetchingUsers ? 'Carregando usuários...' : 'Selecione o profissional...'}
                </option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({translateSector(user.sector)})
                  </option>
                ))}
              </select>
            </div>

            {/* Área da Assinatura */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-primary dark:text-secondary">
                    <Signature size={18} />
                    <h2 className="font-black uppercase text-sm tracking-widest">Assinatura Manuscrita</h2>
                    </div>
                    <button 
                    onClick={clearSignature}
                    className="flex items-center gap-1 text-xs font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                    <Trash2 size={14} /> Limpar
                    </button>
                </div>

                {/* O fundo agora é fixo (bg-zinc-50) e a borda é fixa (border-zinc-300) */}
                <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-3xl overflow-hidden h-64 relative">
                    <SignatureCanvas 
                    ref={sigCanvas}
                    // Caneta sempre preta para simular tinta real
                    penColor="#18181b" 
                    canvasProps={{
                        // Forçamos largura e altura total para o canvas interno
                        style: { width: '100%', height: '100%' },
                        className: "signature-canvas cursor-crosshair"
                    }}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                    <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">
                        Assine dentro desta área
                    </span>
                    </div>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveSignature}
                disabled={loading || !selectedUserId}
                className="flex items-center gap-2 bg-primary dark:bg-secondary cursor-pointer text-white dark:text-zinc-900 px-10 py-4 rounded-2xl font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Salvar Assinatura
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}