// ============================================================
// SERVICIO DE CLOUDINARY - Sol Naciente
// La subida real se firma en /api/cloudinary-upload (Vercel).
// ============================================================
class CloudinaryService {
  constructor() {
    this.uploadUrl = '/api/cloudinary-upload';
    this.maxSizeMb = 5;
  }

  async subirImagen(archivo) {
    if (!archivo) throw new Error('Selecciona una imagen.');
    if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
    if (archivo.size > this.maxSizeMb * 1024 * 1024) {
      throw new Error(`La imagen no debe superar ${this.maxSizeMb} MB.`);
    }

    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesión como administrador.');
    }

    const firma = await this.obtenerFirma(session.access_token);
    const form = new FormData();
    form.append('file', archivo);
    form.append('api_key', firma.apiKey);
    form.append('timestamp', String(firma.timestamp));
    form.append('folder', firma.folder);
    form.append('signature', firma.signature);

    const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
      method: 'POST',
      body: form
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error?.message || 'Error al subir la imagen');
    }

    return datos.secure_url;
  }

  async obtenerFirma(accessToken) {
    const respuesta = await fetch(this.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudo autorizar la subida.');
    }

    return datos;
  }
}

const cloudinaryService = new CloudinaryService();
