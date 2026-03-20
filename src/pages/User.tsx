import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { TitleBar } from '../components/TitleBar';
import { UserCog, Edit3, Loader2, Search, Filter} from 'lucide-react';
import { EditUserModal } from '../components/EditUserModal';
import { translateSector, translateRole } from '../utils/translations';

export interface UserData {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: string;
  sector: string;
  otherPermittedDevicesIds: string[] | null;
}

export interface Device {
  id: string;
  equipment: string;
  sector: string;
}

export function UserPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterSector, setFilterSector] = useState('TODOS');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@App:token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, devicesRes] = await Promise.all([
        axios.get('http://192.168.1.3:8087/api/users', { headers }),
        axios.get('http://192.168.1.3:8087/api/devices', { headers })
      ]);

      setUsers(usersRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Lógica de filtragem aplicada aqui
  const filteredUsers = users.filter(user => {
    if (filterSector === 'TODOS') return true;
    return user.sector === filterSector;
  });

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <main className="flex-1 flex mt-4 flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        <header className="p-8 flex items-center gap-4">
           <div className="p-3 bg-primary dark:bg-secondary rounded-2xl text-white dark:text-zinc-900 shadow-lg">
              <UserCog size={24} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">Gestão de Usuários</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase">Controle de acessos e permissões</p>
           </div>

           {/* Filtro de Setor */}
           <div className="ml-auto flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-primary dark:hover:border-orange-500/50 group">
                <Filter size={14} className="text-zinc-400 group-hover:text-primary dark:group-hover:text-orange-500 transition-colors" />
                
                <div className="flex flex-col -gap-1">
                    <span className="text-[9px] font-black uppercase text-zinc-400 leading-none">Filtrar por</span>
                    <div className="relative flex items-center">
                    <select 
                        value={filterSector}
                        onChange={(e) => setFilterSector(e.target.value)}
                        className="appearance-none bg-transparent text-[11px] font-black text-zinc-700 dark:text-zinc-100 outline-none cursor-pointer pr-5 z-10 uppercase tracking-tight"
                    >
                        <option value="TODOS" className="dark:bg-zinc-900">TODOS OS SETORES</option>
                        {Array.from(new Set(users.map(u => u.sector))).map(sector => (
                        <option key={sector} value={sector} className="dark:bg-zinc-900">
                            {translateSector(sector).toUpperCase()}
                        </option>
                        ))}
                    </select>
                    
                    {/* Ícone de seta customizado para substituir o do sistema */}
                    <div className="absolute right-0 pointer-events-none text-zinc-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    </div>
                </div>
            </div>
        </header>

        <div className="mx-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex-1 mb-8 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar
          [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-300
        dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400
        dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-zinc-800">
                <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Sobrenome</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Setor Principal</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-zinc-500 font-bold uppercase text-xs">
                      <Loader2 className="animate-spin mx-auto mb-2" /> Carregando...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  // MUDANÇA AQUI: Agora usamos o array filtrado
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">{user.firstName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-zinc-500">{user.lastName}</td>
                      <td className="px-6 py-4 text-xs font-extrabold  text-primary dark:text-secondary">{translateRole(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{translateSector(user.sector)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                          className="p-2 hover:bg-primary/10 dark:hover:bg-secondary/10 text-primary dark:text-secondary rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-zinc-500 font-bold uppercase text-xs italic">
                      Nenhum usuário encontrado neste setor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isEditModalOpen && selectedUser && (
        <EditUserModal 
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); fetchData(); }}
          user={selectedUser}
          allDevices={devices}
        />
      )}
    </div>
  );
}