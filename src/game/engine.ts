import { kuduroAudio } from '../audio/kuduroAudio';
import {
  ActivePowerUp,
  CollectibleItem,
  GameState,
  Obstacle,
  ObstacleType,
  Particle,
  PlayerCharacter,
  PowerUpType,
  ScenarioId
} from '../types';
import { DEATH_MESSAGES, POWER_UP_CONFIG, SCENARIOS } from './constants';

export class GameEngine {
  public state: GameState;
  public obstacles: Obstacle[] = [];
  public collectibles: CollectibleItem[] = [];
  public particles: Particle[] = [];
  public roadOffset: number = 0;
  public animTime: number = 0;

  private nextObstacleZ: number = 220;
  private nextCollectibleZ: number = 80;
  private nextId: number = 1;
  private jumpVelocity: number = 0;
  private gravity: number = 0.65;
  private baseSpeed: number = 5.2;
  private targetSpeed: number = 5.2;
  private maxSpeed: number = 11.5;

  private character: PlayerCharacter;
  private onGameOverCallback?: (finalState: GameState) => void;
  private onScenarioChangeCallback?: (newScenario: ScenarioId) => void;

  constructor(
    character: PlayerCharacter,
    totalKwanzas: number = 0,
    onGameOver?: (finalState: GameState) => void,
    onScenarioChange?: (newScenario: ScenarioId) => void
  ) {
    this.character = character;
    this.onGameOverCallback = onGameOver;
    this.onScenarioChangeCallback = onScenarioChange;

    this.state = this.getInitialState(totalKwanzas);

    // If character starts with bonus shield
    if (character.id === 'bruno_kuduro') {
      this.activatePowerUp('shield');
    }
  }

  public getInitialState(totalKwanzas: number): GameState {
    return {
      score: 0,
      distance: 0,
      kwanzas: 0,
      totalKwanzas: totalKwanzas,
      speed: this.baseSpeed,
      lane: 0,
      targetLane: 0,
      laneTransition: 0,
      isJumping: false,
      jumpY: 0,
      isSliding: false,
      slideProgress: 0,
      activePowerUps: {},
      currentScenario: 'benfica',
      scenarioDistance: 0,
      health: 1,
      maxHealth: 1,
      shieldActive: false,
      multiplier: 1,
      isTurbo: false,
      isGameOver: false,
      isPaused: false,
      deathReason: '',
      showArrived: false
    };
  }

  public setCharacter(char: PlayerCharacter) {
    this.character = char;
  }

  // --- CONTROLS ---

  public moveLeft() {
    if (this.state.isGameOver || this.state.isPaused) return;
    if (this.state.targetLane > -1) {
      this.state.targetLane = (this.state.targetLane - 1) as -1 | 0 | 1;
      kuduroAudio.playSlide();
    }
  }

  public moveRight() {
    if (this.state.isGameOver || this.state.isPaused) return;
    if (this.state.targetLane < 1) {
      this.state.targetLane = (this.state.targetLane + 1) as -1 | 0 | 1;
      kuduroAudio.playSlide();
    }
  }

  public jump() {
    if (this.state.isGameOver || this.state.isPaused) return;
    if (!this.state.isJumping) {
      this.state.isJumping = true;
      this.state.isSliding = false; // Cancel slide if jumping
      this.jumpVelocity = 14.5;
      kuduroAudio.playJump();
    }
  }

  public slide() {
    if (this.state.isGameOver || this.state.isPaused) return;
    if (this.state.isJumping) {
      // Fast fall if mid-air
      this.jumpVelocity = -18;
    }
    this.state.isSliding = true;
    this.state.slideProgress = 1;
    kuduroAudio.playSlide();
  }

  public togglePause() {
    this.state.isPaused = !this.state.isPaused;
    if (this.state.isPaused) {
      kuduroAudio.stopBgm();
    } else {
      kuduroAudio.startBgm();
    }
  }

  // --- MAIN LOOP UPDATE (Called 60 FPS) ---

  public update(deltaTime: number) {
    if (this.state.isGameOver || this.state.isPaused) return;

    this.animTime += deltaTime;

    // 1. Update Speed and Distance
    this.updateSpeedAndDistance(deltaTime);

    // 2. Smooth lane movement (Lerp)
    this.updateLaneInterpolation(deltaTime);

    // 3. Jump and Slide Physics
    this.updatePlayerPhysics(deltaTime);

    // 4. Update Active Power-ups
    this.updatePowerUps(deltaTime);

    // 5. Spawn World Objects (Obstacles and Collectibles)
    this.spawnElements();

    // 6. Update Entities (Movement, Collisions, Cleanups)
    this.updateWorldObjects(deltaTime);

    // 7. Update Particles
    this.updateParticles(deltaTime);

    // 8. Scenario Progression Check
    this.checkScenarioProgression();
  }

