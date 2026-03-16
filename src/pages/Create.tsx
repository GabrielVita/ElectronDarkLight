import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BtnTheme } from '../components/BtnTheme';
import { BtnBack } from '../components/BtnBack';
import logoLight from '../assets/liga-alvaro-logo.png';
import logoDark from '../assets/liga-alvaro-logo-branca-removebg-preview.png';

function Create() {
  const navigate = useNavigate();

  // Estados dos Campos
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  // Estados de Controle
  const [step, setStep] = useState(1); // 1 = Verificar E-mail, 2 = Finalizar Cadastro
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Lógica do Timer de Cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Requisição 1: Verificar E-mail (Enviar Token)
  const handleVerifyEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0 || !email) return;

    setIsLoading(true);
    try {
      await axios.post('http://192.168.1.3:8087/api/auth/verify-email', { email });
      setStep(2); 
      setCooldown(60); // 1 minuto de espera
      alert("Código enviado com sucesso!");
    } catch (error) {
      alert("Erro ao enviar e-mail. Verifique o endereço digitado.");
    } finally {
      setIsLoading(false);
    }
  };

  // Requisição 2: Finalizar Cadastro (Sign Up)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await axios.post('http://192.168.1.3:8087/api/auth/sign-up', {
        token,
        firstName,
        lastName,
        password
      });
      alert("Conta criada com sucesso! Faça login.");
      navigate('/'); 
    } catch (error) {
      alert("Erro ao criar conta. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center transition-colors duration-300 bg-zinc-300 dark:bg-zinc-950 px-4">
      <BtnBack />
      <BtnTheme />
      
      <div className="flex flex-col md:flex-row items-center gap-12 p-12 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-zinc-800 max-w-5xl w-full z-10">
        
        {/* Lado da Logo */}
        <div className='flex items-center border-r-2 border-primary dark:border-white pr-12 h-full min-h-250px'>
          <img src={logoDark} alt="Logo" className="w-40 h-auto hidden dark:block" />
          <img src={logoLight} alt="Logo" className="w-40 h-auto block dark:hidden" />
        </div>

        {/* Lado do Formulário */}
        <div className='flex flex-col gap-y-6 flex-1 w-full relative z-20'>
          <div className='flex flex-col gap-y-2 text-center md:text-left'>
            <h1 className='text-2xl font-bold text-zinc-800 dark:text-zinc-100'>
              {step === 1 ? 'Verificação de e-mail' : 'Finalizar cadastro'}
            </h1>
            <h2 className='text-zinc-600 dark:text-zinc-400'>
              {step === 1 
                ? 'Digite o seu e-mail para enviarmos um pedido de verificação' 
                : 'Preencha os dados abaixo para criar sua conta'}
            </h2>
          </div>

          <form className='space-y-5' onSubmit={step === 1 ? handleVerifyEmail : handleSignUp}>
            
            {/* Campo de E-mail */}
            <div className='space-y-2'>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 ml-1">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step === 2}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-white outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            {/* Campos do Passo 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className='space-y-2'>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 ml-1">Código (Token)</label>
                  <input 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Digite o código recebido"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-white outline-none"
                    required
                  />
                </div>
                
                <div className='flex flex-col md:flex-row gap-4'>
                  <div className='flex-1 space-y-2'>
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 ml-1">Nome</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div className='flex-1 space-y-2'>
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 ml-1">Sobrenome</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 ml-1">Senha</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* BOTÕES */}
            <div className='flex flex-row gap-x-4 pt-2'>
              <button 
                type="submit"
                disabled={isLoading || (step === 1 && cooldown > 0)}
                className="w-full py-4 bg-primary dark:bg-secondary text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg shadow-primary/20 dark:shadow-secondary/20 hover:bg-primary/90 dark:hover:bg-secondary/80 active:scale-95 transition duration-700 ease-in-out hover:scale-110 dark:hover:text-zinc-900 cursor-pointer"
              >
                {isLoading ? 'Aguarde...' : step === 1 ? (cooldown > 0 ? `${cooldown}s` : 'Enviar') : 'Finalizar'}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(step === 1 ? 2 : 1)}
                className="w-full py-4 bg-primary dark:bg-secondary text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg shadow-primary/20 dark:shadow-secondary/20 hover:bg-primary/90 dark:hover:bg-secondary/80 active:scale-95 transition duration-700 ease-in-out hover:scale-110 dark:hover:text-zinc-900 cursor-pointer"
              >
                {step === 1 ? 'Já tenho o token' : 'Voltar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Create;