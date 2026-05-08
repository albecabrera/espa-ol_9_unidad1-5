/* ════════════════════════════════════════════════════
   ¿Quién es el Impostor? — script.js
   Vanilla JS · sin frameworks · sin dependencias externas
════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   1. VOCABULARIO
───────────────────────────────────────────────── */
const BUILT_IN_CATEGORIES = {
  '🍎 Comida': [
    'la manzana','el pan','el queso','el agua','el pollo',
    'la naranja','el tomate','el arroz','la leche','el huevo',
    'la sopa','el helado','la pizza','el chocolate','el café',
  ],
  '🎒 Escuela': [
    'la mochila','el lápiz','la mesa','el libro','el profesor',
    'la silla','la pizarra','el cuaderno','la goma','la regla',
    'el bolígrafo','el aula','el examen','la clase','los deberes',
  ],
  '🐾 Animales': [
    'el perro','el gato','el caballo','el pájaro','el pez',
    'el león','el elefante','la serpiente','el conejo','la tortuga',
    'el oso','el tigre','la jirafa','el cocodrilo','el pingüino',
  ],
  '⚽ Deportes': [
    'correr','nadar','jugar al fútbol','saltar','entrenar',
    'montar en bici','jugar al baloncesto','hacer yoga','boxear','esquiar',
    'hacer surf','jugar al tenis','nadar en el mar','correr una maratón','practicar atletismo',
  ],
  '👨‍👩‍👧 Familia': [
    'la madre','el padre','el hermano','la hermana','los abuelos',
    'el tío','la tía','el primo','la prima','los padres',
    'el hijo','la hija','el bebé','el abuelo','la abuela',
  ],
};

/* Palabras del impostor para modo Vokabel-Chaos (similares pero distintas) */
const CHAOS_ALTS = {
  '🍎 Comida':    ['la pera','el bocadillo','el yogur','el zumo','el pavo','la mantequilla','el jamón'],
  '🎒 Escuela':   ['la cartera','el rotulador','la silla','el cuaderno','el director','el recreo','el pasillo'],
  '🐾 Animales':  ['el lobo','el perrito','la yegua','la gallina','el delfín','el canguro','el búho'],
  '⚽ Deportes':  ['trotar','bucear','chutar','botar','practicar','pedalear','lanzar'],
  '👨‍👩‍👧 Familia':  ['la madrastra','el padrastro','el cuñado','la cuñada','los bisabuelos','el sobrino','la nuera'],
};

/* Preguntas de discusión */
const QUESTIONS = [
  '¿Cómo es?',
  '¿Dónde se encuentra?',
  '¿Qué color tiene?',
  '¿Qué haces con eso?',
  '¿Te gusta? ¿Por qué?',
  '¿Es grande o pequeño/a?',
  '¿Lo usas todos los días?',
  '¿Cuándo lo necesitas?',
  '¿Es importante para ti?',
  '¿Dónde lo puedes comprar?',
  '¿De qué material es?',
  '¿Lo hay en la escuela?',
  '¿Cómo huele o sabe?',
  '¿En qué situación lo usas?',
  '¿Lo puedes comer?',
  '¿Vive en la ciudad o en el campo?',
  '¿Es caro o barato?',
  '¿Lo hay en tu casa?',
];

/* Colores de astronautas */
const PLAYER_COLORS = [
  '#00d4ff','#ff3b5c','#a855f7','#00ff88',
  '#ff8c00','#ffd700','#ff69b4','#7fffd4',
  '#ff6347','#40e0d0',
];

/* ─────────────────────────────────────────────────
   2. ESTADO DEL JUEGO
───────────────────────────────────────────────── */
let game = {
  playerCount: 4,
  category: Object.keys(BUILT_IN_CATEGORIES)[0],
  mode: 'klassisch',      // 'klassisch' | 'schnell' | 'chaos'
  players: [],            // { name, color, colorIndex, score, isImpostor }
  impostorIndex: -1,
  secretWord: '',
  impostorWord: '',
  currentRevealIndex: 0,
  votes: {},              // { group: targetIndex }
  discussionTimer: null,
  discussionSeconds: 0,
  votingTimer: null,
};

