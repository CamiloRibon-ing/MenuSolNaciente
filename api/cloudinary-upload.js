const crypto = require('crypto');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

async function getSupabaseUser(accessToken, supabaseUrl, anonKey) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) return null;
  return response.json();
}

async function isAdmin(userId, supabaseUrl, anonKey, accessToken) {
  const params = new URLSearchParams({
    id: `eq.${userId}`,
    select: 'rol'
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/perfiles?${params}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) return false;
  const perfiles = await response.json();
  return perfiles.some(perfil => perfil.rol === 'admin');
}

function signCloudinaryParams(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${payload}${apiSecret}`)
    .digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const supabaseAnonKey = requiredEnv('SUPABASE_ANON_KEY');
    const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME');
    const apiKey = requiredEnv('CLOUDINARY_API_KEY');
    const apiSecret = requiredEnv('CLOUDINARY_API_SECRET');
    const folder = process.env.CLOUDINARY_FOLDER || 'menusolnaciente';

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'No autorizado.' });

    const user = await getSupabaseUser(token, supabaseUrl, supabaseAnonKey);
    if (!user?.id || !(await isAdmin(user.id, supabaseUrl, supabaseAnonKey, token))) {
      return res.status(403).json({ error: 'Solo administradores pueden subir imágenes.' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { folder, timestamp };
    const signature = signCloudinaryParams(paramsToSign, apiSecret);

    return res.status(200).json({
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error interno.' });
  }
};
