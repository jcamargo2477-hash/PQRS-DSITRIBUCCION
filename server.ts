import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('✨ [LogiControl Server] Gemini client initialized successfully with API key.');
  } else {
    console.log('⚠️ [LogiControl Server] GEMINI_API_KEY is not defined. Falling back to local rules-engine.');
  }

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      hasAi: !!ai,
      timestamp: new Date().toISOString()
    });
  });

  // API 2: Process columns using the real Gemini model or hybrid agent
  app.post('/api/gemini/process-columns', async (req, res) => {
    const { rows, configs } = req.body;

    if (!rows || !Array.isArray(rows) || !configs || !Array.isArray(configs)) {
      return res.status(400).json({ error: 'Parámetros inválidos. Se requiere "rows" y "configs".' });
    }

    // If Gemini key is not configured, reply with fallback indicator so client triggers simulated transformation
    if (!ai) {
      return res.json({ 
        success: true, 
        pipeline: 'local-simulation',
        message: 'Utilizando pila de simulación local interactiva (Faltan secretos en Configuración).'
      });
    }

    try {
      // Execute a batch query to Gemini asking the model to parse the columns, applying user-specified rules
      // For performance & token conservation, we only process the first 10 rows in a tight loop or batch if they are many,
      // Or map them using Gemini's understanding.
      const prompt = `
        Eres un agente experto en ETL (Extract, Transform, Load) para planillas de logística y servicio al cliente (SAC) en Colombia.
        Recibes un conjunto de registros en formato JSON y un mapa de configuración con directrices de qué hacer con las columnas.
        
        Configuraciones:
        ${JSON.stringify(configs.map((c: any) => ({
          columnaOriginal: c.columnName,
          mapeadaAlCampo: c.mappedTo,
          instruccionIA: c.aiInstruction || "Conservar valor crudo"
        })), null, 2)}

        Datos de Entrada:
        ${JSON.stringify(rows.slice(0, 15), null, 2)}

        Por cada registro de entrada:
        1. Mapea la columnaOriginal al mapeadaAlCampo del objeto resultante.
        2. Aplica rigurosamente la instruccionIA (Ej: si dice "Convertir a MAYÚSCULAS", cambia el texto; si dice "formato YYYY-MM-DD", interpreta la fecha; si dice "Anonimizar", oculta apellidos; etc.).
        3. Devuelve los registros resultantes correspondientes en un arreglo JSON que cumpla exactamente con el esquema de salida.
        
        Respeta estos campos de destino y tipos de datos:
        - "id" (string): identificador o radicado limpio.
        - "fecha" (string): fecha formateada (YYYY-MM-DD).
        - "transportadora" (string): nombre de transportadora conocido.
        - "motivo" (string): motivo del reclamo.
        - "cliente" (string): nombre del cliente.
        - "descripcion" (string): descripción detallada de la novedad.
        - "estado" (string): "Abierto", "En proceso" o "Cerrado".
        - "region" (string, opcional): región territorial.
        - "subRegion" (string, opcional): sub-región o ciudad.
        - "costoMercancia" (number): valor numérico de la mercancía.
        - "diasDemora" (number): días de retraso.
        - "guia" (string): número de rastreo.
        - "responsable" (string): agente asignado.
        - "causaRaizSubtema" (string, opcional): deducción de causa raíz en una frase.
        
        Devuelve ÚNICAMENTE un arreglo JSON de objetos que representen los registros transformados. No agregues explicaciones, no uses markdown triple coma, sólo el arreglo JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const responseText = response.text || '[]';
      const transformedRecords = JSON.parse(responseText.trim());

      res.json({
        success: true,
        pipeline: 'gemini-api',
        data: transformedRecords
      });

    } catch (error: any) {
      console.error('Error in Gemini processing server endpoint:', error);
      res.status(500).json({ 
        error: 'Error de servidor procesando con Gemini.',
        details: error.message || String(error)
      });
    }
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [LogiControl Server] Full-stack engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
