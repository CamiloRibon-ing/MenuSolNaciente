// ============================================================
// MENÚ DINÁMICO - Carga productos desde Supabase
// Sol Naciente
// ============================================================
let productosMenu = [];
let categoriasGlobal = [];
let categoriaActual = 'todos';
let busquedaActual = '';

const WHATSAPP_PEDIDOS = '573044891274';

(async function cargarMenu() {
  const contenedor = document.getElementById('menu-contenedor');
  const categoriasScroll = document.getElementById('categorias-scroll');
  const navEl = document.getElementById('navbar');

  configurarBuscador();
  mostrarSkeleton(contenedor);

  try {
    const { data: categorias, error: errCat } = await db
      .from('categorias')
      .select('id, nombre, emoji, slug, orden')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (errCat) throw errCat;
    categoriasGlobal = categorias || [];

    const { data: productos, error: errProd } = await db
      .from('productos')
      .select('id, nombre, descripcion, precio, precio_display, imagen_url, etiqueta, orden, categoria_id')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (errProd) throw errProd;
    productosMenu = productos || [];

    const porCategoria = agruparProductosPorCategoria(categoriasGlobal, productosMenu);
    const categoriasConProductos = categoriasGlobal.filter(cat => porCategoria[cat.id]?.length > 0);

    renderizarCategorias(categoriasConProductos, categoriasScroll);
    renderizarNavbar(categoriasConProductos, navEl);
    aplicarFiltros();
  } catch (err) {
    console.error('Error al cargar el menú:', err);
    mostrarDatosPrueba();
  }
})();

function agruparProductosPorCategoria(categorias, productos) {
  const porCategoria = {};
  categorias.forEach(cat => { porCategoria[cat.id] = []; });
  productos.forEach(producto => {
    if (porCategoria[producto.categoria_id]) {
      porCategoria[producto.categoria_id].push(producto);
    }
  });
  return porCategoria;
}

function renderizarCategorias(categorias, categoriasScroll) {
  const botonesHTML = categorias
    .map(cat => `
      <button class="cat-btn" data-cat="${escMenu(cat.slug)}" data-cat-id="${escMenu(cat.id)}">
        ${escMenu(cat.emoji || '🍽️')} ${escMenu(cat.nombre)}
      </button>
    `)
    .join('');

  categoriasScroll.innerHTML = `<button class="cat-btn cat-btn-activo" data-cat="todos">Todos</button>${botonesHTML}`;

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => filtrarPorCategoria(btn.dataset.cat));
  });
}

function renderizarNavbar(categorias, navEl) {
  navEl.innerHTML = categorias
    .map(cat => `<a href="javascript:filtrarPorCategoria('${escMenu(cat.slug)}')">${escMenu(cat.emoji || '')} ${escMenu(cat.nombre)}</a>`)
    .join('');

  const adminBtn = document.createElement('a');
  adminBtn.href = 'html/admin.html';
  adminBtn.className = 'admin-link-mobile';
  adminBtn.title = 'Panel de administración';
  adminBtn.innerHTML = '<i class="fa fa-user-shield"></i> Panel Admin';
  navEl.appendChild(adminBtn);
}

function configurarBuscador() {
  const input = document.getElementById('buscador-menu');
  const limpiar = document.getElementById('limpiar-busqueda');
  if (!input || !limpiar) return;

  input.addEventListener('input', () => {
    busquedaActual = input.value.trim();
    limpiar.classList.toggle('visible', busquedaActual.length > 0);
    aplicarFiltros();
  });

  limpiar.addEventListener('click', () => {
    input.value = '';
    busquedaActual = '';
    limpiar.classList.remove('visible');
    aplicarFiltros();
    input.focus();
  });
}

function filtrarPorCategoria(slug) {
  categoriaActual = slug;

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('cat-btn-activo', btn.dataset.cat === slug);
  });

  aplicarFiltros();
  cerrarNavbarMobile();
}

