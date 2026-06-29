/* ============================================================
   app.js — Roadmap Artístico Lírico · Interprovincial
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

// Configuración de categorías enriquecidas para el directorio
const CAT_CONFIG = {
  "Colectividades Italianas": { label: "Colectividades Italianas", icon: "🇮🇹", dotClass: "colectividad" },
  "Municipalidades":          { label: "Municipalidades",          icon: "🏛️", dotClass: "default" },
  "Secretarias de Cultura":   { label: "Secretarías de Cultura",   icon: "🎭", dotClass: "cultural" },
  "Secretarias de Turismo":   { label: "Secretarías de Turismo",   icon: "🌿", dotClass: "default" },
  "Teatros":                  { label: "Teatros",                  icon: "🎭", dotClass: "alta" },
  "Centros Culturales":       { label: "Centros Culturales",       icon: "🎭", dotClass: "cultural" },
  "Iglesias":                 { label: "Iglesias",                 icon: "⛪", dotClass: "default" },
  "Catedrales":               { label: "Catedrales",               icon: "⛪", dotClass: "default" },
  "Basílicas":                { label: "Basílicas",                icon: "⛪", dotClass: "default" },
  "Salones Históricos":       { label: "Salones Históricos",       icon: "🏛️", dotClass: "club" },
  "Festivales":               { label: "Festivales",               icon: "🎪", dotClass: "club" },
  "Fiestas Nacionales":       { label: "Fiestas Nacionales",       icon: "🎪", dotClass: "alta" },
  "Casas de la Cultura":      { label: "Casas de la Cultura",      icon: "🎭", dotClass: "cultural" }
};

// Variables globales de estado
let allRoadmapData   = null;
let allContactosData = [];
let activeProvince   = 'all'; // 'all', 'Entre Ríos', 'Santa Fe', 'Córdoba'
let activeCity       = null;  // null = todas

// ── Hero stats ────────────────────────────────────────────────

function buildHeroStats(filteredLocalidades, filteredContactos, roadmap) {
  const totalCiudades = filteredLocalidades.length;
  const p1            = filteredLocalidades.filter(c => c.prioridad === 1).length;
  const totalInst     = filteredContactos.length;

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

function buildCiudades(roadmap, selectedProvince = 'all') {
  const container = document.getElementById('ciudades-grid');
  const potencial = roadmap.potencial || {};

  const filtered = selectedProvince === 'all'
    ? roadmap.localidades
    : roadmap.localidades.filter(c => c.provincia === selectedProvince);

  const sorted = [...filtered].sort((a, b) => {
    if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
    return (potencial[b.nombre] || 0) - (potencial[a.nombre] || 0);
  });

  if (sorted.length === 0) {
    container.innerHTML = `<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--clr-muted)">No hay ciudades prioritarias registradas para esta provincia.</div>`;
    return;
  }

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
            <h3>${escapeHtml(ciudad.nombre)} <small style="font-size:0.75rem; color:var(--clr-muted); font-weight:normal">(${escapeHtml(ciudad.provincia)})</small></h3>
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

function buildDirectorio(contactos) {
  allContactosData = contactos;
  renderDirectorioChips();
  renderDirectorio();
}

function renderDirectorioChips() {
  const chipsContainer = document.getElementById('cf-ciudades');
  if (!chipsContainer) return;

  // Filtrar contactos por provincia activa
  const filtered = activeProvince === 'all'
    ? allContactosData
    : allContactosData.filter(c => c.provincia === activeProvince);

  // Extraer ciudades únicas
  const uniqueCities = [...new Set(filtered.map(c => c.ciudad))].sort();

  // Reconstruir chips
  chipsContainer.innerHTML =
    `<button class="city-chip active" data-ciudad="">Todas</button>` +
    uniqueCities.map(city =>
      `<button class="city-chip" data-ciudad="${escapeHtml(city)}">${escapeHtml(city)}</button>`
    ).join('');

  activeCity = null;

  // Registrar listeners para los chips
  chipsContainer.querySelectorAll('.city-chip').forEach(btn => {
    btn.addEventListener('click', e => {
      chipsContainer.querySelectorAll('.city-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCity = btn.dataset.ciudad || null;
      renderDirectorio();
    });
  });
}

function renderDirectorio() {
  const container = document.getElementById('directorio-grid');
  
  let filtered = allContactosData;
  if (activeProvince !== 'all') {
    filtered = filtered.filter(c => c.provincia === activeProvince);
  }
  if (activeCity) {
    filtered = filtered.filter(c => c.ciudad === activeCity);
  }

  // Agrupar por Ciudad
  const citiesMap = {};
  filtered.forEach(item => {
    if (!citiesMap[item.ciudad]) {
      citiesMap[item.ciudad] = {
        nombre: item.ciudad,
        provincia: item.provincia,
        contactos: []
      };
    }
    citiesMap[item.ciudad].contactos.push(item);
  });

  const sortedCities = Object.values(citiesMap).sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (sortedCities.length === 0) {
    container.innerHTML = `<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--clr-muted);">No hay contactos registrados con los filtros seleccionados.</div>`;
    return;
  }

  container.innerHTML = sortedCities.map(ciudad => {
    // Agrupar los contactos de esta ciudad por Categoría
    const catMap = {};
    ciudad.contactos.forEach(c => {
      const catName = c.categoria || "Otros";
      if (!catMap[catName]) {
        catMap[catName] = [];
      }
      catMap[catName].push(c);
    });

    const catsHtml = Object.entries(catMap).map(([catKey, items]) => {
      const cfg = CAT_CONFIG[catKey] || { label: catKey, icon: '📌', dotClass: 'default' };
      const itemsHtml = items.map(item => buildContactItem(item)).join('');
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

    const roadmapCity = (allRoadmapData?.localidades || []).find(lc => lc.nombre === ciudad.nombre && lc.provincia === ciudad.provincia);
    const pClass = roadmapCity ? getPriorityClass(roadmapCity.prioridad) : 'p3';
    const pLabel = roadmapCity ? getPriorityLabel(roadmapCity.prioridad) : 'Prioridad 3';
    const destacadoHtml = roadmapCity?.destacado ? `<span class="dir-destacado">${roadmapCity.destacado}</span>` : '';

    return `
      <div class="dir-ciudad" id="dir-${ciudad.nombre.replace(/\s+/g, '-').toLowerCase()}">
        <div class="dir-ciudad-header">
          <h3 class="dir-ciudad-nombre">${escapeHtml(ciudad.nombre)} <small style="font-size:0.75rem; color:var(--clr-muted); font-weight:normal">(${escapeHtml(ciudad.provincia)})</small></h3>
          ${destacadoHtml}
          <span class="priority-badge ${pClass} dir-badge">${pLabel}</span>
        </div>
        <div class="dir-cats-grid">${catsHtml}</div>
      </div>`;
  }).join('');
}

function buildContactItem(item) {
  const hasTel  = !!item.telefono;
  const hasDirs = !!item.direccion;
  const hasWeb  = !!item.sitioWeb;
  const hasEmail = !!item.email;
  const hasNota = !!item.notas;
  const hasDesc = !!item.descripcion;

  const tagsHtml = (item.tags || []).map(t =>
    `<span class="oport-tag">${escapeHtml(t)}</span>`).join('');

  const sugeridos = item.eventosSugeridos || item.eventosRelacionados || [];
  const sugeridosHtml = sugeridos.map(e =>
    `<span class="oport-tag" style="border-color: rgba(201,168,76,0.3); color: var(--clr-accent2);">${escapeHtml(e)}</span>`).join('');

  const cfg = CAT_CONFIG[item.categoria] || { dotClass: 'default' };

  return `
    <div class="dir-item">
      <span class="inst-dot ${cfg.dotClass}"></span>
      <div class="dir-item-body">
        <div class="dir-item-nombre">${escapeHtml(item.nombre)}</div>
        ${item.subcategoria ? `<div class="dir-item-tipo">${escapeHtml(item.subcategoria)}</div>` : ''}
        ${hasDesc ? `<div class="inst-desc-mini" style="margin-bottom: 4px;">${escapeHtml(item.descripcion)}</div>` : ''}
        <div class="dir-item-datos">
          ${hasDirs ? `<span class="dir-dato dir-dir">📍 ${escapeHtml(item.direccion)}</span>` : ''}
          ${hasTel  ? `<span class="dir-dato dir-tel">📞 ${escapeHtml(item.telefono)}</span>` : ''}
          ${hasEmail ? `<span class="dir-dato dir-email">✉️ <a href="mailto:${escapeHtml(item.email)}" style="color:var(--clr-muted);text-decoration:underline;">${escapeHtml(item.email)}</a></span>` : ''}
          ${hasWeb  ? `<a class="dir-dato dir-web" href="${escapeHtml(item.sitioWeb)}" target="_blank" rel="noopener">🌐 sitio web</a>` : ''}
        </div>
        ${hasNota ? `<div class="dir-item-nota">${escapeHtml(item.notas)}</div>` : ''}
        ${tagsHtml || sugeridosHtml ? `
          <div class="inst-oportunidades">
            ${tagsHtml}
            ${sugeridosHtml}
          </div>` : ''}
      </div>
    </div>`;
}

// ── Navegación e Inicialización del Filtro de Provincias ──────────

function initProvinceFilters(roadmap) {
  const container = document.getElementById('province-pills');
  if (!container) return;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.province-pill');
    if (!btn) return;

    container.querySelectorAll('.province-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    activeProvince = btn.dataset.provincia;

    const filteredLocalidades = activeProvince === 'all'
      ? roadmap.localidades
      : roadmap.localidades.filter(c => c.provincia === activeProvince);

    const filteredContactos = activeProvince === 'all'
      ? allContactosData
      : allContactosData.filter(c => c.provincia === activeProvince);

    buildHeroStats(filteredLocalidades, filteredContactos, roadmap);
    buildCiudades(roadmap, activeProvince);
    renderDirectorioChips();
    renderDirectorio();
    
    // Reinicializar observers para las animaciones de entrada de nuevos elementos
    setTimeout(initFadeObserver, 50);
  });
}

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

    allRoadmapData = roadmap;

    buildHeroStats(roadmap.localidades, ciudadesData, roadmap);
    buildCiudades(roadmap, 'all');
    buildCalendario(roadmap);
    buildCalendarioOculto(roadmap);
    buildMercados(roadmap);
    buildRepertorio(roadmap);
    buildDirectorio(ciudadesData);
    initProvinceFilters(roadmap);
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
