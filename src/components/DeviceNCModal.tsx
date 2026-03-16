import { X } from 'lucide-react';

interface NonConformity {
  id: string;
  type: string;
  startTimestamp: string | Date;
  endTimestamp: string | Date;
  averageValueNonConformity: number;
}

interface DeviceNCModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
  nonConformities: NonConformity[];
}

export function DeviceNCModal({ isOpen, onClose, deviceName, nonConformities }: DeviceNCModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
              Inconformidades: {deviceName}
            </h2>
            <p className="text-sm text-zinc-500">Últimos 8 dias registrados</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lista de Inconformidades */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-zinc-300
          dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {nonConformities.length > 0 ? (
            nonConformities.map((nc) => (
              <div key={nc.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Tipo</p>
                  <p className={`text-sm font-semibold ${nc.type === 'TEMPERATURE' ? 'text-orange-500' : 'text-blue-500'}`}>
                    {nc.type === 'TEMPERATURE' ? 'Temperatura' : 'Umidade'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Período</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {formatDate(nc.startTimestamp)} <br/> 
                    {formatDate(nc.endTimestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Duração / Média</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    {calculateDuration(nc.startTimestamp, nc.endTimestamp)}
                  </p>
                  <p className="text-xs text-red-500">
                    Média: {nc.averageValueNonConformity.toFixed(1)}{nc.type === 'TEMPERATURE' ? '°C' : '%'}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <div className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-200 dark:border-red-500/20">
                    SEM PLANO DE AÇÃO
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-500 italic">
              Nenhuma inconformidade registrada para este período.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}