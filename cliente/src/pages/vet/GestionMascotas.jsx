"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, PawPrint, Calendar, Weight, Heart, X } from "lucide-react"
import "../../stylos/vet/GestionMascotas.css"


export default function MisPacientes() {
  const [showModal, setShowModal] = useState(false)
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMascota, setSelectedMascota] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Obtener datos del veterinario
  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const vetId = userData.id_usuario

  useEffect(() => {
    fetchMascotas()
  }, [])

  // Función para obtener todas las mascotas (para el veterinario)
  const fetchMascotas = async () => {
    setLoading(true)
    try {
      // Simular datos de mascotas
      const mockMascotas = [
        {
          cod_mas: 1,
          nom_mas: "Max",
          especie: "Perro",
          raza: "Labrador",
          edad: 3.5,
          genero: "Macho",
          peso: 28.5,
          foto: "/placeholder.svg?height=100&width=100",
          propietario: "Carlos Gómez",
          id_pro: 103,
          ultimaVisita: "2024-11-15",
          proximaCita: "2024-12-15",
        },
        {
          cod_mas: 2,
          nom_mas: "Luna",
          especie: "Gato",
          raza: "Siamés",
          edad: 2.0,
          genero: "Hembra",
          peso: 4.2,
          foto: "/placeholder.svg?height=100&width=100",
          propietario: "Carlos Gómez",
          id_pro: 103,
          ultimaVisita: "2024-10-20",
          proximaCita: null,
        },
      ]

      setMascotas(mockMascotas)
    } catch (err) {
      console.error("Error al cargar mascotas:", err)
      setError("Error al cargar las mascotas")
    } finally {
      setLoading(false)
    }
  }

  // Función para registrar nueva mascota
  const registrarMascota = async (mascotaData) => {
    try {
      console.log("Registrando mascota:", mascotaData)
      await fetchMascotas() // Recargar mascotas
      setShowModal(false)
      resetForm()
    } catch (err) {
      console.error("Error al registrar mascota:", err)
      alert("Error al registrar la mascota")
    }
  }

  // Función para actualizar mascota
  const actualizarMascota = async (mascotaData) => {
    try {
      console.log("Actualizando mascota:", mascotaData)
      await fetchMascotas() // Recargar mascotas
      setShowEditModal(false)
      resetForm()
    } catch (err) {
      console.error("Error al actualizar mascota:", err)
      alert("Error al actualizar la mascota")
    }
  }

  // Función para eliminar mascota
  const eliminarMascota = async (codigo) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta mascota?")) {
      try {
        console.log("Eliminando mascota:", codigo)
        await fetchMascotas() // Recargar mascotas
      } catch (err) {
        console.error("Error al eliminar mascota:", err)
        alert("Error al eliminar la mascota")
      }
    }
  }

  // Función para manejar la imagen
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validaciones del archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Solo se permiten archivos JPG, PNG o WebP.")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert("La imagen debe ser menor a 5MB.")
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)

    // Simular subida
    setUploading(true)
    setTimeout(() => {
      setImageUrl(reader.result)
      setUploading(false)
    }, 1000)
  }

  // Función para resetear formulario
  const resetForm = () => {
    setImagePreview(null)
    setImageUrl(null)
    setSelectedMascota(null)
  }

  // Filtrar mascotas por búsqueda
  const mascotasFiltradas = mascotas.filter(
    (mascota) =>
      mascota.nom_mas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mascota.propietario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mascota.raza.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="mis-pacientes-container">
      {/* Header */}
      <div className="pacientes-header">
        <div className="pacientes-title">
          <h2>Mis Pacientes</h2>
          <p>Gestiona la información de tus pacientes</p>
        </div>
        <button className="add-paciente-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Registrar Paciente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-container">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, propietario o raza..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de pacientes */}
      <div className="pacientes-grid">
        {loading ? (
          <div className="loading-message">Cargando pacientes...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : mascotasFiltradas.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? "No se encontraron pacientes que coincidan con la búsqueda" : "No hay pacientes registrados"}
          </div>
        ) : (
          mascotasFiltradas.map((mascota) => (
            <PacienteCard
              key={mascota.cod_mas}
              mascota={mascota}
              onView={() => {
                setSelectedMascota(mascota)
                setShowViewModal(true)
              }}
              onEdit={() => {
                setSelectedMascota(mascota)
                setShowEditModal(true)
              }}
              onDelete={() => eliminarMascota(mascota.cod_mas)}
            />
          ))
        )}
      </div>

      {/* Modal Registrar Paciente */}
      {showModal && (
        <RegistrarPacienteModal
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          onSubmit={registrarMascota}
          imagePreview={imagePreview}
          imageUrl={imageUrl}
          uploading={uploading}
          onImageChange={handleImageChange}
        />
      )}

      {/* Modal Ver Paciente */}
      {showViewModal && selectedMascota && (
        <VerPacienteModal mascota={selectedMascota} onClose={() => setShowViewModal(false)} />
      )}

      {/* Modal Editar Paciente */}
      {showEditModal && selectedMascota && (
        <EditarPacienteModal
          mascota={selectedMascota}
          onClose={() => {
            setShowEditModal(false)
            resetForm()
          }}
          onSubmit={actualizarMascota}
          imagePreview={imagePreview}
          imageUrl={imageUrl}
          uploading={uploading}
          onImageChange={handleImageChange}
        />
      )}
    </div>
  )
}

