import { useState } from 'react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';
import { HelpModal } from '../components/HelpModal';
import { LayoutDashboard, Save, Laptop, Thermometer, HelpCircle, User, Cpu } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast'; // Sugestão para feedback visual

export function DeviceConfig() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [helpTarget, setHelpTarget] = useState<{ title: string; options: string[] } | null>(null);

  // Busca o ID do usuário logado
  const savedUser = localStorage.getItem('@App:user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  // Estado inicial do formulário seguindo o contrato da API
  const [formData, setFormData] = useState({
    name: '',
    branch: 'HMG', // Valor padrão inicial
    function: '',
    equipment: '',
    patrimony: 0,
    tag: '',
    sector: '', // Valor padrão inicial (chave da tradução)
    ip: '',
    deviceType: '',
    sensor: '',
    minWorkingTemp: 0,
    maxWorkingTemp: 0,
    minWorkingHumidity: null, // Alterado para null
    maxWorkingHumidity: null, // Alterado para null
    ownerId: user?.id || ''
  });

  const SECTORS = {
    LABORATORY: 'Laboratório',
    SURGICAL_CENTER: 'Centro Cirúrgico',
    BLOOD_BANK: 'Banco de Sangue',
    IESG: 'IESG',
    ONCOLOGY: 'Oncologia',
    NUTRITION: 'Nutrição',
    UTI_A: 'UTI A',
    HEMODYNAMICS: 'Hemodinâmica',
    RESONANCE: 'Ressonância',
    MAINTENANCE: 'Manutenção',
    CLINICAL_ENGINEERING: 'Engenharia Clínica',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação manual simples
    if (!formData.sector || !formData.deviceType || !formData.sensor || !formData.branch) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('@App:token');
      await axios.post('http://192.168.1.3:8087/api/devices', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Equipamento cadastrado com sucesso!');
      // Opcional: Limpar formulário ou redirecionar
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cadastrar equipamento. Verifique os dados.');
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
              <Cpu className='text-white dark:text-zinc-900' size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none">Cadastrar Equipamento</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase mt-1">Configuração de novos dispositivos na rede</p>
            </div>
          </div>
        </header>

        <div className="px-8 pb-10 max-w-6xl w-full mx-auto">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            
            {/* Seção: Identificação */}
            <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1 flex items-center gap-2 text-primary dark:text-secondary">
              <Laptop size={16} />
              <h2 className="font-black uppercase text-xs tracking-widest">Identificação</h2>
            </div>

            {/* Grid Principal de 3 Colunas */}
            <div className="col-span-full grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Coluna 1: Equipamento */}
              <FormField 
                label="Equipamento" 
                name="equipment" 
                value={formData.equipment} 
                onChange={handleChange} 
                placeholder="Sensor Freezer 01 / Sala" 
              />

              {/* Coluna 2: Setor */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Setor</label>
                <select 
                  name="sector"
                  required
                  value={formData.sector}
                  onChange={handleChange}
                  className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-semibold text-sm h-[46px]"
                >
                  <option value="" disabled>Selecione o setor...</option>
                  {Object.entries(SECTORS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Coluna 3: Divisão entre Filial e Patrimônio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Filial</label>
                  <select 
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-semibold text-sm h-[46px]"
                  >
                    <option value="HEC">HEC</option>
                    <option value="HMG">HMG</option>
                  </select>
                </div>
                
                <FormField 
                  label="Patrimônio" 
                  name="patrimony" 
                  type="number" 
                  value={formData.patrimony} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* Seção: Conectividade */}
            <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 mt-2 mb-1 flex items-center gap-2 text-primary dark:text-secondary">
              <User size={16} />
              <h2 className="font-black uppercase text-xs tracking-widest">Técnico & Rede</h2>
            </div>

            <FormField label="Nome do Dispositivo" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: TH16XX" />
            <FormField label="Endereço IP" name="ip" value={formData.ip} onChange={handleChange} placeholder="192.168.1.XX" />
            <FormField label="Tag" name="tag" value={formData.tag} onChange={handleChange} placeholder="TAG-XYZ" />
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Modelo Device</label>
                <button 
                  type="button" // Importante: type="button" para não submeter o form
                  title="Ajuda para saber qual"
                  onClick={() => setHelpTarget({ title: 'Modelos de Dispositivos', options: ['THR316', 'THR316D', 'TH16RF', 'TH'] })}
                  className="text-primary dark:text-secondary hover:scale-110 transition-transform cursor-pointer"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <select 
                name="deviceType"
                required
                value={formData.deviceType}
                onChange={handleChange}
                className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-semibold text-sm h-[46px]"
              >
                <option value="" disabled>Selecione o modelo...</option>
                {['THR316', 'THR316D', 'TH16RF', 'TH'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Modelo Sensor</label>
                <button 
                  type="button"
                  title="Ajuda para saber qual"
                  onClick={() => setHelpTarget({ title: 'Modelos de Sensores', options: ['DS18B20', 'AM2301', 'SI7021', 'WTS01', 'DHT11'] })}
                  className="text-primary dark:text-secondary hover:scale-110 transition-transform cursor-pointer"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <select 
                name="sensor"
                required
                value={formData.sensor}
                onChange={handleChange}
                className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-semibold text-sm h-[46px]"
              >
                <option value="" disabled>Selecione o sensor...</option>
                {['DS18B20', 'AM2301', 'SI7021', 'WTS01', 'DHT11'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Seção: Parâmetros de Trabalho */}
            <div className="col-span-full border-b border-zinc-100 dark:border-zinc-800 pb-1 mt-2 mb-1 flex items-center gap-2 text-primary dark:text-secondary">
              <Thermometer size={16} />
              <h2 className="font-black uppercase text-xs tracking-widest">Limites de Trabalho</h2>
            </div>

            {/* Container que força os 4 campos na mesma linha em telas grandes */}
            <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField 
                label="Temp. Mínima (°C)" 
                name="minWorkingTemp" 
                type="number" 
                value={formData.minWorkingTemp} 
                onChange={handleChange} 
              />
              <FormField 
                label="Temp. Máxima (°C)" 
                name="maxWorkingTemp" 
                type="number" 
                value={formData.maxWorkingTemp} 
                onChange={handleChange} 
              />
              <FormField 
                label="Hum. Mínima (%)" 
                name="minWorkingHumidity" 
                type="number" 
                value={formData.minWorkingHumidity ?? ''} 
                onChange={handleChange} 
              />
              <FormField 
                label="Hum. Máxima (%)" 
                name="maxWorkingHumidity" 
                type="number" 
                value={formData.maxWorkingHumidity ?? ''} 
                onChange={handleChange} 
              />
            </div>

            {/* Linha do Botão - Agora ele pode ocupar a largura total ou ficar alinhado à direita */}
            <div className="col-span-full flex justify-center mt-2">
              <button 
                type="submit"
                disabled={loading}
                className="flex cursor-pointer h-[46px] w-full lg:w-1/3 items-center justify-center gap-2 bg-primary dark:bg-secondary text-white dark:text-zinc-900 rounded-xl font-black uppercase tracking-tighter hover:brightness-110 hover:scale-105 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Processando...' : <><Save size={18} /> Salvar Equipamento</>}
              </button>
            </div>
            
          </form>
        </div>
        {helpTarget && (
          <HelpModal 
            title={helpTarget.title} 
            options={helpTarget.options} 
            onClose={() => setHelpTarget(null)} 
          />
        )}
      </main>
    </div>
    
  );
}



// Componente Auxiliar de Input para manter o código limpo
function FormField({ label, name, type = 'text', value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{label}</label>
      <input 
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary outline-none font-semibold text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
      />
    </div>
  );
}