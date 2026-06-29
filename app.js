/* ============================================================
   app.js — Roadmap Artístico Lírico · Entre Ríos
   Carga datos desde JSON y construye toda la interfaz
   ============================================================ */

const ROADMAP_URL  = 'data/roadmap.json';
const CIUDADES_URL = 'data/ciudades.json';

// ── Helpers ──────────────────────────────────────────────────

function getPriorityClass(p) {
  if (p === 1) return 'p1';
  if (p === 2) return 'p2';
  return 'p3';
}
function getPriorityLabel(p) {
  if (p === 1) return 'Prioridad 1';
  if (p === 2) return 'Prioridad 2';
  return 'Prioridad 3';
}
function getInstDotClass(tipo = '') {
  const t = tipo.toLowerCase();
  if (t.includes('teatro') || t.includes('auditorio')) return 'alta';
  if (t.includes('sociedad') || t.includes('colectividad')) return 'colectividad';
  if (t.includes('instituto') || t.includes('cultural') || t.includes('dante')) return 'cultural';
  if (t.includes('club')) return 'club';
  return 'default';
}
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Barra de potencial visual
function potentialBar(score) {
  const pct   = (score / 10) * 100;
  const color = score >= 9 ? 'var(--clr-verde)' : score >= 7 ? 'var(--clr-accent)' : 'var(--clr-naranja)';
  return `
    <div class="potencial-wrap" title="Potencial: ${score}/10">
      <div class="potencial-bar-bg">
        <div class="potencial-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="potencial-num" style="color:${color}">${score}<small>/10</small></span>
    </div>`;
}

function tipoIcon(tipo = '') {
  const map = {
    'Italianidad': '🇮🇹', 'Patrio': '🇦🇷', 'Religioso': '⛪',
    'Municipal': '🏛️', 'Fiesta Nacional': '🎪', 'Fiesta Provincial': '🎪',
    'Cultural': '🎭', 'Turístico': '🌿', 'Artístico': '🎶'
  };
  return map[tipo] || '📌';
}

// ── Hero stats ────────────────────────────────────────────────

function buildHeroStats(roadmap, ciudadesData) {
  const totalCiudades = ciudadesData.ciudades.length;
  const p1            = ciudadesData.ciudades.filter(c => c.prioridad === 1).length;
  const totalInst     = ciudadesData.ciudades.reduce((acc, c) => {
    const cat = c.categorias || {};
    return acc +
      (cat.colectividades?.length || 0) +
      (cat.municipios?.length || 0) +
      (cat.iglesias?.length || 0) +
      (cat.espaciosCulturales?.length || 0);
  }, 0);

  document.getElementById('hero-stats').innerHTML = `
    <div class="hero-stat fade-in fade-in-delay-1">
      <div class="hero-stat-num">${totalCiudades}</div>
      <div class="hero-stat-label">Ciudades</div>
    </div>
    <div class="hero-stat fade-in fade-in-delay-2">
      <div class="hero-stat-num">${p1}</div>
      <div class="hero-stat-label">Prioridad 1</div>
    </div>
    <div class="hero-stat fade-in fade-in-delay-3">
      <div class="hero-stat-num">${totalInst}</div>
      <div class="hero-stat-label">Instituciones</div>
    </div>
    <div class="hero-stat fade-in fade-in-delay-3">
      <div class="hero-stat-num">${roadmap.objetivo.eventosMinimosAnuales}+</div>
      <div class="hero-stat-label">Eventos / Año</div>
    </div>`;
}

// ── Ciudades (cards con instituciones del roadmap) ────────────

