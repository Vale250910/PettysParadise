"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Eye,
  Edit,
  Download,
  FileText,
  Calendar,
  User,
  Stethoscope,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import jsPDF from "jspdf"
import "../../stylos/vet/HistorialesMedicos.css"
import "../../stylos/vet/loadingvet.css"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

export default function HistorialesMedicos() {
  const [showModal, setShowModal] = useState(false)
  const [historiales, setHistoriales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHistorial, setSelectedHistorial] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [mascotas, setMascotas] = useState([])
  const [notification, setNotification] = useState(null)

  // Obtener datos del veterinario
  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchHistoriales()
    fetchMascotas()
  }, [])

  // Función para mostrar notificaciones
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Función para realizar peticiones autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error en la petición")
    }

    return response.json()
  }

  // Función para obtener historiales médicos
  const fetchHistoriales = async () => {
    setLoading(true)
    try {
      // Obtener todos los historiales médicos
      const response = await authenticatedFetch(`${API_BASE_URL}/historiales/obtener/completos`)
      setHistoriales(response || [])
    } catch (err) {
      console.error("Error al cargar historiales:", err)
      setError("Error al cargar los historiales médicos")
      showNotification("Error al cargar los historiales médicos", "error")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener mascotas
  const fetchMascotas = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/vermas/mascotas`)
      setMascotas(response || [])
    } catch (err) {
      console.error("Error al cargar mascotas:", err)
    }
  }

  // Función para crear nuevo historial
  const crearHistorial = async (historialData) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/historiales`, {
        method: "POST",
        body: JSON.stringify(historialData),
      })

      await fetchHistoriales() // Recargar historiales
      setShowModal(false)
      showNotification("Historial médico creado exitosamente")
    } catch (err) {
      console.error("Error al crear historial:", err)
      showNotification("Error al crear el historial médico", "error")
    }
  }

  // Función para actualizar historial
  const actualizarHistorial = async (historialData) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/historiales/${historialData.cod_his}`, {
        method: "PUT",
        body: JSON.stringify(historialData),
      })

      await fetchHistoriales() // Recargar historiales
      setShowEditModal(false)
      showNotification("Historial médico actualizado exitosamente")
    } catch (err) {
      console.error("Error al actualizar historial:", err)
      showNotification("Error al actualizar el historial médico", "error")
    }
  }

  // Función para generar PDF mejorada
  const generarPDF = (historial) => {
    try {
      const doc = new jsPDF()

      // Configurar fuente
      doc.setFont("helvetica")

      // Título
      doc.setFontSize(20)
      doc.setTextColor(44, 62, 80)
      doc.text("HISTORIAL MÉDICO VETERINARIO", 20, 30)

      // Línea separadora
      doc.setDrawColor(5, 150, 105)
      doc.setLineWidth(1)
      doc.line(20, 35, 190, 35)

      // Información de la clínica
      doc.setFontSize(12)
      doc.setTextColor(127, 140, 141)
      doc.text("Petty's Paradise - Clínica Veterinaria", 20, 45)
      doc.text(`Dr. ${userData.nombre} ${userData.apellido}`, 20, 52)
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 59)

      // Información del paciente
      doc.setFontSize(14)
      doc.setTextColor(44, 62, 80)
      doc.text("INFORMACIÓN DEL PACIENTE", 20, 75)

      doc.setFontSize(11)
      doc.setTextColor(52, 73, 94)
      doc.text(`Nombre: ${historial.mascota || "N/A"}`, 20, 85)
      doc.text(`Especie: ${historial.especie || "N/A"}`, 20, 92)
      doc.text(`Raza: ${historial.raza || "N/A"}`, 20, 99)
      doc.text(`Propietario: ${historial.propietario || "N/A"}`, 20, 106)

      // Información del historial
      doc.setFontSize(14)
      doc.setTextColor(44, 62, 80)
      doc.text("REGISTRO MÉDICO", 20, 125)

      doc.setFontSize(11)
      doc.setTextColor(52, 73, 94)
      doc.text(`Fecha de consulta: ${new Date(historial.fech_his).toLocaleDateString()}`, 20, 135)

      // Descripción
      doc.text("Descripción/Diagnóstico:", 20, 150)
      const descripcionLines = doc.splitTextToSize(historial.descrip_his || "", 170)
      doc.text(descripcionLines, 20, 160)

      // Tratamiento
      const yTratamiento = 160 + descripcionLines.length * 7 + 10
      doc.text("Tratamiento:", 20, yTratamiento)
      const tratamientoLines = doc.splitTextToSize(historial.tratamiento || "", 170)
      doc.text(tratamientoLines, 20, yTratamiento + 10)

      // Firma
      const yFirma = yTratamiento + tratamientoLines.length * 7 + 30
      doc.setDrawColor(127, 140, 141)
      doc.line(120, yFirma, 190, yFirma)
      doc.text(`Dr. ${userData.nombre} ${userData.apellido}`, 120, yFirma + 10)
      doc.text("Médico Veterinario", 120, yFirma + 17)

      // Guardar PDF
      doc.save(`Historial_${historial.mascota || "Paciente"}_${historial.fech_his}.pdf`)
      showNotification("PDF generado exitosamente")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      showNotification("Error al generar el PDF", "error")
    }
  }

  // Filtrar historiales por búsqueda
  const historialesFiltrados = historiales.filter(
    (historial) =>
      historial.mascota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historial.propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historial.descrip_his?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="vet-historiales-container">
      {/* Notificaciones */}
      {notification && (
        <div className={`vet-notification ${notification.type}`}>
          {notification.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="vet-historiales-header">
        <div className="vet-historiales-title">
          <h2>Historiales Médicos</h2>
          <p>Gestiona los registros médicos de tus pacientes</p>
        </div>
        <button className="vet-add-historial-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nuevo Historial
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="vet-search-container">
        <div className="vet-search-box">
          <Search size={20} className="vet-search-icon" />
          <input
            type="text"
            placeholder="Buscar por mascota, propietario o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de historiales */}
      <div className="vet-historiales-list">
        {loading ? (
          <div className="vet-loading-message">
            <div className="vet-loading-spinner"></div>
            Cargando historiales...
          </div>
        ) : error ? (
          <div className="vet-error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        ) : historialesFiltrados.length === 0 ? (
          <div className="vet-empty-message">
            <FileText size={48} />
            <h3>No hay historiales</h3>
            <p>
              {searchTerm
                ? "No se encontraron historiales que coincidan con la búsqueda"
                : "No hay historiales médicos registrados"}
            </p>
          </div>
        ) : (
          historialesFiltrados.map((historial) => (
            <HistorialCard
              key={historial.cod_his}
              historial={historial}
              onView={() => {
                setSelectedHistorial(historial)
                setShowViewModal(true)
              }}
              onEdit={() => {
                setSelectedHistorial(historial)
                setShowEditModal(true)
              }}
              onDownload={() => generarPDF(historial)}
            />
          ))
        )}
      </div>

      {/* Modales */}
      {showModal && (
        <NuevoHistorialModal onClose={() => setShowModal(false)} onSubmit={crearHistorial} mascotas={mascotas} />
      )}

      {showViewModal && selectedHistorial && (
        <VerHistorialModal
          historial={selectedHistorial}
          onClose={() => setShowViewModal(false)}
          onDownload={() => generarPDF(selectedHistorial)}
        />
      )}

      {showEditModal && selectedHistorial && (
        <EditarHistorialModal
          historial={selectedHistorial}
          onClose={() => setShowEditModal(false)}
          onSubmit={actualizarHistorial}
          mascotas={mascotas}
        />
      )}
    </div>
  )
}

// Resto de los componentes con clases CSS actualizadas...
// [HistorialCard, NuevoHistorialModal, VerHistorialModal, EditarHistorialModal]

// Componente HistorialCard
function HistorialCard({ historial, onView, onEdit, onDownload }) {
  const fecha = new Date(historial.fech_his)
  const fechaFormateada = fecha.toLocaleDateString()

  return (
    <div className="vet-historial-card">
      <div className="vet-historial-date">
        <Calendar size={20} />
        <span>{fechaFormateada}</span>
      </div>

      <div className="vet-historial-info">
        <div className="vet-historial-header">
          <h3>{historial.mascota}</h3>
          <span className="vet-historial-id">#{historial.cod_his}</span>
        </div>

        <div className="vet-historial-meta">
          <span className="vet-meta-item">
            <User size={14} />
            {historial.propietario}
          </span>
          <span className="vet-meta-item">
            <Stethoscope size={14} />
            {historial.especie} • {historial.raza}
          </span>
        </div>

        <div className="vet-historial-description">
          <p>{historial.descrip_his}</p>
        </div>
      </div>

      <div className="vet-historial-actions">
        <button className="vet-action-btn vet-view-btn" onClick={onView} title="Ver detalles">
          <Eye size={16} />
        </button>
        <button className="vet-action-btn vet-edit-btn" onClick={onEdit} title="Editar">
          <Edit size={16} />
        </button>
        <button className="vet-action-btn vet-download-btn" onClick={onDownload} title="Descargar PDF">
          <Download size={16} />
        </button>
      </div>
    </div>
  )
}

// Modal Nuevo Historial
function NuevoHistorialModal({ onClose, onSubmit, mascotas }) {
  const [formData, setFormData] = useState({
    cod_mas: "",
    fech_his: new Date().toISOString().split("T")[0],
    descrip_his: "",
    tratamiento: "",
  })

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
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-simple vet-modal-large">
        <div className="vet-modal-header">
          <h2>Nuevo Historial Médico</h2>
          <button className="vet-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="vet-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="vet-form-row">
              <div className="vet-form-group">
                <label htmlFor="cod_mas">Paciente:</label>
                <select
                  id="cod_mas"
                  className="vet-form-input"
                  value={formData.cod_mas}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {mascotas.map((mascota) => (
                    <option key={mascota.cod_mas} value={mascota.cod_mas}>
                      {mascota.nom_mas} - {mascota.propietario} ({mascota.especie})
                    </option>
                  ))}
                </select>
              </div>
              <div className="vet-form-group">
                <label htmlFor="fech_his">Fecha:</label>
                <input
                  type="date"
                  id="fech_his"
                  className="vet-form-input"
                  value={formData.fech_his}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="vet-form-group">
              <label htmlFor="descrip_his">Descripción/Diagnóstico:</label>
              <textarea
                id="descrip_his"
                className="vet-form-input"
                rows={4}
                value={formData.descrip_his}
                onChange={handleChange}
                placeholder="Describe los síntomas, diagnóstico y observaciones..."
                required
              />
            </div>

            <div className="vet-form-group">
              <label htmlFor="tratamiento">Tratamiento:</label>
              <textarea
                id="tratamiento"
                className="vet-form-input"
                rows={4}
                value={formData.tratamiento}
                onChange={handleChange}
                placeholder="Describe el tratamiento aplicado, medicamentos, recomendaciones..."
                required
              />
            </div>
          </form>
        </div>
        <div className="vet-modal-footer">
          <button className="vet-cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="vet-submit-button" onClick={handleSubmit}>
            <FileText size={16} /> Crear Historial
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Ver Historial
function VerHistorialModal({ historial, onClose, onDownload }) {
  return (
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-simple">
        <div className="vet-modal-header">
          <h2>Historial Médico #{historial.cod_his}</h2>
          <button className="vet-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="vet-modal-body">
          <div className="vet-historial-details-view">
            <div className="vet-detail-group">
              <h3>Información del Paciente</h3>
              <p>
                <strong>Nombre:</strong> {historial.mascota}
              </p>
              <p>
                <strong>Especie:</strong> {historial.especie}
              </p>
              <p>
                <strong>Raza:</strong> {historial.raza}
              </p>
              <p>
                <strong>Propietario:</strong> {historial.propietario}
              </p>
            </div>

            <div className="vet-detail-group">
              <h3>Información de la Consulta</h3>
              <p>
                <strong>Fecha:</strong> {new Date(historial.fech_his).toLocaleDateString()}
              </p>
            </div>

            <div className="vet-detail-group">
              <h3>Descripción/Diagnóstico</h3>
              <p>{historial.descrip_his}</p>
            </div>

            <div className="vet-detail-group">
              <h3>Tratamiento</h3>
              <p>{historial.tratamiento}</p>
            </div>
          </div>
        </div>
        <div className="vet-modal-footer">
          <button className="vet-download-btn-modal" onClick={onDownload}>
            <Download size={16} /> Descargar PDF
          </button>
          <button className="vet-submit-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Editar Historial
function EditarHistorialModal({ historial, onClose, onSubmit, mascotas }) {
  const [formData, setFormData] = useState({
    cod_his: historial.cod_his,
    cod_mas: historial.cod_mas,
    fech_his: new Date(historial.fech_his).toISOString().split("T")[0],
    descrip_his: historial.descrip_his,
    tratamiento: historial.tratamiento,
  })

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
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-simple vet-modal-large">
        <div className="vet-modal-header">
          <h2>Editar Historial Médico</h2>
          <button className="vet-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="vet-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="vet-form-row">
              <div className="vet-form-group">
                <label htmlFor="cod_mas">Paciente:</label>
                <select
                  id="cod_mas"
                  className="vet-form-input"
                  value={formData.cod_mas}
                  onChange={handleChange}
                  required
                >
                  {mascotas.map((mascota) => (
                    <option key={mascota.cod_mas} value={mascota.cod_mas}>
                      {mascota.nom_mas} - {mascota.propietario} ({mascota.especie})
                    </option>
                  ))}
                </select>
              </div>
              <div className="vet-form-group">
                <label htmlFor="fech_his">Fecha:</label>
                <input
                  type="date"
                  id="fech_his"
                  className="vet-form-input"
                  value={formData.fech_his}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="vet-form-group">
              <label htmlFor="descrip_his">Descripción/Diagnóstico:</label>
              <textarea
                id="descrip_his"
                className="vet-form-input"
                rows={4}
                value={formData.descrip_his}
                onChange={handleChange}
                required
              />
            </div>

            <div className="vet-form-group">
              <label htmlFor="tratamiento">Tratamiento:</label>
              <textarea
                id="tratamiento"
                className="vet-form-input"
                rows={4}
                value={formData.tratamiento}
                onChange={handleChange}
                required
              />
            </div>
          </form>
        </div>
        <div className="vet-modal-footer">
          <button className="vet-cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="vet-submit-button" onClick={handleSubmit}>
            <Edit size={16} /> Actualizar Historial
          </button>
        </div>
      </div>
    </div>
  )
}