let settings = { discussionTime: 180, voteTime: 30 };

/* ─────────────────────────────────────────────────
   3. UTILIDADES
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────────
   4. NAVEGACIÓN DE PANTALLAS
───────────────────────────────────────────────── */
function goTo(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $('screen-' + screenName);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────────────────────────────────────
   5. PANTALLA DE INICIO
───────────────────────────────────────────────── */
function buildCategoryButtons() {
  const grid = $('category-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const allCats = { ...BUILT_IN_CATEGORIES, ...getCustomCategories() };

  Object.keys(allCats).forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (name === game.category ? ' active' : '');
    btn.textContent = name;
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      game.category = name;
    };
    grid.appendChild(btn);
    if (i === 0 && !Object.keys(allCats).includes(game.category)) {
      game.category = name;
    }
  });
}

function adjustPlayers(delta) {
  game.playerCount = Math.max(4, Math.min(10, game.playerCount + delta));
  $('player-count-display').textContent = game.playerCount;
}

function selectMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  game.mode = btn.dataset.mode;
}

/* ─────────────────────────────────────────────────
   6. CONFIGURACIÓN DE JUGADORES
───────────────────────────────────────────────── */
function goToPlayerSetup() {
  $('player-setup-hint').textContent = game.playerCount + ' Spieler';
  const container = $('player-name-inputs');
  container.innerHTML = '';

  for (let i = 0; i < game.playerCount; i++) {
    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    const row = document.createElement('div');
    row.className = 'player-input-row';
    row.innerHTML = `
      <div class="player-input-blob" style="background:${color};border-radius:50% 50% 40% 40%"></div>
      <input type="text" maxlength="16" placeholder="Spieler ${i + 1}"
             id="pname-${i}" value="${escHtml(game.players[i]?.name || '')}"
             autocomplete="off" spellcheck="false">
    `;
    container.appendChild(row);
  }
  setTimeout(() => { const el = $('pname-0'); if (el) el.focus(); }, 80);
  goTo('player-setup');
}

/* ─────────────────────────────────────────────────
   7. INICIO DEL JUEGO — asignar roles y palabras
───────────────────────────────────────────────── */
function startGame() {
  // Leer nombres
  const players = [];
  for (let i = 0; i < game.playerCount; i++) {
    const el = $('pname-' + i);
    const name = el?.value.trim() || ('Spieler ' + (i + 1));
    players.push({
      name,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      colorIndex: i,
      score: 0,
      isImpostor: false,
    });
  }

  // Elegir impostor al azar
  const impIdx = Math.floor(Math.random() * players.length);
  players[impIdx].isImpostor = true;
  game.impostorIndex = impIdx;

  // Elegir palabras
  const allCats = { ...BUILT_IN_CATEGORIES, ...getCustomCategories() };
  const wordList = allCats[game.category] || BUILT_IN_CATEGORIES['🍎 Comida'];
  const words = shuffle(wordList);
  game.secretWord = words[0];

  if (game.mode === 'chaos') {
    const alts = (CHAOS_ALTS[game.category] || []).filter(w => w !== game.secretWord);
    game.impostorWord = alts.length ? pick(alts) : '???';
  } else {
    // Klassisch/Schnell: 40% palabra diferente, 60% "???"
    game.impostorWord = Math.random() < 0.4 && words[1] ? words[1] : '???';
  }

  game.players = players;
  game.currentRevealIndex = 0;
  game.votes = {};
  loadSettings();

  showPrivacyScreen(0);
}

/* ─────────────────────────────────────────────────
   8. FLUJO DE REVELACIÓN DE ROLES
───────────────────────────────────────────────── */
function showPrivacyScreen(index) {
  game.currentRevealIndex = index;
  const p = game.players[index];
  $('privacy-player-name').textContent = p.name + ' ist dran';
  goTo('role-privacy');
}

