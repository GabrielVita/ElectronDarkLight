import { useEffect, useState } from 'react'
// import { WiMoonAltWaningCrescent4 } from "react-icons/wi";
import { FaMoon } from "react-icons/fa";
// import { PiSunFill } from "react-icons/pi";
import { FaSun } from "react-icons/fa";
// import cloud from './assets/nuvem.png';

export function BtnTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="fixed bottom-20 right-8 z-50">
      <button
        onClick={() => setDark(!dark)}
        className={`
          relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer
          ${dark ? 'bg-zinc-700' : 'bg-primary'}
        `}
      >
        {/* Pino do Switch (O círculo que move) */}
        <div
          className={`
            bg-primary dark:bg-zinc-700 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center
            ${dark ? 'translate-x-6' : 'translate-x-0'}
          `}
        >
          {/* O ícone agora mora aqui dentro e troca com base no estado */}
          {dark ? (
            <FaMoon className="text-yellow-200 text-sm animate-in fade-in zoom-in duration-300" />
          ) : (
            <FaSun className="text-secondary text-sm animate-in fade-in zoom-in duration-300" />
          )}
        </div>
      </button>
    </div>
  );
}