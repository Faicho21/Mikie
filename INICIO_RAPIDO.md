# 🚀 Inicio Rápido - Mikie

Guía rápida para poner en marcha el sistema.

## 1️⃣ Backend

```bash
cd Backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed  # Crear datos de prueba (PINs: 1234 y 5678)
npm run dev
```

✅ Backend corriendo en http://localhost:3000

## 2️⃣ Frontend

```bash
cd Frontend
npm install
npm run dev
```

✅ Frontend corriendo en http://localhost:5173

## 3️⃣ Primera Vez

1. Abrir http://localhost:5173
2. Login con PIN: `1234` (Juan Pérez)
3. Escanear código o buscar producto
4. Confirmar venta

## 📱 Instalar en Android

1. Abrir en Chrome desde el celular
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. Dar permisos de cámara cuando se solicite

## 🔧 Datos de Prueba

**Empleados:**
- PIN: `1234` - Juan Pérez
- PIN: `5678` - María González

**Productos de ejemplo:**
- Coca Cola 500ml - Código: 7790310980010
- Pepsi 500ml - Código: 7790310980027
- Y más...

## ⚠️ Notas

- Los iconos de la PWA están pendientes (ver `Frontend/public/ICONOS.md`)
- La base de datos se crea automáticamente en `Backend/data/data.db`
- El sistema funciona offline, las ventas se sincronizan automáticamente

## 📚 Documentación Completa

Ver `README.md` para documentación completa.