function buildCiudades(roadmap) {
  const container = document.getElementById('ciudades-grid');
  const potencial = roadmap.potencial || {};

  const sorted = [...roadmap.localidades].sort((a, b) => {
    if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
    return (potencial[b.nombre] || 0) - (potencial[a.nombre] || 0);
  });

  container.innerHTML = sorted.map(ciudad => {
    const pClass = getPriorityClass(ciudad.prioridad);
    const pLabel = getPriorityLabel(ciudad.prioridad);
    const score  = potencial[ciudad.nombre];
    const nivelABadge = ciudad.nivelA ? `<span class="nivel-a-badge">⭐ Nivel A</span>` : '';

    const instituciones = (ciudad.instituciones || []).map(inst => `
      <li class="inst-item">
        <span class="inst-dot ${getInstDotClass(inst.tipo)}"></span>
        <div class="inst-info">
          <div class="inst-nombre">${escapeHtml(inst.nombre)}</div>
          <div class="inst-meta">
            <span class="inst-tipo">${escapeHtml(inst.tipo)}</span>
            ${inst.telefono ? `<span class="inst-tel">📞 ${escapeHtml(inst.telefono)}</span>` : ''}
          </div>
          ${inst.descripcion ? `<div class="inst-desc-mini">${escapeHtml(inst.descripcion)}</div>` : ''}
          ${inst.oportunidades?.length ? `
            <div class="inst-oportunidades">
              ${inst.oportunidades.map(o => `<span class="oport-tag">${escapeHtml(o)}</span>`).join('')}
            </div>` : ''}
        </div>
      </li>`).join('');

    const eventos = (ciudad.eventosClave || []).map(ev => `
      <div class="evento-pill">
        <span>${escapeHtml(ev.nombre)}</span>
        <span class="evento-mes">${escapeHtml(ev.mes)}</span>
      </div>`).join('');

    return `
      <div class="ciudad-card fade-in">
        <div class="ciudad-card-header">
          <div>
            <h3>${escapeHtml(ciudad.nombre)}</h3>
            ${nivelABadge}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <span class="priority-badge ${pClass}">${pLabel}</span>
            ${score !== undefined ? potentialBar(score) : ''}
          </div>
        </div>
        ${ciudad.destacado ? `<div class="ciudad-destacado">${ciudad.destacado}</div>` : ''}
        ${ciudad.descripcion ? `<p class="ciudad-desc">${escapeHtml(ciudad.descripcion)}</p>` : ''}
        <ul class="instituciones-list">${instituciones}</ul>
        ${eventos ? `<div class="ciudad-eventos">
          <h4>Eventos Clave</h4>${eventos}
        </div>` : ''}
      </div>`;
  }).join('');
}

// ── Calendario estacional ─────────────────────────────────────

function buildCalendario(data) {
  document.getElementById('calendario-grid').innerHTML =
    (data.calendarioAnual || []).map(est => `
      <div class="estacion-card">
        <div class="estacion-header">
          <span class="estacion-icon">${est.icono || '📅'}</span>
          <div>
            <div class="estacion-nombre">${escapeHtml(est.estacion)}</div>
            <div class="estacion-meses">${escapeHtml(est.meses)}</div>
          </div>
        </div>
        <div class="estacion-section">
          <h4>Acciones</h4>
          <ul>${(est.acciones || []).map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
        </div>
        <div class="estacion-section">
          <h4>Eventos</h4>
          <ul>${(est.eventos || []).map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
        </div>
      </div>`).join('');
}

// ── Calendario oculto (mensual) ───────────────────────────────

function buildCalendarioOculto(data) {
  const container = document.getElementById('timeline');
  if (!container || !data.calendarioOculto) return;
  container.innerHTML = data.calendarioOculto.map(mes => {
    const evItems = (mes.eventos || []).map(ev => `
      <div class="cal-oculto-ev">
        <span class="cal-ev-icon">${tipoIcon(ev.tipo)}</span>
        <span class="cal-ev-nombre">${escapeHtml(ev.nombre)}</span>
        ${ev.ciudad ? `<span class="cal-ev-ciudad">${escapeHtml(ev.ciudad)}</span>` : ''}
        <span class="cal-ev-tipo">${escapeHtml(ev.tipo)}</span>
      </div>`).join('');
    return `
      <div class="cal-oculto-item">
        <div class="cal-oculto-mes">${escapeHtml(mes.mes)}</div>
        <div class="cal-oculto-estacion">${escapeHtml(mes.estacion)}</div>
        <div class="cal-oculto-eventos">${evItems}</div>
      </div>`;
  }).join('');
}

// ── Mercados alternativos ─────────────────────────────────────

