// ============================================================
// MENÚ DINÁMICO - Carga productos desde Supabase
// Sol Naciente
// ============================================================
let productosMenu = [];
let categoriasGlobal = [];
let categoriaActual = 'todos';
let busquedaActual = '';

const WHATSAPP_PEDIDOS = '573044891274';

// URLs remotas para registros antiguos cuya imagen_url aún está vacía en Supabase.
const IMAGENES_CLOUDINARY_PRODUCTOS = {
  'chorizo': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146581/menusolnaciente/r83rmmz5wk99zhql0jip.jpg',
  'arroz': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146583/menusolnaciente/mwpakgcbk7qx1yrkdivl.jpg',
  'coca-cola-personal': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146588/menusolnaciente/rmysyppegpzrmq09bzm5.jpg',
  'costilla': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146592/menusolnaciente/ienfow53xxs9mwus1ajq.jpg',
  'picada-xs': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146593/menusolnaciente/tpchfq4sbznq0k7h2oby.jpg',
  'picada-s': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146595/menusolnaciente/ux3bu1v3fqg0evvzqlmj.jpg',
  'picada-m': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146597/menusolnaciente/eafq3wov5yutsa2s9vd1.jpg',
  'gallina': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146599/menusolnaciente/m61kb8nftrcnukpbg0hw.jpg',
  'sopa': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146601/menusolnaciente/qp5y0vkrukqvj8wo3rdi.jpg',
  'speed-max': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146604/menusolnaciente/zkwfwb7vdaz7alalunfi.jpg',
  'sopa-y-arroz': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146606/menusolnaciente/qcuisumnso53swmbvi1p.jpg',
  'desayuno-tipo-1': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146610/menusolnaciente/dcdaicajwlb98haicfla.webp',
  'desayuno-tipo-2': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146612/menusolnaciente/zohc4tjbaetlonjchacb.jpg',
  'papa-a-la-francesa': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146617/menusolnaciente/ttyvgp30zz0obrgpmegb.jpg',
  'patacones': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146619/menusolnaciente/lhaqdsvz9s1qupera1ww.jpg',
  'soda': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146621/menusolnaciente/zf2zhnbemvoqmcsovddf.jpg',
  'soda-ginger': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146624/menusolnaciente/ivjym5ygb5ceyyu5j9es.jpg',
  'limonada-natural': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146626/menusolnaciente/g4racck1nmub2ieoccx1.jpg',
  'limonada-de-coco': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146629/menusolnaciente/kfjjx73hvagecsj83dhf.jpg',
  'limonada-cerezada': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146635/menusolnaciente/s1ichbnnlechbzoesyiv.jpg',
  'maracuya': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146637/menusolnaciente/qfyiaijr5sppwet3jstg.jpg',
  'old-parr-750ml': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146640/menusolnaciente/kdg9oilgho5ixp16aygi.jpg',
  'buchanan-s-master-750ml': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146643/menusolnaciente/uburblf33txe79bgk25z.jpg',
  'medellin-8-anos': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146645/menusolnaciente/lnk7e65btofgafvnfmxg.jpg',
  'medellin-3-anos': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146647/menusolnaciente/jih6cxseepi190cmpwah.jpg',
  'aguardiente-amarrillo': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146648/menusolnaciente/nt18xxwjtybkrrtmrm0n.jpg',
  'aguardiente-pipona': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146650/menusolnaciente/gdgbsjmottqgsncmf05f.jpg',
  'aguardiente-limosina': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146652/menusolnaciente/zamhbg90abpiujk1dhzu.jpg',
  'aguardiente-garrafon': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146654/menusolnaciente/awji5aoqeamordbjikdz.jpg',
  'poker': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146655/menusolnaciente/kow7jxkjo7i9qoygf8ia.jpg',
  'budweiser': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146657/menusolnaciente/ibp7oci7r1wut7gkaswk.jpg',
  'aguila-negra': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146659/menusolnaciente/ia3stiswf6lbcn6pixy8.jpg',
  'aguilita-negra': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146661/menusolnaciente/gqwhch8tdad9wo1waonv.jpg',
  'aguila-light': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146662/menusolnaciente/kiodkskf5dizb9wkycuq.jpg',
  'aguilita-light': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146667/menusolnaciente/ns5hu1g8shnca8rbmbsm.jpg',
  'raspado-de-kola': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146669/menusolnaciente/iiubjdsiyqcazovfrdtt.jpg',
  'raspado-de-maracuya': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146671/menusolnaciente/e2tk1dm9rxkpufgosxgr.jpg',
  'raspado-de-chicle': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146672/menusolnaciente/fuhkrtc8tyl0x5ga4qih.jpg',
  'frutos-rojos': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146674/menusolnaciente/iy9dc2ds1tiz7qxh1yel.jpg',
  'manzana-verde': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146675/menusolnaciente/mjegryxa7vlv7hjhdvz3.jpg',
  'kiwi': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146676/menusolnaciente/va60t1nnxm5zwc04hgfi.jpg',
  'mango-verde': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146679/menusolnaciente/sgzbiu7yugfhtecyblm7.jpg',
  'fresa': 'https://res.cloudinary.com/dczdtij3q/image/upload/v1787146680/menusolnaciente/jbrqnr1tioeqjsksn3yl.jpg'
};

