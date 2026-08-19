// ============================================================
// PANEL DE ADMINISTRACIÓN - Sol Naciente
// ============================================================

// ---- Estado global ----
let categorias = [];
let productos = [];
let accionEliminar = null; // función que se ejecuta al confirmar eliminación

// ---- Utilidades UI ----
function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast ${tipo} visible`;
  setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function abrirModal(id) {
  document.getElementById(id).classList.add('abierto');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('abierto');
}

function mostrarError(contenedorId, mensaje) {
  const el = document.getElementById(contenedorId);
  el.textContent = mensaje;
  el.style.display = 'block';
}

function ocultarError(contenedorId) {
  document.getElementById(contenedorId).style.display = 'none';
}

// Cerrar modales con botones [data-modal] y con clic fuera
document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => cerrarModal(btn.dataset.modal));
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal(modal.id);
  });
});

// ============================================================
// AUTH - LOGIN / LOGOUT
// ============================================================

document.getElementById('btn-ver-clave').addEventListener('click', () => {
  const input = document.getElementById('login-clave');
  const icono = document.querySelector('#btn-ver-clave i');
  if (input.type === 'password') {
    input.type = 'text';
    icono.className = 'fa fa-eye-slash';
  } else {
    input.type = 'password';
    icono.className = 'fa fa-eye';
  }
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError('login-error');

  const correo = document.getElementById('login-correo').value.trim();
  const clave = document.getElementById('login-clave').value;
  const btnTexto = document.getElementById('texto-btn-login');
  const spinner = document.getElementById('spinner-login');
  const btn = document.getElementById('btn-ingresar');

  btn.disabled = true;
  btnTexto.style.display = 'none';
  spinner.style.display = 'inline-block';

  try {
    const { data, error } = await db.auth.signInWithPassword({ email: correo, password: clave });

    if (error) throw error;

    // Verificar que sea admin desde el backend
    const { profile: perfil } = await apiClient.getProfile();

    if (!perfil) throw new Error('No se pudo obtener el perfil.');
    if (perfil.rol !== 'admin') throw new Error('Acceso denegado. No tienes permisos de administrador.');

    document.getElementById('nombre-admin').textContent = perfil.nombre;
    document.getElementById('pantalla-login').style.display = 'none';
    document.getElementById('panel-admin').style.display = 'block';
    await iniciarPanel();

  } catch (err) {
    mostrarError('login-error', err.message || 'Error al iniciar sesión.');
  } finally {
    btn.disabled = false;
    btnTexto.style.display = 'inline';
    spinner.style.display = 'none';
  }
});

document.getElementById('btn-cerrar-sesion').addEventListener('click', async () => {
  await db.auth.signOut();
  document.getElementById('panel-admin').style.display = 'none';
  document.getElementById('pantalla-login').style.display = 'flex';
  document.getElementById('form-login').reset();
});

// Verificar sesión al cargar
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return;

  let perfil = null;
  try {
    ({ profile: perfil } = await apiClient.getProfile());
  } catch (err) {
    return;
  }

  if (perfil && perfil.rol === 'admin') {
    document.getElementById('nombre-admin').textContent = perfil.nombre;
    document.getElementById('pantalla-login').style.display = 'none';
    document.getElementById('panel-admin').style.display = 'block';
    await iniciarPanel();
  }
})();

// ============================================================
// INICIO DEL PANEL
// ============================================================

async function iniciarPanel() {
  await cargarCategorias();
  await cargarProductos();
  configurarFiltros();
  configurarTabOrdenar();
}

// ============================================================
// TABS
// ============================================================

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.tab-contenido').forEach(c => c.classList.remove('activo'));
    tab.classList.add('activo');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('activo');
    if (tab.dataset.tab === 'ordenar') renderOrdenarTab();
  });
});

// ============================================================
// CATEGORÍAS - CARGA Y TABLA
// ============================================================

async function cargarCategorias() {
  try {
    const { categorias: data } = await apiClient.listCategories();
    categorias = data || [];
  } catch (error) {
    mostrarToast('Error al cargar categorías', 'error');
    return;
  }

  renderizarTablaCategorias();
  actualizarSelectCategorias();
  renderOrdenarTab();
}

function renderizarTablaCategorias() {
  const tbody = document.getElementById('cuerpo-tabla-categorias');
  if (!categorias.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="cargando">No hay categorías registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = categorias.map(cat => `
    <tr>
      <td style="font-size:1.5rem">${cat.emoji || '🍽️'}</td>
      <td><strong>${escHtml(cat.nombre)}</strong></td>
      <td><code>${escHtml(cat.slug)}</code></td>
      <td>${cat.orden}</td>
      <td>
        <span class="${cat.activo ? 'badge-activo' : 'badge-inactivo'}">
          ${cat.activo ? 'Activa' : 'Inactiva'}
        </span>
      </td>
      <td>
        <div class="acciones-tabla">
          <button class="btn-icono btn-editar" onclick="editarCategoria('${cat.id}')" title="Editar">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn-icono btn-toggle" onclick="toggleCategoria('${cat.id}', ${cat.activo})" title="${cat.activo ? 'Desactivar' : 'Activar'}">
            <i class="fa fa-${cat.activo ? 'toggle-on' : 'toggle-off'}"></i>
          </button>
          <button class="btn-icono btn-eliminar" onclick="confirmarEliminarCategoria('${cat.id}', '${escHtml(cat.nombre)}')" title="Eliminar">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function actualizarSelectCategorias() {
  const selects = [
    document.getElementById('filtro-categoria'),
    document.getElementById('producto-categoria')
  ];
  selects.forEach(sel => {
    if (!sel) return;
    const valorActual = sel.value;
    const opcionVacia = sel.options[0].outerHTML;
    sel.innerHTML = opcionVacia + categorias.map(cat =>
      `<option value="${cat.id}">${cat.emoji || ''} ${escHtml(cat.nombre)}</option>`
    ).join('');
    sel.value = valorActual;
  });
}

