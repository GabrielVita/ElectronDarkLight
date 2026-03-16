import { createContext, useContext, useState, ReactNode } from 'react';

interface UserData {
  id: string;
  login: string;
  role: string;
  sector: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  signIn: (token: string, data: UserData) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa o estado buscando do localStorage para não deslogar no F5
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('@App:token'));
  const [user, setUser] = useState<UserData | null>(() => {
    const savedUser = localStorage.getItem('@App:user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const signIn = (token: string, data: UserData) => {
    setToken(token);
    setUser(data);
    localStorage.setItem('@App:token', token);
    localStorage.setItem('@App:user', JSON.stringify(data));
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:user');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para facilitar o uso
export const useAuth = () => useContext(AuthContext);