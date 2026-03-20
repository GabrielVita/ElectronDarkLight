import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
// Importações das imagens...
import AM2301 from '../assets/AM2301.png';
import DHT11 from '../assets/DHT11.png';
import DS18B20 from '../assets/DS18B20.png';
import SI7021 from '../assets/SI7021.png';
import WTS01 from '../assets/WTS01.png';
import TH from '../assets/TH.png';
import TH16RF from '../assets/TH16RF.png';
import THR316 from '../assets/THR316.png';
import THR316D from '../assets/THR316D.png';

const IMAGE_MAP: Record<string, string> = {
  AM2301, DHT11, DS18B20, SI7021, WTS01,
  TH, TH16RF, THR316, THR316D
};

interface HelpModalProps {
  title: string;
  options: string[];
  onClose: () => void;
}

export function HelpModal({ title, options, onClose }: HelpModalProps) {
  // Estado para a imagem que será ampliada
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase tracking-tighter text-zinc-800 dark:text-zinc-100">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer transition-colors">
            <X size={24} className="text-zinc-500" />
          </button>
        </div>
        
        {/* Grid de Opções */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-h-[70vh] overflow-y-auto">
          {options.map(opt => (
            <div 
              key={opt} 
              className="group flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:border-primary/50 dark:hover:border-secondary/50"
            >
              <div 
                className="relative w-full aspect-square flex items-center justify-center bg-white dark:bg-zinc-900 rounded-xl overflow-hidden p-2 cursor-pointer"
                onClick={() => setSelectedImage(opt)}
              >
                <img 
                  src={IMAGE_MAP[opt]} 
                  alt={opt} 
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110" 
                />
                {/* Overlay de Zoom no Hover */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ZoomIn className="text-primary dark:text-secondary" size={24} />
                </div>
              </div>
              <span className="font-bold text-xs text-zinc-600 dark:text-zinc-400 uppercase">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camada de Zoom Ampliado (Lightbox) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center">
             <button 
              className="absolute -top-2 right-0 p-2 text-white hover:text-primary dark:hover:text-secondary transition-colors cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <img 
              src={IMAGE_MAP[selectedImage]} 
              alt={selectedImage} 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl animate-in zoom-in-95 duration-300"
            />
            <h4 className="mt-4 text-white text-2xl font-black uppercase tracking-widest">
              {selectedImage}
            </h4>
          </div>
        </div>
      )}
    </div>
  );
}