// ---- Nueva categoría ----
document.getElementById('btn-nueva-categoria').addEventListener('click', () => {
  document.getElementById('categoria-id').value = '';
  document.getElementById('form-categoria').reset();
  document.getElementById('modal-categoria-titulo').textContent = 'Nueva Categoría';
  document.getElementById('categoria-activa').checked = true;
  ocultarError('error-categoria');
  abrirModal('modal-categoria');
});

// ---- Editar categoría ----
function editarCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('categoria-id').value = cat.id;
  document.getElementById('categoria-nombre').value = cat.nombre;
  document.getElementById('categoria-emoji').value = cat.emoji || '';
  document.getElementById('categoria-orden').value = cat.orden;
  document.getElementById('categoria-activa').checked = cat.activo;
  document.getElementById('modal-categoria-titulo').textContent = 'Editar Categoría';
  ocultarError('error-categoria');
  abrirModal('modal-categoria');
}

// ---- Toggle activo/inactivo categoría ----
async function toggleCategoria(id, activo) {
  try {
    await apiClient.updateCategory(id, { activo: !activo });
    mostrarToast(`Categoría ${!activo ? 'activada' : 'desactivada'}`);
    await cargarCategorias();
  } catch (error) {
    mostrarToast('Error al actualizar', 'error');
  }
}

// ---- Guardar categoría (crear o actualizar) ----
function generarSlugCategoria(nombre) {
  const slugBase = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';

  let slug = slugBase;
  let consecutivo = 2;
  const slugsExistentes = new Set(categorias.map(cat => cat.slug));
  while (slugsExistentes.has(slug)) slug = `${slugBase}-${consecutivo++}`;
  return slug;
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError('error-categoria');

  const id = document.getElementById('categoria-id').value;
  const nombre = document.getElementById('categoria-nombre').value.trim();
  const datos = {
    nombre,
    emoji: document.getElementById('categoria-emoji').value.trim() || '🍽️',
    orden: parseInt(document.getElementById('categoria-orden').value) || 0,
    activo: document.getElementById('categoria-activa').checked
  };

  // El slug es un dato técnico: se crea automáticamente y se conserva al editar.
  if (!id) datos.slug = generarSlugCategoria(nombre);

  const btnTexto = document.getElementById('texto-btn-categoria');
  const spinner = document.getElementById('spinner-categoria');
  const btn = document.getElementById('btn-guardar-categoria');

  btn.disabled = true;
  btnTexto.style.display = 'none';
  spinner.style.display = 'inline-block';

  try {
    if (id) {
      await apiClient.updateCategory(id, datos);
    } else {
      await apiClient.createCategory(datos);
    }

    mostrarToast(`Categoría ${id ? 'actualizada' : 'creada'} correctamente`);
    cerrarModal('modal-categoria');
    await cargarCategorias();

  } catch (err) {
    mostrarError('error-categoria', err.message || 'Error al guardar la categoría.');
  } finally {
    btn.disabled = false;
    btnTexto.style.display = 'inline';
    spinner.style.display = 'none';
  }
});

