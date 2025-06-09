"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { Plus, Search, Edit, Trash2, Stethoscope, User, Dog, Calendar, FileText, X, Download} from "lucide-react"
import { apiService } from "../../services/api-service"
import jsPDF from "jspdf";
import "../../stylos/vet/HistorialesMedicos.css"
import "../../stylos/vet/loadingvet.css"

// =================================================================================
// COMPONENTE PRINCIPAL
// =================================================================================
export default function HistorialesMedicos() {
  const [historiales, setHistoriales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedHistorial, setSelectedHistorial] = useState(null)

  useEffect(() => {
    fetchHistoriales()
  }, [])

  const showNotification = (message, type = "success") => {
    const icon = type === "success" ? "success" : "error"
    Swal.fire({ icon, title: message, timer: 3000, showConfirmButton: false, toast: true, position: "top-end" })
  }

  const fetchHistoriales = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.get("/api/historiales")
      setHistoriales(response || [])
    } catch (err) {
      setError("Error al cargar los historiales médicos.")
      showNotification("Error al cargar historiales", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (historialData) => {
    try {
      if (isEditing) {
        await apiService.put(`/api/historiales/${historialData.cod_his}`, historialData)
        showNotification("Historial actualizado exitosamente.")
      } else {
        await apiService.post("/api/historiales", historialData)
        showNotification("Historial registrado exitosamente.")
      }
      setShowModal(false)
      await fetchHistoriales()
    } catch (err) {
      showNotification(`Error al guardar el historial: ${err.message}`, "error")
    }
  }

  const handleDelete = async (historialId, mascotaNombre) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar el registro de ${mascotaNombre}?`,
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await apiService.delete(`/api/historiales/${historialId}`)
        showNotification("Historial eliminado correctamente.")
        await fetchHistoriales()
      } catch (err) {
        showNotification(`Error al eliminar: ${err.message}`, "error")
      }
    }
  }

  const generarPDF = (historial) => {
    try {
      const doc = new jsPDF();
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      // Configurar fuente
      doc.setFont("helvetica");

      // Título
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text("HISTORIAL MÉDICO VETERINARIO", 20, 30);

      // Línea separadora
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(1);
      doc.line(20, 35, 190, 35);

      // Información de la clínica
      doc.setFontSize(12);
      doc.setTextColor(127, 140, 141);
      doc.text("Petty's Paradise - Clínica Veterinaria", 20, 45);
      doc.text(`Dr. ${userData.nombre} ${userData.apellido}`, 20, 52);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 59);

      // Información del paciente
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text("INFORMACIÓN DEL PACIENTE", 20, 75);

      doc.setFontSize(11);
      doc.setTextColor(52, 73, 94);
      doc.text(`Nombre: ${historial.nombre_mascota || "N/A"}`, 20, 85);
      doc.text(`Propietario: ${historial.nombre_propietario || "N/A"}`, 20, 92);

      // Información del historial
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text("REGISTRO MÉDICO", 20, 110);

      doc.setFontSize(11);
      doc.setTextColor(52, 73, 94);
      doc.text(`Fecha de consulta: ${new Date(historial.fecha).toLocaleDateString()}`, 20, 120);

      // Descripción
      doc.text("Descripción/Diagnóstico:", 20, 135);
      const descripcionLines = doc.splitTextToSize(historial.descripcion || "", 170);
      doc.text(descripcionLines, 20, 145);

      // Tratamiento
      const yTratamiento = 145 + descripcionLines.length * 7 + 10;
      doc.text("Tratamiento:", 20, yTratamiento);
      const tratamientoLines = doc.splitTextToSize(historial.tratamiento || "", 170);
      doc.text(tratamientoLines, 20, yTratamiento + 10);

      // Firma
      const yFirma = yTratamiento + tratamientoLines.length * 7 + 30;
      doc.setDrawColor(127, 140, 141);
      doc.line(120, yFirma, 190, yFirma);
      doc.text(`Dr. ${userData.nombre} ${userData.apellido}`, 120, yFirma + 10);
      doc.text("Médico Veterinario", 120, yFirma + 17);

      // Guardar PDF
      doc.save(`Historial_${historial.nombre_mascota || "Paciente"}_${historial.fecha}.pdf`);
      showNotification("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showNotification("Error al generar el PDF", "error");
    }
  };

  const openModal = (historial = null) => {
    setSelectedHistorial(historial)
    setIsEditing(!!historial)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedHistorial(null)
    setIsEditing(false)
  }

  const historialesFiltrados = historiales.filter(
    (h) =>
      h.nombre_mascota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.nombre_propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="historiales-medicos-container">
      <div className="historiales-medicos-header">
        <h1>Historiales Médicos</h1>
        <button onClick={() => openModal()} className="historiales-medicos-add-btn">
          <Plus size={20} /> Nuevo Historial
        </button>
      </div>
      <div className="historiales-medicos-search-container">
        <div className="historiales-medicos-search-box">
          <Search size={20} className="historiales-medicos-search-icon" />
          <input
            type="text"
            placeholder="Buscar por mascota, propietario o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="historiales-medicos-list">
        {loading ? (
          <div className="historiales-medicos-loading-message">
            <div className="historiales-medicos-loading-spinner"></div>Cargando historiales...
          </div>
        ) : error ? (
          <p className="historiales-medicos-error-message">{error}</p>
        ) : historialesFiltrados.length === 0 ? (
          <div className="historiales-medicos-empty-message">No hay historiales que coincidan con la búsqueda.</div>
        ) : (
          historialesFiltrados.map((historial) => (
            <HistorialCard
              key={historial.cod_his}
              historial={historial}
              onEdit={() => openModal(historial)}
              onDelete={() => handleDelete(historial.cod_his, historial.nombre_mascota)}
              onDownload={() => generarPDF(historial)}
            />
          ))
        )}
      </div>

      {showModal && (
        <HistorialModal
          onClose={closeModal}
          onSubmit={handleSave}
          isEditing={isEditing}
          historial={selectedHistorial}
        />
      )}
    </div>
  )
}

// =================================================================================
// SUB-COMPONENTES
// =================================================================================


function HistorialCard({ historial, onEdit, onDelete, onDownload }) {
  return (
    <div className="historiales-medicos-card">
      <div className="historiales-medicos-card-header">
        <Stethoscope />
        <div>
          <h4>{historial.nombre_mascota}</h4>
          <p>{historial.nombre_propietario}</p>
        </div>
        <span>{new Date(historial.fecha).toLocaleDateString("es-CO")}</span>
      </div>
      <div className="historiales-medicos-card-body">
        <p>
          <strong>Descripción:</strong> {historial.descripcion}
        </p>
        <p>
          <strong>Tratamiento:</strong> {historial.tratamiento}
        </p>
      </div>
      <div className="historiales-medicos-card-actions">
        <button onClick={onEdit} className="historiales-medicos-action-btn edit">
          <Edit size={16} /> Editar
        </button>
        <button onClick={onDownload} className="vet-action-btn download"><Download size={16} /> Descargar</button>
        <button onClick={onDelete} className="historiales-medicos-action-btn delete">
          <Trash2 size={16} /> Eliminar
        </button>
      </div>
    </div>
  )
}

function HistorialModal({ onClose, onSubmit, isEditing, historial }) {
  const [formData, setFormData] = useState({
    cod_mas: historial?.cod_mas || "",
    fecha: historial ? new Date(historial.fecha).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    descripcion: historial?.descripcion || "",
    tratamiento: historial?.tratamiento || "",
    cod_his: historial?.cod_his || null,
  })

  const [propietarios, setPropietarios] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [selectedPropietario, setSelectedPropietario] = useState("")
  const [loadingMascotas, setLoadingMascotas] = useState(false)

  useEffect(() => {
    const fetchPropietarios = async () => {
      try {
        const response = await apiService.get("/api/roles/propietarios")
        if (response.success) setPropietarios(response.propietarios || [])
      } catch (error) {
        console.error("Error fetching propietarios", error)
      }
    }
    fetchPropietarios()
  }, [])

  useEffect(() => {
    if (!selectedPropietario) {
      setMascotas([])
      return
    }
    const fetchMascotas = async () => {
      setLoadingMascotas(true)
      try {
        const response = await apiService.get(`/api/mascota/propietario/${selectedPropietario}`)
        if (response.success) setMascotas(response.mascotas || [])
      } catch (error) {
        console.error("Error fetching mascotas", error)
        setMascotas([])
      } finally {
        setLoadingMascotas(false)
      }
    }
    fetchMascotas()
  }, [selectedPropietario])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePropietarioChange = (e) => {
    setSelectedPropietario(e.target.value)
    setFormData((prev) => ({ ...prev, cod_mas: "" })) // Resetear mascota al cambiar de dueño
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.cod_mas && !isEditing) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Debes seleccionar un propietario y una mascota.",
      })
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="historiales-medicos-modal-overlay" onClick={onClose}>
      <div className="historiales-medicos-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="historiales-medicos-modal-header">
          <h2>{isEditing ? "Editar" : "Nuevo"} Historial Médico</h2>
          <button onClick={onClose} className="historiales-medicos-modal-close-btn">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="historiales-medicos-modal-body">
          {!isEditing && (
            <>
              <div className="historiales-medicos-form-group">
                <label>
                  <User size={16} /> Propietario
                </label>
                <select value={selectedPropietario} onChange={handlePropietarioChange} required={!isEditing}>
                  <option value="">-- Seleccionar Propietario --</option>
                  {propietarios.map((p) => (
                    <option key={p.id_pro} value={p.id_pro}>
                      {p.nombre} {p.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="historiales-medicos-form-group">
                <label>
                  <Dog size={16} /> Mascota
                </label>
                <select
                  name="cod_mas"
                  value={formData.cod_mas}
                  onChange={handleChange}
                  required={!isEditing}
                  disabled={!selectedPropietario || loadingMascotas}
                >
                  <option value="">{loadingMascotas ? "Cargando..." : "-- Seleccionar Mascota --"}</option>
                  {mascotas.map((m) => (
                    <option key={m.cod_mas} value={m.cod_mas}>
                      {m.nom_mas}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {isEditing && (
            <div className="historiales-medicos-form-group">
              <label>Paciente</label>
              <input
                type="text"
                value={`${historial.nombre_mascota} (Propietario: ${historial.nombre_propietario})`}
                disabled
              />
            </div>
          )}
          <div className="historiales-medicos-form-group">
            <label>
              <Calendar size={16} /> Fecha
            </label>
            <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required />
          </div>
          <div className="historiales-medicos-form-group">
            <label>
              <FileText size={16} /> Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              rows="4"
            ></textarea>
          </div>
          <div className="historiales-medicos-form-group">
            <label>
              <Stethoscope size={16} /> Tratamiento
            </label>
            <textarea
              name="tratamiento"
              value={formData.tratamiento}
              onChange={handleChange}
              required
              rows="4"
            ></textarea>
          </div>
          <div className="historiales-medicos-modal-footer">
            <button type="button" className="historiales-medicos-cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="historiales-medicos-submit-button">
              {isEditing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
