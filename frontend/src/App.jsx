import { useEffect, useMemo, useState } from 'react';

const modules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reservations', label: 'Reservas' },
  { key: 'rooms', label: 'Habitaciones' },
  { key: 'guests', label: 'Huéspedes' },
  { key: 'tasks', label: 'Tareas' },
  { key: 'messages', label: 'Mensajes' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'customization', label: 'Customización' }
];

const endpoint = 'http://localhost:8000/api.php';

async function api(module, method = 'GET', payload) {
  const res = await fetch(`${endpoint}?module=${module}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Error de red');
  }

  return res.json();
}

function CrudSection({ title, module, fields, records, onRefresh }) {
  const initial = useMemo(
    () => fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
    [fields]
  );
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setForm(initial);
    setEditingId(null);
  }, [initial, module]);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api(module, 'PUT', { id: editingId, ...form });
    } else {
      await api(module, 'POST', form);
    }
    setForm(initial);
    setEditingId(null);
    onRefresh();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    const next = { ...initial };
    fields.forEach((field) => {
      next[field.name] = item[field.name] ?? '';
    });
    setForm(next);
  };

  return (
    <section className="panel reveal">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{records.length} registros</span>
      </div>
      <form className="form-grid" onSubmit={submit}>
        {fields.map((field) => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              type={field.type || 'text'}
              value={form[field.name]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
              required={field.required !== false}
            />
          </label>
        ))}
        <button className="btn-primary" type="submit">
          {editingId ? 'Guardar cambios' : 'Agregar'}
        </button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.name}>{f.label}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={fields.length + 1} className="empty-row">Sin registros aún. Empieza desde cero agregando el primero.</td>
              </tr>
            )}
            {records.map((item) => (
              <tr key={item.id}>
                {fields.map((f) => (
                  <td key={f.name}>{item[f.name]}</td>
                ))}
                <td>
                  <button className="btn-ghost" onClick={() => startEdit(item)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Dashboard({ data }) {
  const totalRevenue = data.reservations.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const occupied = data.rooms.filter((room) => room.status === 'Ocupada').length;
  const pendingTasks = data.tasks.filter((task) => task.status !== 'Completada').length;
  const allEmpty = Object.values(data).every((section) => section.length === 0);

  return (
    <div className="dashboard-grid reveal">
      <article className="kpi float-card">
        <h3>Ingresos Totales</h3>
        <strong>${totalRevenue.toLocaleString('es-MX')}</strong>
        <small>Basado en reservas activas</small>
      </article>
      <article className="kpi float-card">
        <h3>Habitaciones Ocupadas</h3>
        <strong>{occupied}/{data.rooms.length}</strong>
        <small>Nivel de ocupación actual</small>
      </article>
      <article className="kpi float-card">
        <h3>Tareas Pendientes</h3>
        <strong>{pendingTasks}</strong>
        <small>Housekeeping y mantenimiento</small>
      </article>
      <article className="panel chart-panel">
        <h3>Disponibilidad por tipo</h3>
        {['Suite', 'Doble', 'Sencilla'].map((type) => {
          const total = data.rooms.filter((r) => r.type === type).length;
          const free = data.rooms.filter((r) => r.type === type && r.status === 'Disponible').length;
          const ratio = total ? (free / total) * 100 : 0;
          return (
            <div key={type} className="meter">
              <span>{type}</span>
              <div className="bar"><i style={{ width: `${ratio}%` }} /></div>
              <span>{free}/{total}</span>
            </div>
          );
        })}
      </article>
      <article className="panel chart-panel">
        <h3>Actividad reciente</h3>
        <ul className="timeline">
          {data.messages.slice(0, 4).map((msg) => (
            <li key={msg.id}>
              <strong>{msg.sender}</strong>
              <p>{msg.subject}</p>
            </li>
          ))}
          {data.messages.length === 0 && <li className="empty-row">No hay actividad todavía.</li>}
        </ul>
      </article>
      {allEmpty && (
        <article className="panel chart-panel empty-state">
          <h3>Sistema inicializado desde 0</h3>
          <p>No hay datos cargados en ningún módulo. Puedes iniciar capturando habitaciones, huéspedes y reservas.</p>
        </article>
      )}
    </div>
  );
}

function RoomStudio({ records, onRefresh }) {
  const initial = useMemo(
    () => ({
      number: '',
      name: '',
      floor: '',
      type: '',
      status: '',
      maxGuests: '',
      price: '',
      tariff: '',
      size: '',
      bedType: '',
      view: ''
    }),
    []
  );
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);
  const [roomUi, setRoomUi] = useState({ density: 'comoda', labelStyle: 'minimalista' });

  const submit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api('rooms', 'PUT', { id: editingId, ...form });
    } else {
      await api('rooms', 'POST', form);
    }
    setForm(initial);
    setEditingId(null);
    onRefresh();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    const next = { ...initial };
    Object.keys(next).forEach((key) => {
      next[key] = item[key] ?? '';
    });
    setForm(next);
  };

  const occupied = records.filter((room) => room.status === 'Ocupada').length;
  const available = records.filter((room) => room.status === 'Disponible').length;

  return (
    <section className="panel reveal room-studio">
      <div className="panel-header">
        <h2>Gestión de habitaciones (vista moderna)</h2>
        <span>{records.length} registros</span>
      </div>

      <div className="room-toolbar">
        <article>
          <small>Total habitaciones</small>
          <strong>{records.length}</strong>
        </article>
        <article>
          <small>Disponibles</small>
          <strong>{available}</strong>
        </article>
        <article>
          <small>Ocupadas</small>
          <strong>{occupied}</strong>
        </article>
        <label>
          <span>Densidad visual</span>
          <select value={roomUi.density} onChange={(e) => setRoomUi((prev) => ({ ...prev, density: e.target.value }))}>
            <option value="comoda">Cómoda</option>
            <option value="compacta">Compacta</option>
            <option value="amplia">Amplia</option>
          </select>
        </label>
        <label>
          <span>Estilo etiqueta</span>
          <select value={roomUi.labelStyle} onChange={(e) => setRoomUi((prev) => ({ ...prev, labelStyle: e.target.value }))}>
            <option value="minimalista">Minimalista</option>
            <option value="borde">Con borde</option>
            <option value="solida">Sólida</option>
          </select>
        </label>
      </div>

      <div className={`room-layout density-${roomUi.density}`}>
        <form className="room-form" onSubmit={submit}>
          <h3>Detalle de habitación</h3>
          <div className="room-form-grid">
            <label><span>Número</span><input value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} required /></label>
            <label><span>Nombre</span><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
            <label><span>Piso</span><input type="number" value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} required /></label>
            <label><span>Capacidad máxima</span><input type="number" value={form.maxGuests} onChange={(e) => setForm((p) => ({ ...p, maxGuests: e.target.value }))} required /></label>
            <label><span>Tipo</span><input placeholder="Suite / Doble / Sencilla" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} required /></label>
            <label><span>Estado</span><input placeholder="Disponible / Ocupada / Limpieza" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} required /></label>
            <label><span>Precio base</span><input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required /></label>
            <label><span>Tarifa</span><input placeholder="Flexible / No reembolsable" value={form.tariff} onChange={(e) => setForm((p) => ({ ...p, tariff: e.target.value }))} required /></label>
            <label><span>Tamaño (m²)</span><input type="number" value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} /></label>
            <label><span>Tipo de cama</span><input placeholder="King / Queen / Twin" value={form.bedType} onChange={(e) => setForm((p) => ({ ...p, bedType: e.target.value }))} /></label>
            <label><span>Vista</span><input placeholder="Mar / Ciudad / Jardín" value={form.view} onChange={(e) => setForm((p) => ({ ...p, view: e.target.value }))} /></label>
          </div>
          <button className="btn-primary" type="submit">{editingId ? 'Guardar habitación' : 'Agregar habitación'}</button>
        </form>

        <aside className={`room-preview label-${roomUi.labelStyle}`}>
          <h3>Vista previa en tiempo real</h3>
          <div className="preview-card">
            <header>
              <strong>{form.name || 'Nombre de habitación'}</strong>
              <span>{form.status || 'Estado'}</span>
            </header>
            <p>Habitación {form.number || '000'} · Piso {form.floor || '-'} · {form.type || 'Tipo'}</p>
            <div className="preview-meta">
              <span>{form.maxGuests || '-'} huéspedes</span>
              <span>{form.size || '-'} m²</span>
              <span>{form.bedType || 'Cama'}</span>
            </div>
            <footer>
              <strong>${Number(form.price || 0).toLocaleString('es-MX')}</strong>
              <small>{form.tariff || 'Tarifa'} · {form.view || 'Vista'}</small>
            </footer>
          </div>
          <small>Inspirado en layout tipo panel con detalle, filtros y tarjetas modernas.</small>
        </aside>
      </div>

      <div className="room-list-grid">
        {records.length === 0 && (
          <article className="empty-state room-empty">
            <h3>Sistema de habitaciones vacío</h3>
            <p>No hay habitaciones creadas. Puedes cargar desde cero piso, nombre, capacidad, tipo, estado, precio, tarifa y más.</p>
          </article>
        )}
        {records.map((room) => (
          <article className="room-card" key={room.id}>
            <header>
              <h4>{room.name || `Habitación ${room.number}`}</h4>
              <span>{room.status}</span>
            </header>
            <p>#{room.number} · Piso {room.floor} · {room.type}</p>
            <p>Capacidad: {room.maxGuests} · Tarifa: {room.tariff}</p>
            <footer>
              <strong>${Number(room.price || 0).toLocaleString('es-MX')}</strong>
              <button className="btn-ghost" onClick={() => startEdit(room)}>Editar</button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomizationPanel({ theme, onThemeChange, logo, onLogoChange }) {
  const [error, setError] = useState('');

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes para el logo.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setError('');
      onLogoChange({
        name: file.name,
        width: image.width,
        height: image.height,
        url: objectUrl
      });
    };
    image.src = objectUrl;
  };

  return (
    <section className="panel reveal">
      <div className="panel-header">
        <h2>Menú de customización</h2>
        <span>Personalización visual</span>
      </div>
      <div className="custom-grid">
        <label>
          <span>Color primario</span>
          <input type="color" value={theme.primary} onChange={(e) => onThemeChange('primary', e.target.value)} />
        </label>
        <label>
          <span>Color de acento</span>
          <input type="color" value={theme.accent} onChange={(e) => onThemeChange('accent', e.target.value)} />
        </label>
        <label>
          <span>Color de fondo</span>
          <input type="color" value={theme.background} onChange={(e) => onThemeChange('background', e.target.value)} />
        </label>
      </div>

      <div className="logo-uploader">
        <h3>Logo del sistema</h3>
        <p>Medidas recomendadas: <strong>180x60 px</strong> para cabecera y archivo original mínimo de <strong>512x512 px</strong>.</p>
        <input type="file" accept="image/*" onChange={handleLogo} />
        {error && <p className="error-text">{error}</p>}
        {logo && (
          <div className="logo-preview">
            <img src={logo.url} alt="Logo personalizado" />
            <div>
              <strong>{logo.name}</strong>
              <p>Medidas detectadas: {logo.width} x {logo.height} px</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [data, setData] = useState({
    rooms: [], reservations: [], guests: [], tasks: [], messages: [], inventory: []
  });
  const [theme, setTheme] = useState({
    primary: '#d4ef78',
    accent: '#80d0c7',
    background: '#eef2f1'
  });
  const [logo, setLogo] = useState(null);

  const loadAll = async () => {
    const keys = ['rooms', 'reservations', 'guests', 'tasks', 'messages', 'inventory'];
    const result = await Promise.all(keys.map((key) => api(key)));
    const next = {};
    keys.forEach((key, i) => {
      next[key] = result[i].data;
    });
    setData(next);
  };

  useEffect(() => {
    loadAll().catch((err) => console.error(err));
  }, []);

  const themeStyle = {
    '--primary': theme.primary,
    '--accent': theme.accent,
    '--app-bg': theme.background
  };

  return (
    <div className="layout" style={themeStyle}>
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            {logo ? <img src={logo.url} alt="Logo" /> : '▦'}
          </div>
          <div>
            <h1>Lodgify Pro</h1>
            <small>Hotel Management</small>
          </div>
        </div>
        <nav>
          {modules.map((item) => (
            <button
              key={item.key}
              className={item.key === active ? 'active' : ''}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <header className="topbar reveal">
          <input placeholder="Buscar por habitación, huésped o tarea..." />
          <div className="user">Administrador · Vista general</div>
        </header>
        {active === 'dashboard' && <Dashboard data={data} />}
        {active === 'customization' && (
          <CustomizationPanel
            theme={theme}
            onThemeChange={(name, value) => setTheme((prev) => ({ ...prev, [name]: value }))}
            logo={logo}
            onLogoChange={setLogo}
          />
        )}
        {active === 'rooms' && <RoomStudio records={data.rooms} onRefresh={loadAll} />}
        {active === 'reservations' && (
          <CrudSection
            title="Reservas"
            module="reservations"
            fields={[
              { name: 'guest', label: 'Huésped' },
              { name: 'room', label: 'Habitación' },
              { name: 'checkIn', label: 'Check-In', type: 'date' },
              { name: 'checkOut', label: 'Check-Out', type: 'date' },
              { name: 'total', label: 'Total', type: 'number' }
            ]}
            records={data.reservations}
            onRefresh={loadAll}
          />
        )}
        {active === 'guests' && (
          <CrudSection
            title="Huéspedes"
            module="guests"
            fields={[
              { name: 'name', label: 'Nombre' },
              { name: 'email', label: 'Correo', type: 'email' },
              { name: 'phone', label: 'Teléfono' },
              { name: 'vip', label: 'Segmento (VIP / Normal)' }
            ]}
            records={data.guests}
            onRefresh={loadAll}
          />
        )}
        {active === 'tasks' && (
          <CrudSection
            title="Tareas Operativas"
            module="tasks"
            fields={[
              { name: 'title', label: 'Título' },
              { name: 'area', label: 'Área' },
              { name: 'dueDate', label: 'Fecha límite', type: 'date' },
              { name: 'status', label: 'Estado' }
            ]}
            records={data.tasks}
            onRefresh={loadAll}
          />
        )}
        {active === 'messages' && (
          <CrudSection
            title="Mensajería Interna"
            module="messages"
            fields={[
              { name: 'sender', label: 'Remitente' },
              { name: 'recipient', label: 'Destino' },
              { name: 'subject', label: 'Asunto' },
              { name: 'priority', label: 'Prioridad' }
            ]}
            records={data.messages}
            onRefresh={loadAll}
          />
        )}
        {active === 'inventory' && (
          <CrudSection
            title="Inventario"
            module="inventory"
            fields={[
              { name: 'item', label: 'Producto' },
              { name: 'category', label: 'Categoría' },
              { name: 'stock', label: 'Stock', type: 'number' },
              { name: 'minStock', label: 'Stock mínimo', type: 'number' }
            ]}
            records={data.inventory}
            onRefresh={loadAll}
          />
        )}
      </main>
    </div>
  );
}
