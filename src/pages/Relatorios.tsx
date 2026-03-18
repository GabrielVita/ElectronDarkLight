import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Calendar, AlertCircle, Thermometer, Droplets, LoaderCircle } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import JSZip from 'jszip';
import { TitleBar } from '../components/TitleBar';

// 1. Schema do Zod (mantido igual)
const reportSchema = z.object({
  dateInit: z.string().min(1, { message: "Data inicial obrigatória" }),
  dateEnd: z.string().min(1, { message: "Data final obrigatória" }),
  type: z.string().min(1, { message: "Selecione o tipo de relatório" }),
}).refine((data) => {
  const start = new Date(data.dateInit);
  const end = new Date(data.dateEnd);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (end < start) return false;

  const isSameMonth = start.getUTCMonth() === end.getUTCMonth();
  const isSameYear = start.getUTCFullYear() === end.getUTCFullYear();

  return isSameMonth && isSameYear;
}, {
  message: "O período deve estar dentro do mesmo mês e ano",
  path: ["dateEnd"],
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportItem {
  fileName: string;
  encodedFile: string;
}

export function Relatorios() {
  const [isOpen, setIsOpen] = useState(true);
  
  // NOVO: Estado para controlar o progresso (0 a 100)
  const [downloadProgress, setDownloadProgress] = useState(0);

  const userRaw = localStorage.getItem('@App:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user?.role === 'ADMIN';

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { 
      type: isAdmin ? "ALL" : "" // Se for admin, já definimos um valor padrão
    }
  });

  const onSubmit = async (data: ReportFormData) => {
    // Reseta o progresso ao iniciar
    setDownloadProgress(0);

    try {
      const token = localStorage.getItem('@App:token') || localStorage.getItem('token'); 
      const userRaw = localStorage.getItem('@App:user'); 
      
      if (!userRaw) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const user = JSON.parse(userRaw);
      const sector = user.sector;
      const role = user.role;
      const url = role === 'ADMIN' 
        ? 'http://192.168.1.3:8087/api/reports/all' 
        : 'http://192.168.1.3:8087/api/reports/sector';

      const requestBody = {
        startDate: data.dateInit,
        endDate: data.dateEnd,
        type: data.type, 
        branch: "HMG",
        ...(role !== 'ADMIN' && { sector: sector })
      };

      // --- CONFIGURAÇÃO DO AXIOS COM BARRA DE PROGRESSO ---
      const response = await axios.post(url, requestBody, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        
        // Esta função é chamada múltiplas vezes durante o download
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Calcula a porcentagem baseada nos bytes recebidos
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Atualiza o estado da barra
            setDownloadProgress(percentCompleted);
          } else {
            // Caso a API não envie o cabeçalho 'Content-Length'
            // simulamos um progresso estático para não parecer travado
            setDownloadProgress(progressEvent.loaded > 0 ? 50 : 0);
          }
        },
      });

      // Se chegamos aqui, o download da API terminou (100%)
      setDownloadProgress(100);

      // --- Lógica do ZIP (mantém igual) ---
      if (response.data.reports && response.data.reports.length > 0) {
        // O JSZip é rápido, mas se for muito pesado, o spinner do botão continua girando
        const zip = new JSZip();
        const folderName = `Relatorios_${role}_${data.dateInit}`;
        const reportFolder = zip.folder(folderName);

        response.data.reports.forEach((report: ReportItem) => {
          const base64Content = report.encodedFile.split(';base64,').pop() || report.encodedFile;
          const fileName = report.fileName.endsWith('.pdf') ? report.fileName : `${report.fileName}.pdf`;
          reportFolder?.file(fileName, base64Content, { base64: true });
        });

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${folderName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        // Limpa o progresso após o download do ZIP iniciar
        setTimeout(() => setDownloadProgress(0), 1000);

      } else {
        alert("Nenhum dado encontrado para este período.");
        setDownloadProgress(0);
      }

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Falha na comunicação com o servidor.");
      setDownloadProgress(0); // Reseta em caso de erro
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-200 dark:bg-zinc-950 transition-colors duration-500">
      <TitleBar />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="flex-1 pt-4 flex flex-col relative overflow-hidden bg-primary/15 dark:bg-zinc-950">
        <header className="p-8">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Gerar Relatórios</h1>
        </header>

        <section className="p-8 pt-0 flex justify-center overflow-y-auto">
          <div className="w-full max-w-2xl">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 flex flex-col relative">
              
              {/* --- COMPONENTE VISUAL DA BARRA DE PROGRESSO --- */}
              {isSubmitting && (
                <div className="absolute top-0 left-0 right-0 p-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-t-3xl border-b border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-300 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <LoaderCircle className="text-primary dark:text-secondary animate-spin" size={20} />
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                        {downloadProgress === 100 
                          ? 'Gerando arquivo ZIP...' 
                          : 'Baixando dados da API...'}
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary dark:text-secondary font-mono">
                      {downloadProgress}%
                    </span>
                  </div>
                  
                  {/* Container da Barra (Cinza) */}
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    {/* O Progresso Real (Verde) */}
                    <div 
                      className="h-full bg-primary dark:bg-secondary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Título da Seção (Ajustado margem quando a barra aparece) */}
              <div className={`flex items-center gap-3 mb-8 transition-all ${isSubmitting ? 'opacity-20 pointer-events-none' : ''}`}>
                <div className="p-2 bg-primary/10 dark:bg-secondary/10 rounded-lg text-primary dark:text-secondary">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Configurar Exportação</h2>
                  <p className="text-sm text-zinc-500">Selecione o período (dentro do mesmo mês)</p>
                </div>
              </div>

              {/* Formulário (Opaco enquanto envia) */}
              <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 w-full transition-opacity ${isSubmitting ? 'opacity-20 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Inicial */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Início em:</label>
                    <input 
                      type="date" 
                      {...register('dateInit')}
                      onClick={(e) => e.currentTarget.showPicker()} 
                      className={`w-full mt-1.5 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 transition-all outline-none cursor-pointer
                        ${errors.dateInit ? 'border-red-500' : 'border-transparent focus:border-primary dark:focus:border-secondary'}
                        text-zinc-900 dark:text-white`}
                    />
                    {errors.dateInit && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.dateInit.message}</span>}
                  </div>

                  {/* Data Final */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Término em:</label>
                    <input 
                      type="date" 
                      {...register('dateEnd')}
                      onClick={(e) => e.currentTarget.showPicker()} 
                      className={`w-full mt-1.5 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 transition-all outline-none cursor-pointer
                        ${errors.dateEnd ? 'border-red-500' : 'border-transparent focus:border-primary dark:focus:border-secondary'}
                        text-zinc-900 dark:text-white`}
                    />
                    {errors.dateEnd && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.dateEnd.message}</span>}
                  </div>
                </div>

                {/* Seletor de Tipo (Temperatura / Umidade) */}
                {!isAdmin && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                      Tipo de Medição
                    </label>
                    
                    <div className="flex gap-4">
                      {/* Opção Temperatura */}
                      <label className={`
                        flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${errors.type ? 'border-red-500/50' : 'border-zinc-100 dark:border-zinc-800'}
                        hover:bg-zinc-50 dark:hover:bg-zinc-800/30
                        has-checked:border-primary dark:has-checked:border-secondary 
                        has-checked:bg-primary/5 dark:has-checked:bg-secondary/5
                        has-checked:text-primary dark:has-checked:text-secondary
                      `}>
                        <input type="radio" value="TEMPERATURE" {...register('type')} className="sr-only" />
                        <Thermometer size={18} className="shrink-0" />
                        <span className="font-bold text-sm">Temperatura</span>
                      </label>

                      {/* Opção Umidade */}
                      <label className={`
                        flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${errors.type ? 'border-red-500/50' : 'border-zinc-100 dark:border-zinc-800'}
                        hover:bg-zinc-50 dark:hover:bg-zinc-800/30
                        has-checked:border-primary dark:has-checked:border-secondary 
                        has-checked:bg-primary/5 dark:has-checked:bg-secondary/5
                        has-checked:text-primary dark:has-checked:text-secondary
                      `}>
                        <input type="radio" value="HUMIDITY" {...register('type')} className="sr-only" />
                        <Droplets size={18} className="shrink-0" />
                        <span className="font-bold text-sm">Umidade</span>
                      </label>
                    </div>
                    
                    {errors.type && (
                      <span className="text-xs text-red-500 flex items-center gap-1 ml-1">
                        <AlertCircle size={12}/> {errors.type.message}
                      </span>
                    )}
                  </div>
                )}

                {/* Se for Admin, incluímos um input hidden para o Zod não reclamar que o 'type' está vazio */}
                {isAdmin && <input type="hidden" value="ALL" {...register('type')} />}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary dark:bg-secondary text-white dark:text-zinc-900 font-bold rounded-xl 
                            shadow-lg shadow-primary/20 dark:shadow-secondary/20 hover:scale-[1.01] active:scale-95 
                            transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                    <>
                      <FileDown size={20} />
                      Gerar e Baixar PDF
                    </>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}