import {
  CollectibleItem,
  GameState,
  Obstacle,
  Particle,
  PlayerCharacter,
  ScenarioConfig
} from '../types';
import { SCENARIOS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private horizonY: number = 0;
  private roadBottomWidth: number = 0;
  private roadTopWidth: number = 0;
  private roadBottomY: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.horizonY = height * 0.44;
    this.roadTopWidth = width * 0.22;
    this.roadBottomWidth = width * 0.94;
    this.roadBottomY = height * 0.96;
  }

  /**
   * Transforms a 3D road coordinate (lane: -1..1, z: 0..maxZ) into 2D canvas screen coords (x, y, scale)
   * z = 0 is right at the player's feet
   * z = 1000 is near the vanishing point / horizon
   */
  public project(lane: number, z: number, yOffset: number = 0): { x: number; y: number; scale: number } {
    const fov = 340;
    const clampedZ = Math.max(1, z);
    const depth = clampedZ + fov;
    const scale = fov / depth;

    const currentRoadWidth = this.roadTopWidth + (this.roadBottomWidth - this.roadTopWidth) * scale;
    const laneStep = currentRoadWidth / 3;
    const centerX = this.width / 2;

    const x = centerX + lane * laneStep;
    const y = this.roadBottomY - (this.roadBottomY - this.horizonY) * (1 - scale) - yOffset * scale * 2.2;

    return { x, y, scale };
  }

  public render(
    state: GameState,
    character: PlayerCharacter,
    obstacles: Obstacle[],
    collectibles: CollectibleItem[],
    particles: Particle[],
    roadOffset: number,
    animTime: number
  ) {
    const scenario = SCENARIOS[state.currentScenario] || SCENARIOS.benfica;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Backdrop
    this.drawSkyAndScenery(scenario, state.distance, animTime);

    // 2. Road surface & Lane lines
    this.drawRoad(scenario, roadOffset);

    // 3. Collectibles & Obstacles sorted by depth (back to front)
    this.drawWorldObjects(obstacles, collectibles, animTime);

    // 4. Player Character
    this.drawPlayer(state, character, animTime);

    // 5. Active particles & popups
    this.drawParticles(particles);

    // 6. Fullscreen speed/turbo overlay if active
    if (state.isTurbo) {
      this.drawTurboEffect(animTime);
    }
  }

  private drawSkyAndScenery(scenario: ScenarioConfig, distance: number, animTime: number) {
    const ctx = this.ctx;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    skyGrad.addColorStop(0, scenario.skyGradient[0]);
    skyGrad.addColorStop(1, scenario.skyGradient[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.horizonY);

    // Sun / Moon / Ambient glow
    const sunX = this.width * 0.75;
    const sunY = this.horizonY * 0.35;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 70);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
    sunGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Distant Luanda city skyline parallax
    const skylineY = this.horizonY;
    const scrollOffset = (distance * 0.3) % 200;

    ctx.fillStyle = scenario.horizonColor;
    // Draw background silhouettes (tall towers in Talatona, monuments in Kinaxixi, palms in Ilha, roofs in Benfica)
    for (let x = -200; x < this.width + 200; x += 45) {
      const seed = Math.sin((x + scrollOffset) * 0.05);
      const h = 25 + Math.abs(seed) * 55;
      const bWidth = 35 + (Math.abs(seed * 10) % 25);
      ctx.fillRect(x - (scrollOffset % 45), skylineY - h, bWidth, h);

      // Light windows on some towers
      if (h > 45) {
        ctx.fillStyle = 'rgba(254, 243, 199, 0.4)';
        for (let wy = skylineY - h + 8; wy < skylineY - 10; wy += 12) {
          ctx.fillRect(x - (scrollOffset % 45) + 6, wy, 4, 6);
          ctx.fillRect(x - (scrollOffset % 45) + 16, wy, 4, 6);
        }
        ctx.fillStyle = scenario.horizonColor;
      }
    }

    // Ground terrain beside road
    ctx.fillStyle = scenario.groundColor;
    ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);

    // Decorative side features (Palm trees or market stalls)
    this.drawRoadsideDecorations(scenario, distance, animTime);
  }

  private drawRoadsideDecorations(scenario: ScenarioConfig, distance: number, _animTime: number) {
    const ctx = this.ctx;
    // Draw decorative items on left and right side of road
    const decorSpacing = 160;
    const startZ = (distance * 1.5) % decorSpacing;

    for (let z = 600; z >= 30; z -= decorSpacing) {
      const effZ = z - startZ;
      if (effZ < 15) continue;

      // Left side decoration
      const leftProj = this.project(-1.75, effZ);
      // Right side decoration
      const rightProj = this.project(1.75, effZ);

      if (scenario.id === 'ilha' || scenario.id === 'talatona') {
        // Draw majestic palm tree
        this.drawPalmTree(leftProj.x, leftProj.y, leftProj.scale);
        this.drawPalmTree(rightProj.x, rightProj.y, rightProj.scale);
      } else if (scenario.id === 'kinaxixi') {
        // Street lamps / neon posts
        this.drawStreetLamp(leftProj.x, leftProj.y, leftProj.scale, true);
        this.drawStreetLamp(rightProj.x, rightProj.y, rightProj.scale, false);
      } else {
        // Benfica: Market stalls / tires / barrel
        this.drawMarketStall(leftProj.x, leftProj.y, leftProj.scale);
        this.drawMarketStall(rightProj.x, rightProj.y, rightProj.scale);
      }
    }
  }

  private drawPalmTree(x: number, y: number, scale: number) {
    const ctx = this.ctx;
    const trunkH = 80 * scale;
    const trunkW = 8 * scale;

    ctx.save();
    ctx.translate(x, y);

    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-trunkW / 2, 0);
    ctx.quadraticCurveTo(trunkW * 0.8, -trunkH * 0.5, trunkW * 0.5, -trunkH);
    ctx.lineTo(-trunkW * 0.2, -trunkH);
    ctx.closePath();
    ctx.fill();

    // Fronds (leaves)
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 4 * scale;
    const angles = [-2.2, -1.8, -1.2, -0.6, -0.1, 0.4];
    angles.forEach(ang => {
      ctx.beginPath();
      ctx.moveTo(trunkW * 0.2, -trunkH);
      const leafLength = 40 * scale;
      const lx = Math.cos(ang) * leafLength;
      const ly = Math.sin(ang) * leafLength - 10 * scale;
      ctx.quadraticCurveTo(lx * 0.5, ly - 10 * scale, lx, ly);
      ctx.stroke();
    });

    ctx.restore();
  }

  private drawStreetLamp(x: number, y: number, scale: number, isLeft: boolean) {
    const ctx = this.ctx;
    const h = 75 * scale;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + (isLeft ? 15 : -15) * scale, y - h);
    ctx.stroke();

    // Glowing bulb
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + (isLeft ? 15 : -15) * scale, y - h, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMarketStall(x: number, y: number, scale: number) {
    const ctx = this.ctx;
    const w = 40 * scale;
    const h = 30 * scale;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x - w / 2, y - h, w, h);
    // Colorful tarp roof
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 5 * scale, y - h);
    ctx.lineTo(x, y - h - 12 * scale);
    ctx.lineTo(x + w / 2 + 5 * scale, y - h);
    ctx.closePath();
    ctx.fill();
  }

  private drawRoad(scenario: ScenarioConfig, roadOffset: number) {
    const ctx = this.ctx;
    const centerX = this.width / 2;

    // Asphalt Road polygon
    ctx.fillStyle = scenario.roadColor;
    ctx.beginPath();
    ctx.moveTo(centerX - this.roadTopWidth / 2, this.horizonY);
    ctx.lineTo(centerX + this.roadTopWidth / 2, this.horizonY);
    ctx.lineTo(centerX + this.roadBottomWidth / 2, this.roadBottomY);
    ctx.lineTo(centerX - this.roadBottomWidth / 2, this.roadBottomY);
    ctx.closePath();
    ctx.fill();

    // Road Kerbs (Red & White alternating street kerbs)
    const kerbSteps = 22;
    for (let i = 0; i < kerbSteps; i++) {
      const zNear = i * 25 - (roadOffset % 50);
      const zFar = zNear + 25;
      if (zNear < 5 || zFar > 550) continue;

      const pNearL = this.project(-1.5, zNear);
      const pFarL = this.project(-1.5, zFar);
      const pNearR = this.project(1.5, zNear);
      const pFarR = this.project(1.5, zFar);

      ctx.fillStyle = i % 2 === 0 ? scenario.kerbColor : '#ffffff';

      // Left kerb
      ctx.beginPath();
      ctx.moveTo(pNearL.x, pNearL.y);
      ctx.lineTo(pFarL.x, pFarL.y);
      ctx.lineTo(pFarL.x - 10 * pFarL.scale, pFarL.y);
      ctx.lineTo(pNearL.x - 10 * pNearL.scale, pNearL.y);
      ctx.closePath();
      ctx.fill();

      // Right kerb
      ctx.beginPath();
      ctx.moveTo(pNearR.x, pNearR.y);
      ctx.lineTo(pFarR.x, pFarR.y);
      ctx.lineTo(pFarR.x + 10 * pFarR.scale, pFarR.y);
      ctx.lineTo(pNearR.x + 10 * pNearR.scale, pNearR.y);
      ctx.closePath();
      ctx.fill();
    }

    // Dashed Lane dividers (between left/mid and mid/right lanes)
    const laneDivs = [-0.5, 0.5];
    ctx.fillStyle = scenario.laneLineColor;

    for (const laneDiv of laneDivs) {
      for (let z = 20; z < 520; z += 55) {
        const stripeZ = z - (roadOffset % 55);
        if (stripeZ < 10) continue;

        const p1 = this.project(laneDiv, stripeZ);
        const p2 = this.project(laneDiv, stripeZ + 28);
        const stripeWidth = 6 * p1.scale;

        ctx.beginPath();
        ctx.moveTo(p1.x - stripeWidth / 2, p1.y);
        ctx.lineTo(p1.x + stripeWidth / 2, p1.y);
        ctx.lineTo(p2.x + stripeWidth / 2, p2.y);
        ctx.lineTo(p2.x - stripeWidth / 2, p2.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawWorldObjects(obstacles: Obstacle[], collectibles: CollectibleItem[], animTime: number) {
    // Combine both into one array and sort by Z descending (farthest first)
    type RenderItem =
      | { kind: 'obstacle'; data: Obstacle; z: number }
      | { kind: 'collectible'; data: CollectibleItem; z: number };

    const items: RenderItem[] = [
      ...obstacles.filter(o => o.z > 5 && !o.hit).map(o => ({ kind: 'obstacle' as const, data: o, z: o.z })),
      ...collectibles.filter(c => c.z > 5 && !c.collected).map(c => ({ kind: 'collectible' as const, data: c, z: c.z }))
    ];

    items.sort((a, b) => b.z - a.z);

    for (const item of items) {
      if (item.kind === 'obstacle') {
        this.drawSingleObstacle(item.data, animTime);
      } else {
        this.drawSingleCollectible(item.data, animTime);
      }
    }
  }

  // --- OBSTACLES ---

  private drawSingleObstacle(obs: Obstacle, animTime: number) {
    const { x, y, scale } = this.project(obs.lane, obs.z);
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    switch (obs.type) {
      case 'candongueiro':
        this.drawCandongueiroVan(ctx, scale, animTime);
        break;
      case 'buraco':
        this.drawPothole(ctx, scale);
        break;
      case 'policia':
        this.drawPoliceOfficer(ctx, scale, animTime);
        break;
      case 'contas':
        this.drawFlyingBills(ctx, scale, animTime);
        break;
    }

    ctx.restore();
  }

  /**
   * Candongueiro (Toyota HiAce Azul e Branco)
   * The undisputed king of Luanda public transit!
   */
  private drawCandongueiroVan(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    const vanW = 82 * scale;
    const vanH = 72 * scale;
    const halfW = vanW / 2;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, halfW * 1.1, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-halfW + 6 * scale, -18 * scale, 16 * scale, 18 * scale);
    ctx.fillRect(halfW - 22 * scale, -18 * scale, 16 * scale, 18 * scale);
    // Silver hubcaps
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(-halfW + 14 * scale, -9 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(halfW - 14 * scale, -9 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Lower body (AZUL CELESTE / BLUE)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-halfW, -vanH * 0.6, vanW, vanH * 0.6 - 6 * scale, [4 * scale]);
    ctx.fill();

    // Upper body (BRANCO / WHITE)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-halfW, -vanH, vanW, vanH * 0.45, [10 * scale, 10 * scale, 0, 0]);
    ctx.fill();

    // Front Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 8 * scale, -vanH * 0.94, vanW - 16 * scale, vanH * 0.38, [6 * scale]);
    ctx.fill();

    // Driver silhouette
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-halfW + 24 * scale, -vanH * 0.72, 9 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Front Grille & Toyota badge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 16 * scale, -vanH * 0.42, vanW - 32 * scale, 12 * scale);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(0, -vanH * 0.36, 6 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front Headlights (Yellow/White glow)
    const lightGlow = Math.sin(animTime * 8) > 0 ? '#fef08a' : '#fde047';
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.roundRect(-halfW + 6 * scale, -vanH * 0.46, 12 * scale, 10 * scale, [2 * scale]);
    ctx.roundRect(halfW - 18 * scale, -vanH * 0.46, 12 * scale, 10 * scale, [2 * scale]);
    ctx.fill();

    // License Plate "LD-88-24"
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-16 * scale, -vanH * 0.22, 32 * scale, 9 * scale);
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('LD-KUDURO', 0, -vanH * 0.14);

    // Route sign on roof: "SÃO PAULO / MUTAMBA"
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-halfW + 14 * scale, -vanH - 8 * scale, vanW - 28 * scale, 10 * scale);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.max(6, Math.floor(6.5 * scale))}px sans-serif`;
    ctx.fillText('MUTAMBA', 0, -vanH - 1 * scale);
  }

  /**
   * Buraco na Estrada (Pothole with broken edge & warning stones)
   */
  private drawPothole(ctx: CanvasRenderingContext2D, scale: number) {
    const rx = 36 * scale;
    const ry = 14 * scale;

    // Outer cracked asphalt
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner deep pit
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, rx * 0.75, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warning stones or branch (classic Angolan street warning marker)
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(-rx * 0.8, -ry * 0.4, 5 * scale, 0, Math.PI * 2);
    ctx.arc(rx * 0.7, -ry * 0.3, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Red warning flag / cloth
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -22 * scale);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -22 * scale);
    ctx.lineTo(14 * scale, -17 * scale);
    ctx.lineTo(0, -12 * scale);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Polícia de Trânsito (Fiscalização / Operação Stop)
   */
  private drawPoliceOfficer(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    const h = 76 * scale;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (Navy blue trousers)
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-10 * scale, -h * 0.45, 8 * scale, h * 0.45);
    ctx.fillRect(2 * scale, -h * 0.45, 8 * scale, h * 0.45);
    // Black shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(-12 * scale, -5 * scale, 10 * scale, 5 * scale);
    ctx.fillRect(2 * scale, -5 * scale, 10 * scale, 5 * scale);

    // Torso with Fluorescent High-Vis Vest (Colete Refletor)
    ctx.fillStyle = '#84cc16'; // Neon lime
    ctx.fillRect(-14 * scale, -h * 0.8, 28 * scale, h * 0.36);
    // Silver reflective stripes
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-14 * scale, -h * 0.68, 28 * scale, 5 * scale);
    ctx.fillRect(-14 * scale, -h * 0.54, 28 * scale, 5 * scale);

    // Head / Face
    ctx.fillStyle = '#5c2c16';
    ctx.beginPath();
    ctx.arc(0, -h * 0.88, 11 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Police Peaked Cap (Képi azul com pala preta)
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-13 * scale, -h * 1.02, 26 * scale, 10 * scale);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-15 * scale, -h * 0.94, 30 * scale, 4 * scale);

    // Arm extended with STOP whistle / hand sign
    const armWobble = Math.sin(animTime * 6) * 3 * scale;
    ctx.strokeStyle = '#5c2c16';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(12 * scale, -h * 0.72);
    ctx.lineTo(26 * scale, -h * 0.72 + armWobble);
    ctx.stroke();

    // White glove hand signaling STOP
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(28 * scale, -h * 0.72 + armWobble, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Badge "STOP"
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -h * 0.62, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(5, Math.floor(6 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STOP', 0, -h * 0.59);
  }

  /**
   * Contas pra Pagar 😂 (Facturas voando à altura da cabeça - agachar/slide!)
   */
  private drawFlyingBills(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    // Floats in the air around head/chest height (requires sliding under!)
    const floatY = -48 * scale + Math.sin(animTime * 7) * 6 * scale;

    // Ground shadow showing obstacle is in the lane
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(0, floatY);

    // Floating envelope / Invoice stack
    ctx.fillStyle = '#fef08a';
    ctx.rotate(Math.sin(animTime * 4) * 0.12);
    ctx.fillRect(-28 * scale, -18 * scale, 56 * scale, 36 * scale);

    // Red Urgent Stamp "A PAGAR!"
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(-24 * scale, -14 * scale, 48 * scale, 28 * scale);

    ctx.fillStyle = '#dc2626';
    ctx.font = `bold ${Math.max(7, Math.floor(8 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('FATURA', 0, -4 * scale);

    ctx.fillStyle = '#b91c1c';
    ctx.font = `bold ${Math.max(5, Math.floor(6.5 * scale))}px sans-serif`;
    ctx.fillText('50.000 Kz', 0, 6 * scale);

    // Floating secondary bill flapping behind
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(16 * scale, -28 * scale, 24 * scale, 18 * scale);
    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${Math.max(5, Math.floor(5 * scale))}px sans-serif`;
    ctx.fillText('ENDE', 28 * scale, -16 * scale);

    ctx.restore();
  }

  // --- COLLECTIBLES & POWER-UPS ---

  private drawSingleCollectible(item: CollectibleItem, animTime: number) {
    const { x, y, scale } = this.project(item.lane, item.z, item.yOffset || 0);
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating bounce
    const bobY = -24 * scale + Math.sin(animTime * 8 + item.id) * 6 * scale;
    ctx.translate(0, bobY);

    if (item.type === 'kwanza') {
      this.drawKwanzaCoin(ctx, scale, animTime);
    } else if (item.type === 'shield') {
      this.drawMicrophoneShield(ctx, scale, animTime);
    } else if (item.type === 'turbo') {
      this.drawWaterBottleTurbo(ctx, scale, animTime);
    } else if (item.type === 'multiplier') {
      this.drawBeatPowerUp(ctx, scale, animTime);
    }

    ctx.restore();
  }

  /**
   * Kwanza (Kz) Gold Coin
   */
  private drawKwanzaCoin(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    const spin = Math.sin(animTime * 6);
    const radius = 16 * scale;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.abs(spin) * radius, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner rim
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.abs(spin) * radius * 0.75, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Kz letters if coin is facing forward
    if (Math.abs(spin) > 0.4) {
      ctx.fillStyle = '#78350f';
      ctx.font = `bold ${Math.max(7, Math.floor(11 * scale))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Kz', 0, 0);
    }
  }

  /**
   * Microfone = Escudo
   */
  private drawMicrophoneShield(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    // Pulsing aura ring
    const pulse = 1 + Math.sin(animTime * 10) * 0.15;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * scale * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Gold Microphone Body
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-4 * scale, -4 * scale, 8 * scale, 22 * scale);

    // Grille head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -10 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Badge label
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ESCUDO', 0, 26 * scale);
  }

  /**
   * Garrafa de Água = Turbo
   */
  private drawWaterBottleTurbo(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    // Water splash waves around it
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * scale + Math.sin(animTime * 12) * 3 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Blue bottle body
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.roundRect(-7 * scale, -14 * scale, 14 * scale, 26 * scale, [4 * scale]);
    ctx.fill();

    // White label "PURÍSSIMA"
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7 * scale, -6 * scale, 14 * scale, 10 * scale);

    // Blue bottle cap
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-4 * scale, -18 * scale, 8 * scale, 5 * scale);

    // Speed label
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('TURBO', 0, 24 * scale);
  }

  /**
   * Beat = Pontos x2
   */
  private drawBeatPowerUp(ctx: CanvasRenderingContext2D, scale: number, animTime: number) {
    // Pulsing music note / boombox
    const pulse = 1 + Math.sin(animTime * 12) * 0.18;
    ctx.save();
    ctx.scale(pulse, pulse);

    // Magenta Boombox
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.roundRect(-16 * scale, -12 * scale, 32 * scale, 22 * scale, [5 * scale]);
    ctx.fill();

    // Speakers
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.arc(-8 * scale, -1 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(8 * scale, -1 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Center cassette / x2
    ctx.fillStyle = '#fef08a';
    ctx.font = `bold ${Math.max(7, Math.floor(8 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2X', 0, -1 * scale);

    ctx.restore();

    ctx.fillStyle = '#f472b6';
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('BEAT x2', 0, 24 * scale);
  }

  // --- PLAYER CHARACTER (KUDURO ARTIST) ---

  private drawPlayer(state: GameState, character: PlayerCharacter, animTime: number) {
    // Current interpolated lane position
    const lanePos = state.laneTransition;
    const { x, y, scale } = this.project(lanePos, 35, state.jumpY);
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    // Ground Shadow (shrinks when jumping)
    const shadowScale = Math.max(0.3, 1 - state.jumpY / 120);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, state.jumpY * scale * 2.2, 22 * scale * shadowScale, 9 * scale * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield Aura (if active)
    if (state.shieldActive) {
      const shieldPulse = 1 + Math.sin(animTime * 14) * 0.08;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(0, -42 * scale, 42 * scale * shieldPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.beginPath();
      ctx.arc(0, -42 * scale, 42 * scale * shieldPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Double Beat Musical Aura (if active)
    if (state.activePowerUps.multiplier) {
      ctx.fillStyle = '#ec4899';
      const noteX = Math.sin(animTime * 8) * 26 * scale;
      const noteY = -65 * scale + Math.cos(animTime * 8) * 10 * scale;
      ctx.font = `bold ${Math.floor(16 * scale)}px sans-serif`;
      ctx.fillText('♪', noteX, noteY);
    }

    // Kuduro Dance / Run Cycle Animation
    const runCycle = Math.sin(animTime * (state.isTurbo ? 22 : 14));
    const isSliding = state.isSliding;
    const isJumping = state.isJumping;

    if (isSliding) {
      this.drawKuduroSlide(ctx, scale, character, animTime);
    } else if (isJumping) {
      this.drawKuduroJump(ctx, scale, character, animTime);
    } else {
      this.drawKuduroRun(ctx, scale, character, runCycle, animTime);
    }

    ctx.restore();
  }

  private drawKuduroRun(
    ctx: CanvasRenderingContext2D,
    scale: number,
    char: PlayerCharacter,
    runCycle: number,
    _animTime: number
  ) {
    const h = 76 * scale;
    const legOffset = runCycle * 14 * scale;

    // Legs with Kuduro dance swagger
    ctx.fillStyle = char.colorScheme.pants;
    // Left leg
    ctx.fillRect(-12 * scale, -h * 0.45, 9 * scale, h * 0.45 + legOffset * 0.4);
    // Right leg
    ctx.fillRect(3 * scale, -h * 0.45, 9 * scale, h * 0.45 - legOffset * 0.4);

    // Stylish Sneakers (Ténis de Kuduro)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14 * scale, -5 * scale + legOffset * 0.4, 12 * scale, 6 * scale);
    ctx.fillRect(2 * scale, -5 * scale - legOffset * 0.4, 12 * scale, 6 * scale);
    // Sneaker accent stripe
    ctx.fillStyle = char.colorScheme.accent;
    ctx.fillRect(-14 * scale, -3 * scale + legOffset * 0.4, 12 * scale, 2 * scale);
    ctx.fillRect(2 * scale, -3 * scale - legOffset * 0.4, 12 * scale, 2 * scale);

    // Torso / Jersey
    ctx.fillStyle = char.colorScheme.shirt;
    ctx.beginPath();
    ctx.roundRect(-15 * scale, -h * 0.82, 30 * scale, h * 0.4, [6 * scale]);
    ctx.fill();

    // Gold Chain (Cordão de Ouro Luandense)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(0, -h * 0.74, 9 * scale, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Kuduro Dancing Arms (Pumping to the 140 BPM beat)
    const armL = -runCycle * 18 * scale;
    const armR = runCycle * 18 * scale;
    ctx.strokeStyle = char.colorScheme.skin;
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = 'round';

    // Left arm
    ctx.beginPath();
    ctx.moveTo(-14 * scale, -h * 0.76);
    ctx.lineTo(-24 * scale, -h * 0.6 + armL);
    ctx.stroke();

    // Right arm (holding golden mic or pointing to the crowd)
    ctx.beginPath();
    ctx.moveTo(14 * scale, -h * 0.76);
    ctx.lineTo(24 * scale, -h * 0.6 + armR);
    ctx.stroke();

    // Head
    ctx.fillStyle = char.colorScheme.skin;
    ctx.beginPath();
    ctx.arc(0, -h * 0.92, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Sunglasses / Óculos escuros
    if (char.colorScheme.glasses) {
      ctx.fillStyle = char.colorScheme.glasses;
      ctx.fillRect(-10 * scale, -h * 0.96, 20 * scale, 6 * scale);
    }

    // Hat / Cap / Toque
    ctx.fillStyle = char.colorScheme.hat;
    ctx.beginPath();
    ctx.arc(0, -h * 0.98, 13 * scale, Math.PI, 0);
    ctx.fill();
    // Cap visor
    ctx.fillRect(-14 * scale, -h * 0.98, 28 * scale, 4 * scale);
  }

  private drawKuduroJump(
    ctx: CanvasRenderingContext2D,
    scale: number,
    char: PlayerCharacter,
    _animTime: number
  ) {
    const h = 76 * scale;

    // Acrobatics jump: legs kicked sideways (Kuduro jump style)
    ctx.fillStyle = char.colorScheme.pants;
    ctx.save();
    // Left leg kicked
    ctx.rotate(-0.3);
    ctx.fillRect(-18 * scale, -h * 0.45, 9 * scale, h * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-20 * scale, -5 * scale, 12 * scale, 6 * scale);
    ctx.restore();

    ctx.save();
    // Right leg kicked
    ctx.rotate(0.3);
    ctx.fillStyle = char.colorScheme.pants;
    ctx.fillRect(9 * scale, -h * 0.45, 9 * scale, h * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8 * scale, -5 * scale, 12 * scale, 6 * scale);
    ctx.restore();

    // Torso
    ctx.fillStyle = char.colorScheme.shirt;
    ctx.beginPath();
    ctx.roundRect(-15 * scale, -h * 0.82, 30 * scale, h * 0.4, [6 * scale]);
    ctx.fill();

    // Arms spread high in celebration
    ctx.strokeStyle = char.colorScheme.skin;
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14 * scale, -h * 0.76);
    ctx.lineTo(-28 * scale, -h * 0.95);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14 * scale, -h * 0.76);
    ctx.lineTo(28 * scale, -h * 0.95);
    ctx.stroke();

    // Head
    ctx.fillStyle = char.colorScheme.skin;
    ctx.beginPath();
    ctx.arc(0, -h * 0.92, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (char.colorScheme.glasses) {
      ctx.fillStyle = char.colorScheme.glasses;
      ctx.fillRect(-10 * scale, -h * 0.96, 20 * scale, 6 * scale);
    }

    ctx.fillStyle = char.colorScheme.hat;
    ctx.beginPath();
    ctx.arc(0, -h * 0.98, 13 * scale, Math.PI, 0);
    ctx.fill();
  }

  private drawKuduroSlide(
    ctx: CanvasRenderingContext2D,
    scale: number,
    char: PlayerCharacter,
    _animTime: number
  ) {
    // Sliding horizontally on the knee (Toque do deslizamento)
    const w = 68 * scale;
    const h = 30 * scale;

    // Dust trail behind slide
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.beginPath();
    ctx.arc(-w * 0.4, 0, 10 * scale, 0, Math.PI * 2);
    ctx.arc(-w * 0.7, -4 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Body horizontal
    ctx.fillStyle = char.colorScheme.pants;
    ctx.fillRect(-w * 0.4, -h * 0.6, w * 0.5, h * 0.5);

    // Sneakers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.5, -h * 0.5, 12 * scale, 8 * scale);

    // Torso tilted forward
    ctx.fillStyle = char.colorScheme.shirt;
    ctx.beginPath();
    ctx.roundRect(0, -h * 0.85, w * 0.4, h * 0.75, [4 * scale]);
    ctx.fill();

    // Head low
    ctx.fillStyle = char.colorScheme.skin;
    ctx.beginPath();
    ctx.arc(w * 0.38, -h * 0.65, 11 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (char.colorScheme.glasses) {
      ctx.fillStyle = char.colorScheme.glasses;
      ctx.fillRect(w * 0.35, -h * 0.7, 12 * scale, 5 * scale);
    }

    ctx.fillStyle = char.colorScheme.hat;
    ctx.beginPath();
    ctx.arc(w * 0.38, -h * 0.72, 11 * scale, Math.PI * 0.8, 0);
    ctx.fill();
  }

  // --- PARTICLES & FX ---

  private drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${Math.max(12, Math.floor(p.size))}px 'Chakra Petch', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawTurboEffect(animTime: number) {
    const ctx = this.ctx;
    // Speed lines on outer edges of screen
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    const numLines = 14;

    for (let i = 0; i < numLines; i++) {
      const y = (i / numLines) * this.height + (Math.sin(animTime * 10 + i) * 20);
      const len = 40 + Math.random() * 80;

      // Left speed line
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(10 + len, y);
      ctx.stroke();

      // Right speed line
      ctx.beginPath();
      ctx.moveTo(this.width - 10, y);
      ctx.lineTo(this.width - 10 - len, y);
      ctx.stroke();
    }
  }
}
