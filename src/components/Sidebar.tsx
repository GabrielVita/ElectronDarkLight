// src/components/Sidebar.tsx
import { useState, useEffect } from 'react'; // 1. useEffect adicionado
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  House,
  TriangleAlert,
  LogOut,
  Bug,
  Lightbulb,
} from 'lucide-react';
import logoLight from '../assets/liga-alvaro-logo.png';
import logoDark from '../assets/liga-alvaro-logo-branca-removebg-preview.png';
import { FaSun } from "react-icons/fa";
import { FaMoon } from "react-icons/fa";
import axios from 'axios';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem('@App:user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isAdmin = user?.role === 'ADMIN';

  // --- NOVA FUNÇÃO DE DIRECIONAMENTO INTELIGENTE ---
  const handleGoHome = () => {
    const savedUser = localStorage.getItem('@App:user'); // Certifique-se de que a chave é essa mesma
    
    if (!savedUser) {
      navigate('/'); // Se não achar o usuário, manda pro login
      return;
    }

    try {
      const user = JSON.parse(savedUser);
      
      // Verifica o cargo e direciona
      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/menu'); // Direciona USER para o Menu
      }
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      navigate('/');
    }
  };
  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    // 1. Salva o tema atual antes de limpar
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
      // 2. Limpa TUDO do localStorage
      localStorage.clear();

      // 3. Devolve apenas o tema para o localStorage
      if (currentTheme) {
        localStorage.setItem('theme', currentTheme);
      }

      // 4. Redireciona para o login
      navigate('/', { replace: true });
      
      // Dica: Como estamos no Electron/React, as vezes o estado da memória 
      // segura o usuário. Esse comando garante que o app "resete" o estado.
      window.location.reload();
    }
  };

  // --- LÓGICA DO TEMA INTEGRADA ---
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

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
  // ---------------------------------

  return (
    <aside 
      className={`relative pt-7 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
      transition-all duration-300 ease-in-out flex flex-col shadow-sm
      ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* Botão Retrátil (Toggle) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-18 bg-primary dark:bg-secondary text-white dark:text-zinc-900 rounded-full p-1 shadow-lg cursor-pointer z-50 hover:scale-110 transition-transform"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Logo Section */}
      <div className="p-6 flex justify-center items-center h-28 overflow-hidden">
        <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
          <img src={logoLight} className="w-32 block dark:hidden" alt="Logo" />
          <img src={logoDark} className="w-32 hidden dark:block" alt="Logo" />
        </div>
        {!isOpen && (
          <div className="absolute w-10 h-10 bg-primary dark:bg-secondary rounded-xl flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xl animate-in zoom-in duration-300">
            L
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-2 mt-4">
          <SidebarItem 
            icon={<House size={24} />} 
            text="Início" 
            isOpen={isOpen} 
            // CHAMADA DA NOVA FUNÇÃO AQUI:
            onClick={handleGoHome} 
          />
          <SidebarItem 
            icon={<FileText size={24} />} 
            text="Relatórios" 
            isOpen={isOpen} 
            onClick={() => navigate('/relatorios')} 
          />
          <SidebarItem 
            icon={<TriangleAlert size={24} />} 
            text="Inconformidades" 
            isOpen={isOpen} 
            onClick={() => navigate('/inconformes')} 
          />
          <SidebarItem 
            icon={<Lightbulb size={24} />} 
            text="Dados" 
            isOpen={isOpen} 
            onClick={() => navigate('/deviceinsights')} 
          />
          {isAdmin && (
            <SidebarItem 
              icon={<Bug size={24} />} 
              text="Teste" 
              isOpen={isOpen} 
              onClick={() => navigate('/test')} 
            />
          )}
      </nav>

      {/* --- BOTÃO DE TEMA --- */}
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
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isOpen ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 -ml-2.5'}`}>
            <span className="font-semibold">{dark ? 'Modo Escuro' : 'Modo Claro'}</span>
          </div>
        </button>
      </div>
      {/* ------------------- */}

      {/* Botão Sair */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={handleLogout} // <--- Alterado aqui
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer
            ${isOpen ? 'justify-start' : 'justify-center'}
            text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 group`}
        >
          <LogOut size={24} className="shrink-0 group-hover:translate-x-1 transition-transform" />
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isOpen ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 -ml-2.5'}`}>
            <span className="font-bold">Sair</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

// Componente Interno
function SidebarItem({ icon, text, isOpen, onClick }: { icon: any, text: string, isOpen: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer group
        ${isOpen ? 'justify-start' : 'justify-center'}
        text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-secondary`}
    >
      <div className="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap shrink-0">{icon}</div>
      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
        ${isOpen ? 'opacity-100 w-auto translate-x-0' : 'opacity-0 w-0 -translate-x-4 pointer-events-none'}
      `}>
        <span className="font-semibold">{text}</span>
      </div>
    </button>
  );
}