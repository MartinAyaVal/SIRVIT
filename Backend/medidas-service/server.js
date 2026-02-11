// medidas-service/server.js
const express = require('express');
const cors = require('cors');
const medidasRoutes = require('./routes/medidasRoutes.js');

const app = express();
const PORT = process.env.PORT || 3002;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID', 'X-User-Documento', 'X-User-Rol', 'X-User-Nombre', 'X-User-Comisaria']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== RUTAS API =====
app.use('/api/medidas', medidasRoutes);

// ===== RUTAS DEL SERVICIO =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'medidas-service',
    timestamp: new Date().toISOString(),
    endpoints: {
      createMedidaCompleta: 'POST /api/medidas/completa/nueva',
      getMedidas: 'GET /api/medidas',
      getMedidaCompleta: 'GET /api/medidas/completa/:id'
    }
  });
});

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    service: 'medidas-service',
    port: PORT,
    status: 'active',
    timestamp: new Date().toISOString(),
    note: 'Este servicio es accedido a través del gateway en puerto 8080',
    exampleRequest: {
      method: 'POST',
      url: 'http://localhost:8080/usuarios/completa/nueva',
      headers: {
        'Authorization': 'Bearer [tu_token]',
        'Content-Type': 'application/json'
      },
      body: {
        medida: {
          numeroMedida: 1001,
          lugarHechos: "Calle 123",
          tipoViolencia: "fisica",
          fechaUltimosHechos: "2024-12-24",
          horaUltimosHechos: "14:30:00",
          comisariaId: 1,
          usuarioId: 1
        },
        victimario: { /* ... */ },
        victimas: [ /* ... */ ]
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.path} no existe en medidas-service`,
    availableEndpoints: [
      'POST /api/medidas/completa/nueva',
      'GET /api/medidas',
      'GET /api/medidas/completa/:id',
      'GET /health'
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MEDIDAS-SERVICE');
  console.log('='.repeat(60));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api/medidas`);
  console.log('='.repeat(60));
  console.log('\n🎯 ACCESO A TRAVÉS DEL GATEWAY:');
  console.log('   🟢 POST http://localhost:8080/medidas/completa/nueva'); 
  console.log('   🔵 GET  http://localhost:8080/medidas/*');
  console.log('='.repeat(60) + '\n');
});