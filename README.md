# Sistema de Gestión Hotelera (React + PHP)

Panel moderno inspirado en Lodgify, con frontend en React/Vite y backend en PHP para CRUD de módulos principales del hotel.

## Módulos implementados
- Dashboard con KPIs, disponibilidad por tipo y actividad reciente.
- Reservas (agregar y editar).
- Habitaciones (agregar y editar).
- Huéspedes (agregar y editar).
- Tareas operativas (agregar y editar).
- Mensajería interna (agregar y editar).
- Inventario (agregar y editar).
- Integración de WhatsApp por módulo + canal directo con recepción.

## Desarrollo local
### Backend (PHP)
```bash
cd backend/public
php -S 0.0.0.0:8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Variables de entorno del frontend
Crea `frontend/.env` (opcional):
```env
VITE_API_URL=/api.php
VITE_RECEPTION_PHONE=5215550000000
VITE_RECEPTION_EMAIL=recepcion@hotel.com
```

## API
Endpoint único:
- `GET /api.php?module={rooms|reservations|guests|tasks|messages|inventory}`
- `POST /api.php?module=...`
- `PUT /api.php?module=...`

## Persistencia de datos
El backend ahora soporta dos modos:
1. **MySQL (recomendado para Hostinger)** usando variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
2. **Fallback JSON** en `backend/data` cuando no hay configuración de base de datos.

### Crear base de datos (Hostinger)
1. En hPanel crea una base de datos MySQL y un usuario.
2. Importa `backend/database/schema.sql`.
3. Configura variables de entorno PHP con los datos de conexión.

Referencia de variables en `backend/.env.example`.

## Despliegue listo para Hostinger
1. Compila frontend:
```bash
cd frontend
npm install
npm run build
```
2. Copia el contenido de `frontend/dist/` a `public_html/`.
3. Copia `backend/public/api.php` a `public_html/api.php`.
4. Si usarás fallback JSON, crea `public_html/data/` y sube los JSON de `backend/data/` con permisos de escritura.
5. Si usarás MySQL, importa el esquema SQL y define las variables de entorno DB.

## Vista rápida (sin npm)
Si quieres ver cómo se ve de inmediato:
```bash
cd backend/public
php -S 0.0.0.0:8000
```
Luego abre:
- `http://localhost:8000/demo.html`
- `http://localhost:8000/api.php?module=rooms`