function showRole() {
  const idx = game.currentRevealIndex;
  const p = game.players[idx];
  const isImp = p.isImpostor;

  const card  = $('role-reveal-card');
  const badge = $('role-badge');
  const word  = $('role-word');
  const tip   = $('role-tip');

  card.className  = 'role-card glass ' + (isImp ? 'impostor-card' : 'tripulante-card');
  badge.className = 'role-badge ' + (isImp ? 'impostor' : 'tripulante');
  badge.textContent = isImp ? '🔴 IMPOSTOR' : '🔵 TRIPULANTE';
  word.textContent  = isImp ? game.impostorWord : game.secretWord;
  tip.textContent   = isImp
    ? '⚠️ Du bist der Impostor! Täusche die Gruppe — verhalte dich unauffällig!'
    : '✅ Beschreibe das Wort auf Spanisch, ohne es zu nennen. Finde den Impostor!';

  goTo('role-reveal');
  playSound('reveal');
}

function nextPlayer() {
  const next = game.currentRevealIndex + 1;
  if (next < game.players.length) {
    showPrivacyScreen(next);
  } else {
    startDiscussion();
  }
}

/* ─────────────────────────────────────────────────
   9. FASE DE DISCUSIÓN
───────────────────────────────────────────────── */
function startDiscussion() {
  // Render jugadores
  const grid = $('discussion-players');
  grid.innerHTML = '';
  game.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-disc-card';
    card.innerHTML = `
      <div class="player-disc-blob" style="background:${p.color}"></div>
      <div class="player-disc-name">${escHtml(p.name)}</div>
      <div class="player-disc-score">⭐ ${p.score} Punkte</div>
    `;
    grid.appendChild(card);
  });

  nextQuestion();

  const totalSecs = game.mode === 'schnell'
    ? Math.min(settings.discussionTime, 120)
    : settings.discussionTime;

  startDiscussionTimer(totalSecs);
  goTo('discussion');
  playSound('start');
}

function nextQuestion() {
  $('current-question').textContent = pick(QUESTIONS);
}

function startDiscussionTimer(totalSecs) {
  clearInterval(game.discussionTimer);
  game.discussionSeconds = totalSecs;
  const circumference = 2 * Math.PI * 43;

  function tick() {
    const pct = game.discussionSeconds / totalSecs;
    const circle = $('timer-circle');
    if (circle) {
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference * (1 - pct);
      circle.style.stroke = pct > 0.5 ? 'var(--cyan)' : pct > 0.25 ? 'var(--yellow)' : 'var(--red)';
    }
    const display = $('timer-display');
    if (display) display.textContent = fmtTime(game.discussionSeconds);

    if (game.discussionSeconds <= 0) {
      clearInterval(game.discussionTimer);
      showToast('⏱ Zeit abgelaufen! Abstimmung beginnt…');
      setTimeout(startVoting, 1500);
      return;
    }
    game.discussionSeconds--;
  }

  tick();
  game.discussionTimer = setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────
   10. FASE DE VOTACIÓN
───────────────────────────────────────────────── */
function startVoting() {
  clearInterval(game.discussionTimer);
  game.votes = {};

  const grid = $('voting-grid');
  grid.innerHTML = '';

  game.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'vote-card';
    card.id = 'vote-card-' + i;
    card.innerHTML = `
      <div class="vote-blob" style="background:${p.color}"></div>
      <div class="vote-name">${escHtml(p.name)}</div>
    `;
    card.onclick = () => castVote(i);
    grid.appendChild(card);
  });

  $('confirm-vote-btn').disabled = true;
  startVoteTimer();
  goTo('voting');
  playSound('emergency');
}

function castVote(targetIndex) {
  document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('voted'));
  const card = $('vote-card-' + targetIndex);
  if (card) { card.classList.add('voted'); }
  game.votes = { group: targetIndex };
  $('confirm-vote-btn').disabled = false;
  playSound('click');
}

