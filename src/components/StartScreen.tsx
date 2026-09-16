import React, { useState } from 'react';
import { Play, ShoppingBag, Trophy, Shield, Zap, Music2, AlertTriangle, Sparkles, HelpCircle, X } from 'lucide-react';
import { PlayerCharacter } from '../types';

interface StartScreenProps {
  character: PlayerCharacter;
  highScore: number;
  totalKwanzas: number;
  onStartGame: () => void;
  onOpenShop: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  character,
  highScore,
  totalKwanzas,
  onStartGame,
  onOpenShop
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div
      id="start-screen"
      className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
    >
      {/* Top Header info */}
      <div className="w-full max-w-md flex items-center justify-between gap-3">
        {/* Total Kwanzas */}
        <div id="start-kwanza-badge" className="bg-neutral-900/90 border border-amber-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
          <span className="text-xs font-bold text-amber-400">Carteira:</span>
          <span className="font-hud font-black text-amber-300 text-sm sm:text-base">
            {totalKwanzas.toLocaleString()} Kz
          </span>
        </div>

        {/* High Score */}
        <div id="start-highscore-badge" className="bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-hud font-bold text-white text-sm">
            Recorde: <strong className="text-yellow-400">{highScore.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Main Hero & Title */}
      <div className="flex flex-col items-center text-center my-auto py-4 max-w-md w-full">
        {/* Badge Angolano */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 via-amber-500/30 to-yellow-500/30 border border-amber-500/50 px-4 py-1 rounded-full mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Angola • Luanda Street Runner
          </span>
        </div>

        {/* Title */}
        <h1 className="font-arcade text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)] tracking-wider">
          KUDURO RUNNER
        </h1>
        <p className="font-arcade text-xl sm:text-2xl text-white tracking-widest mt-0.5">
          LUANDA
        </p>

        <p className="text-neutral-300 text-xs sm:text-sm mt-3 px-4 max-w-sm leading-relaxed">
          Tu és um artista de kuduro fugindo dos problemas no asfalto pra chegar no show do ano!
        </p>

        {/* Selected Character Preview Box */}
        <div id="start-character-card" className="mt-5 w-full bg-neutral-900/80 border border-neutral-700/80 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 text-left">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-amber-500/50 shadow-inner relative overflow-hidden"
              style={{ backgroundColor: character.colorScheme.shirt }}
            >
              <div
                className="w-6 h-6 rounded-full absolute top-2"
                style={{ backgroundColor: character.colorScheme.skin }}
              />
              <div
                className="w-8 h-3 rounded-full absolute top-1"
                style={{ backgroundColor: character.colorScheme.hat }}
              />
              <div
                className="w-7 h-1.5 absolute top-4 bg-black"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-arcade text-white text-base font-bold">{character.name}</span>
                <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {character.nickname}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{character.specialBonus}</p>
            </div>
          </div>

          <button
            id="start-open-shop-btn"
            onClick={onOpenShop}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95 shadow-md"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Loja
          </button>
        </div>

        {/* Quick Power-ups summary banner */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 text-[11px]">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-2 flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-neutral-200">Microfone</span>
            <span className="text-[10px] text-amber-400 font-semibold">Escudo</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-2 flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-neutral-200">Garrafa de Água</span>
            <span className="text-[10px] text-cyan-400 font-semibold">Turbo</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-2 flex flex-col items-center gap-1">
            <Music2 className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-neutral-200">Beat Kuduro</span>
            <span className="text-[10px] text-pink-400 font-semibold">Pontos x2</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        {/* Big Start Button */}
        <button
          id="start-play-btn"
          onClick={onStartGame}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade text-xl sm:text-2xl font-black rounded-2xl shadow-[0_6px_24px_rgba(245,158,11,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Play className="w-7 h-7 fill-current" />
          COMEÇAR O TOQUE!
        </button>

        {/* Cenários & Como Jogar toggle */}
        <div className="flex items-center justify-between w-full px-2 text-xs text-neutral-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Benfica • Talatona • Kinaxixi • Ilha
          </span>

          <button
            id="start-howtoplay-btn"
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Como Jogar
          </button>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div id="how-to-play-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl relative flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-arcade text-xl text-amber-400">COMO JOGAR KUDURO RUNNER</h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-neutral-200">
              <p className="font-bold text-amber-300">🎮 Controles:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                <li><strong className="text-white">Deslizar Esquerda / Direita (ou Setas ⬅️ ➡️)</strong>: Mudar de faixa na estrada</li>
                <li><strong className="text-white">Deslizar Cima (ou Seta ⬆️ / Espaço)</strong>: Saltar por cima de buracos e polícias</li>
                <li><strong className="text-white">Deslizar Baixo (ou Seta ⬇️)</strong>: Agachar / Kuduro Slide por baixo de contas a pagar</li>
              </ul>
            </div>

            {/* Obstacles */}
            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Obstáculos das Ruas de Luanda:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                <div className="bg-neutral-800/80 p-2 rounded-lg">
                  <strong className="text-cyan-400 block">🚐 Candongueiro</strong>
                  Carrinha azul e branca! Muda de faixa depressa.
                </div>
                <div className="bg-neutral-800/80 p-2 rounded-lg">
                  <strong className="text-yellow-400 block">🕳️ Buracos</strong>
                  Asfalto estragado! Salta por cima.
                </div>
                <div className="bg-neutral-800/80 p-2 rounded-lg">
                  <strong className="text-lime-400 block">👮 Polícia de Trânsito</strong>
                  Operação Stop! Salta ou desvia-te.
                </div>
                <div className="bg-neutral-800/80 p-2 rounded-lg">
                  <strong className="text-red-400 block">📄 Contas pra Pagar 😂</strong>
                  Facturas voando! Agacha-te (slide) para passar.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-arcade font-bold rounded-xl transition-all"
            >
              ENTENDI, BORA AO SHOW!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
