# Galería de Fotos y Videos

Galería pública para ver, descargar y gestionar fotos y videos alojados en Cloudflare R2.

## Requisitos

- Node.js 18+
- Cuenta gratis en [Cloudflare](https://dash.cloudflare.com)
- Cuenta gratis en [Vercel](https://vercel.com)

## Configuración

### 1. Crear bucket en Cloudflare R2

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Seleccionar **R2 Object Storage**
3. Crear un bucket (ej: `mi-galeria`)
4. Ir a **Settings** → **API Tokens**
5. Crear token con permisos **Object Read & Write**
6. Copiar:
   - **Account ID** (en la URL del dashboard)
   - **Access Key ID**
   - **Secret Access Key**

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET_NAME=tu_bucket_name
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña
```

### 3. Subir archivos a R2

```bash
npm run upload
```

Esto subirá todas las imágenes y videos de las carpetas `Imágenes/` y `Videoclips/` al bucket.

### 4. Desplegar en Vercel

```bash
npm i -g vercel
vercel
```

En Vercel, agregar las mismas variables de entorno en **Settings → Environment Variables**.

## Uso

### Galería Pública
- Visitar la página principal para ver fotos y videos
- Clic en un archivo para verlo en tamaño completo
- Botón de descarga en cada archivo

### Panel Admin
- Ir a `/admin`
- Ingresar contraseña
- Subir nuevos archivos arrastrando o seleccionando
- Eliminar archivos

## Estructura

```
├── Imágenes/     # Fotos (no se sube a git)
├── Videoclips/   # Videos (no se sube a git)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Galería pública
│   │   └── admin/page.tsx    # Panel admin
│   ├── components/
│   │   ├── Gallery.tsx       # Grid de archivos
│   │   ├── MediaCard.tsx     # Card individual
│   │   └── Lightbox.tsx      # Visor ampliado
│   └── lib/
│       └── r2.ts             # Cliente Cloudflare R2
└── scripts/
    └── upload-to-r2.ts       # Script de subida
```

## Comandos

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción
npm run upload   # Subir archivos a R2
npm run lint     # Verificar código
```
