// ============================================================
// SERVICIO DE CLOUDINARY - Sol Naciente
// Usa el unsigned upload preset configurado en Cloudinary.
// ============================================================
class CloudinaryService {
  constructor() {
    this.cloudName = 'dczdtij3q';
    this.uploadPreset = 'luni_products';
    this.folder = 'menusolnaciente';
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    this.maxSizeMb = 5;
  }

  async subirImagen(archivo) {
    if (!archivo) throw new Error('Selecciona una imagen.');
    if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
    if (archivo.size > this.maxSizeMb * 1024 * 1024) {
      throw new Error(`La imagen no debe superar ${this.maxSizeMb} MB.`);
    }

    const form = new FormData();
    form.append('file', archivo);
    form.append('upload_preset', this.uploadPreset);
    form.append('folder', this.folder);

    const respuesta = await fetch(this.uploadUrl, {
      method: 'POST',
      body: form
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error?.message || 'Error al subir la imagen');
    }

    return datos.secure_url;
  }
}

const cloudinaryService = new CloudinaryService();