function buildMercados(data) {
  document.getElementById('mercados-grid').innerHTML =
    (data.mercadosAlternativos || []).map(m => {
      const eventos   = (m.eventos || []).map(e => `<span class="mercado-ev-tag">${escapeHtml(e.nombre)} <em>${escapeHtml(e.mes || '')}</em></span>`).join('');
      const contactos = (m.contactos || []).map(c => `<span class="mercado-tag">${escapeHtml(c)}</span>`).join('');
      const rep       = (m.repertorioIdeal || []).map(r => `<span class="mercado-tag">♪ ${escapeHtml(r)}</span>`).join('');
      return `
        <div class="mercado-card">
          <div class="mercado-icono">${m.icono || '📌'}</div>
          <div class="mercado-tipo">${escapeHtml(m.tipo)}</div>
          <p class="mercado-desc">${escapeHtml(m.descripcion)}</p>
          ${m.rentabilidad ? `<div class="rentabilidad-badge">💰 Rentabilidad: ${escapeHtml(m.rentabilidad)}</div>` : ''}
          ${contactos ? `<div class="mercado-section"><h4>Contactar</h4><div class="mercado-tags">${contactos}</div></div>` : ''}
          ${eventos ? `<div class="mercado-section"><h4>Eventos</h4><div class="mercado-tags">${eventos}</div></div>` : ''}
          ${rep ? `<div class="mercado-section"><h4>Repertorio Ideal</h4><div class="mercado-tags">${rep}</div></div>` : ''}
        </div>`;
    }).join('');
}

// ── Repertorio ────────────────────────────────────────────────

function buildRepertorio(data) {
  const LABELS = {
    italiano:   '🇮🇹 Música Italiana',
    lirico:     '🎭 Repertorio Lírico',
    sacro:      '⛪ Música Sacra',
    patriotico: '🇦🇷 Música Patriótica'
  };
  document.getElementById('repertorio-grid').innerHTML =
    Object.entries(data.repertorio || {}).map(([key, items]) => `
      <div class="rep-card">
        <div class="rep-categoria">${LABELS[key] || key}</div>
        <ul class="rep-list">
          ${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
        </ul>
      </div>`).join('');
}

// ── Directorio de Contactos ───────────────────────────────────

const CAT_CONFIG = {
  colectividades:   { label: 'Colectividades',    icon: '🇮🇹', dotClass: 'colectividad' },
  municipios:       { label: 'Municipios',         icon: '🏛️', dotClass: 'default' },
  iglesias:         { label: 'Iglesias',           icon: '⛪',  dotClass: 'default' },
  espaciosCulturales: { label: 'Espacios Culturales', icon: '🎭', dotClass: 'alta' }
};

let allCiudadesData   = [];
let activeCity        = null;   // null = todas