// ---- Eliminar categoría ----
function confirmarEliminarCategoria(id, nombre) {
  document.getElementById('texto-confirmar').textContent =
    `¿Eliminar la categoría "${nombre}"? Los productos de esta categoría no se podrán eliminar si tienen registros asociados.`;
  accionEliminar = async () => {
    try {
      await apiClient.deleteCategory(id);
      mostrarToast('Categoría eliminada');
      await cargarCategorias();
      await cargarProductos();
    } catch (error) {
      mostrarToast('No se puede eliminar: tiene productos asociados.', 'error');
    }
  };
  abrirModal('modal-confirmar');
}

// ============================================================
// PRODUCTOS - CARGA Y TABLA
// ============================================================

async function cargarProductos() {
  try {
    const { productos: data } = await apiClient.listProducts();
    productos = data || [];
  } catch (error) {
    mostrarToast('Error al cargar productos', 'error');
    return;
  }

  renderizarTablaProductos(productos);
  renderOrdenarTab();
}

function renderizarTablaProductos(lista) {
  const tbody = document.getElementById('cuerpo-tabla-productos');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="cargando">No hay productos para mostrar.</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const catNombre = p.categorias ? `${p.categorias.emoji || ''} ${p.categorias.nombre}` : '—';
    const precioTexto = p.precio_display || `$${Number(p.precio).toLocaleString('es-CO')}`;
    const imgHtml = p.imagen_url
      ? `<img src="${escHtml(p.imagen_url)}" class="thumb" alt="${escHtml(p.nombre)}" loading="lazy">`
      : `<div class="sin-imagen"><i class="fa fa-image"></i></div>`;

    return `
      <tr>
        <td>${imgHtml}</td>
        <td><strong>${escHtml(p.nombre)}</strong></td>
        <td>${escHtml(catNombre)}</td>
        <td style="font-weight:700;color:#d62828">${escHtml(precioTexto)}</td>
        <td>${escHtml(p.etiqueta || '—')}</td>
        <td>
          <span class="${p.activo ? 'badge-activo' : 'badge-inactivo'}">
            ${p.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="acciones-tabla">
            <button class="btn-icono" onclick="previsualizarProducto('${p.id}')" title="Vista previa" style="background:#e8edf8;color:#003399">
              <i class="fa fa-eye"></i>
            </button>
            <button class="btn-icono btn-editar" onclick="editarProducto('${p.id}')" title="Editar">
              <i class="fa fa-pencil"></i>
            </button>
            <button class="btn-icono btn-toggle" onclick="toggleProducto('${p.id}', ${p.activo})" title="${p.activo ? 'Desactivar' : 'Activar'}">
              <i class="fa fa-${p.activo ? 'toggle-on' : 'toggle-off'}"></i>
            </button>
            <button class="btn-icono btn-eliminar" onclick="confirmarEliminarProducto('${p.id}', '${escHtml(p.nombre).replace(/'/g, "\\'")}')" title="Eliminar">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- Filtros ----
function configurarFiltros() {
  const filtroCat = document.getElementById('filtro-categoria');
  const filtroBusq = document.getElementById('filtro-busqueda');

  function filtrar() {
    const catId = filtroCat.value;
    const busq = filtroBusq.value.toLowerCase();
    let lista = productos;
    if (catId) lista = lista.filter(p => p.categoria_id === catId);
    if (busq) lista = lista.filter(p => p.nombre.toLowerCase().includes(busq) || (p.descripcion || '').toLowerCase().includes(busq));
    renderizarTablaProductos(lista);
  }

  filtroCat.addEventListener('change', filtrar);
  filtroBusq.addEventListener('input', filtrar);
}

// ---- Nuevo producto ----
document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  resetFormProducto();
  document.getElementById('modal-producto-titulo').textContent = 'Nuevo Producto';
  abrirModal('modal-producto');
});

function resetFormProducto() {
  document.getElementById('producto-id').value = '';
  document.getElementById('form-producto').reset();
  document.getElementById('producto-activo').checked = true;
  document.getElementById('producto-imagen-url').value = '';
  document.getElementById('imagen-archivo').value = '';
  document.getElementById('btn-quitar-imagen').style.display = 'none';
  document.getElementById('progreso-upload').style.display = 'none';
  const preview = document.getElementById('imagen-preview');
  preview.innerHTML = `<i class="fa fa-image icono-imagen"></i><p>Sin imagen</p>`;
  ocultarError('error-producto');
  actualizarPreviewLiveProducto();
}

// ---- Imagen: selección, arrastre y subida ----
const zonaImagen = document.getElementById('zona-imagen');
const inputImagen = document.getElementById('imagen-archivo');

function pintarPreviewImagen(src) {
  const preview = document.getElementById('imagen-preview');
  const liveImg = document.getElementById('preview-live-img');
  preview.innerHTML = `<img src="${src}" alt="Preview">`;
  liveImg.innerHTML = `<img src="${src}" alt="Preview">`;
}

function pintarPreviewImagenVacia() {
  document.getElementById('imagen-preview').innerHTML = `<i class="fa fa-image icono-imagen"></i><p>Sin imagen</p>`;
  document.getElementById('preview-live-img').innerHTML = `<i class="fa fa-utensils"></i>`;
}

async function manejarArchivoProducto(archivo) {
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (ev) => pintarPreviewImagen(ev.target.result);
  lector.readAsDataURL(archivo);

  const progreso = document.getElementById('progreso-upload');
  progreso.style.display = 'block';

  try {
    const url = await cloudinaryService.subirImagen(archivo);
    document.getElementById('producto-imagen-url').value = url;
    document.getElementById('btn-quitar-imagen').style.display = 'inline-flex';
    actualizarPreviewLiveProducto();
    mostrarToast('Imagen subida correctamente');
  } catch (err) {
    mostrarToast('Error al subir la imagen: ' + err.message, 'error');
    document.getElementById('producto-imagen-url').value = '';
    document.getElementById('imagen-archivo').value = '';
    document.getElementById('btn-quitar-imagen').style.display = 'none';
    pintarPreviewImagenVacia();
  } finally {
    progreso.style.display = 'none';
  }
}

inputImagen.addEventListener('change', async (e) => {
  await manejarArchivoProducto(e.target.files[0]);
});

zonaImagen.addEventListener('click', (e) => {
  if (e.target.closest('button, label')) return;
  inputImagen.click();
});

zonaImagen.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    inputImagen.click();
  }
});

['dragenter', 'dragover'].forEach(evento => {
  zonaImagen.addEventListener(evento, (e) => {
    e.preventDefault();
    zonaImagen.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(evento => {
  zonaImagen.addEventListener(evento, (e) => {
    e.preventDefault();
    zonaImagen.classList.remove('drag-over');
  });
});

zonaImagen.addEventListener('drop', async (e) => {
  const archivo = e.dataTransfer.files[0];
  if (!archivo) return;
  inputImagen.files = e.dataTransfer.files;
  await manejarArchivoProducto(archivo);
});

document.getElementById('btn-quitar-imagen').addEventListener('click', () => {
  document.getElementById('producto-imagen-url').value = '';
  document.getElementById('imagen-archivo').value = '';
  document.getElementById('btn-quitar-imagen').style.display = 'none';
  pintarPreviewImagenVacia();
});

function actualizarPreviewLiveProducto() {
  const nombre = document.getElementById('producto-nombre').value.trim() || 'Producto sin nombre';
  const descripcion = document.getElementById('producto-descripcion').value.trim();
  const precio = parseFloat(document.getElementById('producto-precio').value) || 0;
  const precioDisplay = document.getElementById('producto-precio-display').value.trim();
  const etiqueta = document.getElementById('producto-etiqueta').value.trim();
  const categoriaId = document.getElementById('producto-categoria').value;
  const categoria = categorias.find(cat => cat.id === categoriaId);
  const activo = document.getElementById('producto-activo').checked;
  const imagenUrl = document.getElementById('producto-imagen-url').value;

  document.getElementById('preview-live-nombre').textContent = nombre;

  const descEl = document.getElementById('preview-live-desc');
  descEl.textContent = descripcion;
  descEl.style.display = descripcion ? 'block' : 'none';

  document.getElementById('preview-live-precio').textContent = precioDisplay || `$ ${Number(precio).toLocaleString('es-CO')}`;
  document.getElementById('preview-live-categoria').textContent = categoria ? `${categoria.emoji || ''} ${categoria.nombre}` : 'Sin categoria';

  const badge = document.getElementById('preview-live-badge');
  badge.textContent = etiqueta;
  badge.style.display = etiqueta ? 'inline-block' : 'none';

  const estado = document.getElementById('preview-live-estado');
  estado.textContent = activo ? 'Activo' : 'Inactivo';
  estado.className = activo ? 'badge-activo' : 'badge-inactivo';

  if (imagenUrl) {
    document.getElementById('preview-live-img').innerHTML = `<img src="${escHtml(imagenUrl)}" alt="${escHtml(nombre)}">`;
  } else if (!document.querySelector('#preview-live-img img')) {
    pintarPreviewImagenVacia();
  }
}

[
  'producto-nombre',
  'producto-categoria',
  'producto-descripcion',
  'producto-precio',
  'producto-precio-display',
  'producto-etiqueta',
  'producto-activo'
].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', actualizarPreviewLiveProducto);
  el.addEventListener('change', actualizarPreviewLiveProducto);
});

// ---- Editar producto ----
function editarProducto(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  document.getElementById('producto-id').value = p.id;
  document.getElementById('producto-nombre').value = p.nombre;
  document.getElementById('producto-categoria').value = p.categoria_id;
  document.getElementById('producto-descripcion').value = p.descripcion || '';
  document.getElementById('producto-precio').value = p.precio;
  document.getElementById('producto-precio-display').value = p.precio_display || '';
  document.getElementById('producto-etiqueta').value = p.etiqueta || '';
  document.getElementById('producto-orden').value = p.orden;
  document.getElementById('producto-activo').checked = p.activo;
  document.getElementById('producto-imagen-url').value = p.imagen_url || '';
  document.getElementById('imagen-archivo').value = '';
  document.getElementById('progreso-upload').style.display = 'none';

  const preview = document.getElementById('imagen-preview');
  if (p.imagen_url) {
    preview.innerHTML = `<img src="${escHtml(p.imagen_url)}" alt="Imagen">`;
    document.getElementById('btn-quitar-imagen').style.display = 'inline-flex';
  } else {
    preview.innerHTML = `<i class="fa fa-image icono-imagen"></i><p>Sin imagen</p>`;
    document.getElementById('btn-quitar-imagen').style.display = 'none';
  }

  document.getElementById('modal-producto-titulo').textContent = 'Editar Producto';
  ocultarError('error-producto');
  actualizarPreviewLiveProducto();
  abrirModal('modal-producto');
}

// ---- Toggle activo/inactivo producto ----
async function toggleProducto(id, activo) {
  try {
    await apiClient.updateProduct(id, { activo: !activo });
    mostrarToast(`Producto ${!activo ? 'activado' : 'desactivado'}`);
    await cargarProductos();
  } catch (error) {
    mostrarToast('Error al actualizar', 'error');
  }
}

// ---- Guardar producto (crear o actualizar) ----
document.getElementById('form-producto').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError('error-producto');

  const id = document.getElementById('producto-id').value;
  const datos = {
    categoria_id: document.getElementById('producto-categoria').value,
    nombre: document.getElementById('producto-nombre').value.trim(),
    descripcion: document.getElementById('producto-descripcion').value.trim() || null,
    precio: parseFloat(document.getElementById('producto-precio').value) || 0,
    precio_display: document.getElementById('producto-precio-display').value.trim() || null,
    imagen_url: document.getElementById('producto-imagen-url').value || null,
    etiqueta: document.getElementById('producto-etiqueta').value.trim() || null,
    orden: parseInt(document.getElementById('producto-orden').value) || 0,
    activo: document.getElementById('producto-activo').checked
  };

  const btnTexto = document.getElementById('texto-btn-producto');
  const spinner = document.getElementById('spinner-producto');
  const btn = document.getElementById('btn-guardar-producto');

  btn.disabled = true;
  btnTexto.style.display = 'none';
  spinner.style.display = 'inline-block';

  try {
    if (id) {
      await apiClient.updateProduct(id, datos);
    } else {
      await apiClient.createProduct(datos);
    }

    mostrarToast(`Producto ${id ? 'actualizado' : 'creado'} correctamente`);
    cerrarModal('modal-producto');
    await cargarProductos();

  } catch (err) {
    mostrarError('error-producto', err.message || 'Error al guardar el producto.');
  } finally {
    btn.disabled = false;
    btnTexto.style.display = 'inline';
    spinner.style.display = 'none';
  }
});

// ---- Eliminar producto ----
function confirmarEliminarProducto(id, nombre) {
  document.getElementById('texto-confirmar').textContent =
    `¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`;
  accionEliminar = async () => {
    try {
      await apiClient.deleteProduct(id);
      mostrarToast('Producto eliminado');
      await cargarProductos();
    } catch (error) {
      mostrarToast('Error al eliminar el producto.', 'error');
    }
  };
  abrirModal('modal-confirmar');
}

// ---- Modal confirmar ----
document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
  cerrarModal('modal-confirmar');
  if (typeof accionEliminar === 'function') {
    await accionEliminar();
    accionEliminar = null;
  }
});

// ============================================================
// PREVIEW PRODUCTO (vista previa del menú público)
// ============================================================
function previsualizarProducto(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  const precio = p.precio_display || `$ ${Number(p.precio).toLocaleString('es-CO')}`;
  const catNombre = p.categorias ? `${p.categorias.emoji || ''} ${p.categorias.nombre}` : '';

  const imgWrap = document.getElementById('preview-img-wrap');
  if (p.imagen_url) {
    imgWrap.innerHTML = `<img src="${escHtml(p.imagen_url)}" style="width:100%;height:100%;object-fit:cover" alt="${escHtml(p.nombre)}">`;
  } else {
    imgWrap.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;color:#003399"><i class="fa fa-utensils"></i></div>`;
  }

  const badge = document.getElementById('preview-badge');
  badge.textContent = p.etiqueta || '';
  badge.style.display = p.etiqueta ? 'inline-block' : 'none';

  document.getElementById('preview-nombre').textContent = p.nombre;
  document.getElementById('preview-desc').textContent = p.descripcion || '';
  document.getElementById('preview-desc').style.display = p.descripcion ? 'block' : 'none';
  document.getElementById('preview-precio').textContent = precio;
  document.getElementById('preview-categoria').textContent = catNombre;

  const estadoEl = document.getElementById('preview-estado');
  estadoEl.textContent = p.activo ? 'Activo' : 'Inactivo';
  estadoEl.className = p.activo ? 'badge-activo' : 'badge-inactivo';
  estadoEl.style.display = 'inline-block';

  abrirModal('modal-preview');
}

