import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  House,
  TriangleAlert,
  LogOut,
  Bug,
  Lightbulb,
  Cpu,
  Signature,
  User,
  Cog
} from 'lucide-react';
import logoLight from '../assets/liga-alvaro-logo.png';
import logoDark from '../assets/liga-alvaro-logo-branca-removebg-preview.png';
import { FaSun, FaMoon } from "react-icons/fa";
import axios from 'axios';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para identificar a rota atual

  const savedUser = localStorage.getItem('@App:user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isAdmin = user?.role === 'ADMIN';

  const handleGoHome = () => {
    if (!user) {
      navigate('/');
      return;
    }
    // Direcionamento inteligente baseado no cargo
    user.role === 'ADMIN' ? navigate('/dashboard') : navigate('/menu');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    const currentTheme = localStorage.getItem('theme');

    try {
      if (token) {
        await axios.post('http://192.168.1.3:8087/api/auth/sign-out', {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Erro na API de logout:", error);
    } finally {
      localStorage.clear();
      if (currentTheme) localStorage.setItem('theme', currentTheme);
      navigate('/', { replace: true });
      window.location.reload();
    }
  };

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <aside 
      className={`relative pt-7 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
      transition-all duration-300 ease-in-out flex flex-col shadow-sm
      ${isOpen ? 'w-64' : 'w-20'}`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-18 bg-primary dark:bg-secondary text-white dark:text-zinc-900 rounded-full p-1 shadow-lg cursor-pointer z-50 hover:scale-110 transition-transform"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className="p-6 flex justify-center items-center h-28 overflow-hidden">
        <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
          <img src={logoLight} className="w-32 block dark:hidden" alt="Logo" />
          <img src={logoDark} className="w-32 hidden dark:block" alt="Logo" />
        </div>
        {!isOpen && (
          <div className="absolute w-10 h-10 bg-primary dark:bg-secondary rounded-xl flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xl">
            L
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
          <SidebarItem 
            icon={<House size={24} />} 
            text="Início" 
            isOpen={isOpen} 
            onClick={handleGoHome}
            isActive={location.pathname === '/dashboard' || location.pathname === '/menu'}
          />
          <SidebarItem 
            icon={<FileText size={24} />} 
            text="Relatórios" 
            isOpen={isOpen} 
            onClick={() => navigate('/relatorios')}
            isActive={location.pathname === '/relatorios'}
          />
          <SidebarItem 
            icon={<TriangleAlert size={24} />} 
            text="Inconformidades" 
            isOpen={isOpen} 
            onClick={() => navigate('/inconformes')}
            isActive={location.pathname === '/inconformes'}
          />
          <SidebarItem 
            icon={<Lightbulb size={24} />} 
            text="Dados" 
            isOpen={isOpen} 
            onClick={() => navigate('/deviceinsights')}
            isActive={location.pathname === '/deviceinsights'}
          />
          
          {isAdmin && (
            <>
              <SidebarItem 
                icon={<Cpu size={24} />} 
                text="Dispositivo" 
                isOpen={isOpen} 
                onClick={() => navigate('/deviceconfig')}
                isActive={location.pathname === '/deviceconfig'}
              />
              <SidebarItem 
                icon={<Signature size={24} />} 
                text="Assinaturas" 
                isOpen={isOpen} 
                onClick={() => navigate('/signatures')}
                isActive={location.pathname === '/signatures'}
              />
              <SidebarItem 
                icon={<User size={24} />} 
                text="Usuários" 
                isOpen={isOpen} 
                onClick={() => navigate('/user')}
                isActive={location.pathname === '/user'}
              />
              <SidebarItem 
                icon={<Cog size={24} />} 
                text="Configurações" 
                isOpen={isOpen} 
                onClick={() => navigate('/configuracoes')}
                isActive={location.pathname === '/configuracoes'}
              />
              <SidebarItem 
                icon={<Bug size={24} />} 
                text="Teste" 
                isOpen={isOpen} 
                onClick={() => navigate('/test')}
                isActive={location.pathname === '/test'}
              />
            </>
          )}
      </nav>

      <div className="px-3 mb-2">
        <button 
          onClick={() => setDark(!dark)}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer group
            ${isOpen ? 'justify-start' : 'justify-center'}
            text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-secondary`}
        >
          <div className="shrink-0 flex items-center justify-center">
            {dark ? <FaMoon size={24} className="text-yellow-200" /> : <FaSun size={24} className="text-secondary" />}
          </div>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <span className="font-semibold">{dark ? 'Modo Escuro' : 'Modo Claro'}</span>
          </div>
        </button>
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer
            ${isOpen ? 'justify-start' : 'justify-center'}
            text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 group`}
        >
          <LogOut size={24} className="shrink-0 group-hover:translate-x-1 transition-transform" />
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <span className="font-bold">Sair</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ 
  icon, 
  text, 
  isOpen, 
  onClick, 
  isActive 
}: { 
  icon: any, 
  text: string, 
  isOpen: boolean, 
  onClick: () => void, 
  isActive?: boolean 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer group
        ${isOpen ? 'justify-start' : 'justify-center'}
        ${isActive 
          ? ' text-primary dark:text-secondary' 
          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-secondary'
        }`}
    >
      <div className={`transition-all duration-300 shrink-0 ${isActive ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <div className={`
        transition-all duration-300 overflow-hidden whitespace-nowrap
        ${isOpen ? 'opacity-100 w-auto translate-x-0' : 'opacity-0 w-0 -translate-x-4 pointer-events-none'}
      `}>
        <span className={`font-semibold ${isActive ? 'font-bold' : ''}`}>{text}</span>
      </div>
    </button>
  );
}