function startVoteTimer() {
  clearInterval(game.votingTimer);
  let secs = settings.voteTime;
  const fill = $('vote-timer-fill');
  const txt  = $('vote-timer-display');

  function tick() {
    const pct = (secs / settings.voteTime) * 100;
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct > 50
        ? 'linear-gradient(90deg, var(--green), var(--cyan))'
        : pct > 25
          ? 'linear-gradient(90deg, var(--yellow), var(--orange))'
          : 'linear-gradient(90deg, var(--red), #ff6b6b)';
    }
    if (txt) txt.textContent = secs;
    if (secs <= 0) { clearInterval(game.votingTimer); confirmVotes(); return; }
    secs--;
  }
  tick();
  game.votingTimer = setInterval(tick, 1000);
}

function confirmVotes() {
  clearInterval(game.votingTimer);
  showResults(game.votes.group);
}

/* ─────────────────────────────────────────────────
   11. RESULTADOS
───────────────────────────────────────────────── */
function showResults(votedIndex) {
  const impostor  = game.players[game.impostorIndex];
  const crewWon   = (votedIndex === game.impostorIndex);

  // Puntos
  game.players.forEach(p => {
    if (crewWon) { if (!p.isImpostor) p.score += 10; }
    else         { if  (p.isImpostor) p.score += 20; }
  });

  // Hero
  const hero = $('result-hero');
  hero.className = 'result-hero ' + (crewWon ? 'crew' : 'impost');
  $('result-icon').textContent  = crewWon ? '🎉' : '😈';
  $('result-title').textContent = crewWon ? 'Die Crew gewinnt!' : 'El Impostor gewinnt!';
  $('result-sub').textContent   = crewWon
    ? `Ihr habt ${impostor.name} entlarvt! ¡Bien hecho, tripulación!`
    : `${impostor.name} hat die Gruppe erfolgreich getäuscht!`;

  // Revelación
  $('impostor-revealed-name').textContent = impostor.name;
  $('reveal-crew-word').textContent       = game.secretWord;
  $('reveal-impostor-word').textContent   = game.impostorWord;

  buildScoreboard(crewWon);
  goTo('results');
  playSound(crewWon ? 'win' : 'lose');
  if (crewWon) triggerConfetti();
}

function buildScoreboard(crewWon) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];

  let html = '<div class="scoreboard-title">📊 Punktestand</div>';
  sorted.forEach((p, rank) => {
    const delta = p.isImpostor
      ? (crewWon ? '+0' : '+20')
      : (crewWon ? '+10' : '+0');
    html += `
      <div class="score-row">
        <span class="score-rank">${medals[rank] || (rank + 1)}</span>
        <div class="score-blob-sm" style="background:${p.color}"></div>
        <span class="score-name">${escHtml(p.name)}</span>
        ${p.isImpostor ? '<span class="score-badge imp">IMPOSTOR</span>' : ''}
        <span class="score-delta">${delta}</span>
        <span class="score-pts">${p.score} ⭐</span>
      </div>`;
  });
  $('scoreboard').innerHTML = html;
}

function playAgain() {
  goToPlayerSetup();
}

/* ─────────────────────────────────────────────────
   12. LEHRER-EINSTELLUNGEN
───────────────────────────────────────────────── */
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('impostor-settings') || '{}');
    Object.assign(settings, saved);
  } catch(e) {}
  const d = $('setting-discussion-time');
  const v = $('setting-vote-time');
  if (d) d.value = settings.discussionTime;
  if (v) v.value = settings.voteTime;
}

function saveTimeSettings() {
  settings.discussionTime = parseInt($('setting-discussion-time')?.value) || 180;
  settings.voteTime       = parseInt($('setting-vote-time')?.value) || 30;
  localStorage.setItem('impostor-settings', JSON.stringify(settings));
  showToast('✅ Zeitlimits gespeichert!');
}

function getCustomCategories() {
  try { return JSON.parse(localStorage.getItem('impostor-custom-cats') || '{}'); }
  catch { return {}; }
}

