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
