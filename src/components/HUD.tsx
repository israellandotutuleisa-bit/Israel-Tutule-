import React from 'react';
import { Volume2, VolumeX, Pause, Play, Shield, Zap, Music2, MapPin, Coins } from 'lucide-react';
import { GameState, PowerUpType, ActivePowerUp } from '../types';
import { SCENARIOS, POWER_UP_CONFIG } from '../game/constants';

interface HUDProps {
  state: GameState;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  isMuted,
  onToggleMute,
  onTogglePause
}) => {
  const scenario = SCENARIOS[state.currentScenario] || SCENARIOS.benfica;
  const distanceToShow = Math.max(0, Math.round(2600 - state.distance));
  const activeEntries = Object.entries(state.activePowerUps) as [PowerUpType, ActivePowerUp | undefined][];

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Left: Score & Kwanzas */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Score Counter */}
          <div id="hud-score-card" className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Pontos</span>
            <span className="font-hud font-black text-xl sm:text-2xl text-white tracking-wider">
              {state.score.toLocaleString()}
            </span>
            {state.multiplier > 1 && (
              <span className="bg-pink-600 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                x2
              </span>
            )}
          </div>

          {/* Kwanzas Coin Wallet */}
          <div id="hud-kwanzas-card" className="bg-neutral-900/85 backdrop-blur-md border border-yellow-500/30 rounded-xl px-3 py-1 shadow-md flex items-center gap-2 w-fit">
            <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-hud font-bold text-amber-300 text-sm sm:text-base">
              {state.kwanzas.toLocaleString()} Kz
            </span>
          </div>
        </div>

        {/* Center: Scenario & Progress to Show */}
        <div className="flex flex-col items-center pointer-events-auto">
          {/* Scenario Badge */}
          <div id="hud-scenario-badge" className="bg-gradient-to-r from-neutral-900/95 via-neutral-900/90 to-neutral-900/95 border border-white/20 backdrop-blur-md rounded-full px-4 py-1 flex items-center gap-1.5 shadow-xl">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-arcade text-amber-300 text-xs sm:text-sm font-bold tracking-wide uppercase">
              {scenario.name}
            </span>
          </div>

          {/* Distance to Show */}
          <div className="mt-1 text-[11px] font-semibold text-neutral-200/90 bg-neutral-900/60 px-2.5 py-0.5 rounded-md backdrop-blur-sm border border-neutral-700/50">
            {distanceToShow > 0 ? (
              <span>Faltam <strong className="text-amber-400">{distanceToShow}m</strong> pro Show!</span>
            ) : (
              <span className="text-green-400 font-bold animate-pulse">NO PALCO DO SHOW!</span>
            )}
          </div>
        </div>

        {/* Right: Sound & Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="hud-mute-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? "Ativar Som" : "Silenciar Som"}
            className="w-10 h-10 rounded-xl bg-neutral-900/85 hover:bg-neutral-800 text-white border border-neutral-700/60 flex items-center justify-center transition-all active:scale-95 shadow-lg backdrop-blur-md"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>
          <button
            id="hud-pause-btn"
            onClick={onTogglePause}
            aria-label={state.isPaused ? "Continuar Jogo" : "Pausar Jogo"}
            className="w-10 h-10 rounded-xl bg-neutral-900/85 hover:bg-neutral-800 text-white border border-neutral-700/60 flex items-center justify-center transition-all active:scale-95 shadow-lg backdrop-blur-md"
          >
            {state.isPaused ? <Play className="w-5 h-5 text-green-400" /> : <Pause className="w-5 h-5 text-neutral-300" />}
          </button>
        </div>
      </div>

      {/* Active Power-ups Bar (Left side vertical or horizontal stack) */}
      <div className="flex flex-col gap-2 max-w-[200px] pointer-events-auto">
        {activeEntries.map(([type, pu]) => {
          if (!pu) return null;
          const config = POWER_UP_CONFIG[type];
          const pct = Math.max(0, Math.min(100, (pu.duration / pu.totalDuration) * 100));

          return (
            <div
              key={type}
              id={`hud-powerup-${type}`}
              className="bg-neutral-900/90 border border-neutral-700/80 rounded-lg p-2 backdrop-blur-md shadow-lg flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-1.5">
                  {type === 'shield' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                  {type === 'turbo' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  {type === 'multiplier' && <Music2 className="w-3.5 h-3.5 text-pink-400" />}
                  <span>{config.effectName}</span>
                </div>
                <span className="text-[11px] text-neutral-300">{Math.ceil(pu.duration)}s</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    type === 'shield' ? 'bg-amber-400' : type === 'turbo' ? 'bg-cyan-400' : 'bg-pink-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pause Screen Overlay */}
      {state.isPaused && (
        <div id="hud-pause-overlay" className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto z-50">
          <div className="bg-neutral-900 border border-amber-500/40 p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl flex flex-col items-center gap-4">
            <h2 className="font-arcade text-2xl text-amber-400">JOGO PAUSADO</h2>
            <p className="text-neutral-300 text-sm">
              Respira um bocado! A plateia do Kuduro tá à tua espera no show.
            </p>
            <button
              id="hud-resume-btn"
              onClick={onTogglePause}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-arcade font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              CONTINUAR CORRIDA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
