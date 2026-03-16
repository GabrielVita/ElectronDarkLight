import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { BtnTheme } from '../components/BtnTheme';
import logoLight from '../assets/liga-alvaro-logo.png';
import logoDark from '../assets/liga-alvaro-logo-branca-removebg-preview.png';
import { useAuth } from '../contexts/AuthContext';
import { TitleBar } from '../components/TitleBar';

// 1. Schema de Validação
const loginSchema = z.object({
  login: z.string().min(1, "O login é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // 2. Configuração do Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Função de Envio
  const onSubmit = async (data: LoginFormData) => {
  setLoginError(null);
  try {
    const response = await axios.post('http://192.168.1.3:8087/api/auth/sign-in', data);
    
    console.log("Response completa:", response.data);

    const token = response.data.token;
    // Como sua API retorna { data: { role: ... } }, o userData abaixo pegará o objeto interno
    const userData = response.data.data || response.data.user || response.data;

    if (!token) {
      console.error("Token não encontrado na resposta");
      setLoginError("Erro no servidor: Token ausente.");
      return;
    }
    
    // 4. Execução dos métodos do Contexto (salva no localStorage e estado global)
    signIn(token, userData);
    
    // 5. Redirecionamento baseado no Role
    console.log(`Login realizado como ${userData.role}, redirecionando...`);

    if (userData.role === 'ADMIN') {
      navigate('/dashboard');
    } else {
      navigate('/menu');
    }

  } catch (error: any) {
    console.error("Erro capturado no catch:", error);
    
    if (error.response) {
      setLoginError(`Erro ${error.response.status}: Credenciais inválidas.`);
    } else {
      setLoginError("Erro de conexão ou falha no processamento.");
    }
  }
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500 p-4">
      <TitleBar />
      <BtnTheme />
      
      <div className="flex flex-col md:flex-row items-center gap-12 p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-zinc-800 w-full max-w-4xl">
        
        {/* Lado da Logo */}
        <div className='hidden md:block h-80 border-r-2 border-primary dark:border-white pr-12 items-center'>
            <img src={logoDark} alt="Logo" className="w-40 h-auto hidden dark:block" />
            <img src={logoLight} alt="Logo" className="w-40 h-auto block dark:hidden" />
        </div>

        {/* Formulário */}
        <div className='flex flex-col w-full max-w-sm'>
          <h1 className='text-2xl font-bold mb-2 text-zinc-800 dark:text-zinc-100'>Bem-vindo!</h1>
          <p className='text-zinc-500 text-sm mb-6'>Acesse o sistema com suas credenciais.</p>

          <form className='space-y-5' onSubmit={handleSubmit(onSubmit)}>
            
            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in zoom-in duration-300">
                {loginError}
              </div>
            )}

            <div className='space-y-2'>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">E-mail</label>
              <input 
                {...register('login')}
                placeholder="user@email.com"
                // value={"hmg.pid@gmail.com"}
                // value={"gabriel.vita@labcmi.org.br"}
                className={`w-full px-4 py-3 mt-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 outline-none transition-all text-zinc-900 dark:text-white
                  ${errors.login ? 'border-red-500' : 'border-transparent focus:border-primary dark:focus:border-secondary'}`}
              />
              {errors.login && <span className="text-xs text-red-500 ml-1 font-medium">{errors.login.message}</span>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Senha</label>
                <Link to="/recover" className="text-xs text-primary dark:text-secondary hover:underline font-medium">Esqueceu a senha?</Link>
              </div>
              
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  {...register('password')}
                  placeholder="••••••••"
                  // value={"hmg.IOT2024"}
                  // value={"hmg.123"}
                  className={`w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 outline-none transition-all pr-12 text-zinc-900 dark:text-white
                    ${errors.password ? 'border-red-500' : 'border-transparent focus:border-primary dark:focus:border-secondary'}`}
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 ml-1 font-medium">{errors.password.message}</span>}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary dark:bg-secondary text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Entrar no Sistema"}
            </button>

            <div className='flex flex-row justify-center items-center gap-x-2'>
              <div className='flex-1 border-b border-zinc-200 dark:border-zinc-800'></div>
              <div className='text-zinc-400 text-xs font-semibold'>ou</div>
              <div className='flex-1 border-b border-zinc-200 dark:border-zinc-800'></div>
            </div>

            <button 
                type="button"
                onClick={() => navigate('/create')}
                className="w-full py-3 border-2 border-primary/20 dark:border-secondary/20 text-primary dark:text-secondary font-bold rounded-xl hover:bg-primary/5 dark:hover:bg-secondary/5 transition-all cursor-pointer"
            >
                Criar uma conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;