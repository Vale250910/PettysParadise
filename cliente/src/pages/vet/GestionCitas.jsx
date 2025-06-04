"use client"

import { useState, useEffect } from "react"
import {
  List,
  Eye,
  Edit,
  X,
  Check,
  RefreshCw,
  CalendarIcon,
  RotateCcw,
  Plus,
  Clock,
  User,
  Stethoscope,
} from "lucide-react"
import "../../stylos/vet/GestionCitas.css"

export default function GestionCitas() {
  const [showModal, setShowModal] = useState(false)
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCita, setSelectedCita] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState("all")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [propietarios, setPropietarios] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [servicios, setServicios] = useState([])
  const [veterinarios, setVeterinarios] = useState([])

  // Obtener datos del veterinario
  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const vetId = userData.id_usuario

  // Cargar datos al iniciar
  useEffect(() => {
    fetchCitas()
    fetchPropietarios()
    fetchServicios()
    fetchVeterinarios()
  }, [])

  // Función para obtener citas del veterinario
  const fetchCitas = async () => {
    setLoading(true)
    try {
      // Simular datos de citas para el veterinario
      const mockCitas = [
        {
          cod_cit: 1,
          fech_cit: "2024-12-10",
          hora: "10:00:00",
          estado: "CONFIRMADA",
          notas: "Chequeo general",
          propietario: "Carlos Gómez",
          mascota: "Max",
          servicio: "Consulta General",
          cod_mas: 1,
          cod_ser: 1,
          id_pro: 103,
        },
        {
          cod_cit: 2,
          fech_cit: "2024-12-11",
          hora: "14:30:00",
          estado: "PENDIENTE",
          notas: "Vacunación antirrábica",
          propietario: "Carlos Gómez",
          mascota: "Luna",
          servicio: "Vacunación",
          cod_mas: 2,
          cod_ser: 2,
          id_pro: 103,
        },
      ]

      setCitas(mockCitas)
    } catch (err) {
      console.error("Error al cargar citas:", err)
      setError("Error al cargar las citas")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener propietarios
  const fetchPropietarios = async () => {
    try {
      const mockPropietarios = [{ id_pro: 103, nombre: "Carlos", apellido: "Gómez", email: "carlos@email.com" }]
      setPropietarios(mockPropietarios)
    } catch (err) {
      console.error("Error al cargar propietarios:", err)
    }
  }

  // Función para obtener mascotas por propietario
  const fetchMascotasPorPropietario = async (idPropietario) => {
    try {
      const mockMascotas = [
        { cod_mas: 1, nom_mas: "Max", especie: "Perro", raza: "Labrador", id_pro: 103 },
        { cod_mas: 2, nom_mas: "Luna", especie: "Gato", raza: "Siamés", id_pro: 103 },
      ]
      return mockMascotas.filter((m) => m.id_pro === Number.parseInt(idPropietario))
    } catch (err) {
      console.error("Error al cargar mascotas:", err)
      return []
    }
  }

  // Función para obtener servicios
  const fetchServicios = async () => {
    try {
      const mockServicios = [
        { cod_ser: 1, nom_ser: "Consulta General", precio: 45000 },
        { cod_ser: 2, nom_ser: "Vacunación Antirrábica", precio: 30000 },
        { cod_ser: 3, nom_ser: "Desparasitación", precio: 25000 },
        { cod_ser: 4, nom_ser: "Esterilización", precio: 70000 },
        { cod_ser: 5, nom_ser: "Baño y Peluquería", precio: 35000 },
      ]
      setServicios(mockServicios)
    } catch (err) {
      console.error("Error al cargar servicios:", err)
    }
  }

  // Función para obtener veterinarios
  const fetchVeterinarios = async () => {
    try {
      const mockVeterinarios = [
        { id_vet: 102, nombre: "Luis", apellido: "Martínez", especialidad: "Cirugía y diagnóstico" },
      ]
      setVeterinarios(mockVeterinarios)
    } catch (err) {
      console.error("Error al cargar veterinarios:", err)
    }
  }

  // Función para crear una nueva cita
  const crearCita = async (citaData) => {
    try {
      console.log("Creando cita:", citaData)
      await fetchCitas() // Recargar citas
      setShowModal(false)
    } catch (err) {
      console.error("Error al crear cita:", err)
      alert("Error al crear la cita")
    }
  }

  // Función para actualizar una cita
  const actualizarCita = async (citaData) => {
    try {
      console.log("Actualizando cita:", citaData)
      await fetchCitas() // Recargar citas
      setShowEditModal(false)
    } catch (err) {
      console.error("Error al actualizar cita:", err)
      alert("Error al actualizar la cita")
    }
  }

  // Función para cancelar una cita
  const cancelarCita = async (codigo) => {
    if (window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      try {
        console.log("Cancelando cita:", codigo)
        await fetchCitas() // Recargar citas
      } catch (err) {
        console.error("Error al cancelar cita:", err)
        alert("Error al cancelar la cita")
      }
    }
  }

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroEstado("all")
    setFiltroFecha("")
  }

  // Filtrar citas según los criterios seleccionados
  const citasFiltradas = citas.filter((cita) => {
    if (filtroEstado !== "all" && cita.estado !== filtroEstado) {
      return false
    }

    if (filtroFecha) {
      const citaFecha = new Date(cita.fech_cit)
      const filtroFechaObj = new Date(filtroFecha)
      if (citaFecha.toDateString() !== filtroFechaObj.toDateString()) {
        return false
      }
    }

    return true
  })

  return (
    <div className="gestion-citas-container">
      {/* Header */}
      <div className="citas-header">
        <div className="citas-title">
          <h2>Gestión de Citas</h2>
          <p>Administra las citas de tus pacientes</p>
        </div>
        <button className="add-cita-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nueva Cita
        </button>
      </div>

      {/* Filters */}
      <div className="citas-filters">
        <div className="filter-group">
          <label htmlFor="filter-status">Estado:</label>
          <select
            id="filter-status"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="REALIZADA">Realizada</option>
            <option value="NO_ASISTIDA">No Asistida</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-date">Fecha:</label>
          <div className="date-input-container">
            <input
              type="date"
              id="filter-date"
              className="filter-input"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
            <CalendarIcon size={16} className="calendar-icon" />
          </div>
        </div>
        <button className="clear-filters-btn" onClick={limpiarFiltros}>
          <RotateCcw size={16} /> Limpiar filtros
        </button>
      </div>

      {/* Vista de lista */}
      <div className="view-toggle">
        <button className="view-btn active">
          <List size={16} /> Lista de Citas
        </button>
      </div>

      {/* Lista de citas */}
      <div className="citas-list">
        {loading ? (
          <div className="loading-message">Cargando citas...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : citasFiltradas.length === 0 ? (
          <div className="empty-message">No hay citas que coincidan con los filtros seleccionados</div>
        ) : (
          citasFiltradas.map((cita) => (
            <CitaCard
              key={cita.cod_cit}
              cita={cita}
              onView={() => {
                setSelectedCita(cita)
                setShowViewModal(true)
              }}
              onEdit={() => {
                setSelectedCita(cita)
                setShowEditModal(true)
              }}
              onCancel={() => cancelarCita(cita.cod_cit)}
            />
          ))
        )}
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <NuevaCitaModal
          onClose={() => setShowModal(false)}
          onSubmit={crearCita}
          propietarios={propietarios}
          servicios={servicios}
          veterinarios={veterinarios}
          fetchMascotasPorPropietario={fetchMascotasPorPropietario}
        />
      )}

      {/* Modal Ver Cita */}
      {showViewModal && selectedCita && <VerCitaModal cita={selectedCita} onClose={() => setShowViewModal(false)} />}

      {/* Modal Editar Cita */}
      {showEditModal && selectedCita && (
        <EditarCitaModal
          cita={selectedCita}
          onClose={() => setShowEditModal(false)}
          onSubmit={actualizarCita}
          propietarios={propietarios}
          servicios={servicios}
          veterinarios={veterinarios}
          fetchMascotasPorPropietario={fetchMascotasPorPropietario}
        />
      )}
    </div>
  )
}