// ============================================================
// ORDENAR MENÚ - Drag & drop, ordenamiento rápido y vista previa
// ============================================================

function configurarTabOrdenar() {
  const selectVista = document.getElementById('preview-vista-categoria');
  if (selectVista) selectVista.addEventListener('change', renderPreviewOrdenar);
}

function renderOrdenarTab() {
  const lista = document.getElementById('lista-categorias-ordenar');
  const selectVista = document.getElementById('preview-vista-categoria');
  if (!lista || !selectVista) return;

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden);

  const valorVistaActual = selectVista.value || 'todos';
  selectVista.innerHTML = '<option value="todos">Todos</option>' +
    categoriasOrdenadas.map(c => `<option value="${c.id}">${c.emoji || ''} ${escHtml(c.nombre)}</option>`).join('');
  selectVista.value = categoriasOrdenadas.some(c => c.id === valorVistaActual) || valorVistaActual === 'todos'
    ? valorVistaActual
    : 'todos';

  if (!categoriasOrdenadas.length) {
    lista.innerHTML = '<p class="cargando">No hay categorías registradas.</p>';
    renderPreviewOrdenar();
    return;
  }

  lista.innerHTML = categoriasOrdenadas.map(cat => {
    const productosCat = productos.filter(p => p.categoria_id === cat.id).sort((a, b) => a.orden - b.orden);

    const itemsHtml = productosCat.map(p => {
      const precio = p.precio_display || `$${Number(p.precio).toLocaleString('es-CO')}`;
      const thumb = p.imagen_url
        ? `<img class="prod-ordenar-thumb" src="${escHtml(p.imagen_url)}" alt="">`
        : `<div class="prod-ordenar-thumb prod-ordenar-thumb-vacio"><i class="fa fa-image"></i></div>`;

      return `
        <li class="prod-ordenar-item" draggable="true" data-prod-id="${p.id}">
          <i class="fa fa-grip-vertical drag-handle"></i>
          ${thumb}
          <span class="prod-ordenar-nombre">${escHtml(p.nombre)}</span>
          <span class="prod-ordenar-precio">${escHtml(precio)}</span>
          <span class="${p.activo ? 'badge-activo' : 'badge-inactivo'} prod-ordenar-badge">${p.activo ? 'Activo' : 'Inactivo'}</span>
        </li>`;
    }).join('');

    return `
      <div class="cat-ordenar-card" draggable="true" data-cat-id="${cat.id}">
        <div class="cat-ordenar-header">
          <i class="fa fa-grip-vertical drag-handle"></i>
          <span class="cat-ordenar-emoji">${cat.emoji || '🍽️'}</span>
          <strong class="cat-ordenar-nombre">${escHtml(cat.nombre)}</strong>
          <span class="cat-ordenar-count">${productosCat.length} producto${productosCat.length === 1 ? '' : 's'}</span>
          <div class="cat-ordenar-sort-btns">
            <button type="button" data-cat-id="${cat.id}" data-sort="nombre-asc" title="Nombre A-Z"><i class="fa fa-arrow-down-a-z"></i></button>
            <button type="button" data-cat-id="${cat.id}" data-sort="nombre-desc" title="Nombre Z-A"><i class="fa fa-arrow-up-a-z"></i></button>
            <button type="button" data-cat-id="${cat.id}" data-sort="precio-asc" title="Precio: menor a mayor"><i class="fa fa-arrow-down-1-9"></i></button>
            <button type="button" data-cat-id="${cat.id}" data-sort="precio-desc" title="Precio: mayor a menor"><i class="fa fa-arrow-up-9-1"></i></button>
          </div>
          <button type="button" class="cat-ordenar-toggle" title="Expandir/colapsar">
            <i class="fa fa-chevron-down"></i>
          </button>
        </div>
        <ul class="lista-productos-ordenar" data-cat-id="${cat.id}">
          ${itemsHtml || '<li class="ordenar-vacio">Sin productos en esta categoría.</li>'}
        </ul>
      </div>`;
  }).join('');

  configurarArrastreOrdenar();
  configurarBotonesSortOrdenar();
  configurarTogglesOrdenar();
  renderPreviewOrdenar();
}

