# Carpeta de producción para Hostinger

Esta carpeta documenta el paquete final para subir a Hostinger.

## Contenido que debes subir a `public_html`
- `frontend/dist/*` (salida de `npm run build`)
- `backend/public/api.php` como `public_html/api.php`
- `backend/data/*.json` dentro de `public_html/data/` (solo si no usarás MySQL)

## Base de datos
Importa el archivo:
- `backend/database/schema.sql`

y configura variables de entorno en Hostinger:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
