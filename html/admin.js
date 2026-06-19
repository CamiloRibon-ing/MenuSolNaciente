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

    // Verificar que sea admin
    const { data: perfil, error: perfilError } = await db
      .from('perfiles')
      .select('nombre, rol')
      .eq('id', data.user.id)
      .single();

    if (perfilError || !perfil) throw new Error('No se pudo obtener el perfil.');
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

  const { data: perfil } = await db
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', session.user.id)
    .single();

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
  });
});

// ============================================================
// CATEGORÍAS - CARGA Y TABLA
// ============================================================

async function cargarCategorias() {
  const { data, error } = await db
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    mostrarToast('Error al cargar categorías', 'error');
    return;
  }

  categorias = data || [];
  renderizarTablaCategorias();
  actualizarSelectCategorias();
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
  document.getElementById('categoria-slug').value = cat.slug;
  document.getElementById('categoria-orden').value = cat.orden;
  document.getElementById('categoria-activa').checked = cat.activo;
  document.getElementById('modal-categoria-titulo').textContent = 'Editar Categoría';
  ocultarError('error-categoria');
  abrirModal('modal-categoria');
}

// ---- Toggle activo/inactivo categoría ----
async function toggleCategoria(id, activo) {
  const { error } = await db
    .from('categorias')
    .update({ activo: !activo })
    .eq('id', id);

  if (error) { mostrarToast('Error al actualizar', 'error'); return; }
  mostrarToast(`Categoría ${!activo ? 'activada' : 'desactivada'}`);
  await cargarCategorias();
}

// ---- Guardar categoría (crear o actualizar) ----
document.getElementById('form-categoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError('error-categoria');

  const id = document.getElementById('categoria-id').value;
  const datos = {
    nombre: document.getElementById('categoria-nombre').value.trim(),
    emoji: document.getElementById('categoria-emoji').value.trim() || '🍽️',
    slug: document.getElementById('categoria-slug').value.trim().toLowerCase(),
    orden: parseInt(document.getElementById('categoria-orden').value) || 0,
    activo: document.getElementById('categoria-activa').checked
  };

  const btnTexto = document.getElementById('texto-btn-categoria');
  const spinner = document.getElementById('spinner-categoria');
  const btn = document.getElementById('btn-guardar-categoria');

  btn.disabled = true;
  btnTexto.style.display = 'none';
  spinner.style.display = 'inline-block';

  try {
    let error;
    if (id) {
      ({ error } = await db.from('categorias').update(datos).eq('id', id));
    } else {
      ({ error } = await db.from('categorias').insert(datos));
    }

    if (error) throw error;

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
    const { error } = await db.from('categorias').delete().eq('id', id);
    if (error) {
      mostrarToast('No se puede eliminar: tiene productos asociados.', 'error');
    } else {
      mostrarToast('Categoría eliminada');
      await cargarCategorias();
      await cargarProductos();
    }
  };
  abrirModal('modal-confirmar');
}

// ============================================================
// PRODUCTOS - CARGA Y TABLA
// ============================================================

async function cargarProductos() {
  const { data, error } = await db
    .from('productos')
    .select('*, categorias(nombre, emoji)')
    .order('orden', { ascending: true });

  if (error) {
    mostrarToast('Error al cargar productos', 'error');
    return;
  }

  productos = data || [];
  renderizarTablaProductos(productos);
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
}

// ---- Previsualización de imagen ----
document.getElementById('imagen-archivo').addEventListener('change', async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  // Vista previa local mientras sube
  const lector = new FileReader();
  lector.onload = (ev) => {
    const preview = document.getElementById('imagen-preview');
    preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
  };
  lector.readAsDataURL(archivo);

  // Subir a Cloudinary
  const progreso = document.getElementById('progreso-upload');
  progreso.style.display = 'block';

  try {
    const url = await cloudinaryService.subirImagen(archivo);
    document.getElementById('producto-imagen-url').value = url;
    document.getElementById('btn-quitar-imagen').style.display = 'inline-flex';
    mostrarToast('Imagen subida correctamente');
  } catch (err) {
    mostrarToast('Error al subir la imagen: ' + err.message, 'error');
    document.getElementById('producto-imagen-url').value = '';
  } finally {
    progreso.style.display = 'none';
  }
});

document.getElementById('btn-quitar-imagen').addEventListener('click', () => {
  document.getElementById('producto-imagen-url').value = '';
  document.getElementById('imagen-archivo').value = '';
  document.getElementById('btn-quitar-imagen').style.display = 'none';
  const preview = document.getElementById('imagen-preview');
  preview.innerHTML = `<i class="fa fa-image icono-imagen"></i><p>Sin imagen</p>`;
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
  abrirModal('modal-producto');
}

// ---- Toggle activo/inactivo producto ----
async function toggleProducto(id, activo) {
  const { error } = await db
    .from('productos')
    .update({ activo: !activo })
    .eq('id', id);

  if (error) { mostrarToast('Error al actualizar', 'error'); return; }
  mostrarToast(`Producto ${!activo ? 'activado' : 'desactivado'}`);
  await cargarProductos();
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
    let error;
    if (id) {
      ({ error } = await db.from('productos').update(datos).eq('id', id));
    } else {
      ({ error } = await db.from('productos').insert(datos));
    }

    if (error) throw error;

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
    const { error } = await db.from('productos').delete().eq('id', id);
    if (error) {
      mostrarToast('Error al eliminar el producto.', 'error');
    } else {
      mostrarToast('Producto eliminado');
      await cargarProductos();
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