function claveProducto(nombre) {
  return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function obtenerImagenProducto(producto) {
  const url = producto.imagen_url || IMAGENES_CLOUDINARY_PRODUCTOS[claveProducto(producto.nombre)] || '';
  return url.includes('res.cloudinary.com/')
    ? url.replace('/image/upload/', '/image/upload/f_auto,q_auto:good,w_900,c_limit/')
    : url;
}

(async function inicio() {
  configurarBuscador();
  await cargarMenu();
  suscribirseATiempoReal();
})();

async function cargarMenu() {
  const contenedor = document.getElementById('menu-contenedor');
  const categoriasScroll = document.getElementById('categorias-scroll');
  const navEl = document.getElementById('navbar');

  mostrarSkeleton(contenedor);

  try {
    const { categorias, productos } = await apiClient.getMenu();
    categoriasGlobal = categorias || [];

    // Para la vista "Todos" se agrupa por el orden de categoría definido por el admin
    // y, dentro de cada categoría, por el orden de producto definido por el admin.
    productosMenu = categoriasGlobal.flatMap(cat =>
      (productos || []).filter(p => p.categoria_id === cat.id)
    );

    const porCategoria = agruparProductosPorCategoria(categoriasGlobal, productosMenu);
    const categoriasConProductos = categoriasGlobal.filter(cat => porCategoria[cat.id]?.length > 0);

    renderizarCategorias(categoriasConProductos, categoriasScroll);
    renderizarNavbar(categoriasConProductos, navEl);
    aplicarFiltros();
  } catch (err) {
    console.error('Error al cargar el menú:', err);
    categoriasGlobal = [];
    productosMenu = [];
    categoriasScroll.innerHTML = '';
    navEl.innerHTML = '';
    contenedor.innerHTML = `
      <div class="estado-vacio">
        <i class="fa fa-triangle-exclamation"></i>
        <h3>No pudimos cargar el menú</h3>
        <p>Actualiza la página en unos segundos.</p>
      </div>`;
  }
}

// ---- Actualización en tiempo real cuando el admin modifica el menú ----
function suscribirseATiempoReal() {
  if (!db?.channel) return;

  let recargaProgramada = null;
  const recargarConDebounce = () => {
    clearTimeout(recargaProgramada);
    recargaProgramada = setTimeout(cargarMenu, 350);
  };

  db.channel('menu-publico-cambios')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, recargarConDebounce)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, recargarConDebounce)
    .subscribe();
}

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
  const imagen = obtenerImagenProducto(p);
  const imgHtml = imagen
    ? `<img src="${escMenu(imagen)}" alt="${escMenu(p.nombre)}" loading="lazy">`
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
  const imagen = obtenerImagenProducto(producto);

  document.getElementById('detalle-img-wrap').innerHTML = imagen
    ? `<img src="${escMenu(imagen)}" alt="${escMenu(producto.nombre)}" loading="lazy">`
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
