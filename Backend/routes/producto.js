import prisma from '../db.js';

export default async function productoRoutes(fastify, options) {
  // Buscar producto por código de barras
  fastify.get('/buscar/:codigo', async (request, reply) => {
    const { codigo } = request.params;

    const producto = await prisma.producto.findFirst({
      where: {
        OR: [
          { codigoBarra: codigo },
          { nombre: { contains: codigo } },
          { marca: { contains: codigo } }
        ],
        activo: true
      }
    });

    if (!producto) {
      return reply.code(404).send({ error: 'Producto no encontrado' });
    }

    return { producto };
  });

  // Obtener productos (paginado opcional: limit, offset; si no se envían, devuelve todos)
  fastify.get('/', async (request, reply) => {
    const { activo, limit, offset } = request.query;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const hasPagination = limit != null && limit !== '';
    const take = hasPagination ? Math.min(Math.max(1, parseInt(limit) || 50), 200) : undefined;
    const skip = hasPagination && offset != null && offset !== '' ? Math.max(0, parseInt(offset)) : 0;

    const [total, productos] = await Promise.all([
      prisma.producto.count({ where }),
      prisma.producto.findMany({
        where,
        orderBy: { nombre: 'asc' },
        ...(take != null && { take, skip })
      })
    ]);

    return hasPagination ? { productos, total } : { productos, total };
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
    const { nombre, marca, codigoBarra, precio, stock, stockMinimo } = request.body;

    if (!nombre || precio === undefined) {
      return reply.code(400).send({ error: 'Nombre y precio requeridos' });
    }

    try {
      const producto = await prisma.producto.create({
        data: {
          nombre,
          marca: marca ? String(marca).trim() || null : null,
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
    const { nombre, marca, codigoBarra, precio, stock, stockMinimo, activo } = request.body;

    try {
      const producto = await prisma.producto.update({
        where: { id: parseInt(id) },
        data: {
          ...(nombre && { nombre }),
          ...(marca !== undefined && { marca: marca ? String(marca).trim() || null : null }),
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
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum < 1) {
      return reply.code(400).send({ error: 'ID de producto inválido' });
    }

    try {
      const producto = await prisma.producto.update({
        where: { id: idNum },
        data: { activo: false }
      });

      return reply.send({ producto });
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Producto no encontrado' });
      }
      throw error;
    }
  });
}

