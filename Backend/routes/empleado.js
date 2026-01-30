import prisma from '../db.js';

export default async function empleadoRoutes(fastify, options) {
  // Login por PIN
  fastify.post('/login', async (request, reply) => {
    const { pin } = request.body;

    if (!pin) {
      return reply.code(400).send({ error: 'PIN requerido' });
    }

    const empleado = await prisma.empleado.findUnique({
      where: { pin },
      select: {
        id: true,
        nombre: true,
        pin: false, // No devolver el PIN por seguridad
        activo: true
      }
    });

    if (!empleado || !empleado.activo) {
      return reply.code(401).send({ error: 'PIN inválido o empleado inactivo' });
    }

    return { empleado };
  });

  // Obtener todos los empleados (para admin)
  fastify.get('/', async (request, reply) => {
    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        activo: true,
        createdAt: true
      },
      orderBy: { nombre: 'asc' }
    });

    return { empleados };
  });

  // Cambiar PIN del empleado
  fastify.post('/cambiar-pin', async (request, reply) => {
    const { pinActual, pinNuevo } = request.body;

    if (!pinActual || !pinNuevo) {
      return reply.code(400).send({ error: 'PIN actual y PIN nuevo requeridos' });
    }

    const empleado = await prisma.empleado.findUnique({
      where: { pin: pinActual }
    });

    if (!empleado || !empleado.activo) {
      return reply.code(401).send({ error: 'PIN actual incorrecto o empleado inactivo' });
    }

    try {
      const actualizado = await prisma.empleado.update({
        where: { id: empleado.id },
        data: { pin: pinNuevo },
        select: {
          id: true,
          nombre: true,
          activo: true
        }
      });

      return { empleado: actualizado };
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'El nuevo PIN ya está en uso por otro empleado' });
      }
      throw error;
    }
  });

  // Crear empleado
  fastify.post('/', async (request, reply) => {
    const { nombre, pin } = request.body;

    if (!nombre || !pin) {
      return reply.code(400).send({ error: 'Nombre y PIN requeridos' });
    }

    try {
      const empleado = await prisma.empleado.create({
        data: { nombre, pin },
        select: {
          id: true,
          nombre: true,
          activo: true
        }
      });

      return reply.code(201).send({ empleado });
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'PIN ya existe' });
      }
      throw error;
    }
  });
}