  private updateSpeedAndDistance(deltaTime: number) {
    // Gradually increase game speed with distance
    const speedIncrease = Math.min(4.5, (this.state.distance / 1200) * 1.5);
    this.targetSpeed = (this.baseSpeed + speedIncrease) * (this.state.isTurbo ? 1.7 : 1);

    // Turbo speed boost bonus for Mestre Sebem
    if (this.state.isTurbo && this.character.id === 'mestre_sebem') {
      this.targetSpeed *= 1.25;
    }

    this.state.speed += (this.targetSpeed - this.state.speed) * 0.1;
    this.roadOffset += this.state.speed;

    const deltaDistance = (this.state.speed * deltaTime * 12);
    this.state.distance += deltaDistance;

    // Points gain (distance + multiplier)
    const pts = deltaDistance * 1.8 * this.state.multiplier;
    this.state.score += Math.floor(pts);
  }

  private updateLaneInterpolation(deltaTime: number) {
    const laneSpeed = 16 * deltaTime;
    this.state.laneTransition += (this.state.targetLane - this.state.laneTransition) * Math.min(1, laneSpeed);
    this.state.lane = Math.round(this.state.laneTransition) as -1 | 0 | 1;
  }

  private updatePlayerPhysics(deltaTime: number) {
    // Jump physics
    if (this.state.isJumping) {
      this.state.jumpY += this.jumpVelocity;
      this.jumpVelocity -= this.gravity * (deltaTime * 60);

      if (this.state.jumpY <= 0) {
        this.state.jumpY = 0;
        this.state.isJumping = false;
        this.jumpVelocity = 0;
      }
    }

    // Slide timer
    if (this.state.isSliding) {
      this.state.slideProgress -= deltaTime * 1.8;
      if (this.state.slideProgress <= 0) {
        this.state.isSliding = false;
        this.state.slideProgress = 0;
      }
    }
  }

  private updatePowerUps(deltaTime: number) {
    const powerUps = this.state.activePowerUps;

    // Reset base flags
    this.state.isTurbo = false;
    this.state.multiplier = 1;
    this.state.shieldActive = false;

    for (const key in powerUps) {
      const type = key as PowerUpType;
      const pu = powerUps[type];
      if (!pu) continue;

      pu.duration -= deltaTime;
      if (pu.duration <= 0) {
        delete powerUps[type];
        if (type === 'turbo') {
          kuduroAudio.setTurbo(false);
        }
      } else {
        if (type === 'shield') this.state.shieldActive = true;
        if (type === 'turbo') {
          this.state.isTurbo = true;
          this.state.shieldActive = true; // Turbo also gives invulnerability
        }
        if (type === 'multiplier') this.state.multiplier = 2;
      }
    }
  }

  public activatePowerUp(type: PowerUpType) {
    const config = POWER_UP_CONFIG[type];
    let duration = config.baseDuration;

    // Character bonus for Diva Zélia (longer beat)
    if (type === 'multiplier' && this.character.id === 'diva_zelia') {
      duration *= 1.5;
    }

    this.state.activePowerUps[type] = {
      type,
      duration,
      totalDuration: duration
    };

    if (type === 'turbo') {
      kuduroAudio.setTurbo(true);
    }

    kuduroAudio.playPowerUp();
    this.spawnTextParticle(config.effectName, '#fef08a');
  }

  // --- SPAWNING ---

  private spawnElements() {
    // 1. Obstacle spawning
    if (this.nextObstacleZ < 550) {
      this.spawnObstacleWave();
      // Distance between obstacle waves shrinks slightly with distance
      const minGap = Math.max(90, 150 - (this.state.distance / 1000) * 20);
      this.nextObstacleZ += minGap + Math.random() * 60;
    }

    // 2. Collectible spawning
    if (this.nextCollectibleZ < 550) {
      this.spawnCollectiblePattern();
      this.nextCollectibleZ += 60 + Math.random() * 50;
    }
  }

