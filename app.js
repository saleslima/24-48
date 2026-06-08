(() => {
  'use strict';

  const STORAGE_KEY = 'escala_24x48_premium_config_v2';
  const INSTALL_DISMISSED_KEY = 'escala_24x48_install_dismissed_v1';
  const teams = ['A', 'B', 'C'];
  const config = loadConfig();
  const baseDate = toDate(config.baseDate);
  const baseTeamIndex = teams.includes(config.baseTeam) ? teams.indexOf(config.baseTeam) : 0;

  const monthTitle = document.getElementById('monthTitle');
  const todayLabel = document.getElementById('todayLabel');
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarViewport = document.getElementById('calendarViewport');
  const prevButton = document.getElementById('prevMonth');
  const nextButton = document.getElementById('nextMonth');
  const installBanner = document.getElementById('installBanner');
  const installButton = document.getElementById('installButton');
  const dismissInstall = document.getElementById('dismissInstall');
  const installTitle = document.getElementById('installTitle');
  const installDescription = document.getElementById('installDescription');
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleText = document.getElementById('themeToggleText');
  const themeIcon = document.querySelector('.theme-toggle-icon');
  const themeColorMeta = document.getElementById('themeColorMeta');
  const teamHelp = document.getElementById('teamHelp');
  const teamButtons = Array.from(document.querySelectorAll('.team-toggle'));
  const legendItems = Array.from(document.querySelectorAll('.legend-item'));

  const today = startOfDay(new Date());
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedTeams = normalizeSelectedTeams(config.selectedTeams);
  let activeTheme = normalizeTheme(config.theme);
  let deferredPrompt = null;
  let touchStartX = 0;
  let touchStartY = 0;

  init();

  function init() {
    applyTheme(activeTheme);
    syncTeamButtons();
    renderCalendar(currentMonth);
    registerEvents();
    registerServiceWorker();
    showInstallHint();
  }

  function loadConfig() {
    const fallback = {
      baseDate: '2026-06-02',
      baseTeam: 'B',
      teamOrder: 'A-B-C',
      selectedTeams: ['A', 'B', 'C'],
      theme: getPreferredTheme(),
      updatedAt: new Date().toISOString()
    };

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const legacy = JSON.parse(localStorage.getItem('escala_24x48_premium_config_v1')) || {};
      const merged = { ...fallback, ...legacy, ...stored };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (_) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  function saveConfig(partial) {
    const next = { ...config, ...partial, updatedAt: new Date().toISOString() };
    Object.assign(config, next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function registerEvents() {
    prevButton.addEventListener('click', () => changeMonth(-1));
    nextButton.addEventListener('click', () => changeMonth(1));

    teamButtons.forEach((button) => {
      button.addEventListener('click', () => toggleTeam(button.dataset.team));
    });

    themeToggle.addEventListener('click', () => {
      activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
      saveConfig({ theme: activeTheme });
      applyTheme(activeTheme);
    });

    calendarViewport.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    calendarViewport.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
        changeMonth(deltaX < 0 ? 1 : -1);
      }
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') changeMonth(-1);
      if (event.key === 'ArrowRight') changeMonth(1);
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      showInstallHint(true);
    });

    window.addEventListener('appinstalled', () => {
      hideInstallHint();
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    });

    installButton.addEventListener('click', handleInstallClick);

    dismissInstall.addEventListener('click', () => {
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
      hideInstallHint();
    });
  }

  function toggleTeam(team) {
    if (!teams.includes(team)) return;

    const isSelected = selectedTeams.includes(team);
    if (isSelected && selectedTeams.length === 1) {
      flashTeamHelp('Mantenha pelo menos uma equipe selecionada.');
      return;
    }

    selectedTeams = isSelected
      ? selectedTeams.filter((item) => item !== team)
      : [...selectedTeams, team].sort((a, b) => teams.indexOf(a) - teams.indexOf(b));

    selectedTeams = normalizeSelectedTeams(selectedTeams);
    saveConfig({ selectedTeams });
    syncTeamButtons();
    renderCalendar(currentMonth);
  }

  function syncTeamButtons() {
    teamButtons.forEach((button) => {
      const team = button.dataset.team;
      const selected = selectedTeams.includes(team);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    legendItems.forEach((item) => {
      const team = item.classList.contains('team-a') ? 'A' : item.classList.contains('team-b') ? 'B' : 'C';
      item.style.opacity = selectedTeams.includes(team) ? '1' : '0.42';
    });

    teamHelp.textContent = `Selecionadas: ${selectedTeams.map((team) => `Equipe ${team}`).join(', ')}.`;
    teamHelp.classList.remove('warn');
  }

  function flashTeamHelp(message) {
    teamHelp.textContent = message;
    teamHelp.classList.add('warn');
    setTimeout(syncTeamButtons, 1800);
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    themeToggleText.textContent = theme === 'light' ? 'Modo claro' : 'Modo escuro';
    themeIcon.textContent = theme === 'light' ? '☀' : '☾';
    themeColorMeta.setAttribute('content', theme === 'light' ? '#f4c74c' : '#050505');
  }

  function changeMonth(direction) {
    const slideClass = direction > 0 ? 'slide-left' : 'slide-right';
    calendarGrid.classList.add(slideClass);

    window.setTimeout(() => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
      renderCalendar(currentMonth);
      calendarGrid.classList.remove(slideClass);
      calendarGrid.animate(
        [
          { opacity: 0, transform: `translateX(${direction > 0 ? '18px' : '-18px'})` },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        { duration: 230, easing: 'cubic-bezier(.2,.7,.2,1)' }
      );
    }, 140);
  }

  function renderCalendar(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const gridStart = new Date(year, month, 1 - firstDay.getDay());
    const holidaysByDate = getHolidayMap(year);
    if (month === 11) mergeHolidayMap(holidaysByDate, getHolidayMap(year + 1));
    if (month === 0) mergeHolidayMap(holidaysByDate, getHolidayMap(year - 1));

    const paymentDate = getFifthBusinessDay(year, month, holidaysByDate);
    const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthTitle.textContent = capitalize(monthName);
    todayLabel.textContent = `Hoje: ${today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    calendarGrid.innerHTML = '';

    const totalCells = Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7) * 7;
    const cells = Math.max(35, totalCells);

    for (let index = 0; index < cells; index += 1) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const iso = formatISO(date);
      const team = getTeamForDate(date);
      const holiday = holidaysByDate.get(iso);
      const isOutside = date.getMonth() !== month;
      const isToday = sameDate(date, today);
      const isPayday = paymentDate && sameDate(date, paymentDate);
      const isSelectedTeam = selectedTeams.includes(team);

      const cell = document.createElement('article');
      cell.className = [
        'day-cell',
        `team-${team.toLowerCase()}-day`,
        isSelectedTeam ? 'filtered-in' : 'filtered-out',
        isOutside ? 'outside' : '',
        isToday ? 'today' : '',
        holiday ? 'holiday' : '',
        isPayday ? 'payday' : ''
      ].filter(Boolean).join(' ');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', buildAriaLabel(date, team, holiday, isPayday, isToday, isSelectedTeam));

      const row = document.createElement('div');
      row.className = 'day-number-row';

      const dayNumber = document.createElement('span');
      dayNumber.className = 'day-number';
      dayNumber.textContent = date.getDate();
      row.appendChild(dayNumber);

      const badges = document.createElement('div');
      badges.className = 'badges';

      if (holiday) {
        const holidayIcon = document.createElement('span');
        holidayIcon.className = 'badge-icon holiday-icon';
        holidayIcon.title = holiday.name;
        holidayIcon.textContent = '✦';
        badges.appendChild(holidayIcon);
      }

      if (isPayday) {
        const moneyIcon = document.createElement('span');
        moneyIcon.className = 'badge-icon money-icon';
        moneyIcon.title = 'Quinto dia útil - pagamento';
        moneyIcon.textContent = '💰';
        badges.appendChild(moneyIcon);
      }

      row.appendChild(badges);
      cell.appendChild(row);

      const pill = document.createElement('div');
      pill.className = `team-pill team-${team.toLowerCase()}`;
      pill.innerHTML = `<span>Equipe</span><strong>${team}</strong>`;
      cell.appendChild(pill);

      if (holiday && !isOutside) {
        const holidayName = document.createElement('div');
        holidayName.className = 'holiday-name';
        holidayName.textContent = holiday.name;
        cell.appendChild(holidayName);
      }

      calendarGrid.appendChild(cell);
    }
  }

  function buildAriaLabel(date, team, holiday, isPayday, isToday, isSelectedTeam) {
    const parts = [date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })];
    if (isToday) parts.push('dia atual');
    parts.push(`equipe ${team}`);
    parts.push(isSelectedTeam ? 'equipe selecionada' : 'equipe não selecionada no filtro');
    if (holiday) parts.push(`feriado: ${holiday.name}`);
    if (isPayday) parts.push('quinto dia útil, pagamento');
    return parts.join(', ');
  }

  function getTeamForDate(date) {
    const diff = daysBetween(baseDate, startOfDay(date));
    const index = mod(baseTeamIndex + diff, teams.length);
    return teams[index];
  }

  function getFifthBusinessDay(year, month, holidaysByDate) {
    let businessDays = 0;
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const iso = formatISO(date);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaysByDate.has(iso);

      if (!isWeekend && !isHoliday) {
        businessDays += 1;
        if (businessDays === 5) return date;
      }
    }

    return null;
  }

  function getHolidayMap(year) {
    const map = new Map();
    const add = (month, day, name, type = 'national') => {
      map.set(`${year}-${pad(month)}-${pad(day)}`, { name, type });
    };
    const addDate = (date, name, type = 'national') => {
      map.set(formatISO(date), { name, type });
    };

    const easter = getEasterDate(year);

    add(1, 1, 'Confraternização Universal');
    addDate(addDays(easter, -48), 'Carnaval');
    addDate(addDays(easter, -47), 'Carnaval');
    addDate(addDays(easter, -2), 'Sexta-feira Santa');
    addDate(easter, 'Páscoa');
    add(4, 21, 'Tiradentes');
    add(5, 1, 'Dia do Trabalho');
    addDate(addDays(easter, 60), 'Corpus Christi');
    add(7, 9, 'Revolução Constitucionalista - SP', 'state');
    add(9, 7, 'Independência do Brasil');
    add(10, 12, 'Nossa Senhora Aparecida');
    add(11, 2, 'Finados');
    add(11, 15, 'Proclamação da República');
    add(11, 20, 'Dia Nacional de Zumbi e da Consciência Negra');
    add(12, 25, 'Natal');

    return map;
  }

  function mergeHolidayMap(target, source) {
    source.forEach((value, key) => target.set(key, value));
  }

  function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 100 % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, easterMonth - 1, day);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => undefined);
      });
    }
  }

  function showInstallHint(force = false) {
    const standalone = isStandaloneMode();
    if (standalone || !installBanner) return;
    if (!force && localStorage.getItem(INSTALL_DISMISSED_KEY) === '1') return;

    const platform = detectPlatform();
    if (platform === 'ios') {
      installTitle.textContent = 'Instalar no iPhone/iPad';
      installDescription.textContent = 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.';
      installButton.textContent = 'Ver dica';
    } else if (platform === 'android') {
      installTitle.textContent = 'Instalar no Android';
      installDescription.textContent = deferredPrompt
        ? 'Toque em Instalar para adicionar o app à tela inicial.'
        : 'No Chrome, abra o menu ⋮ e escolha Instalar app ou Adicionar à tela inicial.';
      installButton.textContent = deferredPrompt ? 'Instalar' : 'Ver dica';
    } else {
      installTitle.textContent = 'Instalar calendário';
      installDescription.textContent = 'Use a opção de instalação do navegador para abrir em tela cheia e offline.';
      installButton.textContent = deferredPrompt ? 'Instalar' : 'Ver dica';
    }

    installBanner.hidden = false;
    requestAnimationFrame(() => installBanner.classList.add('show'));
  }

  function hideInstallHint() {
    if (!installBanner) return;
    installBanner.classList.remove('show');
    window.setTimeout(() => {
      installBanner.hidden = true;
    }, 230);
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideInstallHint();
      return;
    }

    const platform = detectPlatform();
    if (platform === 'ios') {
      installDescription.textContent = 'Safari: toque no botão Compartilhar, role as opções e escolha Adicionar à Tela de Início.';
    } else if (platform === 'android') {
      installDescription.textContent = 'Chrome/Edge: abra o menu ⋮ e escolha Instalar app ou Adicionar à tela inicial.';
    } else {
      installDescription.textContent = 'Procure o ícone de instalação na barra do navegador ou use o menu do navegador.';
    }
  }

  function detectPlatform() {
    const userAgent = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
    if (isIOS) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    return 'desktop';
  }

  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function normalizeSelectedTeams(value) {
    const list = Array.isArray(value) ? value : String(value || '').split(/[,-]/);
    const unique = list
      .map((team) => String(team).trim().toUpperCase())
      .filter((team, index, array) => teams.includes(team) && array.indexOf(team) === index)
      .sort((a, b) => teams.indexOf(a) - teams.indexOf(b));
    return unique.length ? unique.slice(0, 3) : ['A', 'B', 'C'];
  }

  function normalizeTheme(theme) {
    return theme === 'light' || theme === 'dark' ? theme : getPreferredTheme();
  }

  function getPreferredTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function toDate(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function daysBetween(a, b) {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / 86400000);
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function mod(number, divisor) {
    return ((number % divisor) + divisor) % divisor;
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
})();
