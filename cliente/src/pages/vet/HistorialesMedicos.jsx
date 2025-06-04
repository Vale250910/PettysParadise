"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Download, FileText, Calendar, User, Stethoscope, X } from "lucide-react"
import jsPDF from "jspdf"
import "../../stylos/vet/HistorialesMedicos.css"


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

  // Obtener datos del veterinario
  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const vetId = userData.id_usuario

  useEffect(() => {
    fetchHistoriales()
    fetchMascotas()
  }, [])

  // Función para obtener historiales médicos
  const fetchHistoriales = async () => {
    setLoading(true)
    try {
      // Simular datos de historiales médicos
      const mockHistoriales = [
        {
          cod_his: 1,
          fech_his: "2024-11-15",
          descrip_his: "Chequeo general rutinario. Mascota en buen estado de salud.",
          tratamiento: "Vacuna antirrábica aplicada. Desparasitación oral.",
          cod_mas: 1,
          mascota: "Max",
          propietario: "Carlos Gómez",
          especie: "Perro",
          raza: "Labrador",
        },
        {
          cod_his: 2,
          fech_his: "2024-10-20",
          descrip_his: "Consulta por problemas digestivos. Vómitos ocasionales.",
          tratamiento: "Dieta blanda por 3 días. Medicamento antiemético.",
          cod_mas: 2,
          mascota: "Luna",
          propietario: "Carlos Gómez",
          especie: "Gato",
          raza: "Siamés",
        },
      ]

      setHistoriales(mockHistoriales)
    } catch (err) {
      console.error("Error al cargar historiales:", err)
      setError("Error al cargar los historiales médicos")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener mascotas
  const fetchMascotas = async () => {
    try {
      const mockMascotas = [
        { cod_mas: 1, nom_mas: "Max", especie: "Perro", raza: "Labrador", propietario: "Carlos Gómez" },
        { cod_mas: 2, nom_mas: "Luna", especie: "Gato", raza: "Siamés", propietario: "Carlos Gómez" },
      ]
      setMascotas(mockMascotas)
    } catch (err) {
      console.error("Error al cargar mascotas:", err)
    }
  }

  // Función para crear nuevo historial
  const crearHistorial = async (historialData) => {
    try {
      console.log("Creando historial:", historialData)
      await fetchHistoriales() // Recargar historiales
      setShowModal(false)
    } catch (err) {
      console.error("Error al crear historial:", err)
      alert("Error al crear el historial médico")
    }
  }

  // Función para actualizar historial
  const actualizarHistorial = async (historialData) => {
    try {
      console.log("Actualizando historial:", historialData)
      await fetchHistoriales() // Recargar historiales
      setShowEditModal(false)
    } catch (err) {
      console.error("Error al actualizar historial:", err)
      alert("Error al actualizar el historial médico")
    }
  }

  // Función para generar PDF
  const generarPDF = (historial) => {
    const doc = new jsPDF()

    // Configurar fuente
    doc.setFont("helvetica")

    // Título
    doc.setFontSize(20)
    doc.setTextColor(44, 62, 80)
    doc.text("HISTORIAL MÉDICO VETERINARIO", 20, 30)

    // Línea separadora
    doc.setDrawColor(93, 173, 226)
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
    doc.text(`Nombre: ${historial.mascota}`, 20, 85)
    doc.text(`Especie: ${historial.especie}`, 20, 92)
    doc.text(`Raza: ${historial.raza}`, 20, 99)
    doc.text(`Propietario: ${historial.propietario}`, 20, 106)

    // Información del historial
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text("REGISTRO MÉDICO", 20, 125)

    doc.setFontSize(11)
    doc.setTextColor(52, 73, 94)
    doc.text(`Fecha de consulta: ${new Date(historial.fech_his).toLocaleDateString()}`, 20, 135)

    // Descripción
    doc.text("Descripción/Diagnóstico:", 20, 150)
    const descripcionLines = doc.splitTextToSize(historial.descrip_his, 170)
    doc.text(descripcionLines, 20, 160)

    // Tratamiento
    const yTratamiento = 160 + descripcionLines.length * 7 + 10
    doc.text("Tratamiento:", 20, yTratamiento)
    const tratamientoLines = doc.splitTextToSize(historial.tratamiento, 170)
    doc.text(tratamientoLines, 20, yTratamiento + 10)

    // Firma
    const yFirma = yTratamiento + tratamientoLines.length * 7 + 30
    doc.setDrawColor(127, 140, 141)
    doc.line(120, yFirma, 190, yFirma)
    doc.text(`Dr. ${userData.nombre} ${userData.apellido}`, 120, yFirma + 10)
    doc.text("Médico Veterinario", 120, yFirma + 17)

    // Guardar PDF
    doc.save(`Historial_${historial.mascota}_${historial.fech_his}.pdf`)
  }

  // Filtrar historiales por búsqueda
  const historialesFiltrados = historiales.filter(
    (historial) =>
      historial.mascota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historial.propietario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historial.descrip_his.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="historiales-container">
      {/* Header */}
      <div className="historiales-header">
        <div className="historiales-title">
          <h2>Historiales Médicos</h2>
          <p>Gestiona los registros médicos de tus pacientes</p>
        </div>
        <button className="add-historial-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nuevo Historial
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-container">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por mascota, propietario o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de historiales */}
      <div className="historiales-list">
        {loading ? (
          <div className="loading-message">Cargando historiales...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : historialesFiltrados.length === 0 ? (
          <div className="empty-message">
            {searchTerm
              ? "No se encontraron historiales que coincidan con la búsqueda"
              : "No hay historiales médicos registrados"}
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

      {/* Modal Nuevo Historial */}
      {showModal && (
        <NuevoHistorialModal onClose={() => setShowModal(false)} onSubmit={crearHistorial} mascotas={mascotas} />
      )}

      {/* Modal Ver Historial */}
      {showViewModal && selectedHistorial && (
        <VerHistorialModal
          historial={selectedHistorial}
          onClose={() => setShowViewModal(false)}
          onDownload={() => generarPDF(selectedHistorial)}
        />
      )}

      {/* Modal Editar Historial */}
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

// Componente HistorialCard
function HistorialCard({ historial, onView, onEdit, onDownload }) {
  const fecha = new Date(historial.fech_his)
  const fechaFormateada = fecha.toLocaleDateString()

  return (
    <div className="historial-card">
      <div className="historial-date">
        <Calendar size={20} />
        <span>{fechaFormateada}</span>
      </div>

      <div className="historial-info">
        <div className="historial-header">
          <h3>{historial.mascota}</h3>
          <span className="historial-id">#{historial.cod_his}</span>
        </div>

        <div className="historial-meta">
          <span className="meta-item">
            <User size={14} />
            {historial.propietario}
          </span>
          <span className="meta-item">
            <Stethoscope size={14} />
            {historial.especie} • {historial.raza}
          </span>
        </div>

        <div className="historial-description">
          <p>{historial.descrip_his}</p>
        </div>
      </div>

      <div className="historial-actions">
        <button className="action-btn view-btn" onClick={onView} title="Ver detalles">
          <Eye size={16} />
        </button>
        <button className="action-btn edit-btn" onClick={onEdit} title="Editar">
          <Edit size={16} />
        </button>
        <button className="action-btn download-btn" onClick={onDownload} title="Descargar PDF">
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
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Nuevo Historial Médico</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cod_mas">Paciente:</label>
                <select id="cod_mas" value={formData.cod_mas} onChange={handleChange} required>
                  <option value="">Seleccionar paciente</option>
                  {mascotas.map((mascota) => (
                    <option key={mascota.cod_mas} value={mascota.cod_mas}>
                      {mascota.nom_mas} - {mascota.propietario} ({mascota.especie})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fech_his">Fecha:</label>
                <input type="date" id="fech_his" value={formData.fech_his} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descrip_his">Descripción/Diagnóstico:</label>
              <textarea
                id="descrip_his"
                rows={4}
                value={formData.descrip_his}
                onChange={handleChange}
                placeholder="Describe los síntomas, diagnóstico y observaciones..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tratamiento">Tratamiento:</label>
              <textarea
                id="tratamiento"
                rows={4}
                value={formData.tratamiento}
                onChange={handleChange}
                placeholder="Describe el tratamiento aplicado, medicamentos, recomendaciones..."
                required
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
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
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Historial Médico #{historial.cod_his}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="historial-details-view">
            <div className="detail-group">
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

            <div className="detail-group">
              <h3>Información de la Consulta</h3>
              <p>
                <strong>Fecha:</strong> {new Date(historial.fech_his).toLocaleDateString()}
              </p>
            </div>

            <div className="detail-group">
              <h3>Descripción/Diagnóstico</h3>
              <p>{historial.descrip_his}</p>
            </div>

            <div className="detail-group">
              <h3>Tratamiento</h3>
              <p>{historial.tratamiento}</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="download-btn-modal" onClick={onDownload}>
            <Download size={16} /> Descargar PDF
          </button>
          <button className="submit-btn" onClick={onClose}>
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
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Editar Historial Médico</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cod_mas">Paciente:</label>
                <select id="cod_mas" value={formData.cod_mas} onChange={handleChange} required>
                  {mascotas.map((mascota) => (
                    <option key={mascota.cod_mas} value={mascota.cod_mas}>
                      {mascota.nom_mas} - {mascota.propietario} ({mascota.especie})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fech_his">Fecha:</label>
                <input type="date" id="fech_his" value={formData.fech_his} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descrip_his">Descripción/Diagnóstico:</label>
              <textarea id="descrip_his" rows={4} value={formData.descrip_his} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="tratamiento">Tratamiento:</label>
              <textarea id="tratamiento" rows={4} value={formData.tratamiento} onChange={handleChange} required />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            <Edit size={16} /> Actualizar Historial
          </button>
        </div>
      </div>
    </div>
  )
}
