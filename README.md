# Sistema de Gestión Hotelera (React + PHP)

Panel moderno inspirado en la referencia tipo Lodgify, con frontend en React/Vite y backend en PHP para CRUD de módulos principales del hotel.

## Módulos implementados
- Dashboard con KPIs, disponibilidad por tipo y actividad reciente.
- Reservas (agregar y editar).
- Habitaciones (agregar y editar).
- Huéspedes (agregar y editar).
- Tareas operativas (agregar y editar).
- Mensajería interna (agregar y editar).
- Inventario (agregar y editar).

## Ejecutar backend (PHP)
```bash
cd backend/public
php -S 0.0.0.0:8000
```

## Ejecutar frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## API
Endpoint único:
- `GET /api.php?module={rooms|reservations|guests|tasks|messages|inventory}`
- `POST /api.php?module=...`
- `PUT /api.php?module=...`

Persistencia basada en archivos JSON dentro de `backend/data`.


## Vista rápida (sin npm)
Si quieres ver **cómo se ve** de inmediato, sin instalar dependencias de Node:
```bash
cd backend/public
php -S 0.0.0.0:8000
```
Luego abre:
- `http://localhost:8000/demo.html` (preview visual moderno)
- `http://localhost:8000/api.php?module=rooms` (API activa)

## Carpeta de producción para Hostinger
Se añadió la carpeta `produccion_hostinger` lista para subir a hosting compartido PHP:

```text
produccion_hostinger/
├── data/
│   ├── guests.json
│   ├── inventory.json
│   ├── messages.json
│   ├── reservations.json
│   ├── rooms.json
│   └── tasks.json
└── public_html/
    ├── api.php
    └── index.html
```

### Cómo subir a Hostinger
1. Sube el contenido de `produccion_hostinger/public_html` dentro de `public_html/` de tu cuenta.
2. Sube la carpeta `produccion_hostinger/data` al mismo nivel que `public_html`.
3. Asegúrate de que `data/` tenga permisos de escritura para PHP.

> Nota: `index.html` usa el preview visual (`demo.html`). Si deseas desplegar la app React completa, primero ejecuta el build en `frontend` y reemplaza `public_html/index.html` + assets por el contenido de `frontend/dist`.
