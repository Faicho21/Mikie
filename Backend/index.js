import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './db.js';
import { config } from './config/index.js';
import { routes } from './routes/index.js';

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

// Registrar rutas (modular)
for (const { plugin, prefix } of routes) {
  await fastify.register(plugin, { prefix });
}

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🚀 Backend corriendo en http://localhost:${config.port}`);
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