function aplicarFiltros() {
  const termino = normalizarTexto(busquedaActual);
  let productosFiltrados = productosMenu;

  if (categoriaActual !== 'todos') {
    productosFiltrados = productosFiltrados.filter(producto => {
      const categoria = categoriasGlobal.find(cat => cat.id === producto.categoria_id);
      return categoria?.slug === categoriaActual;
    });
  }

  if (termino) {
    productosFiltrados = productosFiltrados.filter(producto => {
      const textoProducto = normalizarTexto([
        producto.nombre,
        producto.descripcion,
        producto.etiqueta,
        producto.precio_display,
        producto.precio
      ].filter(Boolean).join(' '));

      return textoProducto.includes(termino);
    });
  }

  mostrarProductosFiltrados(productosFiltrados);
}

function cerrarNavbarMobile() {
  const navbar = document.getElementById('navbar');
  if (navbar?.classList.contains('show')) {
    navbar.classList.remove('show');
    const toggle = document.getElementById('menu-toggle');
    if (toggle) {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
}

function mostrarProductosFiltrados(productos) {
  const contenedor = document.getElementById('menu-contenedor');

  if (!productos.length) {
    contenedor.innerHTML = crearEstadoVacio();
    return;
  }

  const tarjetas = productos.map(p => crearTarjeta(p)).join('');
  contenedor.innerHTML = `<div class="menu-grid menu-grid-enter">${tarjetas}</div>`;

  document.querySelectorAll('.card, .btn-ver').forEach(el => {
    el.addEventListener('click', (e) => {
      const productoId = el.dataset.productoId || el.querySelector?.('.btn-ver')?.dataset.productoId;
      const producto = productosMenu.find(p => String(p.id) === String(productoId));
      if (producto) abrirDetalle(producto);
      e.stopPropagation();
    });
  });
}

function crearTarjeta(p) {
  const imgHtml = p.imagen_url
    ? `<img src="${escMenu(p.imagen_url)}" alt="${escMenu(p.nombre)}" loading="lazy">`
    : `<div class="card-sin-imagen">🍽️</div>`;

  const badgeHtml = p.etiqueta ? `<span class="card-badge">${escMenu(p.etiqueta)}</span>` : '';
  const descHtml = p.descripcion ? `<p class="card-desc">${escMenu(p.descripcion)}</p>` : '';
  const precioDisplay = p.precio_display || `$${Number(p.precio || 0).toLocaleString('es-CO')}`;

  return `
    <div class="card" data-producto-id="${escMenu(p.id)}">
      <div class="card-imagen">
        ${imgHtml}
        ${badgeHtml}
      </div>
      <div class="card-body">
        <h3>${escMenu(p.nombre)}</h3>
        ${descHtml}
        <div class="card-footer-row">
          <span class="price">${escMenu(precioDisplay)}</span>
          <button class="btn-ver" data-producto-id="${escMenu(p.id)}" title="Ver detalles">
            <i class="fa fa-eye"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function abrirDetalle(producto) {
  const modal = document.getElementById('modal-detalle');
  const precioDisplay = producto.precio_display || `$${Number(producto.precio || 0).toLocaleString('es-CO')}`;

  document.getElementById('detalle-img-wrap').innerHTML = producto.imagen_url
    ? `<img src="${escMenu(producto.imagen_url)}" alt="${escMenu(producto.nombre)}" loading="lazy">`
    : '<div class="detalle-sin-img">🍽️</div>';

  const badge = document.getElementById('detalle-badge');
  if (producto.etiqueta) {
    badge.textContent = producto.etiqueta;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }

  document.getElementById('detalle-nombre').textContent = producto.nombre;

  const desc = document.getElementById('detalle-desc');
  if (producto.descripcion) {
    desc.textContent = producto.descripcion;
    desc.style.display = 'block';
  } else {
    desc.style.display = 'none';
  }

  document.getElementById('detalle-precio').textContent = precioDisplay;

  const whatsapp = document.getElementById('detalle-whatsapp');
  if (whatsapp) {
    const mensaje = `Hola, quiero pedir: ${producto.nombre} (${precioDisplay})`;
    whatsapp.href = `https://wa.me/${WHATSAPP_PEDIDOS}?text=${encodeURIComponent(mensaje)}`;
  }

  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

function cerrarDetalle() {
  document.getElementById('modal-detalle').classList.remove('abierto');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarDetalle();
});

function mostrarSkeleton(contenedor) {
  if (!contenedor) return;
  const tarjetas = Array.from({ length: 6 }, () => `
    <div class="card skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `).join('');

  contenedor.innerHTML = `<div class="menu-grid">${tarjetas}</div>`;
}

function crearEstadoVacio() {
  const mensaje = busquedaActual
    ? `No encontramos productos para "${escMenu(busquedaActual)}".`
    : 'No hay productos disponibles en esta categoría.';

  return `
    <div class="estado-vacio">
      <i class="fa fa-utensils"></i>
      <h3>Sin resultados</h3>
      <p>${mensaje}</p>
    </div>
  `;
}

function mostrarDatosPrueba() {
  const categoriasScroll = document.getElementById('categorias-scroll');
  const navEl = document.getElementById('navbar');

  categoriasGlobal = [
    { id: '1', nombre: 'Picadas', emoji: '🍟', slug: 'picadas' },
    { id: '2', nombre: 'Almuerzos', emoji: '🍽️', slug: 'almuerzos' },
    { id: '3', nombre: 'Desayunos', emoji: '🥞', slug: 'desayunos' },
  ];

  productosMenu = [
    { id: '1', nombre: 'Papas Fritas', descripcion: 'Papas fritas crujientes', precio: 15000, precio_display: '$15.000', etiqueta: 'Popular', imagen_url: 'https://via.placeholder.com/300x240?text=Papas+Fritas', categoria_id: '1', orden: 1 },
    { id: '2', nombre: 'Alas de Pollo', descripcion: 'Alas de pollo apanadas', precio: 18000, precio_display: '$18.000', etiqueta: 'Recomendado', imagen_url: 'https://via.placeholder.com/300x240?text=Alas+Pollo', categoria_id: '1', orden: 2 },
    { id: '3', nombre: 'Bandeja Paisa', descripcion: 'Tradicional bandeja paisa', precio: 25000, precio_display: '$25.000', etiqueta: 'Especial', imagen_url: 'https://via.placeholder.com/300x240?text=Bandeja+Paisa', categoria_id: '2', orden: 1 },
    { id: '4', nombre: 'Ajiaco', descripcion: 'Ajiaco caliente y delicioso', precio: 16000, precio_display: '$16.000', etiqueta: null, imagen_url: 'https://via.placeholder.com/300x240?text=Ajiaco', categoria_id: '2', orden: 2 },
    { id: '5', nombre: 'Arepas con Queso', descripcion: 'Arepas caseras recién hechas', precio: 8000, precio_display: '$8.000', etiqueta: null, imagen_url: 'https://via.placeholder.com/300x240?text=Arepas', categoria_id: '3', orden: 1 },
    { id: '6', nombre: 'Huevos Rancheros', descripcion: 'Huevos con salsa y tortillas', precio: 12000, precio_display: '$12.000', etiqueta: 'Popular', imagen_url: 'https://via.placeholder.com/300x240?text=Huevos+Rancheros', categoria_id: '3', orden: 2 },
  ];

  renderizarCategorias(categoriasGlobal, categoriasScroll);
  renderizarNavbar(categoriasGlobal, navEl);
  aplicarFiltros();
}

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escMenu(texto) {
  if (texto === null || texto === undefined) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(texto).replace(/[&<>"']/g, m => map[m]);
}
