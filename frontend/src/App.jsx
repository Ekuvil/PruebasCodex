import { useEffect, useMemo, useState } from 'react';

const modules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reservations', label: 'Reservas' },
  { key: 'rooms', label: 'Habitaciones' },
  { key: 'guests', label: 'Huéspedes' },
  { key: 'tasks', label: 'Tareas' },
  { key: 'messages', label: 'Mensajes' },
  { key: 'inventory', label: 'Inventario' }
];

const endpoint = import.meta.env.VITE_API_URL || '/api.php';
const receptionPhone = import.meta.env.VITE_RECEPTION_PHONE || '5215550000000';
const receptionEmail = import.meta.env.VITE_RECEPTION_EMAIL || 'recepcion@hotel.com';

function buildWhatsAppLink(phone, text) {
  const cleaned = String(phone || '').replace(/\D/g, '') || receptionPhone;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

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

function CrudSection({ title, module, fields, records, onRefresh, whatsappTemplate }) {
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

  const openWhatsApp = (item) => {
    const message = whatsappTemplate(item);
    const phone = item.phone || item.contactPhone || receptionPhone;
    window.open(buildWhatsAppLink(phone, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="panel">
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
            {records.map((item) => (
              <tr key={item.id}>
                {fields.map((f) => (
                  <td key={f.name}>{item[f.name]}</td>
                ))}
                <td className="actions-cell">
                  <button className="btn-ghost" type="button" onClick={() => startEdit(item)}>
                    Editar
                  </button>
                  <button className="btn-whatsapp" type="button" onClick={() => openWhatsApp(item)}>
                    WhatsApp
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

  return (
    <div className="dashboard-grid">
      <article className="kpi">
        <h3>Ingresos Totales</h3>
        <strong>${totalRevenue.toLocaleString('es-MX')}</strong>
        <small>Basado en reservas activas</small>
      </article>
      <article className="kpi">
        <h3>Habitaciones Ocupadas</h3>
        <strong>{occupied}/{data.rooms.length}</strong>
        <small>Nivel de ocupación actual</small>
      </article>
      <article className="kpi">
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
        </ul>
      </article>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [data, setData] = useState({
    rooms: [], reservations: [], guests: [], tasks: [], messages: [], inventory: []
  });

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

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">▦</div>
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
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <input placeholder="Buscar por habitación, huésped o tarea..." />
          <div className="contact-actions">
            <button
              type="button"
              className="btn-whatsapp"
              onClick={() => window.open(buildWhatsAppLink(receptionPhone, 'Hola recepción, necesito apoyo.'), '_blank')}
            >
              WhatsApp Recepción
            </button>
            <a className="btn-ghost" href={`mailto:${receptionEmail}`}>Correo recepción</a>
          </div>
        </header>
        {active === 'dashboard' && <Dashboard data={data} />}
        {active === 'rooms' && (
          <CrudSection
            title="Gestión de Habitaciones"
            module="rooms"
            fields={[
              { name: 'number', label: 'Número' },
              { name: 'type', label: 'Tipo' },
              { name: 'status', label: 'Estado' },
              { name: 'price', label: 'Tarifa', type: 'number' }
            ]}
            records={data.rooms}
            onRefresh={loadAll}
            whatsappTemplate={(item) => `Habitación ${item.number} (${item.type}) en estado ${item.status}.`}
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
            whatsappTemplate={(item) => `Reserva de ${item.guest} para habitación ${item.room}. Check-in: ${item.checkIn}, Check-out: ${item.checkOut}.`}
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
            whatsappTemplate={(item) => `Hola ${item.name}, te contacta recepción del hotel.`}
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
            whatsappTemplate={(item) => `Tarea: ${item.title} | Área: ${item.area} | Estado: ${item.status} | Límite: ${item.dueDate}.`}
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
            whatsappTemplate={(item) => `Mensaje interno de ${item.sender} para ${item.recipient}: ${item.subject} (Prioridad: ${item.priority}).`}
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
            whatsappTemplate={(item) => `Inventario ${item.item} (${item.category}): stock actual ${item.stock}, mínimo ${item.minStock}.`}
          />
        )}
      </main>
    </div>
  );
}