// ---- Drag & drop genérico ----
function habilitarArrastre(contenedor, selectorItem, onDrop) {
  let arrastrando = null;

  contenedor.addEventListener('dragstart', (e) => {
    const item = e.target.closest(selectorItem);
    if (!item || !contenedor.contains(item)) return;
    e.stopPropagation();
    arrastrando = item;
    item.classList.add('arrastrando');
    e.dataTransfer.effectAllowed = 'move';
  });

  contenedor.addEventListener('dragover', (e) => {
    if (!arrastrando) return;
    e.preventDefault();
    e.stopPropagation();
    const item = e.target.closest(selectorItem);
    if (!item || item === arrastrando) return;
    const rect = item.getBoundingClientRect();
    const despuesDe = (e.clientY - rect.top) / rect.height > 0.5;
    item.parentElement.insertBefore(arrastrando, despuesDe ? item.nextSibling : item);
  });

  contenedor.addEventListener('drop', (e) => {
    if (!arrastrando) return;
    e.preventDefault();
    e.stopPropagation();
  });

  contenedor.addEventListener('dragend', async () => {
    if (!arrastrando) return;
    arrastrando.classList.remove('arrastrando');
    arrastrando = null;
    await onDrop();
  });
}

function configurarArrastreOrdenar() {
  const listaCategorias = document.getElementById('lista-categorias-ordenar');
  if (!listaCategorias) return;

  habilitarArrastre(listaCategorias, '.cat-ordenar-card', async () => {
    const ids = [...listaCategorias.querySelectorAll('.cat-ordenar-card')].map(el => el.dataset.catId);
    await guardarOrdenCategorias(ids);
  });

  document.querySelectorAll('.lista-productos-ordenar').forEach(ul => {
    habilitarArrastre(ul, '.prod-ordenar-item', async () => {
      const ids = [...ul.querySelectorAll('.prod-ordenar-item')].map(el => el.dataset.prodId).filter(Boolean);
      await guardarOrdenProductosCategoria(ul.dataset.catId, ids);
    });
  });
}

