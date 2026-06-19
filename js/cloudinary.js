// ============================================================
// SERVICIO DE CLOUDINARY - Sol Naciente
// ============================================================
class CloudinaryService {
  constructor() {
    this.cloudName = 'dczdtij3q';
    this.apiKey = '524963822198547';
    this.uploadPreset = 'luni_products';
    this.folder = 'menusolnaciente';
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  }

  // Sube una imagen y devuelve la URL segura
  async subirImagen(archivo) {
    const form = new FormData();
    form.append('file', archivo);
    form.append('upload_preset', this.uploadPreset);
    form.append('folder', this.folder);

    const respuesta = await fetch(this.uploadUrl, {
      method: 'POST',
      body: form
    });

    if (!respuesta.ok) {
      const error = await respuesta.json();
      throw new Error(error.error?.message || 'Error al subir la imagen');
    }

    const datos = await respuesta.json();
    return datos.secure_url;
  }

  // Extrae el public_id de una URL de Cloudinary para poder eliminarla
  obtenerPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    const partes = url.split('/');
    const desde = partes.indexOf('upload') + 2; // saltar la versión
    const publicIdConExtension = partes.slice(desde).join('/');
    return publicIdConExtension.replace(/\.[^/.]+$/, '');
  }
}

const cloudinaryService = new CloudinaryService();
