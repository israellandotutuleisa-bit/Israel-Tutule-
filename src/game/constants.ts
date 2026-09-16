import { PlayerCharacter, ScenarioConfig, ScenarioId } from '../types';

export const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  benfica: {
    id: 'benfica',
    name: 'Benfica',
    subtitle: 'Mercados & Poeira Quente',
    distanceThreshold: 0,
    skyGradient: ['#f59e0b', '#fbbf24'],
    groundColor: '#d97706', // reddish brown terra batida / dusty asphalt
    roadColor: '#33271e',
    laneLineColor: '#fef08a',
    kerbColor: '#ea580c',
    horizonColor: '#b45309',
    buildingPalette: ['#92400e', '#78350f', '#451a03', '#d97706'],
    features: ['Barracas de Mambo', 'Poeira de Terra Batida', 'Oficinas & Estaleiros'],
    ambientNote: 'Xé, cuidado com os buracos no asfalto do Benfica!'
  },
  talatona: {
    id: 'talatona',
    name: 'Talatona',
    subtitle: 'Prédios Espelhados & Palmeiras',
    distanceThreshold: 750,
    skyGradient: ['#0284c7', '#38bdf8'],
    groundColor: '#10b981', // green manicured lawns
    roadColor: '#1e293b',
    laneLineColor: '#ffffff',
    kerbColor: '#0ea5e9',
    horizonColor: '#0369a1',
    buildingPalette: ['#1e3a8a', '#0284c7', '#38bdf8', '#0f172a'],
    features: ['Torres de Vidro', 'Avenidas Largas', 'Palmeiras Reais'],
    ambientNote: 'Talatona moderna, o asfalto é liso mas os candongueiros não perdoam!'
  },
  kinaxixi: {
    id: 'kinaxixi',
    name: 'Kinaxixi',
    subtitle: 'Coração de Luanda & Estátua da Rainha',
    distanceThreshold: 1600,
    skyGradient: ['#8b5cf6', '#ec4899'],
    groundColor: '#475569',
    roadColor: '#0f172a',
    laneLineColor: '#fbbf24',
    kerbColor: '#f43f5e',
    horizonColor: '#4c1d95',
    buildingPalette: ['#581c87', '#7c3aed', '#db2777', '#831843'],
    features: ['Monumento Rainha Nzinga', 'Trânsito Mítico de Luanda', 'Letreiros Luminosos'],
    ambientNote: 'Kinaxixi ao rubro! Falta pouco pro show, não pares de dançar!'
  },
  ilha: {
    id: 'ilha',
    name: 'Ilha de Luanda',
    subtitle: 'Praia, Brisa do Mar & O Grande Concerto!',
    distanceThreshold: 2600,
    skyGradient: ['#f97316', '#fb7185'],
    groundColor: '#0284c7', // Ocean on sides
    roadColor: '#18181b',
    laneLineColor: '#facc15',
    kerbColor: '#fbbf24',
    horizonColor: '#0369a1',
    buildingPalette: ['#047857', '#059669', '#10b981', '#064e3b'],
    features: ['Calçadão da Ilha', 'Oceano Atlântico', 'Palco do Grande Show!'],
    ambientNote: 'Chegaste à Ilha! O palco tá armado, a multidão tá a gritar!'
  }
};

