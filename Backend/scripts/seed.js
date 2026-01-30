// Script para crear datos iniciales de prueba
import prisma from '../db.js';

async function main() {
  console.log('🌱 Creando datos iniciales...');

  // Crear empleados
  const empleado1 = await prisma.empleado.upsert({
    where: { pin: '1234' },
    update: {},
    create: {
      nombre: 'Juan Pérez',
      pin: '1234',
      activo: true
    }
  });

  const empleado2 = await prisma.empleado.upsert({
    where: { pin: '5678' },
    update: {},
    create: {
      nombre: 'María González',
      pin: '5678',
      activo: true
    }
  });

  console.log('✅ Empleados creados:', empleado1.nombre, empleado2.nombre);

  // Crear productos de ejemplo
  const productos = [
    {
      nombre: 'Coca Cola 500ml',
      codigoBarra: '7790310980010',
      precio: 350,
      stock: 50
    },
    {
      nombre: 'Pepsi 500ml',
      codigoBarra: '7790310980027',
      precio: 320,
      stock: 30
    },
    {
      nombre: 'Agua Mineral 500ml',
      codigoBarra: '7790310980034',
      precio: 150,
      stock: 100
    },
    {
      nombre: 'Alfajor Tofi',
      codigoBarra: '7790310980041',
      precio: 120,
      stock: 80
    },
    {
      nombre: 'Chicles Beldent',
      codigoBarra: '7790310980058',
      precio: 80,
      stock: 60
    },
    {
      nombre: 'Repelente Off',
      codigoBarra: '770037000885',
      precio: 560,
      stock: 0
    }
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { codigoBarra: producto.codigoBarra },
      update: {},
      create: producto
    });
  }

  console.log(`✅ ${productos.length} productos creados`);

  console.log('\n🎉 Datos iniciales creados exitosamente!');
  console.log('\n📝 Empleados de prueba:');
  console.log('   - PIN: 1234 (Juan Pérez)');
  console.log('   - PIN: 5678 (María González)');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

