import prisma from '../db.js';

export default async function productoRoutes(fastify, options) {
  // Buscar producto por código de barras
  fastify.get('/buscar/:codigo', async (request, reply) => {
    const { codigo } = request.params;

    const producto = await prisma.producto.findFirst({
      where: {
        OR: [
          { codigoBarra: codigo },
          { nombre: { contains: codigo, mode: 'insensitive' } }
        ],
        activo: true
      }
    });

    if (!producto) {
      return reply.code(404).send({ error: 'Producto no encontrado' });
    }

    return { producto };
  });

  // Obtener todos los productos
  fastify.get('/', async (request, reply) => {
    const { activo } = request.query;
    
    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    return { productos };
  });

  // Obtener producto por ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!producto) {
      return reply.code(404).send({ error: 'Producto no encontrado' });
    }

    return { producto };
  });

  // Crear producto
  fastify.post('/', async (request, reply) => {
    const { nombre, codigoBarra, precio, stock, stockMinimo } = request.body;

    if (!nombre || precio === undefined) {
      return reply.code(400).send({ error: 'Nombre y precio requeridos' });
    }

    try {
      const producto = await prisma.producto.create({
        data: {
          nombre,
          codigoBarra: codigoBarra || null,
          precio: parseFloat(precio),
          stock: stock ? parseInt(stock) : 0,
          ...(stockMinimo !== undefined && { stockMinimo: parseInt(stockMinimo) })
        }
      });

      return reply.code(201).send({ producto });
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Código de barras ya existe' });
      }
      throw error;
    }
  });

  // Actualizar producto
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { nombre, codigoBarra, precio, stock, stockMinimo, activo } = request.body;

    try {
      const producto = await prisma.producto.update({
        where: { id: parseInt(id) },
        data: {
          ...(nombre && { nombre }),
          ...(codigoBarra !== undefined && { codigoBarra }),
          ...(precio !== undefined && { precio: parseFloat(precio) }),
          ...(stockMinimo !== undefined && { stockMinimo: parseInt(stockMinimo) }),
          ...(stock !== undefined && { stock: parseInt(stock) }),
          ...(activo !== undefined && { activo })
        }
      });

      return { producto };
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Producto no encontrado' });
      }
      throw error;
    }
  });

  // Eliminar producto (soft delete)
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const producto = await prisma.producto.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      });

      return { producto };
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Producto no encontrado' });
      }
      throw error;
    }
  });
}