function buildDirectorio(ciudadesData) {
  allCiudadesData = ciudadesData.ciudades;

  // Chips de ciudades
  const chipsContainer = document.getElementById('cf-ciudades');
  chipsContainer.innerHTML =
    `<button class="city-chip active" data-ciudad="">Todas</button>` +
    allCiudadesData.map(c =>
      `<button class="city-chip" data-ciudad="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</button>`
    ).join('');

  chipsContainer.addEventListener('click', e => {
    const btn = e.target.closest('.city-chip');
    if (!btn) return;
    chipsContainer.querySelectorAll('.city-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCity = btn.dataset.ciudad || null;
    renderDirectorio();
  });

  renderDirectorio();
}

function renderDirectorio() {
  const container = document.getElementById('directorio-grid');
  const ciudades = activeCity
    ? allCiudadesData.filter(c => c.nombre === activeCity)
    : allCiudadesData;

  container.innerHTML = ciudades.map(ciudad => {
    const cat  = ciudad.categorias || {};
    const cats = Object.entries(CAT_CONFIG)
      .filter(([key]) => cat[key]?.length)
      .map(([key, cfg]) => {
        const items = cat[key];
        const itemsHtml = items.map(item => buildContactItem(item, key)).join('');
        return `
          <div class="dir-cat">
            <div class="dir-cat-header">
              <span class="dir-cat-icon">${cfg.icon}</span>
              <span class="dir-cat-label">${cfg.label}</span>
              <span class="dir-cat-count">${items.length}</span>
            </div>
            <div class="dir-cat-items">${itemsHtml}</div>
          </div>`;
      }).join('');

    const pClass = getPriorityClass(ciudad.prioridad);
    return `
      <div class="dir-ciudad" id="dir-${ciudad.nombre.replace(/\s+/g, '-').toLowerCase()}">
        <div class="dir-ciudad-header">
          <h3 class="dir-ciudad-nombre">${escapeHtml(ciudad.nombre)}</h3>
          ${ciudad.destacado ? `<span class="dir-destacado">${ciudad.destacado}</span>` : ''}
          <span class="priority-badge ${pClass} dir-badge">${getPriorityLabel(ciudad.prioridad)}</span>
        </div>
        <div class="dir-cats-grid">${cats}</div>
      </div>`;
  }).join('');
}

function buildContactItem(item, catKey) {
  const cfg = CAT_CONFIG[catKey] || { dotClass: 'default' };

  // Para municipios mostramos las áreas de interés
  if (catKey === 'municipios') {
    const areas = (item.areasInteres || []).map(a =>
      `<span class="oport-tag">${escapeHtml(a)}</span>`).join('');
    return `
      <div class="dir-item">
        <span class="inst-dot ${cfg.dotClass}"></span>
        <div class="dir-item-body">
          <div class="dir-item-nombre">${escapeHtml(item.organismo)}</div>
          ${areas ? `<div class="dir-item-areas">${areas}</div>` : ''}
        </div>
      </div>`;
  }

  // Para iglesias
  if (catKey === 'iglesias') {
    return `
      <div class="dir-item">
        <span class="inst-dot ${cfg.dotClass}"></span>
        <div class="dir-item-body">
          <div class="dir-item-nombre">${escapeHtml(item.nombre)}</div>
        </div>
      </div>`;
  }

  // Colectividades y espacios culturales
  const hasTel  = !!item.telefono;
  const hasDirs = !!item.direccion;
  const hasWeb  = !!item.sitioWeb;
  const hasNota = !!item.notas;

  return `
    <div class="dir-item">
      <span class="inst-dot ${getInstDotClass(item.tipo || '')}"></span>
      <div class="dir-item-body">
        <div class="dir-item-nombre">${escapeHtml(item.nombre)}</div>
        ${item.tipo ? `<div class="dir-item-tipo">${escapeHtml(item.tipo)}</div>` : ''}
        <div class="dir-item-datos">
          ${hasDirs ? `<span class="dir-dato dir-dir">📍 ${escapeHtml(item.direccion)}</span>` : ''}
          ${hasTel  ? `<span class="dir-dato dir-tel">📞 ${escapeHtml(item.telefono)}</span>` : ''}
          ${hasWeb  ? `<a class="dir-dato dir-web" href="${escapeHtml(item.sitioWeb)}" target="_blank" rel="noopener">🌐 sitio web</a>` : ''}
        </div>
        ${hasNota ? `<div class="dir-item-nota">${escapeHtml(item.notas)}</div>` : ''}
        ${item.eventosRelacionados?.length ? `
          <div class="inst-oportunidades">
            ${item.eventosRelacionados.map(e => `<span class="oport-tag">${escapeHtml(e)}</span>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
}

// ── Nav scroll effect ─────────────────────────────────────────

function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(15,17,23,.97)'
      : 'rgba(15,17,23,.85)';
  }, { passive: true });
}

// ── Footer ────────────────────────────────────────────────────

function setFooterFecha() {
  const el = document.getElementById('footer-fecha');
  if (el) el.textContent = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Intersection Observer ─────────────────────────────────────

function initFadeObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.06 });

  document.querySelectorAll('.ciudad-card, .estacion-card, .mercado-card, .rep-card, .dir-ciudad').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .45s ease, transform .45s ease';
    observer.observe(el);
  });
}

// ── Bootstrap ─────────────────────────────────────────────────

async function init() {
  try {
    const [roadmapRes, ciudadesRes] = await Promise.all([
      fetch(ROADMAP_URL),
      fetch(CIUDADES_URL)
    ]);
    const [roadmap, ciudadesData] = await Promise.all([
      roadmapRes.json(),
      ciudadesRes.json()
    ]);

    buildHeroStats(roadmap, ciudadesData);
    buildCiudades(roadmap);
    buildCalendario(roadmap);
    buildCalendarioOculto(roadmap);
    buildMercados(roadmap);
    buildRepertorio(roadmap);
    buildDirectorio(ciudadesData);
    setFooterFecha();
    initNav();
    setTimeout(initFadeObserver, 150);

  } catch (err) {
    console.error('Error cargando datos:', err);
    document.body.innerHTML = `
      <div style="display:grid;place-items:center;height:100vh;font-family:system-ui;color:#e8ecf4;background:#0f1117">
        <div style="text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
          <h2>Error cargando datos</h2>
          <p style="color:#8896b0;margin-top:.5rem">Abrí el archivo desde un servidor local (ej: Live Server en VS Code)</p>
          <code style="display:block;margin-top:1rem;color:#c9a84c;font-size:.85rem">${err.message}</code>
        </div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
