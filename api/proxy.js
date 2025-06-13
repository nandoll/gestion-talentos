// Vercel Function para proxy seguro al backend API
export default async function handler(req, res) {
  // Obtener URL del backend desde variables de entorno
  const API_URL = process.env.API_URL;

  if (!API_URL) {
    console.error('API_URL environment variable not configured');
    return res.status(500).json({ error: 'Backend API not configured' });
  }

  // Construir la URL destino manteniendo query parameters
  const { url, method, headers, body } = req;
  const path = url.replace('/api/proxy', '');
  const targetUrl = `${API_URL}${path}`;

  try {
    // Preparar headers para el backend
    const forwardHeaders = {};

    // Copiar headers importantes
    ['content-type', 'authorization', 'accept', 'user-agent'].forEach(
      (header) => {
        if (headers[header]) {
          forwardHeaders[header] = headers[header];
        }
      }
    );

    // Configurar la petición al backend
    const fetchOptions = {
      method,
      headers: forwardHeaders,
    };

    // Agregar body si existe (para POST, PUT, PATCH)
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = body;
    }

    // Hacer la petición al backend
    const response = await fetch(targetUrl, fetchOptions);

    // Leer la respuesta
    const responseData = await response.text();

    // Configurar headers de respuesta
    res.status(response.status);

    // Copiar headers importantes del backend
    ['content-type', 'cache-control', 'etag'].forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });

    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    // Enviar respuesta
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        res.json(JSON.parse(responseData));
      } catch {
        res.send(responseData);
      }
    } else {
      res.send(responseData);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Error al conectar con el backend API',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
