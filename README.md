# El Hotel Rogger · Sistema de Gestión Hotelera (React + PHP)

Aplicación moderna para administrar **un solo hotel con varios pisos**. Incluye dashboard ejecutivo, módulos operativos y compatibilidad con persistencia local JSON o MySQL (ideal para Hostinger).

## Capacidades del proyecto
- Administración del perfil del hotel (**El Hotel Rogger**).
- Gestión de pisos del edificio.
- Gestión de habitaciones con asignación por piso.
- Reservas, huéspedes, tareas, mensajería interna e inventario.
- Interfaz moderna en estilo negro, dorado y blanco (sin degradados).
- API REST simple (`GET`, `POST`, `PUT`) para todos los módulos.
- Modo de almacenamiento dual:
  - `json` para desarrollo rápido local.
  - `mysql` para producción (Hostinger).

---

## 1) Requisitos
- Node.js 18+
- npm 9+
- PHP 8.1+
- MySQL 8+ (o MariaDB compatible)

---

## 2) Instalación paso a paso (entorno local)

### Paso 1. Clonar y entrar al proyecto
```bash
git clone <tu-repo>
cd PruebasCodex
```

### Paso 2. Instalar frontend
```bash
cd frontend
npm install
```

### Paso 3. Levantar backend (modo JSON)
En otra terminal:
```bash
cd backend/public
php -S 0.0.0.0:8000
```

### Paso 4. Levantar frontend
En otra terminal:
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### Paso 5. Abrir aplicación
- Frontend: `http://localhost:5173`
- API: `http://localhost:8000/api.php?module=rooms`

---

## 3) Configurar MySQL para Hostinger

### Paso 1. Crear base de datos en hPanel
1. Entra a Hostinger hPanel.
2. Ve a **Databases > MySQL Databases**.
3. Crea:
   - Base de datos
   - Usuario
   - Contraseña
4. Guarda host, puerto, nombre, usuario y contraseña.

### Paso 2. Importar estructura SQL
1. En hPanel abre **phpMyAdmin**.
2. Selecciona la base de datos creada.
3. Ve a **Importar**.
4. Sube el archivo:
   - `backend/database/hostinger_mysql.sql`
5. Ejecuta la importación.

### Paso 3. Configurar variables de entorno en backend
Antes de iniciar PHP, exporta estas variables:

```bash
export DB_DRIVER=mysql
export DB_HOST=tu_host_mysql
export DB_PORT=3306
export DB_NAME=hotel_rogger
export DB_USER=tu_usuario
export DB_PASS=tu_password
```

> Si no defines `DB_DRIVER=mysql`, la API usará JSON por defecto.

### Paso 4. Iniciar backend con MySQL
```bash
cd backend/public
php -S 0.0.0.0:8000
```

La API tomará MySQL automáticamente cuando `DB_DRIVER=mysql` esté activo.

---

## 4) API disponible
Endpoint base:
- `GET /api.php?module={hotel|floors|rooms|reservations|guests|tasks|messages|inventory}`
- `POST /api.php?module=...`
- `PUT /api.php?module=...`

---

## 5) Estructura importante
- `frontend/src/App.jsx`: pantallas y flujo principal.
- `frontend/src/styles.css`: tema visual moderno (negro/dorado/blanco).
- `backend/public/api.php`: API con soporte JSON + MySQL.
- `backend/database/hostinger_mysql.sql`: script de base de datos para Hostinger.
- `backend/data/*.json`: datos semilla para modo local.