function saveCustomCategory() {
  const nameEl  = $('new-category-name');
  const wordsEl = $('new-words');
  const name    = nameEl?.value.trim();
  const words   = (wordsEl?.value || '').split(',').map(w => w.trim()).filter(Boolean);

  if (!name)          { showToast('Bitte einen Kategorienamen eingeben.', true); return; }
  if (words.length < 3) { showToast('Mindestens 3 Wörter benötigt.', true); return; }

  const cats = getCustomCategories();
  cats[name] = words;
  localStorage.setItem('impostor-custom-cats', JSON.stringify(cats));
  if (nameEl)  nameEl.value  = '';
  if (wordsEl) wordsEl.value = '';
  renderCustomCategories();
  buildCategoryButtons();
  showToast(`✅ Kategorie "${name}" gespeichert!`);
}

function deleteCustomCategory(name) {
  const cats = getCustomCategories();
  delete cats[name];
  localStorage.setItem('impostor-custom-cats', JSON.stringify(cats));
  renderCustomCategories();
  buildCategoryButtons();
  showToast('🗑 Kategorie gelöscht.');
}

function renderCustomCategories() {
  const list = $('custom-categories-list');
  if (!list) return;
  const cats = getCustomCategories();
  const keys = Object.keys(cats);

  if (!keys.length) {
    list.innerHTML = '<p class="no-custom-cats">Noch keine eigenen Kategorien gespeichert.</p>';
    return;
  }
  list.innerHTML = keys.map(name => `
    <div class="custom-cat-item">
      <div>
        <span class="custom-cat-name">${escHtml(name)}</span>
        <span class="custom-cat-count"> — ${cats[name].length} Wörter</span>
      </div>
      <button class="custom-cat-delete"
              onclick="deleteCustomCategory(${JSON.stringify(escHtml(name))})">
        🗑 Löschen
      </button>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────
   13. EFECTOS DE SONIDO (Web Audio API — sin archivos)
───────────────────────────────────────────────── */
let audioCtx = null;

function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}

function tone(freq, dur, type = 'sine', vol = 0.15) {
  const ctx = getAudio();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playSound(type) {
  switch (type) {
    case 'click':
      tone(440, 0.08, 'square', 0.08);
      break;
    case 'start':
      tone(523, 0.15);
      setTimeout(() => tone(659, 0.2), 160);
      break;
    case 'reveal':
      tone(392, 0.12);
      setTimeout(() => tone(494, 0.18), 130);
      break;
    case 'emergency':
      tone(880, 0.3, 'sawtooth', 0.12);
      setTimeout(() => tone(660, 0.3, 'sawtooth', 0.1), 320);
      setTimeout(() => tone(880, 0.3, 'sawtooth', 0.12), 640);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25), i * 120));
      break;
    case 'lose':
      [330, 277, 220].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.1), i * 200));
      break;
  }
}

/* ─────────────────────────────────────────────────
   14. CONFETI (CSS puro — sin canvas)
───────────────────────────────────────────────── */
function triggerConfetti() {
  const colors = ['#00d4ff','#ff3b5c','#a855f7','#00ff88','#ffd700','#ff69b4'];

  // Inyectar keyframe una sola vez
  if (!document.getElementById('confetti-style')) {
    const s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = `
      @keyframes confettiFall {
        0%   { transform:translateY(0) rotate(0deg);       opacity:1; }
        80%  { opacity:1; }
        100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
      }`;
    document.head.appendChild(s);
  }

  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    const size = 6 + Math.random() * 8;
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:${size}px; height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      left:${5 + Math.random() * 90}vw; top:-20px;
      animation:confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

/* ─────────────────────────────────────────────────
   15. TOAST
───────────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, isError = false) {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────────
   16. INIT
───────────────────────────────────────────────── */
function init() {
  loadSettings();
  buildCategoryButtons();
  renderCustomCategories();

  // Enter submits en pantalla de nombres
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const active = document.querySelector('.screen.active');
    if (active?.id === 'screen-player-setup') startGame();
  });
}

document.addEventListener('DOMContentLoaded', init);
