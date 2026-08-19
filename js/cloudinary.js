// ============================================================
// SERVICIO DE CLOUDINARY - Sol Naciente
// Delega la subida al backend TypeScript en /api/uploads.
// ============================================================
class CloudinaryService {
  constructor() {
    this.maxSizeMb = 3;
  }

  async subirImagen(archivo) {
    if (!archivo) throw new Error('Selecciona una imagen.');
    if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
    if (archivo.size > this.maxSizeMb * 1024 * 1024) {
      throw new Error(`La imagen no debe superar ${this.maxSizeMb} MB.`);
    }

    const datos = await apiClient.uploadImage(archivo);
    return datos.secure_url;
  }
}

const cloudinaryService = new CloudinaryService();
