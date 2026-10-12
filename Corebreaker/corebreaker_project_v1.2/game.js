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

  // Los precios son por nivel. Las mejoras permanecen compradas entre los seis jefes.
  const UPGRADES = [
    { id: 'cadence', name: 'Disparo rápido', description: 'Disparás más seguido.', prices: [65, 95, 130], levels: 3, levelText: 'Cadencia' },
    { id: 'rounds', name: 'Munición perforante', description: 'Cada disparo destruye más armadura.', prices: [90, 130], levels: 2, levelText: 'Daño a la armadura' },
    { id: 'reactor', name: 'Núcleo amplificado', description: 'Hacés más daño cuando el núcleo queda expuesto.', prices: [75, 105, 140], levels: 3, levelText: 'Daño al núcleo' },
    { id: 'hull', name: 'Blindaje personal', description: '+20 de energía máxima y recuperás 20.', prices: [75, 105, 140], levels: 3, levelText: 'Energía máxima' },
    { id: 'thrusters', name: 'Propulsores', description: 'Te movés un 12% más rápido por nivel.', prices: [60, 90, 120], levels: 3, levelText: 'Velocidad' },
    { id: 'repair', name: 'Reparación rápida', description: 'Recuperás 35 puntos de energía.', prices: [40], levels: Infinity, levelText: 'Reparación', repeatable: true }
  ];

  // Cada objeto define la vida, armadura, apariencia y patrones de un jefe.
  // Los seis jefes comparten el mismo sistema de combate, pero cada uno sube la dificultad.
  const BOSSES = [
    {
      name: 'EL GUARDIÁN', subtitle: 'La puerta del vacío',
      hint: 'El jefe original. Alterna anillos, disparos dirigidos y ráfagas giratorias.',
      armorCount: 8, plateHP: 3, hp: 100, coreR: 34, spin: 0.78,
      interval: 1.08, minInterval: 0.68, bulletSpeed: 142, damage: 18,
      radialCount: 12, fanCount: 3, fanSpread: 0.38, spiralCount: 8, spiralSpread: 0.78,
      patterns: ['radial', 'fan', 'spiral'],
      armorColor: '#ffbd62', armorHot: '#ff806d', coreColor: '#ed4f87', glow: '#ff638f',
      bulletColor: '#ff547d', secondBulletColor: '#ffb45f', shape: 'hex', arms: 4
    },
    {
      name: 'CENTINELA ORBITAL', subtitle: 'El guardián de los cuatro ejes',
      hint: 'Tiene más vida y usa abanicos de cinco disparos junto con ráfagas en cruz.',
      armorCount: 8, plateHP: 3, hp: 118, coreR: 33, spin: 0.98,
      interval: 0.98, minInterval: 0.61, bulletSpeed: 154, damage: 18,
      radialCount: 14, fanCount: 5, fanSpread: 0.64, spiralCount: 9, spiralSpread: 0.92, crossCount: 4,
      patterns: ['fan', 'cross', 'radial'],
      armorColor: '#67dfff', armorHot: '#b2f7ff', coreColor: '#245dd1', glow: '#47b9ff',
      bulletColor: '#4ed7ff', secondBulletColor: '#91a6ff', shape: 'diamond', arms: 4
    },
    {
      name: 'REACTOR INESTABLE', subtitle: 'Una máquina al borde del colapso',
      hint: 'Su armadura tiene diez placas y dispara anillos más densos a mayor velocidad.',
      armorCount: 10, plateHP: 3, hp: 138, coreR: 32, spin: 1.17,
      interval: 0.88, minInterval: 0.55, bulletSpeed: 168, damage: 18,
      radialCount: 15, fanCount: 5, fanSpread: 0.72, spiralCount: 9, spiralSpread: 1.05, crossCount: 6,
      patterns: ['radial', 'spiral', 'fan', 'cross'],
      armorColor: '#ffc46b', armorHot: '#fff0a0', coreColor: '#b83a23', glow: '#ff8b42',
      bulletColor: '#ff8447', secondBulletColor: '#ffd166', shape: 'octagon', arms: 6
    },
    {
      name: 'HIDRA DE PLASMA', subtitle: 'La tormenta viviente',
      hint: 'Sus placas resisten más impactos. Combina anillos dobles, abanicos y disparos dirigidos.',
      armorCount: 10, plateHP: 4, hp: 158, coreR: 32, spin: 1.34,
      interval: 0.81, minInterval: 0.50, bulletSpeed: 178, damage: 19,
      radialCount: 13, fanCount: 5, fanSpread: 0.82, spiralCount: 10, spiralSpread: 1.12,
      aimedCount: 3, crossCount: 6,
      patterns: ['fan', 'doubleRing', 'aimed', 'spiral'],
      armorColor: '#d78bff', armorHot: '#ffc1fb', coreColor: '#6e28a8', glow: '#d85aff',
      bulletColor: '#e879ff', secondBulletColor: '#ff8fce', shape: 'star', arms: 5
    },
    {
      name: 'ECLIPSE', subtitle: 'La sombra que lo consume todo',
      hint: 'Doce placas, balas rápidas y ataques que llenan más espacio de la arena.',
      armorCount: 12, plateHP: 4, hp: 184, coreR: 31, spin: 1.57,
      interval: 0.72, minInterval: 0.45, bulletSpeed: 190, damage: 20,
      radialCount: 15, fanCount: 7, fanSpread: 0.92, spiralCount: 11, spiralSpread: 1.32,
      aimedCount: 3, crossCount: 8,
      patterns: ['spiral', 'fan', 'doubleRing', 'cross', 'aimed'],
      armorColor: '#a7a3ff', armorHot: '#f4d6ff', coreColor: '#27204f', glow: '#9c75ff',
      bulletColor: '#9e78ff', secondBulletColor: '#ff77b7', shape: 'eclipse', arms: 6
    },
    {
      name: 'NÚCLEO OMEGA', subtitle: 'La última defensa',
      hint: 'El jefe final: catorce placas resistentes, patrones combinados y la mayor cadencia de disparo.',
      armorCount: 14, plateHP: 4, hp: 225, coreR: 30, spin: 1.82,
      interval: 0.64, minInterval: 0.40, bulletSpeed: 202, damage: 20,
      radialCount: 16, fanCount: 7, fanSpread: 1.02, spiralCount: 12, spiralSpread: 1.48,
      aimedCount: 5, crossCount: 8,
      patterns: ['doubleRing', 'fan', 'spiral', 'cross', 'aimed'],
      armorColor: '#ff737d', armorHot: '#fff0c2', coreColor: '#9b1c3e', glow: '#ff435f',
      bulletColor: '#ff536b', secondBulletColor: '#ffc15f', shape: 'omega', arms: 8
    }
  ];

  let state = 'ready'; // ready, playing, paused, between, won, lost
  let last = 0;
  let fps = 60;
  let fpsClock = 0;
  let fpsFrames = 0;
  let score = 0;
  let gameTime = 0;
  let shake = 0;
  let levelIndex = 0;
  let credits = 0;
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

  function makePlayer() {
    const result = {
      x: W * 0.5, y: H - 62, r: 10,
      speed: 255, maxHp: 100, hp: 100,
      fireInterval: 0.14, armorDamage: 1, coreDamage: 2.3,
      upgrades: { cadence: 0, rounds: 0, reactor: 0, hull: 0, thrusters: 0 },
      invuln: 0, fireCD: 0
    };
    return result;
  }

  function makeBoss(index) {
    const config = BOSSES[index];
    return {
      config,
      x: CX,
      y: CY - 8,
      r: config.coreR,
      angle: 0,
      spin: config.spin,
      contactRadius: CONTACT_RADIUS,
      contactDamage: config.damage + 4,
      hp: config.hp,
      maxHp: config.hp,
      armor: Array.from({ length: config.armorCount }, () => ({ hp: config.plateHP, maxHp: config.plateHP, alive: true, flash: 0 })),
      shootCD: 0.85,
      pattern: 0
    };
  }

  function setupCampaign() {
    player = makePlayer();
    boss = makeBoss(0);
    shots = [];
    enemyShots = [];
    particles = [];
    score = 0;
    credits = 0;
    gameTime = 0;
    shake = 0;
    levelIndex = 0;
    fpsClock = 0;
    fpsFrames = 0;
    stars = Array.from({ length: 95 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.5, 1.7), a: rand(.18, .8), sp: rand(3, 15) }));
    updateStats();
  }

  function updateStats() {
    $('levelStat').textContent = `${levelIndex + 1} / ${BOSSES.length}`;
    $('armorStat').textContent = boss ? `${boss.armor.filter((p) => p.alive).length} / ${boss.armor.length}` : '—';
    $('bossStat').textContent = boss ? `${Math.ceil(Math.max(0, boss.hp) / boss.maxHp * 100)}%` : '100%';
    $('playerStat').textContent = player ? `${Math.ceil(Math.max(0, player.hp))} / ${player.maxHp}` : '100 / 100';
    $('creditsStat').textContent = String(credits);
  }

  function showOverlay(title, text, buttonText) {
    $('overlayTitle').textContent = title;
    $('overlayText').textContent = text;
    startBtn.textContent = buttonText;
    $('shopPanel').classList.toggle('hidden', state !== 'between');
    overlay.classList.remove('hidden');
  }

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
    } else {
      credits -= cost;
      player.upgrades[id]++;
      const previousMaxHp = player.maxHp;
      applyUpgrades();
      if (id === 'hull') player.hp = Math.min(player.maxHp, player.hp + (player.maxHp - previousMaxHp));
    }
    renderShop();
    updateStats();
  }

  $('shopItems').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-upgrade]');
    if (button && !button.disabled) buyUpgrade(button.dataset.upgrade);
  });

  function beginLevel(index, options = {}) {
    levelIndex = index;
    boss = makeBoss(levelIndex);
    shots = [];
    enemyShots = [];
    particles = [];
    shake = 0;

    if (options.fresh || !player) {
      player = makePlayer();
    } else if (options.retry) {
      player.x = W * 0.5;
      player.y = H - 62;
      player.hp = player.maxHp;
      player.invuln = 1.25;
      player.fireCD = 0;
    } else {
      // La curación gratuita sucede al vencer al jefe, antes de entrar a la tienda.
      player.x = W * 0.5;
      player.y = H - 62;
      player.invuln = 1.25;
      player.fireCD = 0;
    }

    state = 'playing';
    overlay.classList.add('hidden');
    last = performance.now();
    fpsClock = 0;
    fpsFrames = 0;
    updateStats();
    canvas.focus();
    requestAnimationFrame(loop);
  }

  function startCampaign() {
    setupCampaign();
    beginLevel(0, { fresh: true });
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      showOverlay('PAUSA', 'El combate está detenido. Presioná P o el botón para continuar.', 'Continuar');
    } else if (state === 'paused') {
      state = 'playing';
      overlay.classList.add('hidden');
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function handleOverlayButton() {
    if (state === 'paused') {
      togglePause();
    } else if (state === 'between') {
      beginLevel(levelIndex + 1, { transition: true });
    } else if (state === 'lost') {
      beginLevel(levelIndex, { retry: true });
    } else {
      // En la pantalla inicial o al ganar toda la campaña, empieza desde el primer jefe.
      startCampaign();
    }
  }

  startBtn.addEventListener('click', handleOverlayButton);

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const onButton = event.target instanceof HTMLElement && Boolean(event.target.closest('button'));
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) || (key === ' ' && !onButton)) event.preventDefault();
    keys.add(key);

    if (key === 'p') {
      if (state === 'playing' || state === 'paused') togglePause();
    }
    if ((key === 'enter' || key === ' ') && !onButton && ['ready', 'between', 'won', 'lost'].includes(state)) {
      handleOverlayButton();
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { mouse.down = false; keys.clear(); });

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }
  canvas.addEventListener('pointermove', (event) => {
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
    const vx = dx / distance;
    const vy = dy / distance;
    shots.push({ x: player.x + vx * 13, y: player.y + vy * 13, vx: vx * 590, vy: vy * 590, r: 3.2, life: 1.5 });
    player.fireCD = player.fireInterval;
    spawnParticle(player.x + vx * 12, player.y + vy * 12, '#80f4ff', 2, 35);
  }

  function addEnemyShot(angle, speed, color, radius = 43, size = 5) {
    enemyShots.push({
      x: boss.x + Math.cos(angle) * radius,
      y: boss.y + Math.sin(angle) * radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: size,
      life: 5,
      color
    });
  }

  function fireRing(count, offset, speedScale, color) {
    for (let i = 0; i < count; i++) {
      const angle = offset + TAU * i / count;
      addEnemyShot(angle, boss.config.bulletSpeed * speedScale * rand(.94, 1.06), color, boss.r + 10, 4.8);
    }
  }

  function fireFan(count, spread, baseAngle, speedScale = 1, color = boss.config.bulletColor) {
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0 : i / (count - 1) - .5;
      const angle = baseAngle + fraction * spread;
      addEnemyShot(angle, boss.config.bulletSpeed * speedScale, color, boss.r + 8, 5.1);
    }
  }

  function fireBoss() {
    const cfg = boss.config;
    const healthRatio = boss.hp / boss.maxHp;
    const rage = 1 + (1 - healthRatio) * .16;
    const type = cfg.patterns[boss.pattern % cfg.patterns.length];
    const aimedAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const rotation = boss.angle + boss.pattern * .19;

    if (type === 'radial') {
      fireRing(cfg.radialCount, rotation * .36, rage, cfg.bulletColor);
    } else if (type === 'fan') {
      fireFan(cfg.fanCount, cfg.fanSpread, aimedAngle, rage, cfg.bulletColor);
    } else if (type === 'spiral') {
      // Una ráfaga estrecha que gira con el jefe: cambia de dirección en cada ataque.
      fireFan(cfg.spiralCount, cfg.spiralSpread, rotation, rage * .88, cfg.secondBulletColor || cfg.bulletColor);
    } else if (type === 'cross') {
      const count = cfg.crossCount || 4;
      for (let i = 0; i < count; i++) {
        addEnemyShot(rotation + TAU * i / count, cfg.bulletSpeed * rage * .94, cfg.secondBulletColor || cfg.bulletColor, boss.r + 9, 5.2);
      }
    } else if (type === 'aimed') {
      const count = cfg.aimedCount || 3;
      fireFan(count, .30 + count * .045, aimedAngle, rage * 1.08, cfg.bulletColor);
    } else if (type === 'doubleRing') {
      const countA = cfg.radialCount;
      const countB = Math.max(6, Math.ceil(cfg.radialCount * .65));
      fireRing(countA, rotation * .3, rage * .78, cfg.bulletColor);
      fireRing(countB, rotation * .3 + Math.PI / countA, rage * 1.08, cfg.secondBulletColor || cfg.bulletColor);
    }

    boss.pattern++;
    boss.shootCD = Math.max(cfg.minInterval, cfg.interval - (1 - boss.hp / boss.maxHp) * .18);
    shake = Math.max(shake, 2.2);
  }

  function defeatBoss() {
    // Créditos: romper placas + recompensa por completar el combate.
    credits += 55 + levelIndex * 15;
    if (levelIndex < BOSSES.length - 1) {
      const next = BOSSES[levelIndex + 1];
      const healed = Math.min(35, player.maxHp - player.hp);
      player.hp += healed;
      state = 'between';
      renderShop();
      showOverlay(
        `JEFE ${levelIndex + 1} DERROTADO`,
        `Destruiste a ${boss.config.name}. Ganaste ${55 + levelIndex * 15} créditos y recuperaste ${Math.round(healed)} de energía. Siguiente: ${next.name} — ${next.subtitle} ${next.hint}`,
        'Siguiente nivel'
      );
    } else {
      state = 'won';
      showOverlay(
        '¡CAMPAÑA COMPLETADA!',
        `Derrotaste a los seis jefes y destruiste el Núcleo Omega. Puntaje final: ${Math.floor(score)}. ¡Completaste COREBREAKER!`,
        'Jugar de nuevo'
      );
    }
    updateStats();
  }

  function loseGame() {
    state = 'lost';
    showOverlay('SISTEMA DAÑADO', `El ${boss.config.name} te venció. Probá moverte por la arena y apuntar mientras esquivás. Tu puntaje: ${Math.floor(score)}. Al reintentar conservarás las mejoras compradas y recuperarás toda la energía.`, 'Reintentar jefe');
  }

  function damagePlayer(amount, impactX = player.x, impactY = player.y, color = '#ff638e') {
    if (player.invuln > 0 || state !== 'playing') return false;
    player.hp = Math.max(0, player.hp - amount);
    player.invuln = 0.8;
    shake = Math.max(shake, 8);
    spawnParticle(impactX, impactY, color, 17, 130);
    if (player.hp <= 0) loseGame();
    return true;
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

  function update(dt) {
    if (state !== 'playing') return;

    gameTime += dt;
    boss.angle += boss.spin * dt;
    boss.spin = boss.config.spin + Math.sin(gameTime * .7) * .16;

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
    if (mx || my) {
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
    if (boss.shootCD <= 0) fireBoss();

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
          plate.hp -= player.armorDamage;
          plate.flash = .14;
          spawnParticle(shot.x, shot.y, boss.config.armorHot, 5, 65);
          remove = true;
          if (plate.hp <= 0) {
            plate.alive = false;
            score += 100;
            credits += 12;
            const plateAngle = boss.angle + index * sector;
            spawnParticle(boss.x + Math.cos(plateAngle) * 61, boss.y + Math.sin(plateAngle) * 61, boss.config.armorColor, 22, 165);
            shake = 7;
          }
        } else if (distance < boss.r + 5 && boss.armor.every((plateItem) => !plateItem.alive)) {
          boss.hp -= player.coreDamage;
          spawnParticle(shot.x, shot.y, '#83f7ff', 3, 55);
          score += 5;
          remove = true;
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

    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const shot = enemyShots[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x < -20 || shot.x > W + 20 || shot.y < -20 || shot.y > H + 20) {
        enemyShots.splice(i, 1);
        continue;
      }
      const distance = Math.hypot(shot.x - player.x, shot.y - player.y);
      if (distance < shot.r + player.r && player.invuln <= 0) {
        enemyShots.splice(i, 1);
        damagePlayer(boss.config.damage, player.x, player.y, '#ff638e');
        if (state !== 'playing') break;
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
    ctx.shadowBlur = exposed ? 30 : 16;
    ctx.shadowColor = exposed ? '#67e8f9' : cfg.glow;
    ctx.fillStyle = exposed ? '#153e55' : cfg.coreColor;
    ctx.strokeStyle = exposed ? '#8bf4ff' : cfg.armorHot;
    ctx.lineWidth = 3;

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
    } else {
      polygonPath(6, boss.r, boss.r * .82, Math.PI / 6);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (cfg.shape === 'eclipse') {
      ctx.fillStyle = '#070b1b';
      ctx.beginPath();
      ctx.arc(7, -3, boss.r * .66, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = exposed ? '#b1fcff' : '#bf9cff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, boss.r * .72, -.85, 2.35);
      ctx.stroke();
    } else {
      ctx.rotate(-boss.angle * .9 + gameTime * 1.8);
      ctx.fillStyle = exposed ? '#72f1ff' : cfg.armorColor;
      for (let i = 0; i < 3; i++) {
        ctx.rotate(TAU / 3);
        ctx.fillRect(-2, -boss.r * .62, 4, boss.r * .47);
      }
    }

    const pulse = 1 + Math.sin(gameTime * 5) * .08;
    ctx.beginPath();
    ctx.arc(0, 0, 10 * pulse, 0, TAU);
    ctx.fillStyle = exposed ? '#b5fbff' : cfg.armorHot;
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

    shots.forEach((shot) => {
      ctx.save();
      ctx.shadowBlur = 13;
      ctx.shadowColor = '#72f4ff';
      ctx.fillStyle = '#d9fcff';
      ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, TAU); ctx.fill();
      ctx.restore();
    });
    enemyShots.forEach((shot) => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = shot.color;
      ctx.fillStyle = shot.color;
      ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    });

    // El jugador tiene forma de pequeña nave/cursor.
    const aim = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(aim);
    ctx.globalAlpha = player.invuln > 0 && Math.floor(gameTime * 18) % 2 === 0 ? .32 : 1;
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
    ctx.fillText(`JEFE ${levelIndex + 1}/${BOSSES.length} // ${boss.config.name} // ${armorText}`, 18, 24);
    ctx.fillStyle = '#6b829f';
    ctx.fillText(`PUNTAJE ${String(Math.floor(score)).padStart(5, '0')}`, W - 128, 24);
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
  draw();
})();
