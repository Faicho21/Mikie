# Frontend - Mikie

Frontend PWA del sistema de control de stock y ventas.

## Instalación Rápida

```bash
npm install
npm run dev
```

## Variables de Entorno

Crear archivo `.env` (opcional):

```
VITE_API_URL=http://localhost:3000
```

## Scripts Disponibles

- `npm run dev` - Desarrollo (http://localhost:5173)
- `npm run build` - Build para producción
- `npm run preview` - Preview del build

## Estructura

- `src/pages/` - Pantallas principales
- `src/components/` - Componentes reutilizables
- `src/services/` - Lógica de negocio y APIs
- `public/` - Archivos estáticos

## PWA

La app es una Progressive Web App instalable en Android:
1. Abrir en Chrome/Edge
2. Menú → "Agregar a pantalla de inicio"
3. Funciona como app nativa

## Offline

- Las ventas se guardan en IndexedDB
- Sincronización automática al volver la conexión
- Productos se cachean para búsqueda offline

