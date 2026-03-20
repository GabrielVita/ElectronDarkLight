import { HashRouter, Routes, Route } from 'react-router-dom';
import  Login  from './pages/Login';
import Create from './pages/Create';
import Recover from './pages/Recover';
// import { BtnTheme } from './components/BtnTheme';
import { Dashboard } from './pages/Dashboard';
import { Relatorios } from './pages/Relatorios';
import { Inconformes } from './pages/Inconformes';
import { AuthProvider } from './contexts/AuthContext';
import { Test } from './pages/Test';
import { Menu } from './pages/Menu';
import { DeviceInsights } from './pages/DeviceInsights';
import { DeviceConfig } from './pages/DeviceConfig';
import { Signatures } from './pages/Signatures';
import { UserPage } from './pages/User';

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col justify-center items-center transition-colors duration-300 bg-zinc-100/95 dark:bg-zinc-950">
          {/* <BtnTheme /> */}
          
          <Routes>
            {/* Define qual componente aparece em cada "caminho" */}
            <Route path="/" element={<Login />} />
            <Route path="/create" element={<Create />} />
            <Route path="/recover" element={<Recover />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/inconformes" element={<Inconformes />} />
            <Route path="/test" element={<Test />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/deviceinsights" element={<DeviceInsights />} />
            <Route path="/deviceconfig" element={<DeviceConfig />} />
            <Route path="/signatures" element={<Signatures />} />
            <Route path="/user" element={<UserPage />} />
          </Routes>
        </div>
      </AuthProvider>  
    </HashRouter>
  );
}

export default App;