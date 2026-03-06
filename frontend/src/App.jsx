import { useEffect, useMemo, useState } from 'react';

const modules = [
  { key: 'dashboard', label: 'Panel General' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'floors', label: 'Pisos' },
  { key: 'rooms', label: 'Habitaciones' },
  { key: 'reservations', label: 'Reservas' },
  { key: 'guests', label: 'Huéspedes' },
  { key: 'tasks', label: 'Tareas' },
  { key: 'messages', label: 'Mensajes' },
  { key: 'inventory', label: 'Inventario' }
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

function CrudSection({ title, helper, module, fields, records, onRefresh }) {
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
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {helper && <p>{helper}</p>}
        </div>
        <span className="pill">{records.length} registros</span>
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
  const floors = data.floors.length;

  return (
    <div className="dashboard-grid">
      <article className="kpi">
        <h3>Ingresos proyectados</h3>
        <strong>${totalRevenue.toLocaleString('es-MX')}</strong>
        <small>Reservas activas en El Hotel Rogger</small>
      </article>
      <article className="kpi">
        <h3>Ocupación actual</h3>
        <strong>{occupied}/{data.rooms.length}</strong>
        <small>Habitaciones ocupadas</small>
      </article>
      <article className="kpi">
        <h3>Operación diaria</h3>
        <strong>{pendingTasks} tareas</strong>
        <small>Pendientes por cerrar hoy</small>
      </article>
      <article className="panel chart-panel">
        <h3>Distribución por piso</h3>
        <div className="stat-list">
          {data.floors.map((floor) => {
            const onFloor = data.rooms.filter((room) => String(room.floor) === String(floor.level));
            const occupiedFloor = onFloor.filter((room) => room.status === 'Ocupada').length;
            return (
              <div key={floor.id} className="stat-item">
                <span>Piso {floor.level}</span>
                <strong>{occupiedFloor}/{onFloor.length || 0}</strong>
              </div>
            );
          })}
          {floors === 0 && <p>No hay pisos configurados.</p>}
        </div>
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
        </ul>
      </article>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [data, setData] = useState({
    hotel: [], floors: [], rooms: [], reservations: [], guests: [], tasks: [], messages: [], inventory: []
  });

  const loadAll = async () => {
    const keys = ['hotel', 'floors', 'rooms', 'reservations', 'guests', 'tasks', 'messages', 'inventory'];
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

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">ER</div>
          <div>
            <h1>El Hotel Rogger</h1>
            <small>Gestión centralizada</small>
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
        <header className="topbar">
          <input placeholder="Buscar por piso, habitación, huésped o tarea..." />
          <div className="user">Administrador · Operación del hotel</div>
        </header>
        {active === 'dashboard' && <Dashboard data={data} />}
        {active === 'hotel' && (
          <CrudSection
            title="Datos del hotel"
            helper="Sistema preparado para un solo hotel con varios pisos."
            module="hotel"
            fields={[
              { name: 'name', label: 'Nombre comercial' },
              { name: 'city', label: 'Ciudad' },
              { name: 'address', label: 'Dirección' },
              { name: 'phone', label: 'Teléfono' },
              { name: 'email', label: 'Correo', type: 'email' },
              { name: 'floors', label: 'Número de pisos', type: 'number' }
            ]}
            records={data.hotel}
            onRefresh={loadAll}
          />
        )}
        {active === 'floors' && (
          <CrudSection
            title="Pisos del hotel"
            helper="Define áreas y capacidad por cada piso."
            module="floors"
            fields={[
              { name: 'level', label: 'Nivel' },
              { name: 'name', label: 'Nombre del piso' },
              { name: 'zone', label: 'Zona operativa' },
              { name: 'status', label: 'Estado' }
            ]}
            records={data.floors}
            onRefresh={loadAll}
          />
        )}
        {active === 'rooms' && (
          <CrudSection
            title="Gestión de habitaciones"
            module="rooms"
            fields={[
              { name: 'number', label: 'Número' },
              { name: 'floor', label: 'Piso' },
              { name: 'type', label: 'Tipo' },
              { name: 'status', label: 'Estado' },
              { name: 'price', label: 'Tarifa', type: 'number' }
            ]}
            records={data.rooms}
            onRefresh={loadAll}
          />
        )}
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
            title="Tareas operativas"
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
            title="Mensajería interna"
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
