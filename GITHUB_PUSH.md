# Subir Mikie a GitHub

Ya tenés el repositorio Git inicializado y el primer commit hecho. Para hacer push:

## 1. Crear el repositorio en GitHub (si no existe)

- Entrá a https://github.com/new
- **Repository name:** `Mikie`
- Dejá vacío "Add a README" (ya tenés código local)
- Creá el repositorio

## 2. Configurar la URL del remote

Si tu usuario de GitHub **no** es "Guillermo", cambiá la URL del remote (reemplazá `TU_USUARIO` por tu usuario):

```bash
cd "c:\Users\Guillermo\Desktop\Mikie"
git remote set-url origin https://github.com/TU_USUARIO/Mikie.git
```

Para ver la URL actual:

```bash
git remote -v
```

## 3. Hacer push

```bash
cd "c:\Users\Guillermo\Desktop\Mikie"
git push -u origin main
```

Si GitHub te pide usuario y contraseña: usá tu usuario y, como contraseña, un **Personal Access Token** (GitHub ya no acepta contraseña normal en push). Crealo en: GitHub → Settings → Developer settings → Personal access tokens.

## Resumen de lo ya hecho

- `git init`
- `.gitignore` actualizado (incluye `Backend/prisma/*.db` para no subir la base)
- Primer commit: "Initial commit: Mikie - Control de stock y ventas"
- Rama principal: `main`
- Remote: `origin` → `https://github.com/Guillermo/Mikie.git` (cambialo si tu usuario es otro)
