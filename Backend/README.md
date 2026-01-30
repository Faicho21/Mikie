# Backend - Mikie

Backend del sistema de control de stock y ventas.

## Instalación Rápida

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed  # Opcional: crear datos de prueba
npm run dev
```

## Variables de Entorno

Crear archivo `.env`:

```
DATABASE_URL="file:./data.db"
PORT=3000
```

## Scripts Disponibles

- `npm run dev` - Desarrollo con auto-reload
- `npm start` - Producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio (GUI)
- `npm run seed` - Crear datos iniciales de prueba

## Estructura

- `index.js` - Servidor principal Fastify
- `routes/` - Rutas de la API
- `prisma/schema.prisma` - Modelos de datos
- `scripts/seed.js` - Datos iniciales

## API

Ver documentación completa en el README principal.

