const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3005;

// Variables globales
let webhookHistory = [];
let responseMode = "valid"; // "valid", "404", "not-user", "not-approved", "not-opted"

// Middleware para analizar JSON
app.use(bodyParser.json());

// Servir archivos estáticos (CSS, JS, etc.)
app.use(express.static(__dirname));

// Ruta principal - sirve testwebhook.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'testwebhook.html'));
});

// API Endpoints para webhooks
// 1. Recibir webhooks
app.post('/api/webhook/receive', (req, res) => {
  let responseStatus = 200;
  let responseBody = { success: true, message: 'Webhook recibido' };
  let isValid = true;

  switch(responseMode) {
    case "404":
      responseStatus = 400;
      responseBody = {
        error: {
          message: "Not Found"
        }
      };
      isValid = false;
      break;
    case "not-user":
      responseStatus = 400;
      responseBody = {
        error: {
          message: "Recipient is not a WhatsApp user"
        }
      };
      isValid = false;
      break;
    case "not-approved":
      responseStatus = 400;
      responseBody = {
        error: {
          message: "Template not approved"
        }
      };
      isValid = false;
      break;
    case "not-opted":
      responseStatus = 400;
      responseBody = {
        error: {
          message: "Phone number not opted in"
        }
      };
      isValid = false;
      break;
    // Predeterminado: válido
  }

  const webhook = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    payload: req.body,
    headers: req.headers,
    isValid: isValid,
    responseStatus: responseStatus,
    responseBody: responseBody
  };

  console.log('Webhook recibido:', JSON.stringify(webhook.payload, null, 2));
  console.log('Respuesta:', responseStatus, JSON.stringify(responseBody, null, 2));
  webhookHistory.unshift(webhook);
  if (webhookHistory.length > 20) {
    webhookHistory = webhookHistory.slice(0, 20);
  }
  res.status(responseStatus).json(responseBody);
});

// 2. Validar JSON
app.post('/api/webhook/validate', (req, res) => {
  try {
    const payload = req.body;
    
    if (!validResponseEnabled || !payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Payload inválido: vacío o ausente' 
      });
    }
    
    res.status(200).json({ 
      valid: true, 
      message: 'Payload válido' 
    });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      message: `Error de validación: ${error.message}` 
    });
  }
});

// 3. Obtener historial de webhooks
app.get('/api/webhook/history', (req, res) => {
  res.status(200).json(webhookHistory);
});

// 4. Limpiar historial de webhooks
app.post('/api/webhook/clear', (req, res) => {
  webhookHistory = [];
  console.log('Historial de webhooks borrado');
  res.status(200).json({ success: true, message: 'Historial borrado' });
});

// 5. Forzar webhook inválido
app.post('/api/webhook/force-invalid', (req, res) => {
  const webhook = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    payload: req.body,
    isValid: false
  };

  console.log('Webhook inválido forzado:', JSON.stringify(webhook.payload, null, 2));
  
  webhookHistory.unshift(webhook);
  if (webhookHistory.length > 20) {
    webhookHistory = webhookHistory.slice(0, 20);
  }
  
  res.status(200).json({ success: true, message: 'Webhook inválido registrado' });
});

// 6. Cambiar estado de validación
app.post('/api/webhook/set-response', (req, res) => {
  responseMode = req.body.mode;
  console.log(`Modo de respuesta cambiado a: ${responseMode}`);
  res.status(200).json({ success: true, mode: responseMode });
});

// 7. Obtener estado de validación
app.get('/api/webhook/get-mode', (req, res) => {
  res.status(200).json({ mode: responseMode });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor webhook ejecutándose en http://localhost:${PORT}`);
});