// Componente CitaCard
function CitaCard({ cita, onView, onEdit, onCancel }) {
  const fecha = new Date(cita.fech_cit)
  const mes = fecha.toLocaleString("es", { month: "short" }).toUpperCase()
  const dia = fecha.getDate()
  const año = fecha.getFullYear()
  const hora = cita.hora.substring(0, 5)

  let statusClass = ""
  let statusIcon = null

  switch (cita.estado) {
    case "CONFIRMADA":
      statusClass = "confirmed"
      statusIcon = <Check size={16} />
      break
    case "PENDIENTE":
      statusClass = "pending"
      statusIcon = <Clock size={16} />
      break
    case "CANCELADA":
      statusClass = "canceled"
      statusIcon = <X size={16} />
      break
    case "REALIZADA":
      statusClass = "completed"
      statusIcon = <Check size={16} />
      break
    case "NO_ASISTIDA":
      statusClass = "missed"
      statusIcon = <X size={16} />
      break
    default:
      statusClass = "pending"
      statusIcon = <Clock size={16} />
  }

  return (
    <div className="cita-card">
      <div className="cita-date">
        <div className="month">{mes}</div>
        <div className="day">{dia}</div>
        <div className="year">{año}</div>
        <div className="time">{hora}</div>
      </div>
      <div className="cita-details">
        <div className="cita-info">
          <h3>{cita.servicio}</h3>
          <div className="cita-meta">
            <span className="meta-item">
              <User size={16} /> {cita.propietario}
            </span>
            <span className="meta-item">
              <Stethoscope size={16} /> {cita.mascota}
            </span>
          </div>
          <div className="cita-status">
            <span className={`status-badge ${statusClass}`}>
              {statusIcon} {cita.estado}
            </span>
          </div>
        </div>
        <div className="cita-actions">
          <button className="action-btn view-btn" onClick={onView}>
            <Eye size={16} /> Ver
          </button>
          {cita.estado !== "CANCELADA" && cita.estado !== "REALIZADA" && (
            <>
              <button className="action-btn edit-btn" onClick={onEdit}>
                <Edit size={16} /> Editar
              </button>
              <button className="action-btn cancel-btn" onClick={onCancel}>
                <X size={16} /> Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal Nueva Cita
function NuevaCitaModal({ onClose, onSubmit, propietarios, servicios, veterinarios, fetchMascotasPorPropietario }) {
  const [formData, setFormData] = useState({
    id_propietario: "",
    cod_mas: "",
    cod_ser: "",
    id_vet: "",
    fech_cit: "",
    hora: "",
    notas: "",
  })
  const [mascotasDisponibles, setMascotasDisponibles] = useState([])
  const [errors, setErrors] = useState({})

  // Calcular fechas mínima y máxima
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 1)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  const handleChange = async (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))

    // Si cambia el propietario, cargar sus mascotas
    if (id === "id_propietario" && value) {
      const mascotas = await fetchMascotasPorPropietario(value)
      setMascotasDisponibles(mascotas)
      setFormData((prev) => ({ ...prev, cod_mas: "" })) // Limpiar mascota seleccionada
    }

    // Validaciones
    if (id === "fech_cit") {
      validateDate(value)
    } else if (id === "hora") {
      validateTime(value)
    }
  }

  const validateDate = (date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate <= today) {
      setErrors((prev) => ({ ...prev, fech_cit: "La cita debe ser a partir de mañana" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, fech_cit: null }))
      return true
    }
  }

  const validateTime = (time) => {
    if (!time) return false

    const [hours, minutes] = time.split(":").map(Number)

    if (hours < 8 || hours > 19 || (hours === 19 && minutes > 0)) {
      setErrors((prev) => ({ ...prev, hora: "El horario de atención es de 8:00 AM a 7:00 PM" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, hora: null }))
      return true
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const isDateValid = validateDate(formData.fech_cit)
    const isTimeValid = validateTime(formData.hora)

    if (isDateValid && isTimeValid) {
      onSubmit(formData)
    }
  }

  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nueva Cita</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="id_propietario">Propietario:</label>
              <select id="id_propietario" value={formData.id_propietario} onChange={handleChange} required>
                <option value="">Seleccionar propietario</option>
                {propietarios.map((prop) => (
                  <option key={prop.id_pro} value={prop.id_pro}>
                    {prop.nombre} {prop.apellido} - ID: {prop.id_pro}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cod_mas">Mascota:</label>
              <select
                id="cod_mas"
                value={formData.cod_mas}
                onChange={handleChange}
                required
                disabled={!formData.id_propietario}
              >
                <option value="">Seleccionar mascota</option>
                {mascotasDisponibles.map((mascota) => (
                  <option key={mascota.cod_mas} value={mascota.cod_mas}>
                    {mascota.nom_mas} ({mascota.raza})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cod_ser">Servicio:</label>
              <select id="cod_ser" value={formData.cod_ser} onChange={handleChange} required>
                <option value="">Seleccionar servicio</option>
                {servicios.map((servicio) => (
                  <option key={servicio.cod_ser} value={servicio.cod_ser}>
                    {servicio.nom_ser} - ${servicio.precio}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="id_vet">Veterinario:</label>
              <select id="id_vet" value={formData.id_vet} onChange={handleChange} required>
                <option value="">Seleccionar veterinario</option>
                {veterinarios.map((vet) => (
                  <option key={vet.id_vet} value={vet.id_vet}>
                    Dr. {vet.nombre} {vet.apellido} - {vet.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fech_cit">Fecha:</label>
                <input
                  type="date"
                  id="fech_cit"
                  value={formData.fech_cit}
                  onChange={handleChange}
                  min={minDate}
                  max={maxDateStr}
                  required
                />
                {errors.fech_cit && <p className="error-message">{errors.fech_cit}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="hora">Hora:</label>
                <input
                  type="time"
                  id="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  min="08:00"
                  max="19:00"
                  required
                />
                {errors.hora && <p className="error-message">{errors.hora}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas adicionales:</label>
              <textarea id="notas" rows={3} value={formData.notas} onChange={handleChange} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Agendar Cita
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Ver Cita
function VerCitaModal({ cita, onClose }) {
  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content modal-view">
        <div className="modal-header">
          <h2>Detalles de la Cita</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="cita-details-view">
            <div className="detail-group">
              <h3>Información General</h3>
              <p>
                <strong>Estado:</strong>{" "}
                <span className={`status-text ${cita.estado.toLowerCase()}`}>{cita.estado}</span>
              </p>
              <p>
                <strong>Fecha:</strong> {new Date(cita.fech_cit).toLocaleDateString()}
              </p>
              <p>
                <strong>Hora:</strong> {cita.hora.substring(0, 5)}
              </p>
            </div>

            <div className="detail-group">
              <h3>Paciente</h3>
              <p>
                <strong>Propietario:</strong> {cita.propietario}
              </p>
              <p>
                <strong>Mascota:</strong> {cita.mascota}
              </p>
            </div>

            <div className="detail-group">
              <h3>Servicio</h3>
              <p>{cita.servicio}</p>
            </div>

            {cita.notas && (
              <div className="detail-group">
                <h3>Notas</h3>
                <p>{cita.notas}</p>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="submit-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Editar Cita
function EditarCitaModal({
  cita,
  onClose,
  onSubmit,
  propietarios,
  servicios,
  veterinarios,
  fetchMascotasPorPropietario,
}) {
  const [formData, setFormData] = useState({
    cod_cit: cita.cod_cit,
    id_propietario: cita.id_pro,
    cod_mas: cita.cod_mas,
    cod_ser: cita.cod_ser,
    id_vet: cita.id_vet,
    fech_cit: new Date(cita.fech_cit).toISOString().split("T")[0],
    hora: cita.hora,
    estado: cita.estado,
    notas: cita.notas || "",
  })
  const [mascotasDisponibles, setMascotasDisponibles] = useState([])

  useEffect(() => {
    if (formData.id_propietario) {
      fetchMascotasPorPropietario(formData.id_propietario).then(setMascotasDisponibles)
    }
  }, [formData.id_propietario])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Cita</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="estado">Estado:</label>
              <select id="estado" value={formData.estado} onChange={handleChange}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="REALIZADA">Realizada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="NO_ASISTIDA">No Asistida</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fech_cit">Fecha:</label>
              <input type="date" id="fech_cit" value={formData.fech_cit} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="hora">Hora:</label>
              <input
                type="time"
                id="hora"
                value={formData.hora}
                onChange={handleChange}
                min="08:00"
                max="19:00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas:</label>
              <textarea id="notas" rows={3} value={formData.notas} onChange={handleChange} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}