  private spawnObstacleWave() {
    const types: ObstacleType[] = ['candongueiro', 'buraco', 'policia', 'contas'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    // Choose 1 or 2 lanes (guarantee at least one lane is safe)
    const freeLane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
    const lanes: (-1 | 0 | 1)[] = [-1, 0, 1].filter(l => l !== freeLane) as (-1 | 0 | 1)[];

    // Spawn primary obstacle
    const primaryLane = lanes[Math.floor(Math.random() * lanes.length)];
    this.addObstacle(selectedType, primaryLane, this.nextObstacleZ);

    // Occasionally spawn another obstacle in another lane, ensuring it's jumpable/slideable
    if (Math.random() > 0.45 && lanes.length > 1) {
      const otherLane = lanes.find(l => l !== primaryLane)!;
      // If primary is candongueiro (tall), secondary must be jumpable or slideable
      const secondaryType: ObstacleType = selectedType === 'candongueiro' ? (Math.random() > 0.5 ? 'buraco' : 'contas') : 'buraco';
      this.addObstacle(secondaryType, otherLane, this.nextObstacleZ + 20);
    }
  }

  private addObstacle(type: ObstacleType, lane: -1 | 0 | 1, z: number) {
    const obs: Obstacle = {
      id: this.nextId++,
      type,
      lane,
      z,
      speed: type === 'candongueiro' && Math.random() > 0.5 ? -1.2 : 0, // Some candongueiros drive forward
      width: 0.8,
      height: type === 'contas' ? 0.9 : 1.2,
      hit: false,
      canJumpOver: type === 'buraco' || type === 'policia',
      canSlideUnder: type === 'contas'
    };

    // If candongueiro is moving towards player, play occasional horn
    if (obs.speed < 0 && Math.random() > 0.6) {
      kuduroAudio.playHorn();
    }

    this.obstacles.push(obs);
  }

  private spawnCollectiblePattern() {
    const rand = Math.random();
    const lane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;

    // 12% chance for a Power-Up
    if (rand < 0.12) {
      const pTypes: PowerUpType[] = ['shield', 'turbo', 'multiplier'];
      const chosenPowerUp = pTypes[Math.floor(Math.random() * pTypes.length)];
      this.collectibles.push({
        id: this.nextId++,
        type: chosenPowerUp,
        lane,
        z: this.nextCollectibleZ,
        collected: false
      });
      return;
    }

    // Otherwise spawn an arc or row of 3-5 Kwanzas
    const count = 3 + Math.floor(Math.random() * 3);
    const hasJumpArc = Math.random() > 0.6;

    for (let i = 0; i < count; i++) {
      const z = this.nextCollectibleZ + i * 22;
      const yOffset = hasJumpArc ? Math.sin((i / (count - 1)) * Math.PI) * 35 : 0;
      this.collectibles.push({
        id: this.nextId++,
        type: 'kwanza',
        lane,
        z,
        yOffset,
        collected: false
      });
    }
  }

  // --- ENTITY UPDATES & COLLISIONS ---

  private updateWorldObjects(deltaTime: number) {
    const playerZ = 35; // Player position on road
    const collisionDepth = 18;
    const playerY = this.state.jumpY;
    const isSliding = this.state.isSliding;

    // Character magnet bonus (Scró Boy attracts Kwanzas from afar)
    const magnetDistance = this.character.id === 'scro_boy' || this.state.isTurbo ? 90 : 25;

    // 1. Update Collectibles
    for (const c of this.collectibles) {
      c.z -= this.state.speed;

      // Magnet attraction
      if (!c.collected && Math.abs(c.z - playerZ) < magnetDistance) {
        if (c.lane !== this.state.lane) {
          c.lane = (c.lane + (this.state.lane - c.lane) * 0.25) as -1 | 0 | 1;
        }
      }

      // Collect condition
      if (!c.collected && Math.abs(c.z - playerZ) < collisionDepth) {
        const laneDiff = Math.abs(c.lane - this.state.laneTransition);
        const yDiff = Math.abs((c.yOffset || 0) - playerY);

        if (laneDiff < 0.55 && yDiff < 45) {
          c.collected = true;
          this.onCollectItem(c);
        }
      }
    }

    // 2. Update Obstacles
    for (const obs of this.obstacles) {
      obs.z -= this.state.speed - obs.speed;

      // Check collision
      if (!obs.hit && Math.abs(obs.z - playerZ) < collisionDepth) {
        const laneDiff = Math.abs(obs.lane - this.state.laneTransition);

        if (laneDiff < 0.52) {
          // Check jump or slide evasion
          let evaded = false;

          if (obs.canJumpOver && playerY > 26) {
            evaded = true; // Successfully jumped over buraco / policia!
          } else if (obs.canSlideUnder && isSliding) {
            evaded = true; // Successfully slid under flying bills (contas)!
          }

          if (!evaded) {
            obs.hit = true;
            this.handleCollision(obs);
          }
        }
      }
    }

    // Clean up objects that have passed far behind the screen
    this.obstacles = this.obstacles.filter(o => o.z > 5 && !o.hit);
    this.collectibles = this.collectibles.filter(c => c.z > 5 && !c.collected);

    this.nextObstacleZ -= this.state.speed;
    this.nextCollectibleZ -= this.state.speed;
  }

  private onCollectItem(item: CollectibleItem) {
    if (item.type === 'kwanza') {
      const kwanzaValue = 10 * this.state.multiplier;
      this.state.kwanzas += kwanzaValue;
      this.state.totalKwanzas += kwanzaValue;
      this.state.score += 50 * this.state.multiplier;
      kuduroAudio.playCoin();
      this.spawnCoinParticles(item.lane);
    } else {
      this.activatePowerUp(item.type);
    }
  }

  private handleCollision(obs: Obstacle) {
    // 1. If Turbo is active, smash through obstacle with bonus points
    if (this.state.isTurbo) {
      this.state.score += 500;
      kuduroAudio.playShieldDeflect();
      this.spawnTextParticle('DESTRUIDO!', '#38bdf8');
      return;
    }

    // 2. If Shield (Microfone) is active, deflect collision
    if (this.state.shieldActive) {
      this.state.shieldActive = false;
      delete this.state.activePowerUps.shield;
      kuduroAudio.playShieldDeflect();
      this.spawnTextParticle('ESCUDO SALVOU!', '#fbbf24');
      return;
    }

    // 3. Lethal collision -> Game Over
    this.triggerGameOver(obs.type);
  }

  private triggerGameOver(type: ObstacleType) {
    this.state.isGameOver = true;
    kuduroAudio.stopBgm();
    kuduroAudio.playCrash();

    // Select authentic humorous death message
    const msgs = DEATH_MESSAGES[type] || ['Fim da corrida!'];
    this.state.deathReason = msgs[Math.floor(Math.random() * msgs.length)];

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.state);
    }
  }

  private checkScenarioProgression() {
    const dist = this.state.distance;
    let nextScenario: ScenarioId = 'benfica';

    if (dist >= SCENARIOS.ilha.distanceThreshold) {
      nextScenario = 'ilha';
      if (!this.state.showArrived) {
        this.state.showArrived = true;
        this.spawnTextParticle('CHEGASTE AO SHOW!', '#22c55e');
      }
    } else if (dist >= SCENARIOS.kinaxixi.distanceThreshold) {
      nextScenario = 'kinaxixi';
    } else if (dist >= SCENARIOS.talatona.distanceThreshold) {
      nextScenario = 'talatona';
    }

    if (nextScenario !== this.state.currentScenario) {
      this.state.currentScenario = nextScenario;
      kuduroAudio.playScenarioTransition();
      this.spawnTextParticle(SCENARIOS[nextScenario].name.toUpperCase(), '#f59e0b');

      if (this.onScenarioChangeCallback) {
        this.onScenarioChangeCallback(nextScenario);
      }
    }
  }

  // --- PARTICLES ---

  private spawnCoinParticles(_lane: number) {
    const colors = ['#f59e0b', '#fbbf24', '#fef08a'];
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: window.innerWidth / 2 + (Math.random() * 80 - 40),
        y: window.innerHeight * 0.7 + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  private spawnTextParticle(text: string, color: string) {
    this.particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.45,
      vx: 0,
      vy: -1.5,
      color,
      size: 22,
      alpha: 1,
      life: 1.2,
      maxLife: 1.2,
      text
    });
  }

  private updateParticles(deltaTime: number) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  public restart() {
    const savedTotalKwanzas = this.state.totalKwanzas;
    this.state = this.getInitialState(savedTotalKwanzas);
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.nextObstacleZ = 220;
    this.nextCollectibleZ = 80;

    if (this.character.id === 'bruno_kuduro') {
      this.activatePowerUp('shield');
    }

    kuduroAudio.startBgm();
  }
}
