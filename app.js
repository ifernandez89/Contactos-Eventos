/* ============================================================
   app.js — Roadmap Artístico Lírico · Entre Ríos
   Carga datos desde JSON y construye toda la interfaz
   ============================================================ */

const ROADMAP_URL   = 'data/roadmap.json';
const SEGUIM_URL    = 'data/seguimientos.json';

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
  if (t.includes('teatro'))     return 'alta';
  if (t.includes('colectividad')) return 'colectividad';
  if (t.includes('instituto') || t.includes('cultural')) return 'cultural';
  if (t.includes('club'))       return 'club';
  if (t.includes('municipal'))  return 'default';
  return 'default';
}
function getEstadoBadgeClass(estado = '') {
  const e = estado.toLowerCase();
  if (e.includes('alta'))       return 'estado-alta';
  if (e.includes('contactado')) return 'estado-contactado';
  if (e.includes('confirmado')) return 'estado-confirmado';
  return 'estado-pendiente';
}
function formatFecha(f) {
  if (!f) return '<span class="td-fecha vacio">—</span>';
  return `<span class="td-fecha">${f}</span>`;
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
  const pct = (score / 10) * 100;
  const color = score >= 9 ? 'var(--clr-verde)' : score >= 7 ? 'var(--clr-accent)' : 'var(--clr-naranja)';
  return `
    <div class="potencial-wrap" title="Potencial: ${score}/10">
      <div class="potencial-bar-bg">
        <div class="potencial-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="potencial-num" style="color:${color}">${score}<small>/10</small></span>
    </div>`;
}

// Icono de tipo de evento para el calendario oculto
function tipoIcon(tipo = '') {
  const map = {
    'Italianidad': '🇮🇹',
    'Patrio': '🇦🇷',
    'Religioso': '⛪',
    'Municipal': '🏛️',
    'Fiesta Nacional': '🎪',
    'Fiesta Provincial': '🎪',
    'Cultural': '🎭',
    'Turístico': '🌿',
    'Artístico': '🎶'
  };
  return map[tipo] || '📌';
}

// ── Hero stats ────────────────────────────────────────────────

function buildHeroStats(data) {
  const totalCiudades    = data.localidades.length;
  const p1               = data.localidades.filter(c => c.prioridad === 1).length;
  const totalInst        = data.localidades.reduce((a, c) => a + (c.instituciones?.length || 0), 0);
  const totalEventos     = data.objetivo.eventosMinimosAnuales;
  const container        = document.getElementById('hero-stats');
  container.innerHTML = `
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
      <div class="hero-stat-num">${totalEventos}+</div>
      <div class="hero-stat-label">Eventos / Año</div>
    </div>`;
}

// ── Ciudades ──────────────────────────────────────────────────

function buildCiudades(data) {
  const container = document.getElementById('ciudades-grid');
  const potencial = data.potencial || {};

  // Ordena: prioridad primero, luego potencial
  const sorted = [...data.localidades].sort((a, b) => {
    if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
    const pa = potencial[a.nombre] || 0;
    const pb = potencial[b.nombre] || 0;
    return pb - pa;
  });

  container.innerHTML = sorted.map(ciudad => {
    const pClass = getPriorityClass(ciudad.prioridad);
    const pLabel = getPriorityLabel(ciudad.prioridad);
    const score  = potencial[ciudad.nombre];
    const nivelABadge = ciudad.nivelA
      ? `<span class="nivel-a-badge">⭐ Nivel A</span>` : '';

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
          <h4>Eventos Clave</h4>
          ${eventos}
        </div>` : ''}
      </div>`;
  }).join('');
}

// ── Calendario estacional ─────────────────────────────────────