function configurarBotonesSortOrdenar() {
  document.querySelectorAll('.cat-ordenar-sort-btns button').forEach(btn => {
    btn.addEventListener('click', () => ordenarProductosCategoria(btn.dataset.catId, btn.dataset.sort));
  });
}

function configurarTogglesOrdenar() {
  document.querySelectorAll('.cat-ordenar-card').forEach(card => {
    const btn = card.querySelector('.cat-ordenar-toggle');
    const ul = card.querySelector('.lista-productos-ordenar');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const colapsado = ul.style.display === 'none';
      ul.style.display = colapsado ? '' : 'none';
      btn.querySelector('i').className = colapsado ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
    });
  });
}

// ---- Ordenamiento rápido por nombre/precio ----
function ordenarProductosCategoria(catId, criterio) {
  const lista = productos.filter(p => p.categoria_id === catId);
  let ordenados;

  switch (criterio) {
    case 'nombre-asc': ordenados = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
    case 'nombre-desc': ordenados = [...lista].sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
    case 'precio-asc': ordenados = [...lista].sort((a, b) => a.precio - b.precio); break;
    case 'precio-desc': ordenados = [...lista].sort((a, b) => b.precio - a.precio); break;
    default: return;
  }

  guardarOrdenProductosCategoria(catId, ordenados.map(p => p.id));
}