// Componente PacienteCard
function PacienteCard({ mascota, onView, onEdit, onDelete }) {
  return (
    <div className="paciente-card">
      <div className="paciente-avatar">
        <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
      </div>
      <div className="paciente-info">
        <h3>{mascota.nom_mas}</h3>
        <p className="paciente-raza">
          {mascota.especie} • {mascota.raza}
        </p>
        <p className="paciente-propietario">Propietario: {mascota.propietario}</p>

        <div className="paciente-stats">
          <div className="stat-item">
            <Calendar size={14} />
            <span>{mascota.edad} años</span>
          </div>
          <div className="stat-item">
            <Weight size={14} />
            <span>{mascota.peso} kg</span>
          </div>
          <div className="stat-item">
            <Heart size={14} />
            <span className={`genero ${mascota.genero.toLowerCase()}`}>{mascota.genero}</span>
          </div>
        </div>

        <div className="paciente-dates">
          <p>
            <strong>Última visita:</strong> {mascota.ultimaVisita || "No registrada"}
          </p>
          {mascota.proximaCita && (
            <p>
              <strong>Próxima cita:</strong> {mascota.proximaCita}
            </p>
          )}
        </div>
      </div>

      <div className="paciente-actions">
        <button className="action-btn view-btn" onClick={onView}>
          <Eye size={16} />
        </button>
        <button className="action-btn edit-btn" onClick={onEdit}>
          <Edit size={16} />
        </button>
        <button className="action-btn delete-btn" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

// Modal Registrar Paciente
function RegistrarPacienteModal({ onClose, onSubmit, imagePreview, imageUrl, uploading, onImageChange }) {
  const [formData, setFormData] = useState({
    nom_mas: "",
    especie: "",
    raza: "",
    edad: "",
    genero: "",
    peso: "",
    id_pro: "",
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
    const mascotaData = {
      ...formData,
      edad: Number.parseFloat(formData.edad),
      peso: Number.parseFloat(formData.peso),
      foto: imageUrl || "",
    }
    onSubmit(mascotaData)
  }

  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Registrar Nuevo Paciente</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Upload de imagen */}
            <div className="image-upload-container">
              <label htmlFor="file-upload" className="image-upload-label">
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview || "/placeholder.svg"} alt="Foto del paciente" />
                  ) : (
                    <div className="upload-placeholder">
                      <PawPrint size={40} />
                      <span>Subir foto (opcional)</span>
                    </div>
                  )}
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={onImageChange}
                style={{ display: "none" }}
              />
              {uploading && <p className="uploading-text">Subiendo imagen...</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom_mas">Nombre:</label>
                <input type="text" id="nom_mas" value={formData.nom_mas} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="especie">Especie:</label>
                <select id="especie" value={formData.especie} onChange={handleChange} required>
                  <option value="">Seleccionar especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="raza">Raza:</label>
                <input type="text" id="raza" value={formData.raza} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="genero">Género:</label>
                <select id="genero" value={formData.genero} onChange={handleChange} required>
                  <option value="">Seleccionar género</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edad">Edad (años):</label>
                <input type="number" step="0.1" id="edad" value={formData.edad} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="peso">Peso (kg):</label>
                <input type="number" step="0.1" id="peso" value={formData.peso} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="id_pro">ID del Propietario:</label>
              <input type="text" id="id_pro" value={formData.id_pro} onChange={handleChange} required />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Subiendo..." : "Registrar Paciente"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Ver Paciente
function VerPacienteModal({ mascota, onClose }) {
  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Información del Paciente</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="paciente-details-view">
            <div className="paciente-photo">
              <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
            </div>

            <div className="detail-group">
              <h3>Información Básica</h3>
              <p>
                <strong>Nombre:</strong> {mascota.nom_mas}
              </p>
              <p>
                <strong>Especie:</strong> {mascota.especie}
              </p>
              <p>
                <strong>Raza:</strong> {mascota.raza}
              </p>
              <p>
                <strong>Edad:</strong> {mascota.edad} años
              </p>
              <p>
                <strong>Género:</strong> {mascota.genero}
              </p>
              <p>
                <strong>Peso:</strong> {mascota.peso} kg
              </p>
            </div>

            <div className="detail-group">
              <h3>Propietario</h3>
              <p>
                <strong>Nombre:</strong> {mascota.propietario}
              </p>
              <p>
                <strong>ID:</strong> {mascota.id_pro}
              </p>
            </div>

            <div className="detail-group">
              <h3>Historial</h3>
              <p>
                <strong>Última visita:</strong> {mascota.ultimaVisita || "No registrada"}
              </p>
              {mascota.proximaCita && (
                <p>
                  <strong>Próxima cita:</strong> {mascota.proximaCita}
                </p>
              )}
            </div>
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

// Modal Editar Paciente
function EditarPacienteModal({ mascota, onClose, onSubmit, imagePreview, imageUrl, uploading, onImageChange }) {
  const [formData, setFormData] = useState({
    cod_mas: mascota.cod_mas,
    nom_mas: mascota.nom_mas,
    especie: mascota.especie,
    raza: mascota.raza,
    edad: mascota.edad.toString(),
    genero: mascota.genero,
    peso: mascota.peso.toString(),
    id_pro: mascota.id_pro.toString(),
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
    const mascotaData = {
      ...formData,
      edad: Number.parseFloat(formData.edad),
      peso: Number.parseFloat(formData.peso),
      foto: imageUrl || mascota.foto,
    }
    onSubmit(mascotaData)
  }

  return (
    <div className="modal" onClick={(e) => e.target.classList.contains("modal") && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Editar Paciente</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Upload de imagen */}
            <div className="image-upload-container">
              <label htmlFor="file-upload-edit" className="image-upload-label">
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview || "/placeholder.svg"} alt="Foto del paciente" />
                  ) : (
                    <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
                  )}
                </div>
              </label>
              <input
                id="file-upload-edit"
                type="file"
                accept="image/*"
                onChange={onImageChange}
                style={{ display: "none" }}
              />
              {uploading && <p className="uploading-text">Subiendo imagen...</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom_mas">Nombre:</label>
                <input type="text" id="nom_mas" value={formData.nom_mas} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="especie">Especie:</label>
                <select id="especie" value={formData.especie} onChange={handleChange} required>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="raza">Raza:</label>
                <input type="text" id="raza" value={formData.raza} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="genero">Género:</label>
                <select id="genero" value={formData.genero} onChange={handleChange} required>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edad">Edad (años):</label>
                <input type="number" step="0.1" id="edad" value={formData.edad} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="peso">Peso (kg):</label>
                <input type="number" step="0.1" id="peso" value={formData.peso} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="id_pro">ID del Propietario:</label>
              <input type="text" id="id_pro" value={formData.id_pro} onChange={handleChange} required />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Subiendo..." : "Actualizar Paciente"}
          </button>
        </div>
      </div>
    </div>
  )
}
