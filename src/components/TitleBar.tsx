import logoCocite from '../assets/logo_app_cocite.png';
export function TitleBar() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 h-35px bg-zinc-950 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 drag-region"
      style={{ zIndex: 9999, WebkitAppRegion: 'drag' } as any} 
    >
      <div className="flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <img src={logoCocite} alt="Logo" className="w-9 h-9" />
        <span className="text-md font-bold text-zinc-500 uppercase">Cocite</span>
      </div>
      <div className="flex-1 h-full" /> {/* Espaço para arrastar no meio */}
      <div className="w-110px" /> {/* Espaço dos botões nativos */}
    </div>
  );
}