export const CHARACTERS: PlayerCharacter[] = [
  {
    id: 'bruno_kuduro',
    name: 'Bruno Kuduro',
    nickname: 'O Rei do Toque',
    description: 'Estrela do Sambizanga com ginga inigualável. Começa com escudo bónus!',
    price: 0,
    unlocked: true,
    colorScheme: {
      shirt: '#ef4444', // Red athletic jersey
      pants: '#1e293b', // Black streetwear
      hat: '#eab308', // Gold snapback
      skin: '#78350f', // Warm dark skin
      accent: '#fbbf24', // Gold chain
      glasses: '#000000'
    },
    specialBonus: 'Começa com Microfone de Ouro'
  },
  {
    id: 'diva_zelia',
    name: 'Diva Zélia',
    nickname: 'Rainha da Pista',
    description: 'Voz poderosa e passos relâmpago. Ganha +50% de duração no Beat Duplo!',
    price: 800,
    unlocked: false,
    colorScheme: {
      shirt: '#ec4899', // Hot pink crop top
      pants: '#8b5cf6', // Purple track pants
      hat: '#fbbf24', // Headband
      skin: '#5c2c16',
      accent: '#f43f5e',
      glasses: '#db2777'
    },
    specialBonus: 'Beat x2 dura +50% mais tempo'
  },
  {
    id: 'mestre_sebem',
    name: 'Mestre Sebem',
    nickname: 'A Lenda Viva',
    description: 'Pioneiro do Kuduro angolano! O turbo da garrafa de água é 25% mais rápido.',
    price: 1800,
    unlocked: false,
    colorScheme: {
      shirt: '#10b981', // Emerald retro jacket
      pants: '#ffffff', // White retro pants
      hat: '#047857', // Beret
      skin: '#451a03',
      accent: '#facc15',
      glasses: '#10b981'
    },
    specialBonus: 'Turbo da Garrafa de Água +25% de velocidade'
  },
  {
    id: 'scro_boy',
    name: 'Scró Boy',
    nickname: 'Dono do Ghetto',
    description: 'Energia infinita e toques acrobáticos. Atrai Kwanzas de mais longe!',
    price: 3500,
    unlocked: false,
    colorScheme: {
      shirt: '#f59e0b', // Electric amber
      pants: '#0ea5e9', // Sky blue pants
      hat: '#ef4444', // Red bucket hat
      skin: '#532912',
      accent: '#a855f7',
      glasses: '#eab308'
    },
    specialBonus: 'Íman de Kwanzas constante'
  }
];

export const KUDURO_QUOTES = [
  'Dá no toque!',
  'Olha o candongueiro azul e branco!',
  'Mambo rijo, xé menino!',
  'Salto acrobático de Kuduro!',
  'Foge da fatura da luz!',
  'A caminho do Cine Atlântico!',
  'Tá a bater bue!',
  'Ginga de Luanda!',
  'Show esgotado!',
  'Operação Stop ultrapassada!'
];

export const DEATH_MESSAGES: Record<string, string[]> = {
  candongueiro: [
    'O candongueiro azul e branco parou de repente pra apanhar passageiro!',
    'Levaste uma buzinadela do candongueiro!',
    'O cobrador gritou: "Mutamba, Maianga, São Paulo!" e tropeçaste!'
  ],
  buraco: [
    'Caíste num buraco fundo da estrada!',
    'Aquele buraco tinha um pneu de aviso e não viste!',
    'Tropeçaste nas pedras da berma da estrada!'
  ],
  policia: [
    'Operação Stop! A polícia pediu a cédula pessoal e a factura do som!',
    'Foste multado por excesso de estilo na via pública!',
    'O agente de trânsito mandou encostar pra fiscalização!'
  ],
  contas: [
    'A conta da luz e água voou na tua cara 😂!',
    'A fatura do condomínio apanhou-te antes do cachê do show!',
    'Cobrança em dia: o senhorio encontrou-te na rua!'
  ]
};

export const POWER_UP_CONFIG = {
  shield: {
    name: 'Microfone de Ouro',
    effectName: 'ESCUDO ATIVO',
    desc: 'Protege contra 1 impacto de qualquer obstáculo',
    baseDuration: 12,
    color: '#fbbf24',
    bgBadge: 'bg-amber-500'
  },
  turbo: {
    name: 'Garrafa de Água "Pura"',
    effectName: 'TURBO KUDURO',
    desc: 'Velocidade supersónica com invencibilidade e atração de Kwanzas',
    baseDuration: 8,
    color: '#06b6d4',
    bgBadge: 'bg-cyan-500'
  },
  multiplier: {
    name: 'Beat de Kuduro',
    effectName: 'PONTOS x2',
    desc: 'Dobra todos os pontos e ritmo do jogo',
    baseDuration: 14,
    color: '#ec4899',
    bgBadge: 'bg-pink-500'
  }
};