// ---- Persistencia en Supabase ----
async function persistirOrden(tabla, idsOrdenados) {
  try {
    await apiClient.reorder(tabla, idsOrdenados);
    return true;
  } catch (error) {
    return false;
  }
}

async function guardarOrdenCategorias(idsOrdenados) {
  const ok = await persistirOrden('categorias', idsOrdenados);
  if (!ok) { mostrarToast('Error al guardar el orden de categorías', 'error'); return; }

  idsOrdenados.forEach((id, idx) => {
    const cat = categorias.find(c => c.id === id);
    if (cat) cat.orden = (idx + 1) * 10;
  });

  mostrarToast('Orden de categorías actualizado');
  renderizarTablaCategorias();
  renderOrdenarTab();
}

async function guardarOrdenProductosCategoria(catId, idsOrdenados) {
  const ok = await persistirOrden('productos', idsOrdenados);
  if (!ok) { mostrarToast('Error al guardar el orden de productos', 'error'); return; }

  idsOrdenados.forEach((id, idx) => {
    const p = productos.find(x => x.id === id);
    if (p) p.orden = (idx + 1) * 10;
  });

  mostrarToast('Orden de productos actualizado');
  renderizarTablaProductos(productos);
  renderOrdenarTab();
}

// ---- Vista previa en vivo (réplica del menú público) ----
function renderPreviewOrdenar() {
  const contenedor = document.getElementById('preview-menu-contenedor');
  const selectVista = document.getElementById('preview-vista-categoria');
  if (!contenedor || !selectVista) return;

  const vista = selectVista.value || 'todos';
  const categoriasActivas = [...categorias].filter(c => c.activo).sort((a, b) => a.orden - b.orden);
  const productosActivos = productos.filter(p => p.activo);

  let lista;
  if (vista === 'todos') {
    lista = categoriasActivas.flatMap(cat =>
      productosActivos.filter(p => p.categoria_id === cat.id).sort((a, b) => a.orden - b.orden)
    );
  } else {
    lista = productosActivos.filter(p => p.categoria_id === vista).sort((a, b) => a.orden - b.orden);
  }

  contenedor.innerHTML = lista.length
    ? lista.map(p => crearTarjetaPreviewOrdenar(p)).join('')
    : '<p class="ordenar-preview-vacio">No hay productos activos en esta vista.</p>';
}

function crearTarjetaPreviewOrdenar(p) {
  const imgHtml = p.imagen_url
    ? `<img src="${escHtml(p.imagen_url)}" alt="${escHtml(p.nombre)}" loading="lazy">`
    : `<div class="card-sin-imagen">🍽️</div>`;

  const badgeHtml = p.etiqueta ? `<span class="card-badge">${escHtml(p.etiqueta)}</span>` : '';
  const descHtml = p.descripcion ? `<p class="card-desc">${escHtml(p.descripcion)}</p>` : '';
  const precioDisplay = p.precio_display || `$${Number(p.precio || 0).toLocaleString('es-CO')}`;

  return `
    <div class="card">
      <div class="card-imagen">
        ${imgHtml}
        ${badgeHtml}
      </div>
      <div class="card-body">
        <h3>${escHtml(p.nombre)}</h3>
        ${descHtml}
        <div class="card-footer-row">
          <span class="price">${escHtml(precioDisplay)}</span>
          <button class="btn-ver" title="Ver detalles"><i class="fa fa-eye"></i></button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// SEGURIDAD - Escapar HTML para evitar XSS
// ============================================================
function escHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

