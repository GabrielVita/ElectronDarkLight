import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Calendar, AlertCircle, Thermometer, Droplets } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import JSZip from 'jszip';
import { TitleBar } from '../components/TitleBar';



// 1. Schema sem o z.enum problemático (usando string e refine para validar)
const reportSchema = z.object({
  dateInit: z.string().min(1, { message: "Data inicial obrigatória" }),
  dateEnd: z.string().min(1, { message: "Data final obrigatória" }),
  type: z.string().min(1, { message: "Selecione o tipo de relatório" }),
}).refine((data) => {
  const start = new Date(data.dateInit);
  const end = new Date(data.dateEnd);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  // Validação 1: Data final >= Inicial
  if (end < start) return false;

  // Validação 2: Mesmo mês e Mesmo ano (Exigência da sua API)
  const isSameMonth = start.getUTCMonth() === end.getUTCMonth();
  const isSameYear = start.getUTCFullYear() === end.getUTCFullYear();

  return isSameMonth && isSameYear;
}, {
  message: "O período deve estar dentro do mesmo mês e ano",
  path: ["dateEnd"],
});

type ReportFormData = z.infer<typeof reportSchema>;

export function Relatorios() {
  const [isOpen, setIsOpen] = useState(true);
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { type: "" }
  });

  interface ReportItem {
    fileName: string;
    encodedFile: string;
  }

  const onSubmit = async (data: ReportFormData) => {

    
    try {
      // AJUSTE AQUI: Verifique se no seu login você salvou como 'token' ou '@App:token'
      const token = localStorage.getItem('@App:token') || localStorage.getItem('token'); 
      const userRaw = localStorage.getItem('@App:user'); 
      
      if (!userRaw) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      // Extraindo o setor do objeto que você postou
      const user = JSON.parse(userRaw);
      const sector = user.sector; // Isso pegará "LABORATORY" conforme seu log

      const response = await axios.post('http://192.168.1.3:8087/api/reports/sector', {
        startDate: data.dateInit,
        endDate: data.dateEnd,
        type: data.type, 
        branch: "HMG",
        sector: sector
      }, {
        // Se a API não pedir token, pode remover esta linha de headers
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      

      if (response.data.reports && response.data.reports.length > 0) {
        const zip = new JSZip();
        const folderName = `Relatorios_${data.dateInit}_a_${data.dateEnd}`;
        const reportFolder = zip.folder(folderName);

        response.data.reports.forEach((report: ReportItem) => {
          // 1. Limpar a string Base64 (remover o prefixo se existir)
          // O JSZip precisa apenas do conteúdo base64 puro ou do binário
          const base64Content = report.encodedFile.split(';base64,').pop() || report.encodedFile;

          // 2. Adicionar o arquivo à pasta do ZIP
          const fileName = report.fileName.endsWith('.pdf') 
            ? report.fileName 
            : `${report.fileName}.pdf`;

          reportFolder?.file(fileName, base64Content, { base64: true });
        });

        // 3. Gerar o arquivo ZIP e disparar o download
        zip.generateAsync({ type: "blob" }).then((content) => {
          const zipFileName = `${folderName}.zip`;
          const link = document.createElement("a");
          
          link.href = URL.createObjectURL(content);
          link.download = zipFileName;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Opcional: Liberar memória do objeto criado
          URL.revokeObjectURL(link.href);
        });

      } else {
        alert("Nenhum dado encontrado para este período.");
      }

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Falha na comunicação com o servidor.");
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
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 flex flex-col">
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 dark:bg-secondary/10 rounded-lg text-primary dark:text-secondary">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Configurar Exportação</h2>
                  <p className="text-sm text-zinc-500">Selecione o período (dentro do mesmo mês)</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
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
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                    Tipo de Medição
                  </label>
                  
                  <div className="flex gap-4">
                    {/* Opção Temperatura */}
                    <label className={`
                      flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${errors.type ? 'border-red-500/50' : 'border-zinc-100 dark:border-zinc-800'}
                      hover:bg-zinc-50 dark:hover:bg-zinc-800/30
                      
                      /* Estilo quando SELECIONADO */
                      has-checked:border-primary dark:has-checked:border-secondary 
                      has-checked:bg-primary/5 dark:has-checked:bg-secondary/5
                      has-checked:text-primary dark:has-checked:text-secondary
                    `}>
                      <input 
                        type="radio" 
                        value="TEMPERATURE" 
                        {...register('type')} 
                        className="sr-only" 
                      />
                      <Thermometer size={18} className="shrink-0" />
                      <span className="font-bold text-sm">Temperatura</span>
                    </label>

                    {/* Opção Umidade */}
                    <label className={`
                      flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${errors.type ? 'border-red-500/50' : 'border-zinc-100 dark:border-zinc-800'}
                      hover:bg-zinc-50 dark:hover:bg-zinc-800/30
                      
                      /* Estilo quando SELECIONADO */
                      has-checked:border-primary dark:has-checked:border-secondary 
                      has-checked:bg-primary/5 dark:has-checked:bg-secondary/5
                      has-checked:text-primary dark:has-checked:text-secondary
                    `}>
                      <input 
                        type="radio" 
                        value="HUMIDITY" 
                        {...register('type')} 
                        className="sr-only"
                      />
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

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary dark:bg-secondary text-white dark:text-zinc-900 font-bold rounded-xl 
                            shadow-lg shadow-primary/20 dark:shadow-secondary/20 hover:scale-[1.01] active:scale-95 
                            transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileDown size={20} />
                      Gerar e Baixar PDF
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}