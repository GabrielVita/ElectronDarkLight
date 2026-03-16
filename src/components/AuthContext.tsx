import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Trocamos os hooks do Next pelos do React Router Dom
import { useNavigate, useLocation } from 'react-router-dom';
import Loading from "./Loading";

interface User {
  login: string;
  role: string;
  sector: string;
  id: number;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setToken: (token: string | null, user?: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // No React Router Dom, usamos useNavigate para redirecionar
  const navigate = useNavigate();
  // Usamos useLocation para monitorar a URL atual de forma "reativa"
  const location = useLocation();

  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (storedToken && storedUser) {
    setTokenState(storedToken);
    setUser(JSON.parse(storedUser));
  } else {
    // Definimos quais rotas NÃO precisam de login
    const publicRoutes = ['/', '/Fsenha', '/create', '/recover'];
    const isPublicRoute = publicRoutes.some(route => location.pathname === route) || 
                          location.pathname.startsWith('/reset-password');

    // SÓ redireciona se não for uma rota pública e não houver token
    if (!isPublicRoute) {
      navigate('/');
    }
  }
  // Adicionamos um pequeno delay ou garantimos que o loading pare
  setIsLoading(false);
}, [navigate, location.pathname]);
  const setToken = (newToken: string | null, newUser: User | null = null) => {
    if (newToken && newUser) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setTokenState(newToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setTokenState(null);
    }
  };

  const logout = () => {
    setToken(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ token, user, setToken, logout, isLoading }}>
      {/* Se estiver carregando, mostra o Loading, senão renderiza o app */}
      {isLoading ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};