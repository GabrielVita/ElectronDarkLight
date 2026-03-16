import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from "react-icons/io5"; // Instale react-icons se não tiver

interface BtnBackProps {
  to?: string; // Prop opcional para definir uma rota específica
}

export function BtnBack({ to }: BtnBackProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to); // Vai para a rota que você passou por prop
    } else {
      navigate(-1); // Comportamento padrão: volta uma página no histórico
    }
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-8 left-8 z-50 flex items-center justify-center p-3 rounded-xl 
                 bg-white dark:bg-zinc-800 text-primary dark:text-secondary
                 shadow-lg hover:scale-110 active:scale-95 transition-all 
                 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
      title="Voltar"
    >
      <IoArrowBack size={24} />
    </button>
  );
}