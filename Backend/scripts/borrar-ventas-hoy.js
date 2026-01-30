// Script solo para pruebas: borra las ventas de hoy y restaura el stock.
// Ejecutar desde la carpeta Backend: node scripts/borrar-ventas-hoy.js
import prisma from '../db.js';

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const manana = new Date(hoy);
manana.setDate(manana.getDate() + 1);

async function main() {
  const movimientos = await prisma.movimientoStock.findMany({
    where: {
      tipo: 'venta',
      fecha: { gte: hoy, lt: manana }
    },
    include: { producto: { select: { id: true } } }
  });

  if (movimientos.length === 0) {
    console.log('No hay ventas de hoy para borrar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Restaurar stock por producto (cantidad en venta es negativa)
    const porProducto = {};
    for (const m of movimientos) {
      const q = Math.abs(m.cantidad);
      porProducto[m.productoId] = (porProducto[m.productoId] || 0) + q;
    }
    for (const [productoId, cantidad] of Object.entries(porProducto)) {
      await tx.producto.update({
        where: { id: parseInt(productoId, 10) },
        data: { stock: { increment: cantidad } }
      });
    }
    await tx.movimientoStock.deleteMany({
      where: {
        tipo: 'venta',
        fecha: { gte: hoy, lt: manana }
      }
    });
  });

  console.log(`Se borraron ${movimientos.length} movimiento(s) de venta de hoy y se restauró el stock.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
