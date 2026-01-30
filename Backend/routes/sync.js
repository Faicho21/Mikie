import prisma from '../db.js';

export default async function syncRoutes(fastify, options) {
  // Endpoint para sincronizar datos offline
  // Recibe un array de movimientos guardados offline y los procesa
  fastify.post('/movimientos', async (request, reply) => {
    const { movimientos } = request.body;

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return reply.code(400).send({ error: 'Array de movimientos requerido' });
    }

    const resultados = [];
    const errores = [];

    for (const mov of movimientos) {
      try {
        const { empleadoId, productoId, cantidad, tipo, fecha } = mov;

        // Validar datos
        if (!empleadoId || !productoId || !cantidad || !tipo) {
          errores.push({ movimiento: mov, error: 'Datos incompletos' });
          continue;
        }

        // Verificar empleado
        const empleado = await prisma.empleado.findUnique({
          where: { id: parseInt(empleadoId) }
        });

        if (!empleado || !empleado.activo) {
          errores.push({ movimiento: mov, error: 'Empleado no válido' });
          continue;
        }

        // Verificar producto
        const producto = await prisma.producto.findUnique({
          where: { id: parseInt(productoId) }
        });

        if (!producto || !producto.activo) {
          errores.push({ movimiento: mov, error: 'Producto no válido' });
          continue;
        }

        // Procesar movimiento según tipo
        if (tipo === 'venta') {
          if (producto.stock < cantidad) {
            errores.push({ 
              movimiento: mov, 
              error: 'Stock insuficiente',
              stockDisponible: producto.stock
            });
            continue;
          }

          const resultado = await prisma.$transaction(async (tx) => {
            const movimiento = await tx.movimientoStock.create({
              data: {
                empleadoId: parseInt(empleadoId),
                productoId: parseInt(productoId),
                cantidad: -parseInt(cantidad),
                tipo: 'venta',
                fecha: fecha ? new Date(fecha) : new Date()
              }
            });

            await tx.producto.update({
              where: { id: parseInt(productoId) },
              data: { stock: { decrement: parseInt(cantidad) } }
            });

            return movimiento;
          });

          resultados.push({ movimiento: mov, procesado: resultado });
        } else if (tipo === 'reposicion') {
          const resultado = await prisma.$transaction(async (tx) => {
            const movimiento = await tx.movimientoStock.create({
              data: {
                empleadoId: parseInt(empleadoId),
                productoId: parseInt(productoId),
                cantidad: parseInt(cantidad),
                tipo: 'reposicion',
                fecha: fecha ? new Date(fecha) : new Date()
              }
            });

            await tx.producto.update({
              where: { id: parseInt(productoId) },
              data: { stock: { increment: parseInt(cantidad) } }
            });

            return movimiento;
          });

          resultados.push({ movimiento: mov, procesado: resultado });
        } else {
          errores.push({ movimiento: mov, error: 'Tipo de movimiento inválido' });
        }
      } catch (error) {
        errores.push({ movimiento: mov, error: error.message });
      }
    }

    return {
      procesados: resultados.length,
      errores: errores.length,
      resultados,
      errores
    };
  });

  // Obtener datos para sincronización inicial (productos, empleados)
  fastify.get('/datos', async (request, reply) => {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        codigoBarra: true,
        precio: true,
        stock: true,
        updatedAt: true
      }
    });

    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        updatedAt: true
      }
    });

    return {
      productos,
      empleados,
      timestamp: new Date().toISOString()
    };
  });
}

