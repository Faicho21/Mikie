import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './db.js';
import dotenv from 'dotenv';
import empleadoRoutes from './routes/empleado.js';
import productoRoutes from './routes/producto.js';
import movimientoRoutes from './routes/movimiento.js';
import syncRoutes from './routes/sync.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Manejador global de errores: log en consola y respuesta JSON
fastify.setErrorHandler((err, request, reply) => {
  console.error('[Backend Error]', err.message);
  console.error(err.stack);
  request.log.error(err);
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Error interno del servidor';
  return reply.code(statusCode).send({ error: message });
});

// Registrar CORS para permitir acceso desde el frontend
await fastify.register(cors, {
  origin: true, // En producción, especificar el dominio del frontend
  credentials: true
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Registrar rutas
await fastify.register(empleadoRoutes, { prefix: '/api/empleados' });
await fastify.register(productoRoutes, { prefix: '/api/productos' });
await fastify.register(movimientoRoutes, { prefix: '/api/movimientos' });
await fastify.register(syncRoutes, { prefix: '/api/sync' });

// Iniciar servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend corriendo en http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();

