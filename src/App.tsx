import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { kuduroAudio } from './audio/kuduroAudio';
import { CHARACTERS } from './game/constants';
import { GameState, PlayerCharacter } from './types';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';

const STORAGE_KEYS = {
  HIGH_SCORE: 'kuduro_runner_high_score',
  WALLET: 'kuduro_runner_wallet',
  UNLOCKED_CHARS: 'kuduro_runner_unlocked_chars',
  SELECTED_CHAR: 'kuduro_runner_selected_char'
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Persistence loaded state
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
  });

  const [totalKwanzas, setTotalKwanzas] = useState<number>(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || '0', 10);
  });

  const [unlockedCharIds, setUnlockedCharIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNLOCKED_CHARS);
      return saved ? JSON.parse(saved) : ['bruno_kuduro'];
    } catch {
      return ['bruno_kuduro'];
    }
  });

  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CHAR) || 'bruno_kuduro';
  });

  const selectedCharacter = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  // Game lifecycle states
  const [gameMode, setGameMode] = useState<'start' | 'playing' | 'gameover'>('start');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [hudState, setHudState] = useState<GameState | null>(null);

  // Engine & Renderer instances in refs to survive re-renders
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Touch swipe tracking
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize Game Engine
  const setupGameEngine = useCallback(() => {
    const engine = new GameEngine(
      selectedCharacter,
      totalKwanzas,
      (finalState) => {
        // Game Over Callback
        const finalScore = finalState.score;
        let newRecord = false;

        if (finalScore > highScore) {
          newRecord = true;
          setHighScore(finalScore);
          localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, finalScore.toString());
        }

        setIsNewHighScore(newRecord);
        setTotalKwanzas(finalState.totalKwanzas);
        localStorage.setItem(STORAGE_KEYS.WALLET, finalState.totalKwanzas.toString());
        setGameMode('gameover');
      },
      (_newScenario) => {
        // Scenario changed callback
      }
    );

    engineRef.current = engine;
    setHudState({ ...engine.state });
  }, [selectedCharacter, totalKwanzas, highScore]);

  // Handle Resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (!rendererRef.current && ctx) {
      rendererRef.current = new GameRenderer(ctx);
    }

    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    setupGameEngine();

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      const deltaTime = Math.min(0.06, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer) {
        if (gameMode === 'playing') {
          engine.update(deltaTime);
          setHudState({ ...engine.state });
        }

        renderer.render(
          engine.state,
          selectedCharacter,
          engine.obstacles,
          engine.collectibles,
          engine.particles,
          engine.roadOffset,
          engine.animTime
        );
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [selectedCharacter, setupGameEngine, gameMode]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== 'playing' || !engineRef.current) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engineRef.current.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engineRef.current.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          engineRef.current.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engineRef.current.slide();
          break;
        case 'KeyP':
          e.preventDefault();
          engineRef.current.togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode]);

  // Swipe handlers for mobile touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || gameMode !== 'playing' || !engineRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeDistance = 25;

    if (Math.max(absX, absY) > minSwipeDistance) {
      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) {
          engineRef.current.moveRight();
        } else {
          engineRef.current.moveLeft();
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          engineRef.current.slide();
        } else {
          engineRef.current.jump();
        }
      }
    }
    touchStartPos.current = null;
  };

  // Start game action
  const handleStartGame = () => {
    kuduroAudio.startBgm();
    if (engineRef.current) {
      engineRef.current.restart();
      setHudState({ ...engineRef.current.state });
    }
    setGameMode('playing');
  };

  // Restart after game over
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      setHudState({ ...engineRef.current.state });
    }
    setGameMode('playing');
  };

  // Sound toggle
  const handleToggleMute = () => {
    const muted = kuduroAudio.toggleMute();
    setIsMuted(muted);
  };

  // Pause toggle
  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      setHudState({ ...engineRef.current.state });
    }
  };

  // Character selection & purchases
  const handleSelectCharacter = (char: PlayerCharacter) => {
    setSelectedCharId(char.id);
    localStorage.setItem(STORAGE_KEYS.SELECTED_CHAR, char.id);
    if (engineRef.current) {
      engineRef.current.setCharacter(char);
    }
  };

  const handleBuyCharacter = (char: PlayerCharacter) => {
    if (totalKwanzas >= char.price) {
      const nextKwanzas = totalKwanzas - char.price;
      const nextUnlocked = [...unlockedCharIds, char.id];

      setTotalKwanzas(nextKwanzas);
      setUnlockedCharIds(nextUnlocked);
      setSelectedCharId(char.id);

      localStorage.setItem(STORAGE_KEYS.WALLET, nextKwanzas.toString());
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_CHARS, JSON.stringify(nextUnlocked));
      localStorage.setItem(STORAGE_KEYS.SELECTED_CHAR, char.id);

      kuduroAudio.playPowerUp();

      if (engineRef.current) {
        engineRef.current.setCharacter(char);
        engineRef.current.state.totalKwanzas = nextKwanzas;
      }
    }
  };

  return (
    <div
      id="app-root"
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none touch-none font-sans"
    >
      {/* 3D Game Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* In-Game Heads-Up Display (HUD) */}
      {gameMode === 'playing' && hudState && (
        <>
          <HUD
            state={hudState}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onTogglePause={handleTogglePause}
          />

          {/* On-screen tactile controls */}
          <MobileControls
            onLeft={() => engineRef.current?.moveLeft()}
            onRight={() => engineRef.current?.moveRight()}
            onJump={() => engineRef.current?.jump()}
            onSlide={() => engineRef.current?.slide()}
          />
        </>
      )}

      {/* Start Screen */}
      {gameMode === 'start' && (
        <StartScreen
          character={selectedCharacter}
          highScore={highScore}
          totalKwanzas={totalKwanzas}
          onStartGame={handleStartGame}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* Game Over Modal */}
      {gameMode === 'gameover' && hudState && (
        <GameOverModal
          state={hudState}
          character={selectedCharacter}
          isNewHighScore={isNewHighScore}
          highScore={highScore}
          onRestart={handleRestart}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* Shop / Vestiário Modal */}
      {isShopOpen && (
        <ShopModal
          totalKwanzas={totalKwanzas}
          selectedCharId={selectedCharId}
          unlockedCharIds={unlockedCharIds}
          onSelectCharacter={handleSelectCharacter}
          onBuyCharacter={handleBuyCharacter}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  );
}
