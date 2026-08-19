// Cliente de datos compartido por el menú público y el panel administrativo.
const apiClient = {
  async getMenu() {
    const [categoriasResult, productosResult] = await Promise.all([
      db.from('categorias').select('id, nombre, emoji, slug, orden, activo')
        .eq('activo', true).order('orden', { ascending: true }),
      db.from('productos').select('id, nombre, descripcion, precio, precio_display, imagen_url, etiqueta, orden, categoria_id, activo')
        .eq('activo', true).order('orden', { ascending: true })
    ]);

    if (categoriasResult.error) throw categoriasResult.error;
    if (productosResult.error) throw productosResult.error;
    return { categorias: categoriasResult.data || [], productos: productosResult.data || [] };
  },

  async getProfile() {
    const { data: { user }, error: userError } = await db.auth.getUser();
    if (userError || !user) throw userError || new Error('Sesión no válida.');
    const { data, error } = await db.from('perfiles').select('nombre, rol').eq('id', user.id).single();
    if (error) throw error;
    return { profile: data };
  },

  async listCategories() {
    const { data, error } = await db.from('categorias').select('*').order('orden', { ascending: true });
    if (error) throw error;
    return { categorias: data || [] };
  },

  async createCategory(datos) {
    const { data, error } = await db.from('categorias').insert(datos).select().single();
    if (error) throw error;
    return { categoria: data };
  },

  async updateCategory(id, datos) {
    const { data, error } = await db.from('categorias').update(datos).eq('id', id).select().single();
    if (error) throw error;
    return { categoria: data };
  },

  async deleteCategory(id) {
    const { error } = await db.from('categorias').delete().eq('id', id);
    if (error) throw error;
  },

  async listProducts() {
    const { data, error } = await db.from('productos')
      .select('*, categorias(nombre, emoji)').order('orden', { ascending: true });
    if (error) throw error;
    return { productos: data || [] };
  },

  async createProduct(datos) {
    const { data, error } = await db.from('productos').insert(datos).select().single();
    if (error) throw error;
    return { producto: data };
  },

  async updateProduct(id, datos) {
    const { data, error } = await db.from('productos').update(datos).eq('id', id).select().single();
    if (error) throw error;
    return { producto: data };
  },

  async deleteProduct(id) {
    const { error } = await db.from('productos').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(tabla, idsOrdenados) {
    if (!['categorias', 'productos'].includes(tabla)) throw new Error('Tabla no permitida.');
    const resultados = await Promise.all(idsOrdenados.map((id, indice) =>
      db.from(tabla).update({ orden: (indice + 1) * 10 }).eq('id', id)
    ));
    const fallo = resultados.find(resultado => resultado.error);
    if (fallo) throw fallo.error;
  },

  async uploadImage(archivo) {
    const form = new FormData();
    form.append('file', archivo);
    form.append('upload_preset', 'luni_products');
    form.append('folder', 'menusolnaciente');
    const respuesta = await fetch('https://api.cloudinary.com/v1_1/dczdtij3q/image/upload', {
      method: 'POST', body: form
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.error?.message || 'No se pudo subir la imagen.');
    return datos;
  }
};
