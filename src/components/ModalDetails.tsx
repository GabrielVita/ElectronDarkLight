import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { NonConformity } from '../pages/Inconformes';

// Schema de validação
const actionPlanSchema = z.object({
  actionPlan: z.string().min(5, "Descreva o plano de ação com pelo menos 5 caracteres"),
});

type ActionPlanData = z.infer<typeof actionPlanSchema>;

interface ModalDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  data: NonConformity | null;
  onSuccess: () => void;
}

export function ModalDetails({ isOpen, onClose, data, onSuccess }: ModalDetailsProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ActionPlanData>({
    resolver: zodResolver(actionPlanSchema)
  });

  if (!isOpen || !data) return null;

  // Lógica de detecção de tipo (Igual à da tabela)
  const isHumidity = data.type === 'HUMIDITY' || data.device.function === 'HUMIDITY';
  const unit = isHumidity ? '%' : '°C';
  const label = isHumidity ? 'Média de Umidade' : 'Média de Temperatura';
  const textColor = isHumidity ? 'text-blue-500' : 'text-red-500';

  const handleSaveAction = async (formData: ActionPlanData) => {
    try {
      const token = localStorage.getItem('@App:token');
      const savedUser = localStorage.getItem('@App:user');
      if (!token || !savedUser) return;

      const user = JSON.parse(savedUser);

      const payload = {
        sector: user.sector,
        actionPlan: formData.actionPlan,
        date: data.savedIn,
        actionUserId: user.id,
        deviceId: data.device.id
      };

      await axios.put(
        `http://192.168.1.3:8087/api/nonconformities/action-plan/${data.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Plano de ação registrado com sucesso!");
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar plano de ação:", error);
      alert("Falha ao salvar. Verifique a conexão.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Registrar Plano de Ação</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleSaveAction)} className="p-6 space-y-6">
          
          {/* Resumo da Inconformidade (Visualização Dinâmica) */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-xs uppercase font-bold text-zinc-400">Equipamento</p>
              <p className="text-base font-semibold dark:text-zinc-200">{data.device.equipment}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-zinc-400">{label}</p>
              <p className={`text-base font-bold ${textColor}`}>
                {data.averageValueNonConformity.toFixed(1)}{unit}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase font-bold text-zinc-400">Período da Ocorrência</p>
              <p className="text-sm dark:text-zinc-300">
                Início: {new Date(data.startTimestamp).toLocaleString('pt-BR')} <br />
                Fim: {new Date(data.endTimestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Campo de Texto para o Usuário */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold pl-1 text-zinc-600 dark:text-zinc-400">
              O que foi feito? (Plano de Ação)
            </label>
            <textarea 
              {...register('actionPlan')}
              placeholder="Descreva as medidas tomadas..."
              className="w-full h-32 px-4 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all resize-none dark:text-white border border-transparent dark:border-zinc-700"
            />
            {errors.actionPlan && <span className="text-red-500 text-xs font-bold">{errors.actionPlan.message}</span>}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-primary dark:bg-secondary text-white dark:text-zinc-900 shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Salvando..." : <><Save size={18} /> Salvar Plano</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}