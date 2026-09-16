import React, { useState } from 'react';
import { X, Check, Lock, Shield, Zap, Music2, Coins, Sparkles } from 'lucide-react';
import { PlayerCharacter } from '../types';
import { CHARACTERS } from '../game/constants';
import { kuduroAudio } from '../audio/kuduroAudio';

interface ShopModalProps {
  totalKwanzas: number;
  selectedCharId: string;
  unlockedCharIds: string[];
  onSelectCharacter: (char: PlayerCharacter) => void;
  onBuyCharacter: (char: PlayerCharacter) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalKwanzas,
  selectedCharId,
  unlockedCharIds,
  onSelectCharacter,
  onBuyCharacter,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'powerups'>('characters');

  return (
    <div
      id="shop-modal"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      <div className="bg-neutral-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-arcade text-2xl sm:text-3xl text-amber-400">VESTIÁRIO DE KUDURO</h2>
          </div>

          <button
            id="shop-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Balance Bar */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="text-xs sm:text-sm font-bold text-neutral-200">Kwanzas Disponíveis:</span>
          </div>
          <span className="font-hud font-black text-xl sm:text-2xl text-amber-300">
            {totalKwanzas.toLocaleString()} Kz
          </span>
        </div>

        {/* Character List Grid */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {CHARACTERS.map((char) => {
            const isUnlocked = unlockedCharIds.includes(char.id);
            const isSelected = selectedCharId === char.id;
            const canAfford = totalKwanzas >= char.price;

            return (
              <div
                key={char.id}
                id={`shop-char-${char.id}`}
                className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-md'
                    : 'bg-neutral-800/60 border-neutral-700/60 hover:border-neutral-600'
                }`}
              >
                {/* Character Avatar & Description */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 border-neutral-700 shadow-inner relative overflow-hidden shrink-0"
                    style={{ backgroundColor: char.colorScheme.shirt }}
                  >
                    <div
                      className="w-7 h-7 rounded-full absolute top-2"
                      style={{ backgroundColor: char.colorScheme.skin }}
                    />
                    <div
                      className="w-9 h-3 rounded-full absolute top-1"
                      style={{ backgroundColor: char.colorScheme.hat }}
                    />
                    <div className="w-8 h-2 absolute top-4 bg-black" />
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-arcade text-white text-base sm:text-lg font-bold">
                        {char.name}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {char.nickname}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                      {char.description}
                    </p>

                    <span className="text-[11px] font-bold text-amber-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {char.specialBonus}
                    </span>
                  </div>
                </div>

                {/* Purchase / Select Action */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {isSelected ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-arcade font-bold text-xs flex items-center gap-1 shadow-md">
                      <Check className="w-4 h-4" />
                      EQUIPADO
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectCharacter(char);
                        kuduroAudio.playCoin();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-arcade font-bold text-xs transition-all active:scale-95"
                    >
                      SELECIONAR
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        if (canAfford) {
                          onBuyCharacter(char);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl font-arcade font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {char.price.toLocaleString()} Kz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-arcade font-bold text-sm rounded-xl transition-colors"
        >
          VOLTAR À PISTA
        </button>
      </div>
    </div>
  );
};
