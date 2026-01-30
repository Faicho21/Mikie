import prisma from '../db.js';

export default async function movimientoRoutes(fastify, options) {
  // Registrar venta
  fastify.post('/venta', async (request, reply) => {
    const { empleadoId, productoId, cantidad } = request.body;

    if (!empleadoId || !productoId || !cantidad) {
      return reply.code(400).send({ 
        error: 'empleadoId, productoId y cantidad requeridos' 
      });
    }

    if (cantidad <= 0) {
      return reply.code(400).send({ error: 'La cantidad debe ser positiva' });
    }

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: parseInt(empleadoId) }
    });

    if (!empleado || !empleado.activo) {
      return reply.code(404).send({ error: 'Empleado no encontrado o inactivo' });
    }

    // Verificar que el producto existe y tiene stock
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) }
    });

    if (!producto || !producto.activo) {
      return reply.code(404).send({ error: 'Producto no encontrado o inactivo' });
    }

    if (producto.stock < cantidad) {
      return reply.code(400).send({ 
        error: 'Stock insuficiente',
        stockDisponible: producto.stock
      });
    }

    // Crear movimiento y actualizar stock en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear movimiento
      const movimiento = await tx.movimientoStock.create({
        data: {
          empleadoId: parseInt(empleadoId),
          productoId: parseInt(productoId),
          cantidad: -parseInt(cantidad), // Negativo para venta
          tipo: 'venta'
        },
        include: {
          empleado: {
            select: { id: true, nombre: true }
          },
          producto: {
            select: { id: true, nombre: true, precio: true }
          }
        }
      });

      // Actualizar stock
      const productoActualizado = await tx.producto.update({
        where: { id: parseInt(productoId) },
        data: {
          stock: {
            decrement: parseInt(cantidad)
          }
        }
      });

      return { movimiento, productoActualizado };
    });

    return reply.code(201).send({
      movimiento: resultado.movimiento,
      nuevoStock: resultado.productoActualizado.stock
    });
  });

  // Registrar venta de múltiples productos (carrito)
  fastify.post('/ventas', async (request, reply) => {
    const { empleadoId, items } = request.body;

    if (!empleadoId || !Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({
        error: 'empleadoId e items (array de { productoId, cantidad }) requeridos'
      });
    }

    const empleado = await prisma.empleado.findUnique({
      where: { id: parseInt(empleadoId) }
    });
    if (!empleado || !empleado.activo) {
      return reply.code(404).send({ error: 'Empleado no encontrado o inactivo' });
    }

    const errores = [];
    for (const item of items) {
      const { productoId, cantidad } = item;
      const cantidadNum = parseInt(cantidad);
      if (!productoId || !cantidadNum || cantidadNum <= 0) {
        errores.push({ productoId, error: 'Cantidad inválida' });
        continue;
      }
      const producto = await prisma.producto.findUnique({
        where: { id: parseInt(productoId) }
      });
      if (!producto || !producto.activo) {
        errores.push({ productoId, error: 'Producto no encontrado o inactivo' });
        continue;
      }
      if (producto.stock < cantidadNum) {
        errores.push({
          productoId,
          error: 'Stock insuficiente',
          stockDisponible: producto.stock
        });
      }
    }
    if (errores.length > 0) {
      return reply.code(400).send({
        error: errores[0].error,
        detalles: errores
      });
    }

    const movimientosCreados = await prisma.$transaction(async (tx) => {
      const resultados = [];
      for (const item of items) {
        const cantidadNum = parseInt(item.cantidad);
        const movimiento = await tx.movimientoStock.create({
          data: {
            empleadoId: parseInt(empleadoId),
            productoId: parseInt(item.productoId),
            cantidad: -cantidadNum,
            tipo: 'venta'
          },
          include: {
            producto: { select: { id: true, nombre: true, precio: true } }
          }
        });
        resultados.push(movimiento);
        await tx.producto.update({
          where: { id: parseInt(item.productoId) },
          data: { stock: { decrement: cantidadNum } }
        });
      }
      return resultados;
    });

    return reply.code(201).send({
      movimientos: movimientosCreados
    });
  });

  // Registrar reposición de stock
  fastify.post('/reposicion', async (request, reply) => {
    const { empleadoId, productoId, cantidad } = request.body;

    if (!empleadoId || !productoId || !cantidad) {
      return reply.code(400).send({ 
        error: 'empleadoId, productoId y cantidad requeridos' 
      });
    }

    if (cantidad <= 0) {
      return reply.code(400).send({ error: 'La cantidad debe ser positiva' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoStock.create({
        data: {
          empleadoId: parseInt(empleadoId),
          productoId: parseInt(productoId),
          cantidad: parseInt(cantidad), // Positivo para reposición
          tipo: 'reposicion'
        },
        include: {
          empleado: {
            select: { id: true, nombre: true }
          },
          producto: {
            select: { id: true, nombre: true }
          }
        }
      });

      const productoActualizado = await tx.producto.update({
        where: { id: parseInt(productoId) },
        data: {
          stock: {
            increment: parseInt(cantidad)
          }
        }
      });

      return { movimiento, productoActualizado };
    });

    return reply.code(201).send({
      movimiento: resultado.movimiento,
      nuevoStock: resultado.productoActualizado.stock
    });
  });

  // Obtener historial de movimientos
  fastify.get('/', async (request, reply) => {
    const { empleadoId, productoId, tipo, desde, hasta, limit } = request.query;

    const where = {};
    if (empleadoId) where.empleadoId = parseInt(empleadoId);
    if (productoId) where.productoId = parseInt(productoId);
    if (tipo) where.tipo = tipo;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }

    const movimientos = await prisma.movimientoStock.findMany({
      where,
      include: {
        empleado: {
          select: { id: true, nombre: true }
        },
        producto: {
          select: { id: true, nombre: true, precio: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: limit ? parseInt(limit) : 100
    });

    return { movimientos };
  });
}

