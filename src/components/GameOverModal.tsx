import React, { useEffect } from 'react';
import { RotateCcw, ShoppingBag, Trophy, Coins, MapPin, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, PlayerCharacter } from '../types';
import { SCENARIOS } from '../game/constants';

interface GameOverModalProps {
  state: GameState;
  character: PlayerCharacter;
  isNewHighScore: boolean;
  highScore: number;
  onRestart: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  character,
  isNewHighScore,
  highScore,
  onRestart,
  onOpenShop
}) => {
  const scenario = SCENARIOS[state.currentScenario] || SCENARIOS.benfica;

  useEffect(() => {
    if (isNewHighScore || state.showArrived) {
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback if canvas-confetti is not available
      }
    }
  }, [isNewHighScore, state.showArrived]);

  const handleShare = () => {
    const text = `🔥 Corri ${Math.floor(state.distance)}m no Kuduro Runner Luanda e fiz ${state.score} pontos! Cheguei a ${scenario.name}! Consegues chegar ao show?`;
    if (navigator.share) {
      navigator.share({
        title: 'Kuduro Runner Luanda',
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert('Resultado copiado para a área de transferência!');
    }
  };

  return (
    <div
      id="game-over-modal"
      className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none overflow-y-auto"
    >
      <div className="bg-neutral-900 border-2 border-amber-500/50 rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col items-center gap-4 text-center my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Title Header */}
        <div>
          {state.showArrived ? (
            <div className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Chegaste ao Show do Ano!
            </div>
          ) : (
            <div className="text-xs font-bold uppercase tracking-widest text-red-400">
              Quase no Show!
            </div>
          )}

          <h2 className="font-arcade text-3xl sm:text-4xl text-white">
            {state.showArrived ? 'SHOW ESPECTACULAR!' : 'MAMBO RIJO!'}
          </h2>

          <p className="text-amber-300 text-xs sm:text-sm font-medium mt-1 italic px-2">
            "{state.deathReason || 'Tropeçaste a caminho do show!'}"
          </p>
        </div>

        {/* High score badge */}
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-arcade font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <Trophy className="w-4 h-4" />
            NOVO RECORDE PESSOAL!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Score */}
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Pontuação</span>
            <span className="font-hud font-black text-2xl text-white mt-0.5">
              {state.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Distância</span>
            <span className="font-hud font-black text-2xl text-amber-400 mt-0.5">
              {Math.floor(state.distance)}m
            </span>
          </div>

          {/* Kwanzas Ganhos */}
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" /> Kwanzas Ganhos
            </span>
            <span className="font-hud font-black text-xl text-yellow-300 mt-0.5">
              +{state.kwanzas.toLocaleString()} Kz
            </span>
          </div>

          {/* Cenário Final */}
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400" /> Bairro Final
            </span>
            <span className="font-arcade font-bold text-base text-white mt-0.5">
              {scenario.name}
            </span>
          </div>
        </div>

        {/* Total Wallet Counter */}
        <div className="text-xs text-neutral-300 font-semibold bg-neutral-950/60 px-3 py-1 rounded-xl border border-neutral-800 w-full flex items-center justify-between">
          <span>Carteira Total:</span>
          <strong className="text-amber-400 font-hud text-sm">{state.totalKwanzas.toLocaleString()} Kz</strong>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full mt-1">
          {/* Play Again */}
          <button
            id="gameover-restart-btn"
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade font-black text-lg sm:text-xl rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6" />
            CORRER OUTRA VEZ!
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            {/* Shop Button */}
            <button
              id="gameover-shop-btn"
              onClick={onOpenShop}
              className="py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-amber-300 font-arcade font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              LOJA DE KUDURO
            </button>

            {/* Share Button */}
            <button
              id="gameover-share-btn"
              onClick={handleShare}
              className="py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white font-arcade font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              PARTILHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
