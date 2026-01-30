# Mikie - Sistema de Control de Stock y Ventas

Sistema completo de control de stock y ventas para drugstore/maxikiosco, optimizado para funcionar offline-first y usarse desde smartphones Android.

## 🎯 Características

- ✅ **PWA instalable** - Funciona como app nativa en Android
- ✅ **Offline-first** - Funciona sin internet, sincroniza automáticamente
- ✅ **Escáner de códigos de barras** - Usa la cámara del celular
- ✅ **UI mobile-first** - Diseñado para pantallas táctiles
- ✅ **Rápido y liviano** - Optimizado para servidores gratuitos
- ✅ **Control por empleado** - Login por PIN, registro de acciones

## 🏗️ Arquitectura

### Backend
- **Node.js** + **Fastify** - Servidor rápido y liviano
- **Prisma** + **SQLite** - Base de datos local
- **API REST** - Endpoints simples y claros

### Frontend
- **React** + **Vite** - Framework moderno y rápido
- **PWA** - Service Worker y manifest
- **IndexedDB** - Almacenamiento offline
- **html5-qrcode** - Escáner de códigos de barras

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Backend

```bash
cd Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env si es necesario (por defecto usa SQLite en ./data/data.db)

# Generar cliente de Prisma
npm run prisma:generate

# Crear base de datos y tablas
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver datos
npm run prisma:studio

# Iniciar servidor
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Frontend

```bash
cd Frontend

# Instalar dependencias
npm install

# Configurar URL del backend (opcional)
# Crear .env con: VITE_API_URL=http://localhost:3000

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Build para producción

```bash
# Frontend
cd Frontend
npm run build
# Los archivos estarán en Frontend/dist/

# Backend
cd Backend
npm start
```

## 🚀 Uso

### Primera vez - Crear datos iniciales

1. **Crear empleado** (desde la API o Prisma Studio):
```bash
curl -X POST http://localhost:3000/api/empleados \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Pérez", "pin": "1234"}'
```

2. **Crear productos**:
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Coca Cola 500ml",
    "codigoBarra": "7790310980010",
    "precio": 350,
    "stock": 100
  }'
```

### Flujo de trabajo

1. **Login**: Ingresar con PIN de empleado
2. **Escanear/Buscar**: Usar cámara o búsqueda manual
3. **Confirmar venta**: Ver producto, precio, stock y cantidad
4. **Aceptar/Cancelar**: La venta descuenta stock automáticamente

### Modo Offline

- Las ventas se guardan localmente en IndexedDB
- Al volver la conexión, se sincronizan automáticamente
- Los productos se cachean para búsqueda offline

## 📱 Instalación en Android

1. Abrir la app en Chrome/Edge desde el celular
2. Menú (3 puntos) → "Agregar a pantalla de inicio"
3. La app aparecerá como una app nativa
4. Dar permisos de cámara cuando se solicite

## 🌐 Deploy Gratuito

### Backend (Render / Railway / Fly.io)

1. **Render**:
   - Crear nuevo Web Service
   - Conectar repositorio
   - Build: `cd Backend && npm install && npm run prisma:generate && npm run prisma:migrate`
   - Start: `cd Backend && npm start`
   - Variables: `DATABASE_URL=file:./data/data.db`, `PORT=3000`

2. **Railway**:
   - Similar a Render, con soporte nativo para SQLite

3. **Fly.io**:
   - `fly launch` en la carpeta Backend
   - Configurar volumen persistente para `data.db`

### Frontend (Vercel / Netlify)

1. **Vercel**:
   - Conectar repositorio
   - Build: `cd Frontend && npm install && npm run build`
   - Output: `Frontend/dist`
   - Variables: `VITE_API_URL=https://tu-backend.render.com`

2. **Netlify**:
   - Similar a Vercel

## 📂 Estructura del Proyecto

```
Mikie/
├── Backend/
│   ├── index.js              # Servidor principal
│   ├── routes/               # Rutas de la API
│   │   ├── empleado.js
│   │   ├── producto.js
│   │   ├── movimiento.js
│   │   └── sync.js
│   ├── prisma/
│   │   └── schema.prisma     # Modelos de datos
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── pages/            # Pantallas principales
    │   │   ├── Login.jsx
    │   │   ├── Home.jsx
    │   │   ├── Venta.jsx
    │   │   └── Historial.jsx
    │   ├── components/       # Componentes reutilizables
    │   │   └── EscanerCodigo.jsx
    │   ├── services/         # Lógica de negocio
    │   │   ├── api.js        # Comunicación con backend
    │   │   ├── storage.js    # IndexedDB y localStorage
    │   │   └── sync.js       # Sincronización offline
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/
    └── package.json
```

## 🔧 API Endpoints

### Empleados
- `POST /api/empleados/login` - Login por PIN
- `GET /api/empleados` - Listar empleados
- `POST /api/empleados` - Crear empleado

### Productos
- `GET /api/productos/buscar/:codigo` - Buscar por código o nombre
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar (soft delete)

### Movimientos
- `POST /api/movimientos/venta` - Registrar venta
- `POST /api/movimientos/reposicion` - Reponer stock
- `GET /api/movimientos` - Historial

### Sync
- `POST /api/sync/movimientos` - Sincronizar movimientos offline
- `GET /api/sync/datos` - Obtener datos para cache

## 🛠️ Desarrollo

### Scripts útiles

**Backend:**
```bash
npm run dev          # Desarrollo con auto-reload
npm start            # Producción
npm run prisma:studio # Abrir Prisma Studio
```

**Frontend:**
```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
```

## ⚠️ Notas Importantes

- **SQLite**: La base de datos es un archivo local (`data.db`). En producción, asegurate de tener un volumen persistente.
- **CORS**: El backend permite CORS desde cualquier origen. En producción, restringir a tu dominio.
- **Seguridad**: El sistema usa PINs simples. Para producción real, considerar autenticación más robusta.
- **Stock**: Las ventas descuentan stock automáticamente. Las cancelaciones no modifican nada.

## 📝 Licencia

ISC

## 🤝 Contribuciones

Este es un proyecto personal, pero las sugerencias son bienvenidas.

---

**Desarrollado para uso en drugstore/maxikiosco real** 🏪

