import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onSlide
}) => {
  return (
    <div id="mobile-controls-layer" className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-end pointer-events-none z-30 select-none">
      {/* Left/Right Steering Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          id="btn-ctrl-left"
          type="button"
          aria-label="Mudar Faixa Esquerda"
          onClick={(e) => {
            e.stopPropagation();
            onLeft();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/80 active:bg-amber-500 border-2 border-neutral-700/80 active:border-amber-300 text-white active:text-neutral-950 flex items-center justify-center backdrop-blur-md shadow-xl transition-transform active:scale-90"
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        <button
          id="btn-ctrl-right"
          type="button"
          aria-label="Mudar Faixa Direita"
          onClick={(e) => {
            e.stopPropagation();
            onRight();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/80 active:bg-amber-500 border-2 border-neutral-700/80 active:border-amber-300 text-white active:text-neutral-950 flex items-center justify-center backdrop-blur-md shadow-xl transition-transform active:scale-90"
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Jump and Slide Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          id="btn-ctrl-slide"
          type="button"
          aria-label="Deslizar / Agachar (Kuduro Slide)"
          onClick={(e) => {
            e.stopPropagation();
            onSlide();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/80 active:bg-orange-500 border-2 border-neutral-700/80 active:border-orange-300 text-white active:text-neutral-950 flex flex-col items-center justify-center backdrop-blur-md shadow-xl transition-transform active:scale-90"
        >
          <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[9px] font-extrabold tracking-tight uppercase">Baixo</span>
        </button>

        <button
          id="btn-ctrl-jump"
          type="button"
          aria-label="Saltar (Kuduro Jump)"
          onClick={(e) => {
            e.stopPropagation();
            onJump();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/90 active:bg-amber-400 border-2 border-amber-300 text-neutral-950 flex flex-col items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-90 font-bold"
        >
          <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[9px] font-extrabold tracking-tight uppercase">Salto</span>
        </button>
      </div>
    </div>
  );
};