function buildCalendario(data) {
  const container = document.getElementById('calendario-grid');
  container.innerHTML = (data.calendarioAnual || []).map(est => `
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
  const container = document.getElementById('mercados-grid');
  container.innerHTML = (data.mercadosAlternativos || []).map(m => {
    const eventos = (m.eventos || []).map(e =>
      `<span class="mercado-ev-tag">${escapeHtml(e.nombre)} <em>${escapeHtml(e.mes || '')}</em></span>`
    ).join('');
    const contactos = (m.contactos || []).map(c =>
      `<span class="mercado-tag">${escapeHtml(c)}</span>`
    ).join('');
    const rep = (m.repertorioIdeal || []).map(r =>
      `<span class="mercado-tag">♪ ${escapeHtml(r)}</span>`
    ).join('');

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
  const container = document.getElementById('repertorio-grid');
  const rep = data.repertorio || {};
  const LABELS = {
    italiano:   '🇮🇹 Música Italiana',
    lirico:     '🎭 Repertorio Lírico',
    sacro:      '⛪ Música Sacra',
    patriotico: '🇦🇷 Música Patriótica'
  };
  container.innerHTML = Object.entries(rep).map(([key, items]) => `
    <div class="rep-card">
      <div class="rep-categoria">${LABELS[key] || key}</div>
      <ul class="rep-list">
        ${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
      </ul>
    </div>`).join('');
}

// ── Seguimientos ──────────────────────────────────────────────

let allSeguimientos = [];

function buildSeguimientos(seguimientos, roadmap) {
  allSeguimientos = seguimientos;

  // Poblar filtro de ciudades
  const ciudadSel = document.getElementById('filter-ciudad');
  const ciudades  = [...new Set(seguimientos.map(s => s.ciudad))].sort();
  ciudades.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    ciudadSel.appendChild(opt);
  });

  renderTabla(seguimientos);

  ciudadSel.addEventListener('change', filtrarTabla);
  document.getElementById('filter-estado').addEventListener('change', filtrarTabla);
}

function filtrarTabla() {
  const ciudad = document.getElementById('filter-ciudad').value;
  const estado = document.getElementById('filter-estado').value;
  const filtered = allSeguimientos.filter(s => {
    const okCiudad = !ciudad || s.ciudad === ciudad;
    const okEstado = !estado || s.estado === estado;
    return okCiudad && okEstado;
  });
  renderTabla(filtered);
}

function renderTabla(data) {
  const tbody = document.getElementById('seguimientos-tbody');
  const count = document.getElementById('seguimientos-count');
  count.innerHTML = `Mostrando <strong>${data.length}</strong> de ${allSeguimientos.length} contactos`;

  tbody.innerHTML = data.map(s => `
    <tr>
      <td class="td-num">${s.id}</td>
      <td class="td-nombre">${escapeHtml(s.contacto)}</td>
      <td class="td-ciudad">${escapeHtml(s.ciudad)}</td>
      <td><span class="td-tipo">${escapeHtml(s.tipo)}</span></td>
      <td class="${s.telefono ? 'td-tel' : 'td-tel vacio'}">${s.telefono ? escapeHtml(s.telefono) : '—'}</td>
      <td><span class="estado-badge ${getEstadoBadgeClass(s.estado)}">${escapeHtml(s.estado)}</span></td>
      <td>${formatFecha(s.fechaContacto)}</td>
      <td>${formatFecha(s.proximoSeguimiento)}</td>
      <td class="td-notas">${escapeHtml(s.notas)}</td>
    </tr>`).join('');
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

// ── Footer fecha ──────────────────────────────────────────────

function setFooterFecha() {
  const el = document.getElementById('footer-fecha');
  if (el) el.textContent = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Intersection Observer (animaciones entrada) ───────────────

function initFadeObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.ciudad-card, .estacion-card, .mercado-card, .rep-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .45s ease, transform .45s ease';
    observer.observe(el);
  });
}

// ── Bootstrap ─────────────────────────────────────────────────

async function init() {
  try {
    const [roadmapRes, seguimRes] = await Promise.all([
      fetch(ROADMAP_URL),
      fetch(SEGUIM_URL)
    ]);
    const [roadmap, seguimientos] = await Promise.all([
      roadmapRes.json(),
      seguimRes.json()
    ]);

    buildHeroStats(roadmap);
    buildCiudades(roadmap);
    buildCalendario(roadmap);
    buildCalendarioOculto(roadmap);
    buildMercados(roadmap);
    buildRepertorio(roadmap);
    buildSeguimientos(seguimientos, roadmap);
    setFooterFecha();
    initNav();

    // Pequeño delay para activar las animaciones
    setTimeout(initFadeObserver, 100);

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
