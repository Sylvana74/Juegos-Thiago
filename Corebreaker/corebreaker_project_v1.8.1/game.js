(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const startBtn = $('startBtn');

  const W = canvas.width;
  const H = canvas.height;
  const CX = W / 2;
  const CY = H / 2;
  const TAU = Math.PI * 2;
  const CONTACT_RADIUS = 96;

  // Los precios son por nivel. Las mejoras permanecen compradas durante toda la campaña de diez jefes.
  const UPGRADES = [
    { id: 'cadence', name: 'Disparo rápido', description: 'Disparás más seguido.', prices: [65, 95, 130], levels: 3, levelText: 'Cadencia' },
    { id: 'rounds', name: 'Munición perforante', description: 'Cada disparo destruye más armadura.', prices: [90, 130], levels: 2, levelText: 'Daño a la armadura' },
    { id: 'reactor', name: 'Núcleo amplificado', description: 'Hacés más daño cuando el núcleo queda expuesto.', prices: [75, 105, 140], levels: 3, levelText: 'Daño al núcleo' },
    { id: 'hull', name: 'Blindaje personal', description: '+20 de energía máxima y recuperás 20.', prices: [75, 105, 140], levels: 3, levelText: 'Energía máxima' },
    { id: 'thrusters', name: 'Propulsores', description: 'Te movés un 12% más rápido por nivel.', prices: [60, 90, 120], levels: 3, levelText: 'Velocidad' },
    { id: 'repair', name: 'Reparación rápida', description: 'Recuperás 35 puntos de energía.', prices: [40], levels: Infinity, levelText: 'Reparación', repeatable: true }
  ];

  // Armas extra desbloqueables desde la tienda. Pulso siempre está disponible.
  const WEAPONS = [
    { id: 'pulse', name: 'Pulso', icon: '✦', price: 0, description: 'Disparo equilibrado, preciso y de cadencia media.', hotkey: '1' },
    { id: 'spread', name: 'Triple', icon: '⋔', price: 155, description: 'Tres proyectiles por disparo: cubre más espacio, pero cada bala pega menos al núcleo.', hotkey: '2' },
    { id: 'laser', name: 'Láser', icon: '⚡', price: 225, description: 'Rayo rápido y potente; dispara más lento, pero castiga fuerte al núcleo.', hotkey: '3' }
  ];

  const SAVE_KEY = 'corebreaker-save-v4-experimental';
  const ACHIEVEMENTS = [
    { id: 'first_boss', icon: '🎯', title: 'Primer núcleo', description: 'Derrotá al Guardián por primera vez.' },
    { id: 'plate_breaker', icon: '💥', title: 'Rompecorazas', description: 'Destruí 50 placas de armadura.' },
    { id: 'first_upgrade', icon: '🛠️', title: 'Compra inteligente', description: 'Comprá tu primera mejora en la tienda.' },
    { id: 'arsenal', icon: '⚔️', title: 'Arsenal completo', description: 'Desbloqueá las tres armas.' },
    { id: 'dash_master', icon: '💨', title: 'Esquiva maestra', description: 'Usá la esquiva 50 veces.' },
    { id: 'collector', icon: '🧲', title: 'Buen botín', description: 'Recogé 10 objetos durante los combates.' },
    { id: 'untouched', icon: '🛡️', title: 'Ni un rasguño', description: 'Derrotá a un jefe sin recibir impactos.' },
    { id: 'world_one', icon: '🌌', title: 'Más allá del vacío', description: 'Completá los cinco jefes del Mundo 1.' },
    { id: 'world_two', icon: '🌀', title: 'Cazador de anomalías', description: 'Completá los cinco jefes del Mundo 2.' },
    { id: 'campaign', icon: '👑', title: 'COREBREAKER', description: 'Terminá la campaña y derrotá a los diez jefes.' },
    { id: 'ability_master', icon: '✨', title: 'Táctica perfecta', description: 'Usá 20 habilidades activas.' },
    { id: 'combo_30', icon: '🔥', title: 'Cadena de ruptura', description: 'Conseguí una racha de 30 impactos.' },
    { id: 'chrono_hunter', icon: '⌛', title: 'Tiempo prestado', description: 'Recogé cinco fragmentos crono.' }
  ];

  // Diez jefes organizados en dos mundos de cinco combates.
  // Mundo 1: cuatro jefes originales + Núcleo Omega como quinto.
  // Mundo 2: Eclipse y cuatro jefes nuevos con proyectiles especiales.
  const BOSSES = [
    {
      name: 'EL GUARDIÁN', subtitle: 'La puerta del vacío', world: 0,
      hint: 'Alterna anillos, disparos dirigidos y ráfagas giratorias.',
      armorCount: 8, plateHP: 3, hp: 100, coreR: 34, spin: 0.78,
      interval: 1.08, minInterval: 0.68, bulletSpeed: 142, damage: 18,
      radialCount: 12, fanCount: 3, fanSpread: 0.38, spiralCount: 8, spiralSpread: 0.78,
      patterns: ['radial', 'fan', 'spiral'],
      phaseTwo: { label: 'CAZA', title: 'ANILLO DE CAZA', subtitle: 'ANILLOS CRUZADOS · RÁFAGAS QUE APUNTAN A TU POSICIÓN', color: '#ff638f', patterns: ['doubleRing', 'aimed', 'doubleRing'], intervalMultiplier: 0.68, speedMultiplier: 1.16, spinMultiplier: 1.48, damageMultiplier: 1.10 },
      armorColor: '#ffbd62', armorHot: '#ff806d', coreColor: '#ed4f87', glow: '#ff638f',
      bulletColor: '#ff547d', secondBulletColor: '#ffb45f', shape: 'hex', arms: 4
    },
    {
      name: 'CENTINELA ORBITAL', subtitle: 'El guardián de los cuatro ejes', world: 0,
      hint: 'Abanicos de cinco disparos y ráfagas en cruz.',
      armorCount: 8, plateHP: 3, hp: 118, coreR: 33, spin: 0.98,
      interval: 0.98, minInterval: 0.61, bulletSpeed: 154, damage: 18,
      radialCount: 14, fanCount: 5, fanSpread: 0.64, spiralCount: 9, spiralSpread: 0.92, crossCount: 4,
      patterns: ['fan', 'cross', 'radial'],
      phaseTwo: { label: 'CRUZ', title: 'CRUZ ORBITAL', subtitle: 'EJES CRUZADOS · OLAS QUE CORTAN LA ARENA', color: '#4ed7ff', patterns: ['cross', 'wave', 'cross'], intervalMultiplier: 0.66, speedMultiplier: 1.18, spinMultiplier: 1.42, damageMultiplier: 1.08 },
      armorColor: '#67dfff', armorHot: '#b2f7ff', coreColor: '#245dd1', glow: '#47b9ff',
      bulletColor: '#4ed7ff', secondBulletColor: '#91a6ff', shape: 'diamond', arms: 4
    },
    {
      name: 'REACTOR INESTABLE', subtitle: 'Una máquina al borde del colapso', world: 0,
      hint: 'Diez placas y anillos más densos a mayor velocidad.',
      armorCount: 10, plateHP: 3, hp: 138, coreR: 32, spin: 1.17,
      interval: 0.88, minInterval: 0.55, bulletSpeed: 168, damage: 18,
      radialCount: 15, fanCount: 5, fanSpread: 0.72, spiralCount: 9, spiralSpread: 1.05, crossCount: 6,
      patterns: ['radial', 'spiral', 'fan', 'cross'],
      phaseTwo: { label: 'PULSO', title: 'PULSO CRÍTICO', subtitle: 'DOBLE ONDA RADIAL · LOS ANILLOS LLEGAN A DISTINTAS VELOCIDADES', color: '#ff8b42', patterns: ['pulseRing', 'radial', 'pulseRing'], intervalMultiplier: 0.65, speedMultiplier: 1.14, spinMultiplier: 1.34, damageMultiplier: 1.10 },
      armorColor: '#ffc46b', armorHot: '#fff0a0', coreColor: '#b83a23', glow: '#ff8b42',
      bulletColor: '#ff8447', secondBulletColor: '#ffd166', shape: 'octagon', arms: 6
    },
    {
      name: 'HIDRA DE PLASMA', subtitle: 'La tormenta viviente', world: 0,
      hint: 'Placas reforzadas, anillos dobles y abanicos dirigidos.',
      armorCount: 10, plateHP: 4, hp: 158, coreR: 32, spin: 1.34,
      interval: 0.81, minInterval: 0.50, bulletSpeed: 178, damage: 19,
      radialCount: 13, fanCount: 5, fanSpread: 0.82, spiralCount: 10, spiralSpread: 1.12,
      aimedCount: 3, crossCount: 6,
      patterns: ['fan', 'doubleRing', 'aimed', 'spiral'],
      phaseTwo: { label: 'TORMENTA', title: 'TORMENTA VIVA', subtitle: 'PROYECTILES CURVOS · ABANICOS QUE CAMBIAN DE TRAYECTORIA', color: '#e879ff', patterns: ['curvedFan', 'wave', 'curvedFan', 'aimed'], intervalMultiplier: 0.69, speedMultiplier: 1.15, spinMultiplier: 1.36, damageMultiplier: 1.10 },
      armorColor: '#d78bff', armorHot: '#ffc1fb', coreColor: '#6e28a8', glow: '#d85aff',
      bulletColor: '#e879ff', secondBulletColor: '#ff8fce', shape: 'star', arms: 5
    },
    {
      name: 'NÚCLEO OMEGA', subtitle: 'El guardián del primer portal', world: 0,
      hint: 'El quinto jefe del primer mundo: catorce placas y patrones combinados.',
      armorCount: 14, plateHP: 4, hp: 225, coreR: 30, spin: 1.82,
      interval: 0.64, minInterval: 0.40, bulletSpeed: 202, damage: 20,
      radialCount: 16, fanCount: 7, fanSpread: 1.02, spiralCount: 12, spiralSpread: 1.48,
      aimedCount: 5, crossCount: 8,
      patterns: ['doubleRing', 'fan', 'spiral', 'cross', 'aimed'],
      phaseTwo: { label: 'RUPTURA', title: 'RUPTURA OMEGA', subtitle: 'LOS ABANICOS SE DIVIDEN · ESCAPÁ DE LA SEGUNDA OLEADA', color: '#ff536b', patterns: ['split', 'cross', 'bigFan', 'split'], intervalMultiplier: 0.70, speedMultiplier: 1.14, spinMultiplier: 1.30, damageMultiplier: 1.12, overrides: { splitCount: 5, splitAfter: 0.72, crossCount: 10 } },
      armorColor: '#ff737d', armorHot: '#fff0c2', coreColor: '#9b1c3e', glow: '#ff435f',
      bulletColor: '#ff536b', secondBulletColor: '#ffc15f', shape: 'omega', arms: 8
    },
    {
      name: 'ECLIPSE', subtitle: 'La sombra del segundo mundo', world: 1,
      hint: 'El nuevo sector empieza con ataques más rápidos y anillos dobles.',
      armorCount: 12, plateHP: 4, hp: 246, coreR: 31, spin: 1.68,
      interval: 0.62, minInterval: 0.39, bulletSpeed: 207, damage: 21,
      radialCount: 16, fanCount: 7, fanSpread: 0.98, spiralCount: 12, spiralSpread: 1.34,
      aimedCount: 4, crossCount: 8,
      patterns: ['spiral', 'fan', 'doubleRing', 'cross', 'aimed'],
      phaseTwo: { label: 'ECLIPSE', title: 'ECLIPSE TOTAL', subtitle: 'SOLES OSCUROS · UN ANILLO PESADO CIERRA LA SALIDA', color: '#a58aff', patterns: ['bigRing', 'doubleRing', 'aimed', 'bigRing'], intervalMultiplier: 0.65, speedMultiplier: 1.18, spinMultiplier: 1.46, damageMultiplier: 1.12, overrides: { bigCount: 12 } },
      armorColor: '#a7a3ff', armorHot: '#f4d6ff', coreColor: '#27204f', glow: '#9c75ff',
      bulletColor: '#9e78ff', secondBulletColor: '#ff77b7', shape: 'eclipse', arms: 6
    },
    {
      name: 'SERPIENTE NEBULAR', subtitle: 'La trayectoria imposible', world: 1,
      hint: 'Sus proyectiles curvos te persiguen lentamente: cambiá de dirección y no te quedes quieto.',
      armorCount: 10, plateHP: 4, hp: 266, coreR: 31, spin: 1.73,
      interval: 0.60, minInterval: 0.37, bulletSpeed: 210, damage: 22,
      radialCount: 16, fanCount: 5, fanSpread: 0.72, aimedCount: 4, curveCount: 5,
      curveSpread: 0.86, turnRate: 0.92, waveCount: 5, waveSpread: 1.02,
      patterns: ['curvedFan', 'wave', 'aimed', 'spiral'],
      phaseTwo: { label: 'SERPIENTE', title: 'CAZA NEBULAR', subtitle: 'TRAYECTORIAS CURVAS · LAS BALAS TE SIGUEN AL CAMBIAR DE RUMBO', color: '#43f5dd', patterns: ['wave', 'spiral', 'wave', 'curvedFan'], intervalMultiplier: 0.69, speedMultiplier: 1.17, spinMultiplier: 1.38, damageMultiplier: 1.10, overrides: { curveCount: 7, turnRate: 1.28, waveAmplitude: 36, waveFrequency: 3.4 } },
      armorColor: '#5bf0d2', armorHot: '#d0fff1', coreColor: '#126c83', glow: '#43f5dd',
      bulletColor: '#43f5dd', secondBulletColor: '#7ca8ff', shape: 'serpent', arms: 6
    },
    {
      name: 'COLOSO SOLAR', subtitle: 'Lluvia de soles', world: 1,
      hint: 'Dispara proyectiles enormes que avanzan más despacio, pero ocupan mucho espacio y hacen más daño.',
      armorCount: 12, plateHP: 4, hp: 292, coreR: 34, spin: 1.82,
      interval: 0.58, minInterval: 0.35, bulletSpeed: 205, damage: 23,
      radialCount: 12, fanCount: 5, fanSpread: 0.80, bigCount: 10, bigFanCount: 5,
      patterns: ['bigRing', 'bigFan', 'radial', 'aimed'],
      phaseTwo: { label: 'SUPERNOVA', title: 'SUPERNOVA SOLAR', subtitle: 'PROYECTILES GIGANTES · ABANICOS PESADOS QUE OCUPAN ESPACIO', color: '#ffab38', patterns: ['bigFan', 'bigRing', 'bigFan'], intervalMultiplier: 0.73, speedMultiplier: 1.20, spinMultiplier: 1.30, damageMultiplier: 1.14, overrides: { bigCount: 12, bigFanCount: 7 } },
      armorColor: '#ffb64d', armorHot: '#fff2a6', coreColor: '#c34b18', glow: '#ffab38',
      bulletColor: '#ff8a36', secondBulletColor: '#ffe16b', shape: 'sun', arms: 8
    },
    {
      name: 'MATRIZ FANTASMA', subtitle: 'Nada desaparece del todo', world: 1,
      hint: 'Sus proyectiles se dividen en tres al avanzar. Esquivá la primera bala y preparate para las que vienen detrás.',
      armorCount: 12, plateHP: 5, hp: 320, coreR: 30, spin: 1.94,
      interval: 0.55, minInterval: 0.33, bulletSpeed: 220, damage: 23,
      radialCount: 16, fanCount: 5, fanSpread: 0.90, splitCount: 3, splitAfter: 0.90,
      waveCount: 5, waveSpread: 0.90, crossCount: 8,
      patterns: ['split', 'doubleRing', 'cross', 'wave'],
      phaseTwo: { label: 'DIVISIÓN', title: 'FRACTURA FANTASMA', subtitle: 'CADA ABANICO SE FRAGMENTA · PREPARATE PARA MÁS PROYECTILES', color: '#b59bff', patterns: ['split', 'wave', 'split', 'cross'], intervalMultiplier: 0.63, speedMultiplier: 1.16, spinMultiplier: 1.40, damageMultiplier: 1.12, overrides: { splitCount: 5, splitAfter: 0.66, waveCount: 7 } },
      armorColor: '#b4a5ff', armorHot: '#f5e8ff', coreColor: '#403080', glow: '#b59bff',
      bulletColor: '#b59bff', secondBulletColor: '#63e4ff', shape: 'gear', arms: 8
    },
    {
      name: 'QUIMERA GRAVITACIONAL', subtitle: 'El corazón de la anomalía', world: 1,
      hint: 'Jefe final: mezcla proyectiles curvos, soles enormes y balas que se dividen. No dejes de moverte.',
      armorCount: 14, plateHP: 5, hp: 365, coreR: 32, spin: 2.02,
      interval: 0.50, minInterval: 0.30, bulletSpeed: 232, damage: 25,
      radialCount: 18, fanCount: 7, fanSpread: 1.04, aimedCount: 5, crossCount: 8,
      bigCount: 10, curveCount: 5, curveSpread: 0.92, turnRate: 1.12,
      splitCount: 3, splitAfter: 0.82, waveCount: 7, waveSpread: 1.15,
      patterns: ['curvedFan', 'bigRing', 'split', 'aimed', 'wave', 'doubleRing'],
      phaseTwo: { label: 'CAOS', title: 'COLAPSO GRAVITACIONAL', subtitle: 'CURVAS, DIVISIONES Y SOLES GIGANTES · NO HAY RUTA SEGURA', color: '#ff59cf', patterns: ['curvedFan', 'bigRing', 'split', 'aimed', 'bigFan', 'wave'], intervalMultiplier: 0.58, speedMultiplier: 1.20, spinMultiplier: 1.52, damageMultiplier: 1.13, overrides: { splitCount: 5, splitAfter: 0.66, bigCount: 12, bigFanCount: 7, curveCount: 7, turnRate: 1.3 } },
      armorColor: '#ff6cc9', armorHot: '#ffe1f6', coreColor: '#7e145b', glow: '#ff59cf',
      bulletColor: '#ff59cf', secondBulletColor: '#ffbf69', shape: 'singularity', arms: 10
    },
    {
      name: 'EL ARQUITECTO DEL VACÍO', subtitle: 'La verdad detrás de los diez núcleos', world: 2,
      hint: 'Jefe secreto: buscá la abertura del anillo, esquivá las ráfagas dirigidas y aprovechá las pausas entre patrones.',
      armorCount: 14, plateHP: 4, hp: 400, coreR: 35, spin: 1.82,
      interval: 0.76, minInterval: 0.56, bulletSpeed: 190, damage: 20,
      radialCount: 12, fanCount: 5, fanSpread: 0.88, aimedCount: 4, crossCount: 6,
      bigCount: 9, bigFanCount: 5, curveCount: 4, curveSpread: 0.78, turnRate: 0.75,
      splitCount: 3, splitAfter: 1.02, waveCount: 5, waveSpread: 0.82, gapWidth: 1.35,
      patterns: ['gappedRing', 'fan', 'aimed', 'split', 'cross'],
      phaseTwo: { label: 'COLAPSO', title: 'COLAPSO DEL VACÍO', subtitle: 'ANILLO CON SALIDA · FRAGMENTACIÓN LENTA · PAUSAS PARA REPOSICIONARTE', color: '#ffffff', patterns: ['gappedRing', 'split', 'cross', 'aimed', 'fan', 'gappedRing'], intervalMultiplier: 0.94, speedMultiplier: 1.08, spinMultiplier: 1.18, damageMultiplier: 1.05, overrides: { radialCount: 12, gapWidth: 1.35, splitCount: 3, splitAfter: 1.02, aimedCount: 4, crossCount: 6, fanCount: 5, fanSpread: 0.90 } },
      armorColor: '#d8e5ff', armorHot: '#ffffff', coreColor: '#12152d', glow: '#c7d6ff',
      bulletColor: '#a8c2ff', secondBulletColor: '#fff2a8', shape: 'singularity', arms: 12
    }
  ];

  const CAMPAIGN_BOSS_COUNT = 10;
  const SECRET_BOSS_INDEX = 10;

  const WORLDS = [
    {
      name: 'MUNDO 1', title: 'BORDE DEL VACÍO',
      description: 'Aprendé los patrones y abrí el portal de Omega.',
      startIndex: 0, endIndex: 4, theme: 'world-one',
      bossIndices: [0, 1, 2, 3, 4]
    },
    {
      name: 'MUNDO 2', title: 'ZONA DE ANOMALÍAS',
      description: 'Proyectiles curvos, soles gigantes y ataques que se dividen.',
      startIndex: 5, endIndex: 9, theme: 'world-two',
      bossIndices: [5, 6, 7, 8, 9]
    }
  ];

  let state = 'mainmenu'; // mainmenu, map, playing, paused, between, achievements, settings, won, lost
  let panelReturnState = 'map';
  let selectedWorldView = null; // null = selector de mundos; 0/1 = lista de jefes del mundo
  let last = 0;
  let fps = 60;
  let fpsClock = 0;
  let fpsFrames = 0;
  let score = 0;
  let gameTime = 0;
  let shake = 0;
  let levelIndex = 0;
  let unlockedBossIndex = 0;
  let completedBosses = new Set();
  let credits = 0;
  let unlockedWeapons = new Set(['pulse']);
  let selectedWeapon = 'pulse';
  let difficulty = 'normal';
  let achievements = new Set();
  let lifetimeStats = { bossesDefeated: 0, platesDestroyed: 0, upgradesBought: 0, dashCount: 0, pickupsCollected: 0, abilityUses: 0, maxCombo: 0, chronoPickups: 0 };
  let achievementToastTimer = null;
  let musicVolume = 40;
  let sfxVolume = 75;
  let pickups = [];
  const keys = new Set();
  const mouse = { x: W * 0.72, y: H * 0.5, down: false };
  let player;
  let boss;
  let shots = [];
  let enemyShots = [];
  let particles = [];
  let stars = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Audio generado por el navegador: no requiere archivos MP3/WAV ni descargas.
  let soundEnabled = true;
  let audioContext = null;
  let masterAudioGain = null;
  let musicAudioGain = null;
  let sfxAudioGain = null;
  let musicTimer = null;
  let musicStep = 0;
  const lastSfxAt = Object.create(null);

  function updateSoundButton() {
    const button = $('soundToggle');
    if (!button) return;
    button.textContent = soundEnabled ? '🔊 Sonido: activado' : '🔇 Sonido: silenciado';
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.classList.toggle('is-muted', !soundEnabled);
  }

  function syncVolumeSettings() {
    const musicInput = $('musicVolume');
    const sfxInput = $('sfxVolume');
    if (musicInput) musicVolume = Number(musicInput.value);
    if (sfxInput) sfxVolume = Number(sfxInput.value);
    if ($('musicVolumeLabel')) $('musicVolumeLabel').textContent = `${musicVolume}%`;
    if ($('sfxVolumeLabel')) $('sfxVolumeLabel').textContent = `${sfxVolume}%`;
    if (musicAudioGain && audioContext) musicAudioGain.gain.setTargetAtTime(musicVolume / 100, audioContext.currentTime, .04);
    if (sfxAudioGain && audioContext) sfxAudioGain.gain.setTargetAtTime(sfxVolume / 100, audioContext.currentTime, .04);
  }

  function saveProgress() {
    try {
      const data = {
        version: 4,
        unlockedBossIndex,
        completedBosses: [...completedBosses],
        credits,
        score,
        upgrades: player ? player.upgrades : null,
        unlockedWeapons: [...unlockedWeapons],
        selectedWeapon,
        difficulty,
        achievements: [...achievements],
        lifetimeStats,
        soundEnabled,
        musicVolume,
        sfxVolume
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (error) {
      // Si el navegador no habilita almacenamiento para archivos locales, se puede seguir jugando.
    }
  }

  function loadProgress() {
    try {
      // Importa el guardado estable una sola vez como punto de partida, pero
      // las partidas de esta edición se escriben en una clave experimental separada.
      let raw = localStorage.getItem(SAVE_KEY);
      if (!raw) raw = localStorage.getItem('corebreaker-save-v3');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      unlockedBossIndex = clamp(Number(data.unlockedBossIndex) || 0, 0, CAMPAIGN_BOSS_COUNT - 1);
      completedBosses = new Set((Array.isArray(data.completedBosses) ? data.completedBosses : [])
        .map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < BOSSES.length));
      credits = Math.max(0, Math.floor(Number(data.credits) || 0));
      score = Math.max(0, Number(data.score) || 0);
      if (data.upgrades && player) {
        for (const key of Object.keys(player.upgrades)) {
          const value = Number(data.upgrades[key]);
          player.upgrades[key] = Number.isFinite(value) ? clamp(Math.floor(value), 0, 3) : 0;
        }
        player.upgrades.rounds = Math.min(2, player.upgrades.rounds);
        applyUpgrades();
        player.hp = player.maxHp;
      }
      const validWeaponIds = new Set(WEAPONS.map((weapon) => weapon.id));
      unlockedWeapons = new Set(['pulse', ...(Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : [])]
        .filter((id) => validWeaponIds.has(id)));
      selectedWeapon = unlockedWeapons.has(data.selectedWeapon) ? data.selectedWeapon : 'pulse';
      const validAchievements = new Set(ACHIEVEMENTS.map((item) => item.id));
      achievements = new Set((Array.isArray(data.achievements) ? data.achievements : []).filter((id) => validAchievements.has(id)));
      if (data.lifetimeStats && typeof data.lifetimeStats === 'object') {
        for (const key of Object.keys(lifetimeStats)) {
          lifetimeStats[key] = Math.max(0, Math.floor(Number(data.lifetimeStats[key]) || 0));
        }
      }
      if (['easy', 'normal', 'hard'].includes(data.difficulty)) difficulty = data.difficulty;
      if (typeof data.soundEnabled === 'boolean') soundEnabled = data.soundEnabled;
      musicVolume = clamp(Number(data.musicVolume ?? 40), 0, 100);
      sfxVolume = clamp(Number(data.sfxVolume ?? 75), 0, 100);
      if ($('difficultySelect')) $('difficultySelect').value = difficulty;
      if ($('musicVolume')) $('musicVolume').value = String(musicVolume);
      if ($('sfxVolume')) $('sfxVolume').value = String(sfxVolume);
      return true;
    } catch (error) {
      return false;
    }
  }

  function showAchievementToast(item) {
    const toast = $('achievementToast');
    if (!toast) return;
    toast.innerHTML = `🏆 Logro desbloqueado: ${item.title}<small>${item.description}</small>`;
    toast.classList.remove('hidden');
    if (achievementToastTimer) window.clearTimeout(achievementToastTimer);
    achievementToastTimer = window.setTimeout(() => toast.classList.add('hidden'), 3500);
  }

  function showNotice(title, message) {
    const toast = $('achievementToast');
    if (!toast) return;
    toast.innerHTML = `ℹ️ ${title}<small>${message}</small>`;
    toast.classList.remove('hidden');
    if (achievementToastTimer) window.clearTimeout(achievementToastTimer);
    achievementToastTimer = window.setTimeout(() => toast.classList.add('hidden'), 2400);
  }

  function unlockAchievement(id) {
    if (achievements.has(id)) return;
    const item = ACHIEVEMENTS.find((achievement) => achievement.id === id);
    if (!item) return;
    achievements.add(id);
    showAchievementToast(item);
    playSfx('achievement');
    saveProgress();
    if (state === 'achievements') renderAchievements();
  }

  function achievementProgressText(id) {
    const firstWorld = WORLDS[0].bossIndices.filter((idx) => completedBosses.has(idx)).length;
    const secondWorld = WORLDS[1].bossIndices.filter((idx) => completedBosses.has(idx)).length;
    const progress = {
      first_boss: `${completedBosses.has(0) ? 1 : 0}/1 jefe`,
      plate_breaker: `${Math.min(50, lifetimeStats.platesDestroyed)}/50 placas`,
      first_upgrade: `${Math.min(1, lifetimeStats.upgradesBought)}/1 compra`,
      arsenal: `${unlockedWeapons.size}/3 armas`,
      dash_master: `${Math.min(50, lifetimeStats.dashCount)}/50 esquivas`,
      collector: `${Math.min(10, lifetimeStats.pickupsCollected)}/10 objetos`,
      world_one: `${firstWorld}/5 jefes`,
      world_two: `${secondWorld}/5 jefes`,
      campaign: `${Array.from({ length: CAMPAIGN_BOSS_COUNT }, (_, index) => index).filter((index) => completedBosses.has(index)).length}/10 jefes`,
      ability_master: `${Math.min(20, lifetimeStats.abilityUses)}/20 usos`,
      combo_30: `${Math.min(30, lifetimeStats.maxCombo)}/30 impactos`,
      chrono_hunter: `${Math.min(5, lifetimeStats.chronoPickups)}/5 fragmentos`
    };
    return progress[id] || 'Objetivo especial';
  }

  function renderAchievements() {
    $('achievementCount').textContent = `${achievements.size} / ${ACHIEVEMENTS.length} logros`;
    $('achievementItems').innerHTML = ACHIEVEMENTS.map((item) => {
      const unlocked = achievements.has(item.id);
      const status = unlocked ? 'DESBLOQUEADO' : achievementProgressText(item.id);
      return `<article class="achievement-card${unlocked ? ' unlocked' : ''}">
        <div class="achievement-icon">${unlocked ? item.icon : '🔒'}</div>
        <div><h4>${item.title}</h4><p>${item.description}</p><span class="achievement-status">${status}</span></div>
      </article>`;
    }).join('');
  }

  function ensureAudio() {
    if (!soundEnabled) return false;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        const button = $('soundToggle');
        if (button) {
          button.textContent = 'Audio no disponible';
          button.disabled = true;
          button.title = 'Este navegador no admite Web Audio API.';
        }
        return false;
      }
      if (!audioContext) {
        audioContext = new AudioCtor();
        masterAudioGain = audioContext.createGain();
        musicAudioGain = audioContext.createGain();
        sfxAudioGain = audioContext.createGain();
        musicAudioGain.gain.value = musicVolume / 100;
        sfxAudioGain.gain.value = sfxVolume / 100;
        musicAudioGain.connect(masterAudioGain);
        sfxAudioGain.connect(masterAudioGain);
        masterAudioGain.connect(audioContext.destination);
        masterAudioGain.gain.value = 0.78;
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      if (masterAudioGain) {
        const targetVolume = soundEnabled ? 0.78 : 0;
        masterAudioGain.gain.setTargetAtTime(targetVolume, audioContext.currentTime, 0.035);
      }
      return true;
    } catch (error) {
      // Si el dispositivo bloquea o no puede crear audio, el juego sigue funcionando en silencio.
      return false;
    }
  }

  function tone(frequency, duration, volume, waveform = 'sine', slideTo = null, channel = 'sfx', delay = 0) {
    if (!soundEnabled || !audioContext || !masterAudioGain) return;
    try {
      const startAt = audioContext.currentTime + delay;
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), startAt);
      if (slideTo !== null) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), startAt + Math.max(.025, duration * .82));
      }
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), startAt + Math.min(.012, duration * .2));
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(envelope);
      envelope.connect(channel === 'music' ? musicAudioGain : sfxAudioGain);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + .025);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    } catch (error) {
      // Los efectos son opcionales; un error de audio no debe detener la partida.
    }
  }

  function playSfx(name) {
    if (!soundEnabled || !ensureAudio()) return;
    const now = performance.now();
    const limits = { playerShot: 88, armorHit: 70, coreHit: 92, bossShot: 235, largeShot: 260 };
    const minGap = limits[name] || 0;
    if (minGap && now - (lastSfxAt[name] || 0) < minGap) return;
    lastSfxAt[name] = now;

    switch (name) {
      case 'playerShot':
        tone(720, .065, .033, 'triangle', 270);
        break;
      case 'laserShot':
        tone(1060, .10, .044, 'sawtooth', 250);
        tone(480, .07, .026, 'triangle', 190, 'sfx', .025);
        break;
      case 'armorHit':
        tone(370, .055, .032, 'square', 235);
        break;
      case 'plateBreak':
        tone(420, .12, .055, 'triangle', 760);
        tone(920, .10, .036, 'sine', 510, 'sfx', .065);
        break;
      case 'coreHit':
        tone(240, .075, .045, 'square', 560);
        break;
      case 'bossShot':
        tone(220, .12, .035, 'sawtooth', 105);
        break;
      case 'largeShot':
        tone(145, .21, .055, 'sawtooth', 58);
        tone(410, .075, .023, 'triangle', 190, 'sfx', .015);
        break;
      case 'playerHit':
        tone(190, .22, .085, 'sawtooth', 58);
        tone(112, .19, .045, 'square', 54, 'sfx', .025);
        break;
      case 'purchase':
        tone(610, .09, .048, 'triangle', 790);
        tone(860, .12, .043, 'triangle', 1080, 'sfx', .075);
        break;
      case 'repair':
        tone(330, .12, .04, 'sine', 490);
        tone(490, .15, .044, 'sine', 740, 'sfx', .09);
        tone(740, .17, .042, 'sine', 990, 'sfx', .18);
        break;
      case 'ui':
        tone(420, .045, .022, 'sine', 560);
        break;
      case 'levelStart':
        tone(262, .11, .035, 'triangle', 294);
        tone(392, .12, .038, 'triangle', 440, 'sfx', .07);
        tone(523, .16, .042, 'triangle', 659, 'sfx', .14);
        break;
      case 'bossDefeat':
        tone(294, .15, .05, 'triangle', 330);
        tone(392, .16, .052, 'triangle', 440, 'sfx', .105);
        tone(494, .18, .055, 'triangle', 587, 'sfx', .21);
        tone(659, .25, .058, 'triangle', 784, 'sfx', .32);
        break;
      case 'playerDown':
        tone(330, .15, .055, 'triangle', 247);
        tone(247, .19, .06, 'triangle', 147, 'sfx', .12);
        tone(147, .28, .06, 'sawtooth', 65, 'sfx', .25);
        break;
      case 'campaignWin':
        [392, 494, 587, 784, 988].forEach((freq, i) => tone(freq, .22, .045, 'triangle', freq * 1.04, 'sfx', i * .095));
        break;
      case 'newCampaign':
        tone(330, .10, .032, 'triangle', 392);
        tone(494, .14, .04, 'triangle', 587, 'sfx', .07);
        break;
      case 'dash':
        tone(280, .11, .047, 'sawtooth', 920);
        tone(680, .09, .026, 'triangle', 1150, 'sfx', .045);
        break;
      case 'nova':
        tone(95, .32, .055, 'sawtooth', 520);
        tone(420, .22, .04, 'triangle', 1200, 'sfx', .06);
        break;
      case 'lance':
        tone(880, .10, .045, 'sawtooth', 180);
        tone(160, .20, .035, 'triangle', 75, 'sfx', .035);
        break;
      case 'phaseChange':
        tone(165, .20, .06, 'sawtooth', 330);
        tone(330, .17, .052, 'square', 660, 'sfx', .11);
        tone(660, .25, .04, 'triangle', 880, 'sfx', .20);
        break;
      case 'pickup':
        tone(520, .075, .04, 'sine', 780);
        tone(780, .10, .034, 'triangle', 1040, 'sfx', .055);
        break;
      case 'shield':
        tone(240, .16, .05, 'sine', 620);
        tone(620, .18, .042, 'triangle', 940, 'sfx', .08);
        break;
      case 'achievement':
        [523, 659, 784, 1046].forEach((freq, i) => tone(freq, .14, .04, 'triangle', freq * 1.04, 'sfx', i * .065));
        break;
    }
  }

  function playMusicStep() {
    if (!soundEnabled || state !== 'playing' || !audioContext || !musicAudioGain) return;
    const root = worldIndexForBoss(levelIndex) === 0 ? 110 : 82.41;
    const melody = [0, 7, 12, 7, 3, 7, 10, 7, 0, 7, 12, 14, 3, 7, 10, 12];
    const semitone = melody[musicStep % melody.length];
    const note = root * Math.pow(2, semitone / 12);
    tone(note, .145, .038, musicStep % 4 === 2 ? 'square' : 'triangle', note * .985, 'music');
    if (musicStep % 4 === 0) {
      const bass = root * (musicStep % 8 === 0 ? 1 : 1.5);
      tone(bass, .23, .052, 'sine', bass * .72, 'music');
    }
    if (musicStep % 8 === 6) tone(note * 2, .10, .022, 'sine', note * 1.8, 'music');
    musicStep++;
  }

  function startMusic() {
    if (!soundEnabled || !ensureAudio() || state !== 'playing') return;
    stopMusic();
    musicStep = 0;
    playMusicStep();
    musicTimer = window.setInterval(playMusicStep, 185);
  }

  function stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  $('soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    if (soundEnabled) {
      ensureAudio();
      playSfx('ui');
      if (state === 'playing') startMusic();
    } else {
      stopMusic();
      if (masterAudioGain && audioContext) {
        masterAudioGain.gain.setTargetAtTime(0, audioContext.currentTime, .025);
      }
    }
    saveProgress();
  });
  updateSoundButton();
  $('musicVolume').addEventListener('input', () => { syncVolumeSettings(); saveProgress(); });
  $('sfxVolume').addEventListener('input', () => { syncVolumeSettings(); saveProgress(); });
  $('difficultySelect').addEventListener('change', () => {
    difficulty = $('difficultySelect').value;
    saveProgress();
    playSfx('ui');
  });

  function makePlayer() {
    return {
      x: W * 0.5, y: H - 62, r: 10,
      speed: 255, maxHp: 100, hp: 100,
      fireInterval: 0.14, armorDamage: 1, coreDamage: 2.3,
      upgrades: { cadence: 0, rounds: 0, reactor: 0, hull: 0, thrusters: 0 },
      invuln: 0, fireCD: 0,
      dashCooldown: 0, dashCooldownMax: 2.15, dashTimer: 0, dashVX: 0, dashVY: 0,
      shieldTime: 0, overdriveTime: 0, chronoTime: 0,
      novaCooldown: 0, novaCooldownMax: 12, novaFlash: 0,
      aegisCooldown: 0, aegisCooldownMax: 18, aegisTime: 0,
      lanceCooldown: 0, lanceCooldownMax: 8,
      combo: 0, comboTimer: 0, tookDamageThisFight: false
    };
  }

  function makeBoss(index) {
    const base = BOSSES[index];
    const scales = {
      easy: { hp: .82, armor: .85, speed: .88, damage: .78, cadence: 1.12 },
      normal: { hp: 1, armor: 1, speed: 1, damage: 1, cadence: 1 },
      hard: { hp: 1.22, armor: 1.22, speed: 1.12, damage: 1.22, cadence: .84 }
    }[difficulty] || { hp: 1, armor: 1, speed: 1, damage: 1, cadence: 1 };
    const config = {
      ...base,
      hp: Math.round(base.hp * scales.hp),
      plateHP: Math.max(1, Math.ceil(base.plateHP * scales.armor)),
      bulletSpeed: base.bulletSpeed * scales.speed,
      damage: Math.max(7, Math.round(base.damage * scales.damage)),
      interval: Math.max(.32, base.interval * scales.cadence),
      minInterval: Math.max(.24, base.minInterval * scales.cadence),
      patterns: [...base.patterns]
    };
    const hp = config.hp;
    return {
      config,
      x: CX,
      y: CY - 8,
      r: config.coreR,
      angle: 0,
      spin: config.spin,
      contactRadius: CONTACT_RADIUS,
      contactDamage: config.damage + 4,
      hp,
      maxHp: hp,
      armor: Array.from({ length: config.armorCount }, () => ({ hp: config.plateHP, maxHp: config.plateHP, alive: true, flash: 0 })),
      shootCD: 0.85,
      pattern: 0,
      phase: 1,
      phaseTriggered: false,
      baseInterval: config.interval,
      baseMinInterval: config.minInterval,
      baseBulletSpeed: config.bulletSpeed,
      phaseBannerTimer: 0,
      introTimer: 0,
      pickupSpawnTimer: rand(5.5, 7.5)
    };
  }

  function setupCampaign(newCampaign = false) {
    player = makePlayer();
    levelIndex = 0;
    boss = makeBoss(0);
    shots = [];
    enemyShots = [];
    particles = [];
    pickups = [];
    score = 0;
    credits = 0;
    gameTime = 0;
    shake = 0;
    unlockedBossIndex = 0;
    completedBosses = new Set();
    unlockedWeapons = new Set(['pulse']);
    selectedWeapon = 'pulse';
    if (!newCampaign) loadProgress();
    applyUpgrades();
    if ($('difficultySelect')) $('difficultySelect').value = difficulty;
    syncVolumeSettings();
    updateSoundButton();
    fpsClock = 0;
    fpsFrames = 0;
    stars = Array.from({ length: 95 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.5, 1.7), a: rand(.18, .8), sp: rand(3, 15) }));
    updateStats();
    renderMap();
  }

  function worldIndexForBoss(index) {
    return Math.floor(index / 5);
  }

  function stageNumberForBoss(index) {
    return (index % 5) + 1;
  }

  function allCampaignBossesComplete() {
    for (let index = 0; index < CAMPAIGN_BOSS_COUNT; index++) {
      if (!completedBosses.has(index)) return false;
    }
    return true;
  }

  function secretBossUnlocked() {
    return allCampaignBossesComplete();
  }

  function updateStats() {
    const world = worldIndexForBoss(levelIndex);
    const weapon = WEAPONS.find((item) => item.id === selectedWeapon) || WEAPONS[0];
    const bossPercent = boss ? Math.ceil(Math.max(0, boss.hp) / boss.maxHp * 100) : 100;
    $('levelStat').textContent = levelIndex === SECRET_BOSS_INDEX ? 'SECRETO · 1/1' : `M${world + 1} · ${stageNumberForBoss(levelIndex)}/5`;
    $('armorStat').textContent = boss ? `${boss.armor.filter((p) => p.alive).length} / ${boss.armor.length}` : '—';
    $('bossStat').textContent = `${bossPercent}%`;
    $('playerStat').textContent = player ? `${Math.ceil(Math.max(0, player.hp))} / ${player.maxHp}` : '100 / 100';
    $('creditsStat').textContent = String(credits);
    $('weaponStat').textContent = weapon.name;
    if ($('comboStat')) $('comboStat').textContent = `x${player ? player.combo : 0}`;
    if (player && $('skillHud')) $('skillHud').hidden = state !== 'playing';
    if (boss && $('bossNameHud')) {
      $('bossNameHud').textContent = boss.config.name;
      $('bossPercentHud').textContent = `${bossPercent}%`;
      $('bossHealthFill').style.width = `${clamp(bossPercent, 0, 100)}%`;
      $('phaseHud').textContent = boss.phase >= 2 ? `FASE 2 · ${(boss.config.phaseTwo && boss.config.phaseTwo.label) || 'SOBRECARGA'}` : 'FASE 1';
      $('phaseHud').classList.toggle('phase-two', boss.phase >= 2);
    }
    if (player && $('dashFill')) {
      const readyRatio = 1 - player.dashCooldown / player.dashCooldownMax;
      $('dashFill').style.width = `${clamp(readyRatio * 100, 0, 100)}%`;
      $('dashHud').textContent = player.dashCooldown <= 0.01 ? 'Esquiva lista · Shift/Espacio' : `Esquiva ${player.dashCooldown.toFixed(1)} s`;
      $('weaponHud').textContent = `Arma: ${weapon.name} [${weapon.hotkey}]`;
      const buffs = [];
      if (player.shieldTime > 0) buffs.push(`Escudo ${player.shieldTime.toFixed(0)}s`);
      if (player.overdriveTime > 0) buffs.push(`Sobrecarga ${player.overdriveTime.toFixed(0)}s`);
      if (player.chronoTime > 0) buffs.push(`Crono ${player.chronoTime.toFixed(0)}s`);
      $('buffHud').textContent = buffs.join(' · ') || 'Sin efectos';
      syncSkillButton('nova', player.novaCooldown, player.novaCooldownMax, 'PULSO NOVA', 'limpia proyectiles cercanos');
      syncSkillButton('aegis', player.aegisCooldown, player.aegisCooldownMax, 'ÉGIDA DE FASE', 'invulnerabilidad breve');
      syncSkillButton('lance', player.lanceCooldown, player.lanceCooldownMax, 'LANZA DE RUPTURA', 'daño concentrado');
    }
  }

  function syncSkillButton(id, cooldown, maxCooldown, title, hint) {
    const status = $(`ability${id[0].toUpperCase()}${id.slice(1)}Status`);
    const fill = $(`ability${id[0].toUpperCase()}${id.slice(1)}Fill`);
    const button = $(`ability${id[0].toUpperCase()}${id.slice(1)}Button`);
    if (!status || !fill || !button) return;
    const ratio = clamp(1 - cooldown / maxCooldown, 0, 1);
    fill.style.width = `${ratio * 100}%`;
    status.textContent = cooldown <= .02 ? `LISTA · ${hint}` : `RECARGA ${cooldown.toFixed(1)} s`;
    button.classList.toggle('skill-ready', cooldown <= .02);
    button.classList.toggle('skill-cooling', cooldown > .02);
    button.disabled = state !== 'playing' || cooldown > .02;
    button.setAttribute('aria-label', `${title}: ${cooldown <= .02 ? `lista. ${hint}` : `recarga ${cooldown.toFixed(1)} segundos`}`);
  }

  function showOverlay(title, text, buttonText) {
    if (state !== 'playing') stopMusic();
    $('overlayTitle').textContent = title;
    $('overlayText').textContent = text;
    startBtn.textContent = buttonText;
    const eyebrow = $('overlayEyebrow');
    if (eyebrow) {
      eyebrow.textContent = state === 'mainmenu' ? 'MENÚ PRINCIPAL'
        : state === 'map' ? 'CAMPAÑA // SELECCIONÁ TU RUTA'
        : state === 'between' ? 'TIENDA // PREPARATE PARA EL PRÓXIMO JEFE'
        : state === 'achievements' ? 'CAMPAÑA // REGISTRO DE LOGROS'
        : state === 'settings' ? 'OPCIONES // CONFIGURACIÓN'
        : state === 'paused' ? 'COMBATE EN PAUSA'
        : state === 'won' ? 'CAMPAÑA COMPLETA'
        : state === 'lost' ? 'SISTEMA DAÑADO'
        : 'COMBATE // DESTRUÍ EL NÚCLEO';
    }
    $('shopPanel').classList.toggle('hidden', state !== 'between');
    $('mainMenuPanel').classList.toggle('hidden', state !== 'mainmenu');
    $('mapPanel').classList.toggle('hidden', state !== 'map');
    $('achievementsPanel').classList.toggle('hidden', state !== 'achievements');
    $('settingsPanel').classList.toggle('hidden', state !== 'settings');
    $('combatHud').hidden = !['playing', 'paused'].includes(state);
    if ($('skillHud')) $('skillHud').hidden = state !== 'playing';
    startBtn.classList.toggle('hidden', state === 'map' || state === 'mainmenu');
    document.querySelector('.dialog').classList.toggle('main-menu-dialog', state === 'mainmenu');
    document.querySelector('.wrap').classList.toggle('main-menu-active', state === 'mainmenu');
    overlay.classList.remove('hidden');
  }

  function showMainMenu() {
    state = 'mainmenu';
    showOverlay('COREBREAKER', 'Elegí cómo querés continuar tu aventura.', '');
  }

  function showMap(message = 'Elegí un mundo para ver sus cinco jefes.', resetWorldSelection = false) {
    if (resetWorldSelection) selectedWorldView = null;
    state = 'map';
    showOverlay('MAPA DE CAMPAÑA', 'Elegí un mundo para consultar los jefes.', '');
    renderMap();
    $('mapMessage').textContent = message;
  }

  function showAchievements() {
    state = 'achievements';
    renderAchievements();
    showOverlay('TUS LOGROS', 'Desbloqueá medallas cumpliendo objetivos durante la campaña.', panelReturnState === 'mainmenu' ? 'Volver al menú' : 'Volver al mapa');
  }

  function showSettings() {
    state = 'settings';
    syncVolumeSettings();
    updateSoundButton();
    showOverlay('CONFIGURACIÓN', 'Ajustá el sonido y la dificultad desde acá. Los cambios se guardan automáticamente.', panelReturnState === 'mainmenu' ? 'Volver al menú' : 'Volver al mapa');
  }

  function openSettingsFrom(sourceState) {
    panelReturnState = sourceState;
    playSfx('ui');
    showSettings();
  }

  function openAchievementsFrom(sourceState) {
    panelReturnState = sourceState;
    playSfx('ui');
    showAchievements();
  }

  $('settingsBtn').addEventListener('click', () => openSettingsFrom('map'));
  $('achievementsBtn').addEventListener('click', () => openAchievementsFrom('map'));
  $('mainMenuSettingsBtn').addEventListener('click', () => openSettingsFrom('mainmenu'));
  $('mainMenuAchievementsBtn').addEventListener('click', () => openAchievementsFrom('mainmenu'));
  $('playCampaignBtn').addEventListener('click', () => {
    playSfx('ui');
    showMap('Elegí Mundo 1 o Mundo 2 para ver sus cinco jefes. Tu progreso está guardado.', true);
  });
  $('backToMenuBtn').addEventListener('click', () => {
    playSfx('ui');
    showMainMenu();
  });

  $('newCampaignBtn').addEventListener('click', () => {
    playSfx('ui');
    const confirmed = window.confirm('¿Empezar una campaña nueva? Se reiniciarán jefes completados, créditos, armas y mejoras de la campaña actual. Tus logros desbloqueados se conservarán.');
    if (confirmed) startCampaign();
  });

  function renderMap() {
    const mapWorlds = $('mapWorlds');
    const secretPanel = $('secretBossPanel');
    const newCampaignButton = $('newCampaignBtn');

    if (selectedWorldView === null) {
      mapWorlds.classList.remove('boss-world-view');
      mapWorlds.innerHTML = `<div class="world-picker-grid">${WORLDS.map((world, worldNumber) => {
        const worldUnlocked = unlockedBossIndex >= world.startIndex;
        const completeCount = world.bossIndices.filter((index) => completedBosses.has(index)).length;
        const allWorldBossesComplete = completeCount === 5;
        const status = allWorldBossesComplete ? '✓ MUNDO COMPLETADO' : worldUnlocked ? '● SECTOR ABIERTO' : '🔒 BLOQUEADO · COMPLETÁ EL MUNDO 1';
        const badge = allWorldBossesComplete ? '✓' : worldUnlocked ? '↗' : '🔒';
        return `<button type="button" class="world-select-card ${world.theme}${worldUnlocked ? '' : ' world-select-locked'}" data-world-index="${worldNumber}" aria-label="Ver ${world.name}: ${completeCount} de 5 jefes completados">
          <span class="world-select-top"><span class="world-kicker">${world.name}</span><span class="world-select-badge">${badge}</span></span>
          <strong class="world-select-title">${world.title}</strong>
          <span class="world-select-description">${world.description}</span>
          <span class="world-select-progress"><span>${status}</span><strong>${completeCount}/5</strong></span>
          <span class="world-select-cta">VER LOS 5 JEFES <b>→</b></span>
        </button>`;
      }).join('')}</div>`;
      $('overlayTitle').textContent = 'ELEGÍ TU MUNDO';
      $('overlayText').textContent = 'Entrá a un mundo para consultar sus cinco jefes. Los bloqueados se muestran igual para que puedas ver la ruta completa.';
      if (secretPanel) secretPanel.classList.toggle('hidden', !secretBossUnlocked());
    } else {
      const worldNumber = selectedWorldView;
      const world = WORLDS[worldNumber];
      const worldUnlocked = unlockedBossIndex >= world.startIndex;
      const completeCount = world.bossIndices.filter((index) => completedBosses.has(index)).length;
      mapWorlds.classList.add('boss-world-view');
      const bosses = world.bossIndices.map((index, nodeIndex) => {
        const config = BOSSES[index];
        const isUnlocked = index <= unlockedBossIndex;
        const completed = completedBosses.has(index);
        const isNext = isUnlocked && !completed && index === unlockedBossIndex;
        const statusClass = completed ? 'completed' : isUnlocked ? 'unlocked' : 'locked';
        const status = completed ? '✓ COMPLETADO' : isNext ? '★ SIGUIENTE' : isUnlocked ? 'DISPONIBLE · REPETIBLE' : '🔒 BLOQUEADO';
        const orb = completed ? '✓' : isUnlocked ? String(nodeIndex + 1) : '🔒';
        return `<button type="button" class="boss-select-card ${world.theme} ${statusClass}${isNext ? ' current' : ''}" data-boss-index="${index}" ${isUnlocked ? '' : 'disabled'} aria-label="Jefe ${nodeIndex + 1}: ${config.name}, ${status.toLowerCase()}">
          <span class="boss-select-orb">${orb}</span>
          <span class="boss-select-copy"><span class="boss-select-number">JEFE ${String(nodeIndex + 1).padStart(2, '0')}</span><strong>${config.name}</strong><small>${config.subtitle}</small><span class="boss-select-status">${status}</span></span>
          <span class="boss-select-arrow">${isUnlocked ? '›' : '·'}</span>
        </button>`;
      }).join('');
      mapWorlds.innerHTML = `<div class="world-detail ${world.theme}">
        <div class="world-detail-heading">
          <button type="button" class="secondary-button world-back-button" data-world-back>← Volver a mundos</button>
          <div class="world-detail-title"><span class="world-kicker">${world.name}</span><h3>${world.title}</h3><p>${world.description}</p></div>
          <div class="world-detail-counter"><strong>${completeCount}/5</strong><span>JEFES</span></div>
        </div>
        <div class="boss-select-grid" aria-label="Lista de los cinco jefes">${bosses}</div>
        <p class="world-detail-footnote">${worldUnlocked ? 'Los jefes derrotados se pueden volver a jugar. Las victorias abren los nodos siguientes.' : 'Este mundo todavía está bloqueado. Podés revisar sus jefes; completá los cinco del Mundo 1 para abrirlo.'}</p>
      </div>`;
      $('overlayTitle').textContent = `${world.name} · ${world.title}`;
      $('overlayText').textContent = 'Seleccioná uno de los cinco jefes para entrar al combate.';
      if (secretPanel) secretPanel.classList.add('hidden');
    }

    if (newCampaignButton) newCampaignButton.classList.toggle('hidden', !allCampaignBossesComplete());
    const secretButton = $('secretBossBtn');
    if (secretButton) {
      secretButton.textContent = completedBosses.has(SECRET_BOSS_INDEX) ? 'Volver a desafiar al Arquitecto' : 'Desafiar al jefe secreto';
      secretButton.classList.toggle('secret-defeated', completedBosses.has(SECRET_BOSS_INDEX));
    }
    $('mapMessage').textContent = selectedWorldView === null
      ? 'El progreso se guarda automáticamente. Podés volver a jugar cualquier jefe ya desbloqueado.'
      : `Progreso del ${worldNameForView(selectedWorldView)}: ${WORLDS[selectedWorldView].bossIndices.filter((index) => completedBosses.has(index)).length}/5 jefes completados.`;
  }

  function worldNameForView(worldIndex) {
    return WORLDS[worldIndex]?.name || 'mundo';
  }

  $('mapPanel').addEventListener('click', (event) => {
    if (state !== 'map') return;
    const worldButton = event.target.closest('button[data-world-index]');
    if (worldButton) {
      const worldIndex = Number(worldButton.dataset.worldIndex);
      if (!Number.isInteger(worldIndex) || worldIndex < 0 || worldIndex >= WORLDS.length) return;
      playSfx('ui');
      selectedWorldView = worldIndex;
      renderMap();
      return;
    }

    const worldBackButton = event.target.closest('button[data-world-back]');
    if (worldBackButton) {
      playSfx('ui');
      selectedWorldView = null;
      renderMap();
      return;
    }

    const button = event.target.closest('button[data-boss-index]');
    if (!button || button.disabled) return;
    const index = Number(button.dataset.bossIndex);
    const isSecretBoss = index === SECRET_BOSS_INDEX;
    if (!Number.isInteger(index) || index < 0 || index >= BOSSES.length) return;
    if (isSecretBoss ? !secretBossUnlocked() : index > unlockedBossIndex || index >= CAMPAIGN_BOSS_COUNT) return;
    playSfx('ui');
    beginLevel(index, { replay: completedBosses.has(index) || isSecretBoss });
  });

  function applyUpgrades() {
    const upgrades = player.upgrades;
    player.speed = 255 * (1 + upgrades.thrusters * 0.12);
    player.fireInterval = Math.max(0.075, 0.14 * Math.pow(0.82, upgrades.cadence));
    player.armorDamage = 1 + upgrades.rounds;
    player.coreDamage = 2.3 * (1 + upgrades.reactor * 0.27);
    player.maxHp = 100 + upgrades.hull * 20;
    player.hp = Math.min(player.hp, player.maxHp);
  }

  function getUpgradeCost(upgrade) {
    const level = upgrade.repeatable ? 0 : player.upgrades[upgrade.id];
    return upgrade.prices[Math.min(level, upgrade.prices.length - 1)];
  }

  function renderShop() {
    const shopItems = $('shopItems');
    $('shopCredits').textContent = String(credits);
    shopItems.innerHTML = UPGRADES.map((upgrade) => {
      const level = upgrade.repeatable ? null : player.upgrades[upgrade.id];
      const maxed = !upgrade.repeatable && level >= upgrade.levels;
      const cost = getUpgradeCost(upgrade);
      const canAfford = credits >= cost;
      const repairUnavailable = upgrade.id === 'repair' && player.hp >= player.maxHp;
      const disabled = maxed || !canAfford || repairUnavailable;
      const progress = upgrade.repeatable ? 'Repetible' : `Nivel ${level} / ${upgrade.levels}`;
      let action = maxed ? 'Máximo' : (upgrade.repeatable ? 'Reparar' : 'Comprar mejora');
      if (!canAfford && !maxed) action = `Faltan ${cost - credits}`;
      if (repairUnavailable) action = 'Energía completa';
      return `
        <article class="upgrade-card">
          <div>
            <h4>${upgrade.name}</h4>
            <p>${upgrade.description}</p>
          </div>
          <div class="upgrade-meta"><span>${progress}</span><strong>${maxed ? '—' : `${cost} cr.`}</strong></div>
          <button type="button" data-upgrade="${upgrade.id}" ${disabled ? 'disabled' : ''}>${action}</button>
        </article>`;
    }).join('');
    renderWeapons();
  }

  function renderWeapons() {
    const container = $('weaponItems');
    container.innerHTML = WEAPONS.map((weapon) => {
      const unlocked = unlockedWeapons.has(weapon.id);
      const equipped = selectedWeapon === weapon.id;
      const canAfford = credits >= weapon.price;
      let action = equipped ? 'Equipada' : (unlocked ? 'Equipar' : `Desbloquear · ${weapon.price} cr.`);
      const disabled = equipped || (!unlocked && !canAfford);
      if (!unlocked && !canAfford) action = `Faltan ${weapon.price - credits} cr.`;
      return `<article class="upgrade-card${equipped ? ' equipped' : ''}">
        <div><h4><span class="weapon-icon">${weapon.icon}</span>${weapon.name}</h4><p>${weapon.description}</p></div>
        <div class="upgrade-meta"><span>Tecla ${weapon.hotkey}</span><strong>${unlocked ? (equipped ? 'En uso' : 'Desbloqueada') : `${weapon.price} cr.`}</strong></div>
        <button type="button" data-weapon="${weapon.id}" ${disabled ? 'disabled' : ''}>${action}</button>
      </article>`;
    }).join('');
  }

  function selectWeapon(id, quiet = false) {
    if (!unlockedWeapons.has(id)) {
      if (!quiet) showNotice('Arma bloqueada', 'Desbloqueala desde la tienda entre combates.');
      return false;
    }
    if (selectedWeapon === id) return true;
    selectedWeapon = id;
    if (!quiet) playSfx('ui');
    updateStats();
    saveProgress();
    if (state === 'between') renderWeapons();
    return true;
  }

  function buyWeapon(id) {
    if (state !== 'between') return;
    const weapon = WEAPONS.find((item) => item.id === id);
    if (!weapon) return;
    if (unlockedWeapons.has(id)) {
      selectWeapon(id);
      return;
    }
    if (credits < weapon.price) return;
    credits -= weapon.price;
    unlockedWeapons.add(id);
    selectedWeapon = id;
    playSfx('purchase');
    if (unlockedWeapons.size === WEAPONS.length) unlockAchievement('arsenal');
    renderShop();
    updateStats();
    saveProgress();
  }

  function buyUpgrade(id) {
    if (state !== 'between') return;
    const upgrade = UPGRADES.find((item) => item.id === id);
    if (!upgrade) return;
    const level = upgrade.repeatable ? 0 : player.upgrades[upgrade.id];
    if (!upgrade.repeatable && level >= upgrade.levels) return;
    const cost = getUpgradeCost(upgrade);
    if (credits < cost) return;

    if (upgrade.id === 'repair') {
      if (player.hp >= player.maxHp) return;
      credits -= cost;
      player.hp = Math.min(player.maxHp, player.hp + 35);
      playSfx('repair');
    } else {
      credits -= cost;
      playSfx('purchase');
      player.upgrades[id]++;
      const previousMaxHp = player.maxHp;
      applyUpgrades();
      if (id === 'hull') player.hp = Math.min(player.maxHp, player.hp + (player.maxHp - previousMaxHp));
    }
    lifetimeStats.upgradesBought++;
    unlockAchievement('first_upgrade');
    renderShop();
    updateStats();
    saveProgress();
  }

  $('shopItems').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-upgrade]');
    if (button && !button.disabled) buyUpgrade(button.dataset.upgrade);
  });
  $('weaponItems').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-weapon]');
    if (button && !button.disabled) buyWeapon(button.dataset.weapon);
  });

  function beginLevel(index, options = {}) {
    levelIndex = index;
    boss = makeBoss(levelIndex);
    boss.introTimer = 2.1;
    boss.shootCD = 2.75;
    shots = [];
    enemyShots = [];
    particles = [];
    pickups = [];
    shake = 0;

    if (options.fresh || !player) {
      player = makePlayer();
    } else if (options.retry || options.replay) {
      player.x = W * 0.5;
      player.y = H - 62;
      player.hp = player.maxHp;
      player.invuln = 1.35;
      player.fireCD = 0;
      // Ningún efecto temporal se hereda al reintentar o repetir un jefe.
      player.shieldTime = 0;
      player.overdriveTime = 0;
      player.dashTimer = 0;
      player.dashVX = 0;
      player.dashVY = 0;
    } else {
      player.x = W * 0.5;
      player.y = H - 62;
      player.invuln = 1.35;
      player.fireCD = 0;
    }
    // Cada jefe es un combate nuevo: ningún buff temporal pasa al siguiente.
    player.shieldTime = 0;
    player.overdriveTime = 0;
    player.chronoTime = 0;
    player.novaCooldown = 0;
    player.novaFlash = 0;
    player.aegisCooldown = 0;
    player.aegisTime = 0;
    player.lanceCooldown = 0;
    player.combo = 0;
    player.comboTimer = 0;
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.dashVX = 0;
    player.dashVY = 0;
    player.tookDamageThisFight = false;

    state = 'playing';
    $('combatHud').hidden = false;
    overlay.classList.add('hidden');
    ensureAudio();
    playSfx('levelStart');
    startMusic();
    last = performance.now();
    fpsClock = 0;
    fpsFrames = 0;
    updateStats();
    canvas.focus();
    requestAnimationFrame(loop);
  }

  function startCampaign() {
    setupCampaign(true);
    saveProgress();
    playSfx('newCampaign');
    showMap('¡Nueva campaña! Entrá al Mundo 1 para comenzar. Tus logros anteriores se conservan.', true);
    draw();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      showOverlay('PAUSA', 'El combate está detenido. Presioná P o el botón para continuar.', 'Continuar');
    } else if (state === 'paused') {
      state = 'playing';
      overlay.classList.add('hidden');
      if ($('skillHud')) $('skillHud').hidden = false;
      startMusic();
      playSfx('ui');
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function handleOverlayButton() {
    playSfx('ui');
    if (state === 'paused') {
      togglePause();
    } else if (state === 'between') {
      showMap('Comprá mejoras en la tienda y elegí el próximo nodo desbloqueado.');
    } else if (state === 'achievements') {
      if (panelReturnState === 'mainmenu') showMainMenu();
      else showMap('Revisá tus logros y seguí la campaña desde cualquier nodo desbloqueado.');
    } else if (state === 'settings') {
      if (panelReturnState === 'mainmenu') showMainMenu();
      else showMap('Configuración guardada. Elegí un jefe para continuar.');
    } else if (state === 'lost') {
      beginLevel(levelIndex, { retry: true });
    } else if (state === 'won') {
      showMap(completedBosses.has(SECRET_BOSS_INDEX)
        ? 'La campaña y el desafío secreto están registrados. Volvé a mundos para elegir otro jefe o empezar una campaña nueva.'
        : '¡Los diez jefes completados! Volvé a mundos para encontrar el desafío secreto. Podés jugarlo cuando quieras.');
    }
  }

  startBtn.addEventListener('click', handleOverlayButton);

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const onInteractiveControl = event.target instanceof HTMLElement && Boolean(event.target.closest('button, input, select, textarea'));
    if (!onInteractiveControl && (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) || key === ' ')) event.preventDefault();
    keys.add(key);

    if (state === 'playing' && !onInteractiveControl && !event.repeat && (key === 'shift' || key === ' ')) {
      event.preventDefault();
      startDash();
    }
    if (state === 'playing' && !onInteractiveControl && !event.repeat && key === 'q') activateNova();
    if (state === 'playing' && !onInteractiveControl && !event.repeat && key === 'e') activateAegis();
    if (state === 'playing' && !onInteractiveControl && !event.repeat && key === 'r') activateLance();
    if (state === 'playing' && !onInteractiveControl && !event.repeat && ['1', '2', '3'].includes(key)) {
      const weaponId = ({ '1': 'pulse', '2': 'spread', '3': 'laser' })[key];
      selectWeapon(weaponId);
    }

    if (key === 'p' && !onInteractiveControl) {
      if (state === 'playing' || state === 'paused') togglePause();
    }
    if (key === 'm' && !onInteractiveControl) {
      soundEnabled = !soundEnabled;
      updateSoundButton();
      if (soundEnabled) {
        ensureAudio();
        playSfx('ui');
        if (state === 'playing') startMusic();
      } else {
        stopMusic();
        if (masterAudioGain && audioContext) masterAudioGain.gain.setTargetAtTime(0, audioContext.currentTime, .025);
      }
      saveProgress();
    }
    if ((key === 'enter' || key === ' ') && !onInteractiveControl && ['between', 'won', 'lost', 'settings', 'achievements'].includes(state)) {
      handleOverlayButton();
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { mouse.down = false; keys.clear(); });

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }
  // Escuchamos el movimiento en window, no solo en el canvas: así la mira sigue
  // al cursor incluso cuando pasa por encima del HUD de vida del jefe.
  window.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) return;
    const p = toCanvas(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button === 0) {
      mouse.down = true;
      const p = toCanvas(event);
      mouse.x = p.x;
      mouse.y = p.y;
      canvas.focus();
    }
  });
  window.addEventListener('pointerup', (event) => { if (event.button === 0) mouse.down = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  function spawnParticle(x, y, color, count = 8, power = 100) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, TAU);
      const speed = rand(power * .25, power);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: rand(1, 3), life: rand(.2, .65), maxLife: .65, color });
    }
  }

  function shootPlayer() {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const aim = Math.atan2(dy, dx);
    const weapon = selectedWeapon;
    const overdriveFactor = player.overdriveTime > 0 ? .58 : 1;
    let cooldown = player.fireInterval * overdriveFactor;
    const addPlayerShot = (angle, settings = {}) => {
      const speed = settings.speed || 590;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      shots.push({
        x: player.x + Math.cos(angle) * 13,
        y: player.y + Math.sin(angle) * 13,
        vx, vy, r: settings.r || 3.2, life: settings.life || 1.5,
        type: settings.type || 'pulse',
        armorDamage: settings.armorDamage ?? player.armorDamage,
        coreDamage: settings.coreDamage ?? player.coreDamage
      });
    };

    if (weapon === 'spread') {
      [-.22, 0, .22].forEach((offset) => addPlayerShot(aim + offset, {
        speed: 520, r: 3.0, type: 'spread', life: 1.35,
        armorDamage: Math.max(.55, player.armorDamage * .68),
        coreDamage: player.coreDamage * .48
      }));
      cooldown *= 1.18;
    } else if (weapon === 'laser') {
      addPlayerShot(aim, {
        speed: 940, r: 2.8, type: 'laser', life: 1.0,
        armorDamage: player.armorDamage * .9,
        coreDamage: player.coreDamage * 1.6
      });
      cooldown *= 1.75;
    } else {
      addPlayerShot(aim);
    }
    player.fireCD = cooldown;
    playSfx(weapon === 'laser' ? 'laserShot' : 'playerShot');
    spawnParticle(player.x + Math.cos(aim) * 12, player.y + Math.sin(aim) * 12, weapon === 'laser' ? '#ff91f3' : '#80f4ff', 2, 35);
  }

  function recordAbilityUse() {
    lifetimeStats.abilityUses++;
    if (lifetimeStats.abilityUses >= 20) unlockAchievement('ability_master');
    saveProgress();
  }

  function activateNova() {
    if (state !== 'playing' || player.novaCooldown > 0) return;
    const radius = 245;
    let removed = 0;
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const shot = enemyShots[i];
      if (Math.hypot(shot.x - player.x, shot.y - player.y) <= radius) {
        if (removed < 18) spawnParticle(shot.x, shot.y, shot.color || '#78f6ff', 3, 105);
        enemyShots.splice(i, 1);
        removed++;
      }
    }
    player.novaCooldown = player.novaCooldownMax;
    player.novaFlash = .62;
    player.invuln = Math.max(player.invuln, .42);
    spawnParticle(player.x, player.y, '#78f6ff', 42, 255);
    playSfx('nova');
    recordAbilityUse();
    showNotice('PULSO NOVA', removed ? `${removed} proyectiles neutralizados.` : 'Onda de emergencia activada.');
    updateStats();
  }

  function activateAegis() {
    if (state !== 'playing' || player.aegisCooldown > 0) return;
    player.aegisCooldown = player.aegisCooldownMax;
    player.aegisTime = 1.45;
    player.invuln = Math.max(player.invuln, 1.45);
    spawnParticle(player.x, player.y, '#9b91ff', 30, 180);
    playSfx('shield');
    recordAbilityUse();
    showNotice('ÉGIDA DE FASE', 'Invulnerabilidad temporal activada.');
    updateStats();
  }

  function activateLance() {
    if (state !== 'playing' || player.lanceCooldown > 0) return;
    const aim = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 890;
    shots.push({
      x: player.x + Math.cos(aim) * 15,
      y: player.y + Math.sin(aim) * 15,
      vx: Math.cos(aim) * speed,
      vy: Math.sin(aim) * speed,
      r: 5.2, life: 1.2, type: 'lance',
      armorDamage: player.armorDamage * 2.8,
      coreDamage: player.coreDamage * 2.35
    });
    player.lanceCooldown = player.lanceCooldownMax;
    spawnParticle(player.x + Math.cos(aim) * 15, player.y + Math.sin(aim) * 15, '#ffd47b', 8, 100);
    playSfx('lance');
    recordAbilityUse();
    showNotice('LANZA DE RUPTURA', 'Disparo perforante lanzado hacia la mira.');
    updateStats();
  }

  function activateAbility(name) {
    if (name === 'nova') activateNova();
    else if (name === 'aegis') activateAegis();
    else if (name === 'lance') activateLance();
  }

  $('abilityNovaButton').addEventListener('click', () => { activateAbility('nova'); canvas.focus(); });
  $('abilityAegisButton').addEventListener('click', () => { activateAbility('aegis'); canvas.focus(); });
  $('abilityLanceButton').addEventListener('click', () => { activateAbility('lance'); canvas.focus(); });

  function startDash() {
    if (state !== 'playing' || player.dashCooldown > 0 || player.dashTimer > 0) return;
    let mx = 0;
    let my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx--;
    if (keys.has('arrowright') || keys.has('d')) mx++;
    if (keys.has('arrowup') || keys.has('w')) my--;
    if (keys.has('arrowdown') || keys.has('s')) my++;
    if (!mx && !my) {
      mx = player.x - boss.x;
      my = player.y - boss.y;
    }
    const length = Math.hypot(mx, my) || 1;
    player.dashVX = mx / length;
    player.dashVY = my / length;
    player.dashTimer = .18;
    player.dashCooldown = player.dashCooldownMax;
    player.invuln = Math.max(player.invuln, .34);
    lifetimeStats.dashCount++;
    playSfx('dash');
    spawnParticle(player.x, player.y, '#83faff', 12, 125);
    if (lifetimeStats.dashCount >= 50) unlockAchievement('dash_master');
    saveProgress();
  }

  function createEnemyShot(x, y, angle, speed, color, size = 5, type = 'normal', extra = {}) {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return {
      x, y, vx, vy, baseVx: vx, baseVy: vy, speed,
      r: size, life: extra.life ?? 5, age: 0, color, type,
      turnRate: extra.turnRate ?? 0.9,
      waveAmplitude: extra.waveAmplitude ?? 22,
      waveFrequency: extra.waveFrequency ?? 4.2,
      splitAfter: extra.splitAfter ?? 0.88,
      splitCount: extra.splitCount ?? 3,
      didSplit: false,
      damageScale: extra.damageScale ?? 1
    };
  }

  function addEnemyShot(angle, speed, color, radius = 43, size = 5, type = 'normal', extra = {}) {
    enemyShots.push(createEnemyShot(
      boss.x + Math.cos(angle) * radius,
      boss.y + Math.sin(angle) * radius,
      angle, speed, color, size, type, extra
    ));
  }

  function fireRing(count, offset, speedScale, color, options = {}) {
    for (let i = 0; i < count; i++) {
      const angle = offset + TAU * i / count;
      const size = options.size ?? 4.8;
      addEnemyShot(angle, boss.config.bulletSpeed * speedScale * rand(.94, 1.06), color, boss.r + 10, size, options.type || 'normal', options);
    }
  }

  function fireFan(count, spread, baseAngle, speedScale = 1, color = boss.config.bulletColor, options = {}) {
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0 : i / (count - 1) - .5;
      const angle = baseAngle + fraction * spread;
      addEnemyShot(angle, boss.config.bulletSpeed * speedScale, color, boss.r + 8, options.size ?? 5.1, options.type || 'normal', options);
    }
  }

  function fireBoss() {
    const cfg = boss.config;
    const healthRatio = boss.hp / boss.maxHp;
    const rage = 1 + (1 - healthRatio) * .18;
    // Cada jefe tiene su propia secuencia en fase 2; no se rota una lista genérica compartida.
    const patternList = cfg.patterns;
    const type = patternList[boss.pattern % patternList.length];
    const aimedAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const rotation = boss.angle + boss.pattern * .19;
    const secondary = cfg.secondBulletColor || cfg.bulletColor;

    if (type === 'gappedRing') {
      // El Arquitecto deja deliberadamente una abertura amplia orientada hacia el jugador.
      // Así el anillo exige posicionarse, pero no sella toda la arena.
      const count = cfg.radialCount || 12;
      const gapWidth = cfg.gapWidth || 1.35;
      const offset = rotation * .22;
      for (let i = 0; i < count; i++) {
        const angle = offset + TAU * i / count;
        const difference = Math.atan2(Math.sin(angle - aimedAngle), Math.cos(angle - aimedAngle));
        if (Math.abs(difference) < gapWidth / 2) continue;
        addEnemyShot(angle, cfg.bulletSpeed * rage * .92, cfg.bulletColor, boss.r + 10, 4.6, 'normal', { damageScale: .88 });
      }
    } else if (type === 'radial') {
      fireRing(cfg.radialCount, rotation * .36, rage, cfg.bulletColor);
    } else if (type === 'fan') {
      fireFan(cfg.fanCount, cfg.fanSpread, aimedAngle, rage, cfg.bulletColor);
    } else if (type === 'spiral') {
      fireFan(cfg.spiralCount, cfg.spiralSpread, rotation, rage * .88, secondary);
    } else if (type === 'cross') {
      const count = cfg.crossCount || 4;
      for (let i = 0; i < count; i++) {
        addEnemyShot(rotation + TAU * i / count, cfg.bulletSpeed * rage * .94, secondary, boss.r + 9, 5.2);
      }
    } else if (type === 'aimed') {
      const count = cfg.aimedCount || 3;
      fireFan(count, .30 + count * .045, aimedAngle, rage * 1.08, cfg.bulletColor);
    } else if (type === 'doubleRing') {
      const countA = cfg.radialCount;
      const countB = Math.max(6, Math.ceil(cfg.radialCount * .65));
      fireRing(countA, rotation * .3, rage * .78, cfg.bulletColor);
      fireRing(countB, rotation * .3 + Math.PI / countA, rage * 1.08, secondary);
    } else if (type === 'pulseRing') {
      const countA = cfg.radialCount || 16;
      const countB = Math.max(7, Math.ceil(countA * .62));
      fireRing(countA, rotation * .52, rage * .68, cfg.bulletColor, { size: 4.5, damageScale: .92 });
      fireRing(countB, rotation * .52 + Math.PI / countA, rage * 1.02, secondary, { size: 6.1, damageScale: 1.08 });
    } else if (type === 'curvedFan') {
      fireFan(cfg.curveCount || 5, cfg.curveSpread || .85, aimedAngle, rage * .86, cfg.bulletColor, {
        type: 'curve', size: 5.7, turnRate: cfg.turnRate || .95, damageScale: 1.03
      });
    } else if (type === 'wave') {
      fireFan(cfg.waveCount || 5, cfg.waveSpread || .95, aimedAngle, rage * .91, cfg.secondBulletColor || cfg.bulletColor, {
        type: 'wave', size: 5.8, waveAmplitude: cfg.waveAmplitude || 24, waveFrequency: cfg.waveFrequency || 4.1, damageScale: 1.04
      });
    } else if (type === 'bigRing') {
      fireRing(cfg.bigCount || 9, rotation * .28, rage * .70, cfg.bulletColor, {
        type: 'large', size: 10.5, damageScale: 1.32, life: 6.5
      });
    } else if (type === 'bigFan') {
      fireFan(cfg.bigFanCount || 5, cfg.fanSpread || .82, aimedAngle, rage * .73, cfg.secondBulletColor || cfg.bulletColor, {
        type: 'large', size: 11.5, damageScale: 1.42, life: 6.5
      });
    } else if (type === 'split') {
      fireFan(cfg.fanCount || 5, cfg.fanSpread || .9, aimedAngle, rage * .9, cfg.bulletColor, {
        type: 'split', size: 6.4, splitAfter: cfg.splitAfter || .88, splitCount: cfg.splitCount || 3, damageScale: 1.08
      });
    }

    playSfx(type === 'bigRing' || type === 'bigFan' ? 'largeShot' : 'bossShot');
    boss.pattern++;
    const normalCooldown = Math.max(cfg.minInterval, cfg.interval - (1 - boss.hp / boss.maxHp) * .18);
    // El jefe secreto deja una ventana de reposicionamiento después de cada cuatro ataques.
    const recoveryWindow = levelIndex === SECRET_BOSS_INDEX && boss.pattern % 4 === 0 ? .48 : 0;
    boss.shootCD = normalCooldown + recoveryWindow;
    shake = Math.max(shake, type === 'bigRing' || type === 'bigFan' ? 3.4 : 2.2);
  }

  function defeatBoss() {
    const isSecretBoss = levelIndex === SECRET_BOSS_INDEX;
    const isFinalCampaignBoss = levelIndex === CAMPAIGN_BOSS_COUNT - 1;
    playSfx(isSecretBoss || isFinalCampaignBoss ? 'campaignWin' : 'bossDefeat');
    // Los objetos temporales solo duran durante el combate en el que se recogen.
    player.shieldTime = 0;
    player.overdriveTime = 0;
    player.chronoTime = 0;
    player.aegisTime = 0;
    player.novaFlash = 0;
    player.combo = 0;
    player.comboTimer = 0;
    player.dashTimer = 0;
    player.dashVX = 0;
    player.dashVY = 0;
    player.dashCooldown = 0;
    const firstClear = !completedBosses.has(levelIndex);
    const bossReward = 55 + worldIndexForBoss(levelIndex) * 35 + stageNumberForBoss(levelIndex) * 12;
    credits += bossReward;
    completedBosses.add(levelIndex);
    // El índice de progresión lineal nunca pasa del jefe 10 del mapa principal.
    if (!isSecretBoss) {
      unlockedBossIndex = Math.max(unlockedBossIndex, Math.min(CAMPAIGN_BOSS_COUNT - 1, levelIndex + 1));
    }

    if (firstClear) {
      lifetimeStats.bossesDefeated++;
      if (levelIndex === 0) unlockAchievement('first_boss');
      if (WORLDS[0].bossIndices.every((idx) => completedBosses.has(idx))) unlockAchievement('world_one');
      if (WORLDS[1].bossIndices.every((idx) => completedBosses.has(idx))) unlockAchievement('world_two');
      if (allCampaignBossesComplete()) unlockAchievement('campaign');
    }
    if (!player.tookDamageThisFight) unlockAchievement('untouched');

    if (isSecretBoss) {
      state = 'won';
      showOverlay(
        '¡JEFE SECRETO DERROTADO!',
        `Venciste al Arquitecto del Vacío y ganaste ${bossReward} créditos. El mapa principal queda intacto, así que podés volver a explorar, repetir jefes o empezar una campaña nueva desde el mapa. Puntaje de este combate: ${Math.floor(score)}.`,
        'Volver al mapa'
      );
    } else if (!isFinalCampaignBoss) {
      const next = BOSSES[levelIndex + 1];
      const healed = Math.min(35, player.maxHp - player.hp);
      player.hp += healed;
      state = 'between';
      renderShop();
      const worldNow = worldIndexForBoss(levelIndex) + 1;
      const worldNext = worldIndexForBoss(levelIndex + 1) + 1;
      const completionNote = firstClear ? 'Nuevo nodo desbloqueado en el mapa.' : 'Podés volver al mapa y elegir otro combate desbloqueado.';
      showOverlay(
        `JEFE ${stageNumberForBoss(levelIndex)} DEL MUNDO ${worldNow} DERROTADO`,
        `Destruiste a ${boss.config.name}. Ganaste ${bossReward} créditos y recuperaste ${Math.round(healed)} de energía. ${completionNote} Próximo objetivo: ${next.name} (Mundo ${worldNext}) — ${next.subtitle}. ${next.hint}`,
        'Volver al mapa'
      );
    } else {
      state = 'won';
      showOverlay(
        '¡CAMPAÑA COMPLETADA!',
        `Derrotaste a los diez jefes de los dos mundos. Ganaste ${bossReward} créditos y tu puntaje final es ${Math.floor(score)}. No hace falta reiniciar ahora: volvé al mapa cuando quieras repetir combates o enfrentarte al jefe secreto que acabás de desbloquear.`,
        'Volver al mapa'
      );
    }
    updateStats();
    renderMap();
    saveProgress();
  }

  function loseGame() {
    // Al morir se eliminan inmediatamente los buffs temporales para que no
    // sigan activos ni aparezcan en la pantalla de reintento.
    player.shieldTime = 0;
    player.overdriveTime = 0;
    player.chronoTime = 0;
    player.aegisTime = 0;
    player.novaFlash = 0;
    player.combo = 0;
    player.comboTimer = 0;
    player.dashTimer = 0;
    player.dashVX = 0;
    player.dashVY = 0;
    playSfx('playerDown');
    state = 'lost';
    updateStats();
    showOverlay('SISTEMA DAÑADO', `El ${boss.config.name} te venció. Probá moverte por la arena y apuntar mientras esquivás. Tu puntaje: ${Math.floor(score)}. Al reintentar conservarás las mejoras compradas y recuperarás toda la energía, pero los efectos temporales se reinician.`, 'Reintentar jefe');
  }

  function damagePlayer(amount, impactX = player.x, impactY = player.y, color = '#ff638e') {
    if (player.invuln > 0 || state !== 'playing') return false;
    player.tookDamageThisFight = true;
    if (player.shieldTime > 0) {
      player.shieldTime = 0;
      player.invuln = .48;
      playSfx('shield');
      spawnParticle(impactX, impactY, '#74f8ff', 20, 155);
      shake = Math.max(shake, 5);
      updateStats();
      return true;
    }
    player.hp = Math.max(0, player.hp - amount);
    playSfx('playerHit');
    player.invuln = 0.8;
    shake = Math.max(shake, 8);
    spawnParticle(impactX, impactY, color, 17, 130);
    if (player.hp <= 0) loseGame();
    return true;
  }

  function triggerBossPhase() {
    if (boss.phaseTriggered || boss.hp <= 0 || boss.hp > boss.maxHp * .5) return;
    const profile = boss.config.phaseTwo || {};
    boss.phase = 2;
    boss.phaseTriggered = true;
    boss.phaseBannerTimer = 3.4;
    boss.config.interval = Math.max(.25, boss.baseInterval * (profile.intervalMultiplier || .66));
    boss.config.minInterval = Math.max(.20, boss.baseMinInterval * (profile.intervalMultiplier || .66));
    boss.config.bulletSpeed = boss.baseBulletSpeed * (profile.speedMultiplier || 1.18);
    boss.config.damage = Math.ceil(boss.config.damage * (profile.damageMultiplier || 1.10));
    boss.contactDamage = boss.config.damage + 6;
    if (Array.isArray(profile.patterns) && profile.patterns.length) boss.config.patterns = [...profile.patterns];
    if (profile.overrides) Object.assign(boss.config, profile.overrides);
    // Pausa dramática: elimina las balas antiguas y deja un momento para reaccionar.
    enemyShots = [];
    boss.shootCD = .9;
    shake = Math.max(shake, 17);
    const phaseColor = profile.color || boss.config.glow;
    for (let ring = 0; ring < 5; ring++) {
      spawnParticle(boss.x, boss.y, ring % 2 ? '#ffffff' : phaseColor, 30 + ring * 5, 225 + ring * 42);
    }
    playSfx('phaseChange');
    updateStats();
  }

  function spawnPickup(x, y) {
    const roll = Math.random();
    const type = roll < .23 ? 'health' : roll < .44 ? 'shield' : roll < .65 ? 'overdrive' : roll < .83 ? 'credits' : 'chrono';
    const styles = {
      health: { color: '#70f0a8', symbol: '+' },
      shield: { color: '#70eaff', symbol: '◇' },
      overdrive: { color: '#ff8feb', symbol: '⚡' },
      credits: { color: '#ffd16c', symbol: '$' },
      chrono: { color: '#b49aff', symbol: '◷' }
    };
    pickups.push({ x, y, type, r: 10, age: 0, life: 16, color: styles[type].color, symbol: styles[type].symbol });
  }

  // Los objetos aparecen periódicamente en el espacio libre de la arena,
  // lejos del cuerpo del jefe. Nunca se crean sobre las placas.
  function spawnArenaPickup() {
    let x = W * .12;
    let y = H * .82;
    let foundSafeSpot = false;
    for (let attempt = 0; attempt < 24; attempt++) {
      const testX = rand(42, W - 42);
      const testY = rand(92, H - 42);
      if (Math.hypot(testX - boss.x, testY - boss.y) >= boss.contactRadius + 48) {
        x = testX;
        y = testY;
        foundSafeSpot = true;
        break;
      }
    }
    if (!foundSafeSpot) {
      const safeSpots = [
        { x: 55, y: 105 }, { x: W - 55, y: 105 },
        { x: 55, y: H - 45 }, { x: W - 55, y: H - 45 },
        { x: 125, y: H - 50 }, { x: W - 125, y: H - 50 }
      ];
      const available = safeSpots.filter((spot) => Math.hypot(spot.x - boss.x, spot.y - boss.y) >= boss.contactRadius + 48);
      const spot = available[Math.floor(Math.random() * available.length)] || safeSpots[0];
      x = spot.x;
      y = spot.y;
    }
    spawnPickup(x, y);
  }

  function collectPickup(pickup) {
    if (pickup.type === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + 25);
      playSfx('pickup');
    } else if (pickup.type === 'shield') {
      player.shieldTime = Math.max(player.shieldTime, 8);
      playSfx('shield');
    } else if (pickup.type === 'overdrive') {
      player.overdriveTime = Math.max(player.overdriveTime, 7);
      playSfx('pickup');
    } else if (pickup.type === 'chrono') {
      player.chronoTime = Math.max(player.chronoTime, 5.5);
      lifetimeStats.chronoPickups++;
      if (lifetimeStats.chronoPickups >= 5) unlockAchievement('chrono_hunter');
      playSfx('nova');
      showNotice('FRAGMENTO CRONO', 'Los proyectiles enemigos se ralentizan durante 5,5 segundos.');
    } else {
      credits += 25;
      playSfx('pickup');
    }
    lifetimeStats.pickupsCollected++;
    if (lifetimeStats.pickupsCollected >= 10) unlockAchievement('collector');
    spawnParticle(pickup.x, pickup.y, pickup.color, 16, 110);
    saveProgress();
    updateStats();
  }

  function handleBossContact() {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.hypot(dx, dy);
    // Zona de peligro circular: incluye núcleo, placas y brazos del jefe.
    // La expulsión impide que el jugador atraviese la armadura y se refugie dentro.
    const safeDistance = boss.contactRadius + player.r + 5;
    if (distance >= safeDistance) return;

    const angle = distance > 0.001 ? Math.atan2(dy, dx) : rand(0, TAU);
    player.x = clamp(boss.x + Math.cos(angle) * safeDistance, player.r, W - player.r);
    player.y = clamp(boss.y + Math.sin(angle) * safeDistance, player.r, H - player.r);
    damagePlayer(boss.contactDamage, player.x, player.y, boss.config.glow);
  }

  function registerCombatHit() {
    player.combo = player.comboTimer > 0 ? player.combo + 1 : 1;
    player.comboTimer = 2.6;
    lifetimeStats.maxCombo = Math.max(lifetimeStats.maxCombo, player.combo);
    score += Math.min(20, player.combo);
    if (player.combo >= 30) unlockAchievement('combo_30');
  }

  function update(dt) {
    if (state !== 'playing') return;

    gameTime += dt;
    const phaseSpinBoost = boss.phase >= 2 ? ((boss.config.phaseTwo && boss.config.phaseTwo.spinMultiplier) || 1.35) : 1;
    boss.angle += boss.spin * dt * phaseSpinBoost;
    boss.spin = boss.config.spin + Math.sin(gameTime * .7) * .16;
    boss.phaseBannerTimer = Math.max(0, boss.phaseBannerTimer - dt);
    boss.introTimer = Math.max(0, boss.introTimer - dt);
    player.novaCooldown = Math.max(0, player.novaCooldown - dt);
    player.novaFlash = Math.max(0, player.novaFlash - dt);
    player.aegisCooldown = Math.max(0, player.aegisCooldown - dt);
    player.aegisTime = Math.max(0, player.aegisTime - dt);
    player.lanceCooldown = Math.max(0, player.lanceCooldown - dt);
    player.chronoTime = Math.max(0, player.chronoTime - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer <= 0) player.combo = 0;

    // Botín por tiempo: como máximo dos objetos simultáneos y nunca encima del jefe.
    boss.pickupSpawnTimer -= dt;
    if (boss.pickupSpawnTimer <= 0) {
      if (pickups.length < 2) spawnArenaPickup();
      boss.pickupSpawnTimer = rand(8.5, 10.5);
    }

    stars.forEach((star) => {
      star.y += star.sp * dt;
      if (star.y > H) { star.y = 0; star.x = rand(0, W); }
    });

    let mx = 0;
    let my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx--;
    if (keys.has('arrowright') || keys.has('d')) mx++;
    if (keys.has('arrowup') || keys.has('w')) my--;
    if (keys.has('arrowdown') || keys.has('s')) my++;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.shieldTime = Math.max(0, player.shieldTime - dt);
    player.overdriveTime = Math.max(0, player.overdriveTime - dt);
    if (player.dashTimer > 0) {
      player.x += player.dashVX * player.speed * 4.0 * dt;
      player.y += player.dashVY * player.speed * 4.0 * dt;
    } else if (mx || my) {
      const distance = Math.hypot(mx, my);
      player.x += mx / distance * player.speed * dt;
      player.y += my / distance * player.speed * dt;
    }
    player.x = clamp(player.x, 18, W - 18);
    player.y = clamp(player.y, 18, H - 18);
    player.invuln = Math.max(0, player.invuln - dt);
    player.fireCD -= dt;
    if (mouse.down && player.fireCD <= 0) shootPlayer();

    handleBossContact();
    if (state !== 'playing') { updateStats(); return; }

    boss.shootCD -= dt;
    if (boss.shootCD <= 0 && boss.introTimer <= 0) fireBoss();

    const sector = TAU / boss.armor.length;
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      let remove = shot.life <= 0 || shot.x < -10 || shot.x > W + 10 || shot.y < -10 || shot.y > H + 10;

      if (!remove && boss.hp > 0) {
        const dx = shot.x - boss.x;
        const dy = shot.y - boss.y;
        const distance = Math.hypot(dx, dy);
        const angle = ((Math.atan2(dy, dx) - boss.angle) % TAU + TAU) % TAU;
        const index = Math.round(angle / sector) % boss.armor.length;
        const rawDiff = Math.abs(angle - index * sector);
        const angleDiff = Math.min(rawDiff, TAU - rawDiff);
        const plate = boss.armor[index];
        const plateHalfWidth = sector * .40;

        // Los proyectiles dañan las placas en el anillo exterior. El núcleo se daña solo al quedar expuesto.
        if (plate.alive && distance > 43 && distance < 79 && angleDiff < plateHalfWidth) {
          plate.hp -= shot.armorDamage ?? player.armorDamage;
          registerCombatHit();
          plate.flash = .14;
          playSfx('armorHit');
          spawnParticle(shot.x, shot.y, boss.config.armorHot, 5, 65);
          remove = true;
          if (plate.hp <= 0) {
            plate.alive = false;
            score += 100;
            credits += 12;
            lifetimeStats.platesDestroyed++;
            const plateAngle = boss.angle + index * sector;
            const plateX = boss.x + Math.cos(plateAngle) * 61;
            const plateY = boss.y + Math.sin(plateAngle) * 61;
            spawnParticle(plateX, plateY, boss.config.armorColor, 22, 165);
            if (lifetimeStats.platesDestroyed >= 50) unlockAchievement('plate_breaker');
            saveProgress();
            shake = 7;
            playSfx('plateBreak');
          }
        } else if (distance < boss.r + 5 && boss.armor.every((plateItem) => !plateItem.alive)) {
          boss.hp -= shot.coreDamage ?? player.coreDamage;
          registerCombatHit();
          playSfx('coreHit');
          spawnParticle(shot.x, shot.y, shot.type === 'laser' ? '#ff91f3' : '#83f7ff', 3, 55);
          score += 5;
          remove = true;
          triggerBossPhase();
          if (boss.hp <= 0) {
            boss.hp = 0;
            shots.splice(i, 1);
            updateStats();
            defeatBoss();
            return;
          }
        }
      }

      if (remove) shots.splice(i, 1);
    }

    if (state !== 'playing') { updateStats(); return; }

    const hostileTimeScale = player.chronoTime > 0 ? 0.58 : 1;
    const hostileDt = dt * hostileTimeScale;
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const shot = enemyShots[i];
      const oldAge = shot.age;
      shot.age += hostileDt;

      // Los proyectiles curvos giran gradualmente hacia la posición actual del jugador.
      if (shot.type === 'curve') {
        const currentAngle = Math.atan2(shot.vy, shot.vx);
        const targetAngle = Math.atan2(player.y - shot.y, player.x - shot.x);
        const difference = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        const angle = currentAngle + clamp(difference, -shot.turnRate * hostileDt, shot.turnRate * hostileDt);
        shot.vx = Math.cos(angle) * shot.speed;
        shot.vy = Math.sin(angle) * shot.speed;
        shot.x += shot.vx * hostileDt;
        shot.y += shot.vy * hostileDt;
      } else if (shot.type === 'wave') {
        const perpX = -shot.baseVy / (shot.speed || 1);
        const perpY = shot.baseVx / (shot.speed || 1);
        const oldWave = Math.sin(oldAge * shot.waveFrequency) * shot.waveAmplitude;
        const newWave = Math.sin(shot.age * shot.waveFrequency) * shot.waveAmplitude;
        shot.x += shot.vx * hostileDt + perpX * (newWave - oldWave);
        shot.y += shot.vy * hostileDt + perpY * (newWave - oldWave);
      } else {
        shot.x += shot.vx * hostileDt;
        shot.y += shot.vy * hostileDt;
      }

      // Algunas balas grandes se separan en tres proyectiles pequeños.
      if (shot.type === 'split' && !shot.didSplit && shot.age >= shot.splitAfter) {
        shot.didSplit = true;
        const baseAngle = Math.atan2(shot.vy, shot.vx);
        const count = Math.max(3, shot.splitCount);
        for (let n = 0; n < count; n++) {
          const spreadPos = count === 1 ? 0 : n / (count - 1) - .5;
          const angle = baseAngle + spreadPos * .92;
          enemyShots.push(createEnemyShot(shot.x, shot.y, angle, shot.speed * .77, shot.color, Math.max(3.4, shot.r * .56), 'normal', {
            life: 3.8, damageScale: .82
          }));
        }
        spawnParticle(shot.x, shot.y, shot.color, 9, 75);
        enemyShots.splice(i, 1);
        continue;
      }

      shot.life -= hostileDt;
      if (shot.life <= 0 || shot.x < -30 || shot.x > W + 30 || shot.y < -30 || shot.y > H + 30) {
        enemyShots.splice(i, 1);
        continue;
      }
      const distance = Math.hypot(shot.x - player.x, shot.y - player.y);
      if (distance < shot.r + player.r && player.invuln <= 0) {
        enemyShots.splice(i, 1);
        damagePlayer(boss.config.damage * (shot.damageScale || 1), player.x, player.y, shot.color || '#ff638e');
        if (state !== 'playing') break;
      }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      pickup.age += dt;
      pickup.life -= dt;
      pickup.x += Math.sin(pickup.age * 2.2) * 5 * dt;
      if (pickup.life <= 0) {
        pickups.splice(i, 1);
        continue;
      }
      if (Math.hypot(pickup.x - player.x, pickup.y - player.y) < pickup.r + player.r + 3) {
        pickups.splice(i, 1);
        collectPickup(pickup);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.12, dt);
      particle.vy *= Math.pow(.12, dt);
      particle.life -= dt;
      if (particle.life <= 0) particles.splice(i, 1);
    }
    boss.armor.forEach((plate) => { plate.flash = Math.max(0, plate.flash - dt); });
    shake = Math.max(0, shake - 30 * dt);
    score += dt * 2;
    updateStats();
  }

  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function polygonPath(sides, radius, innerRadius = null, rotation = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + i * Math.PI * 2 / sides;
      const r = innerRadius !== null && i % 2 === 1 ? innerRadius : radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawCore() {
    const cfg = boss.config;
    const exposed = boss.armor.every((plate) => !plate.alive);
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.angle * .45);
    const phaseTwo = boss.phase >= 2;
    const phaseColor = (cfg.phaseTwo && cfg.phaseTwo.color) || '#ff4da6';
    ctx.shadowBlur = phaseTwo ? 40 + Math.sin(gameTime * 13) * 8 : (exposed ? 30 : 16);
    ctx.shadowColor = phaseTwo ? phaseColor : (exposed ? '#67e8f9' : cfg.glow);
    ctx.fillStyle = phaseTwo ? phaseColor + '66' : (exposed ? '#153e55' : cfg.coreColor);
    ctx.strokeStyle = phaseTwo ? phaseColor : (exposed ? '#8bf4ff' : cfg.armorHot);
    ctx.lineWidth = phaseTwo ? 4 : 3;

    if (cfg.shape === 'diamond') {
      polygonPath(4, boss.r, boss.r * .78, Math.PI / 4);
    } else if (cfg.shape === 'octagon') {
      polygonPath(8, boss.r, boss.r * .82, Math.PI / 8);
    } else if (cfg.shape === 'star') {
      polygonPath(10, boss.r, boss.r * .59);
    } else if (cfg.shape === 'eclipse') {
      ctx.beginPath();
      ctx.arc(0, 0, boss.r, 0, TAU);
    } else if (cfg.shape === 'omega') {
      polygonPath(12, boss.r, boss.r * .74, Math.PI / 12);
    } else if (cfg.shape === 'serpent') {
      polygonPath(6, boss.r, boss.r * .50, boss.angle * .35);
    } else if (cfg.shape === 'sun') {
      polygonPath(16, boss.r, boss.r * .78, boss.angle * .2);
    } else if (cfg.shape === 'gear') {
      polygonPath(16, boss.r, boss.r * .66, -boss.angle * .3);
    } else if (cfg.shape === 'singularity') {
      ctx.beginPath(); ctx.arc(0, 0, boss.r, 0, TAU);
    } else {
      polygonPath(6, boss.r, boss.r * .82, Math.PI / 6);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (cfg.shape === 'eclipse' || cfg.shape === 'singularity') {
      ctx.fillStyle = '#070b1b';
      ctx.beginPath();
      ctx.arc(7, -3, boss.r * .66, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = exposed ? '#b1fcff' : (cfg.shape === 'singularity' ? '#ffbaf2' : '#bf9cff');
      ctx.lineWidth = cfg.shape === 'singularity' ? 4 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, boss.r * .72, -.85 + boss.angle * .4, 2.35 + boss.angle * .4);
      ctx.stroke();
      if (cfg.shape === 'singularity') {
        ctx.beginPath(); ctx.arc(0, 0, boss.r * .43, 0, TAU);
        ctx.strokeStyle = '#fff5'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else if (cfg.shape === 'sun') {
      ctx.strokeStyle = '#fff5c288'; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + boss.angle * .2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * boss.r * .34, Math.sin(a) * boss.r * .34);
        ctx.lineTo(Math.cos(a) * boss.r * .75, Math.sin(a) * boss.r * .75); ctx.stroke();
      }
    } else {
      ctx.rotate(-boss.angle * .9 + gameTime * 1.8);
      ctx.fillStyle = exposed ? '#72f1ff' : cfg.armorColor;
      for (let i = 0; i < 3; i++) {
        ctx.rotate(TAU / 3);
        ctx.fillRect(-2, -boss.r * .62, 4, boss.r * .47);
      }
    }

    const pulse = 1 + Math.sin(gameTime * (phaseTwo ? 12 : 5)) * (phaseTwo ? .22 : .08);
    ctx.beginPath();
    ctx.arc(0, 0, (phaseTwo ? 13 : 10) * pulse, 0, TAU);
    ctx.fillStyle = phaseTwo ? '#fff0fb' : (exposed ? '#b5fbff' : cfg.armorHot);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  function drawBoss() {
    const cfg = boss.config;
    const sector = TAU / boss.armor.length;

    // Brazos y silueta exterior propios de cada jefe.
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(-boss.angle * .6);
    if (boss.phase >= 2) {
      ctx.shadowColor = (cfg.phaseTwo && cfg.phaseTwo.color) || '#ff4da6';
      ctx.shadowBlur = 24;
    }
    const armCount = cfg.arms;
    for (let i = 0; i < armCount; i++) {
      ctx.rotate(TAU / armCount);
      ctx.fillStyle = '#16243d';
      ctx.strokeStyle = cfg.armorColor;
      ctx.globalAlpha = .8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boss.r * .72, -7);
      ctx.lineTo(82, -5);
      ctx.lineTo(101, 0);
      ctx.lineTo(82, 5);
      ctx.lineTo(boss.r * .72, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = cfg.glow + '88';
      ctx.fillRect(45, -2, 27, 4);
    }
    ctx.restore();

    // Anillo orbitando las placas.
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.angle);
    ctx.beginPath();
    ctx.arc(0, 0, 83, 0, TAU);
    ctx.strokeStyle = cfg.armorColor + '66';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    boss.armor.forEach((plate, index) => {
      if (!plate.alive) return;
      const centerAngle = index * sector;
      const startAngle = centerAngle - sector * .40;
      const endAngle = centerAngle + sector * .40;
      const plateColor = plate.flash > 0 ? '#ffffff' : (plate.hp <= 1 ? cfg.armorHot : cfg.armorColor);
      ctx.beginPath();
      ctx.arc(0, 0, 61, startAngle, endAngle);
      ctx.strokeStyle = plateColor;
      ctx.lineWidth = 15;
      ctx.lineCap = 'butt';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 61, startAngle, endAngle);
      ctx.strokeStyle = '#ffffff55';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff5cf';
      ctx.beginPath();
      ctx.arc(Math.cos(centerAngle) * 61, Math.sin(centerAngle) * 61, 2.2, 0, TAU);
      ctx.fill();
    });
    ctx.restore();

    drawCore();

    // Barra circular de vida del núcleo.
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, 106, -Math.PI / 2, -Math.PI / 2 + TAU * (boss.hp / boss.maxHp));
    ctx.strokeStyle = cfg.glow;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, 106, -Math.PI / 2, Math.PI * 1.5);
    ctx.strokeStyle = '#ffffff20';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (boss.phase >= 2) {
      // Doble anillo giratorio rojo/magenta: distingue visualmente la forma enfurecida.
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.rotate(-gameTime * 1.9);
      const phaseColor = (cfg.phaseTwo && cfg.phaseTwo.color) || '#ff4da6';
      ctx.shadowColor = phaseColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 116 + Math.sin(gameTime * 12) * 4, 0.2, TAU * .83);
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 4;
      ctx.setLineDash([13, 7]);
      ctx.stroke();
      ctx.rotate(gameTime * 3.8);
      ctx.beginPath();
      ctx.arc(0, 0, 130 + Math.sin(gameTime * 9 + 1) * 4, .5, TAU * .74);
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = .72;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake));
    ctx.clearRect(-20, -20, W + 40, H + 40);

    const background = ctx.createRadialGradient(CX, CY, 15, CX, CY, 580);
    background.addColorStop(0, '#111d37');
    background.addColorStop(1, '#050916');
    ctx.fillStyle = background;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    stars.forEach((star) => {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = '#d6eeff';
      ctx.fillRect(star.x, star.y, star.r, star.r);
    });
    ctx.globalAlpha = 1;

    // Cuadrícula y guías de la arena.
    ctx.strokeStyle = '#28405d55';
    ctx.lineWidth = 1;
    for (let radius = 70; radius < 500; radius += 70) {
      ctx.beginPath(); ctx.arc(CX, CY, radius, 0, TAU); ctx.stroke();
    }
    for (let x = 0; x <= W; x += 80) line(x, 0, x, H, '#20345122');
    for (let y = 0; y <= H; y += 80) line(0, y, W, y, '#20345122');

    drawBoss();

    // Aviso corto antes de cada ráfaga: sirve para anticipar el ritmo sin cubrir la arena.
    if (state === 'playing' && boss.introTimer <= 0 && boss.shootCD > 0 && boss.shootCD < .34) {
      const warning = 1 - boss.shootCD / .34;
      ctx.save();
      ctx.globalAlpha = .28 + warning * .5;
      ctx.strokeStyle = boss.config.bulletColor || '#ff6688';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, 21 + (1 - warning) * 15, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    shots.forEach((shot) => {
      ctx.save();
      ctx.shadowBlur = shot.type === 'lance' ? 25 : shot.type === 'laser' ? 18 : 13;
      ctx.shadowColor = shot.type === 'lance' ? '#ffd47b' : shot.type === 'laser' ? '#ff91f3' : '#72f4ff';
      if (shot.type === 'lance') {
        ctx.strokeStyle = '#fff4c8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(shot.x - shot.vx * .055, shot.y - shot.vy * .055);
        ctx.lineTo(shot.x + shot.vx * .016, shot.y + shot.vy * .016);
        ctx.stroke();
        ctx.fillStyle = '#ffd47b';
      } else if (shot.type === 'laser') {
        ctx.strokeStyle = '#ffb9f7';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(shot.x - shot.vx * .035, shot.y - shot.vy * .035);
        ctx.lineTo(shot.x + shot.vx * .012, shot.y + shot.vy * .012);
        ctx.stroke();
        ctx.fillStyle = '#fff0ff';
      } else {
        ctx.fillStyle = shot.type === 'spread' ? '#a9faff' : '#d9fcff';
      }
      ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, TAU); ctx.fill();
      ctx.restore();
    });
    enemyShots.forEach((shot) => {
      ctx.save();
      ctx.shadowBlur = shot.type === 'large' ? 22 : 12;
      ctx.shadowColor = shot.color;
      ctx.fillStyle = shot.color;
      if (shot.type === 'large') {
        ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r + 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff9'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(shot.x, shot.y, Math.max(2, shot.r * .42), 0, TAU);
        ctx.fillStyle = '#fff9'; ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1; ctx.stroke();
        if (shot.type === 'curve' || shot.type === 'wave' || shot.type === 'split') {
          ctx.globalAlpha = .48;
          ctx.beginPath(); ctx.arc(shot.x - shot.vx * .035, shot.y - shot.vy * .035, shot.r * 1.5, 0, TAU);
          ctx.strokeStyle = shot.color; ctx.lineWidth = 2; ctx.stroke();
        }
      }
      ctx.restore();
    });

    // Objetos temporales que caen al romper algunas placas.
    pickups.forEach((pickup) => {
      const bob = Math.sin(pickup.age * 4) * 3;
      ctx.save();
      ctx.translate(pickup.x, pickup.y + bob);
      ctx.shadowBlur = 18;
      ctx.shadowColor = pickup.color;
      ctx.fillStyle = pickup.color + '33';
      ctx.strokeStyle = pickup.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, pickup.r + 2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f7fbff';
      ctx.font = '900 13px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pickup.symbol, 0, 1);
      ctx.restore();
    });

    // Efectos persistentes de las habilidades experimentales.
    if (player.novaFlash > 0) {
      const progress = 1 - player.novaFlash / .62;
      ctx.save();
      ctx.globalAlpha = clamp(player.novaFlash / .62, 0, 1);
      ctx.strokeStyle = '#79f7ff';
      ctx.shadowColor = '#63f5ff';
      ctx.shadowBlur = 22;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 18 + progress * 240, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (player.aegisTime > 0) {
      ctx.save();
      const pulse = 1 + Math.sin(gameTime * 24) * .07;
      ctx.strokeStyle = '#b3a3ff';
      ctx.fillStyle = '#9e92ff18';
      ctx.shadowColor = '#9c8dff';
      ctx.shadowBlur = 25;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 22 * pulse, 0, TAU);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // El jugador tiene forma de pequeña nave/cursor.
    const aim = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(aim);
    ctx.globalAlpha = player.invuln > 0 && Math.floor(gameTime * 18) % 2 === 0 ? .32 : 1;
    if (player.dashTimer > 0) {
      ctx.strokeStyle = '#99faff';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#60eaff';
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.stroke();
    }
    ctx.shadowBlur = 17;
    ctx.shadowColor = '#69eaff';
    ctx.fillStyle = '#72eaff';
    ctx.strokeStyle = '#e8fdff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.r, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Mira del mouse.
    ctx.strokeStyle = '#b7f8ffbb';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 7, 0, TAU); ctx.stroke();
    line(mouse.x - 12, mouse.y, mouse.x - 5, mouse.y, '#b7f8ff99');
    line(mouse.x + 5, mouse.y, mouse.x + 12, mouse.y, '#b7f8ff99');
    line(mouse.x, mouse.y - 12, mouse.x, mouse.y - 5, '#b7f8ff99');
    line(mouse.x, mouse.y + 5, mouse.x, mouse.y + 12, '#b7f8ff99');

    ctx.font = '700 11px system-ui';
    ctx.fillStyle = '#9fb6d4';
    const armorText = boss.armor.every((plate) => !plate.alive) ? 'NÚCLEO EXPUESTO' : 'ARMADURA ACTIVA';
    ctx.fillText(`${levelIndex === SECRET_BOSS_INDEX ? 'JEFE SECRETO' : `MUNDO ${worldIndexForBoss(levelIndex) + 1} · JEFE ${stageNumberForBoss(levelIndex)}/5`} // ${boss.config.name} // ${armorText}`, 18, 24);
    ctx.fillStyle = '#6b829f';
    ctx.fillText(`PUNTAJE ${String(Math.floor(score)).padStart(5, '0')}`, W - 128, 24);

    // Presentación breve de cada jefe al entrar: deja tiempo para reconocer el combate.
    if (boss.introTimer > 0) {
      const introProgress = clamp(1 - boss.introTimer / 2.1, 0, 1);
      const alpha = clamp(Math.min(introProgress * 5, boss.introTimer * 2), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(CX, 78);
      ctx.fillStyle = '#07101eed';
      ctx.strokeStyle = boss.config.glow;
      ctx.lineWidth = 2;
      ctx.shadowColor = boss.config.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.roundRect(-230, -29, 460, 58, 12); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f5fbff'; ctx.font = '900 20px system-ui';
      ctx.fillText(boss.config.name, 0, -6);
      ctx.fillStyle = boss.config.armorColor; ctx.font = '800 10px system-ui';
      ctx.fillText(boss.config.subtitle.toUpperCase(), 0, 16);
      ctx.restore();
    }

    // Aviso de transición: destello breve y cartel centrado durante la entrada en fase 2.
    if (boss.phase >= 2 && boss.phaseBannerTimer > 0) {
      const remaining = boss.phaseBannerTimer;
      const fade = clamp(remaining / .35, 0, 1);
      const flash = clamp((remaining - 2.35) / .45, 0, .52);
      if (flash > 0) {
        ctx.globalAlpha = flash;
        ctx.fillStyle = (boss.config.phaseTwo && boss.config.phaseTwo.color) || '#ff4da6';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      const entrance = clamp((3.0 - remaining) / .18, 0, 1);
      const pulse = 1 + Math.sin(gameTime * 11) * .025;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(CX, 122 + (1 - entrance) * -24);
      ctx.scale(pulse, pulse);
      const phaseProfile = boss.config.phaseTwo || {};
      const phaseColor = phaseProfile.color || '#ff4da6';
      ctx.shadowColor = phaseColor;
      ctx.shadowBlur = 26;
      ctx.fillStyle = '#080d1eeF';
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-208, -37, 416, 74, 13);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 25px system-ui';
      ctx.fillText(`⚠ ${phaseProfile.title || 'FASE 2: SOBRECARGA'}`, 0, -8);
      ctx.fillStyle = phaseColor;
      ctx.font = '800 11px system-ui';
      ctx.fillText(phaseProfile.subtitle || 'EL NÚCLEO SE DESBLOQUEÓ · ATAQUES INTENSIFICADOS', 0, 19);
      ctx.restore();
    }
    ctx.restore();
  }

  function loop(now) {
    if (state !== 'playing') return;
    const dt = Math.min(.033, Math.max(0, (now - last) / 1000));
    last = now;
    fpsFrames++;
    fpsClock += dt;
    if (fpsClock >= .5) {
      fps = Math.round(fpsFrames / fpsClock);
      $('fpsStat').textContent = fps;
      fpsClock = 0;
      fpsFrames = 0;
    }
    update(dt);
    draw();
    if (state === 'playing') requestAnimationFrame(loop);
  }

  setupCampaign();
  showMainMenu();
  draw();
})();
