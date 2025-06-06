"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  PawPrint,
  Calendar,
  Weight,
  Heart,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  User,
  Dog,
  Award,
  CreditCard,
  UserIcon as Male,
  UserIcon as Female,
} from "lucide-react"
import "../../stylos/vet/GestionMascotas.css"
import "../../stylos/vet/loadingvet.css"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

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
  const [notification, setNotification] = useState(null)

  // Obtener datos del veterinario
  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const token = localStorage.getItem("token")

  useEffect(() => {
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

  // Función para obtener todas las mascotas (para el veterinario)
  const fetchMascotas = async () => {
    setLoading(true)
    try {
      // Para veterinarios, obtener todas las mascotas del sistema
      const response = await authenticatedFetch(`${API_BASE_URL}/vermas/mascotas`)
      setMascotas(response || [])
    } catch (err) {
      console.error("Error al cargar mascotas:", err)
      setError("Error al cargar las mascotas")
      showNotification("Error al cargar las mascotas", "error")
    } finally {
      setLoading(false)
    }
  }

  // Función para registrar nueva mascota
  const registrarMascota = async (mascotaData) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/mascota/create`, {
        method: "POST",
        body: JSON.stringify(mascotaData),
      })

      await fetchMascotas() // Recargar mascotas
      setShowModal(false)
      resetForm()
      showNotification("Mascota registrada exitosamente")
    } catch (err) {
      console.error("Error al registrar mascota:", err)
      showNotification("Error al registrar la mascota", "error")
    }
  }

  // Función para subir imagen
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir imagen")
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error("Error al subir imagen:", error)
      throw error
    }
  }

  // Función para manejar la imagen
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validaciones del archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      showNotification("Solo se permiten archivos JPG, PNG o WebP.", "error")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showNotification("La imagen debe ser menor a 5MB.", "error")
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)

    // Subir imagen
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setImageUrl(url)
      showNotification("Imagen subida exitosamente")
    } catch (error) {
      showNotification("Error al subir la imagen", "error")
    } finally {
      setUploading(false)
    }
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
      mascota.nom_mas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mascota.propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mascota.raza?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="vet-pacientes-container">
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
      <div className="vet-pacientes-header">
        <div className="vet-pacientes-title">
          <h2>Mis Pacientes</h2>
          <p>Gestiona la información de tus pacientes</p>
        </div>
        <button className="vet-add-paciente-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Registrar Paciente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="vet-search-container">
        <div className="vet-search-box">
          <Search size={20} className="vet-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, propietario o raza..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de pacientes */}
      <div className="vet-pacientes-grid">
        {loading ? (
          <div className="vet-loading-message">
            <div className="vet-loading-spinner"></div>
            Cargando pacientes...
          </div>
        ) : error ? (
          <div className="vet-error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        ) : mascotasFiltradas.length === 0 ? (
          <div className="vet-empty-message">
            <PawPrint size={48} />
            <h3>No hay pacientes</h3>
            <p>
              {searchTerm
                ? "No se encontraron pacientes que coincidan con la búsqueda"
                : "No hay pacientes registrados"}
            </p>
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
            />
          ))
        )}
      </div>

      {/* Modales */}
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

      {showViewModal && selectedMascota && (
        <VerPacienteModal mascota={selectedMascota} onClose={() => setShowViewModal(false)} />
      )}

      {showEditModal && selectedMascota && (
        <EditarPacienteModal
          mascota={selectedMascota}
          onClose={() => {
            setShowEditModal(false)
            resetForm()
          }}
          onSubmit={registrarMascota}
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
    <div className="vet-paciente-card">
      <div className="vet-paciente-avatar">
        <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
      </div>
      <div className="vet-paciente-info">
        <h3>{mascota.nom_mas}</h3>
        <p className="vet-paciente-raza">
          {mascota.especie} • {mascota.raza}
        </p>
        <p className="vet-paciente-propietario">Propietario: {mascota.propietario}</p>

        <div className="vet-paciente-stats">
          <div className="vet-stat-item">
            <Calendar size={14} />
            <span>{mascota.edad} años</span>
          </div>
          <div className="vet-stat-item">
            <Weight size={14} />
            <span>{mascota.peso} kg</span>
          </div>
          <div className="vet-stat-item">
            <Heart size={14} />
            <span className={`vet-genero ${mascota.genero.toLowerCase()}`}>{mascota.genero}</span>
          </div>
        </div>

        <div className="vet-paciente-dates">
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

      <div className="vet-paciente-actions">
        <button className="vet-action-btn vet-view-btn" onClick={onView}>
          <Eye size={16} />
        </button>
        <button className="vet-action-btn vet-edit-btn" onClick={onEdit}>
          <Edit size={16} />
        </button>
        <button className="vet-action-btn vet-delete-btn" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

// Modal Registrar Paciente - Inspirado en el dashboard de propietario
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
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-container">
        {/* Panel izquierdo decorativo */}
        <div className="vet-modal-left-panel">
          <div className="vet-modal-decoration">
            <div className="vet-modal-icon-container">
              <PawPrint className="vet-modal-icon" />
            </div>
            <h2>Registro de Paciente</h2>
            <p>Completa los datos del nuevo paciente</p>
          </div>
          <div className="vet-modal-circles">
            <div className="vet-circle vet-circle-1"></div>
            <div className="vet-circle vet-circle-2"></div>
            <div className="vet-circle vet-circle-3"></div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="vet-modal-right-panel">
          <div className="vet-modal-header">
            <button className="vet-modal-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="vet-modal-content">
            <form onSubmit={handleSubmit}>
              {/* Upload de imagen */}
              <div className="vet-image-upload-container">
                <label htmlFor="vet-file-upload" className="vet-image-upload-label">
                  <div className="vet-image-preview">
                    {imagePreview ? (
                      <img src={imagePreview || "/placeholder.svg"} alt="Foto del paciente" />
                    ) : (
                      <div className="vet-upload-placeholder">
                        <Upload className="vet-upload-icon" />
                        <span>Subir foto (opcional)</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  id="vet-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  style={{ display: "none" }}
                />
                {uploading && <p className="vet-uploading-text">Subiendo imagen...</p>}
              </div>

              {/* Campos del formulario */}
              <div className="vet-form-group">
                <label className="vet-form-label">
                  <User className="vet-field-icon" />
                  <span>Nombre</span>
                </label>
                <input
                  type="text"
                  id="nom_mas"
                  className="vet-form-input"
                  placeholder="Nombre de la mascota"
                  value={formData.nom_mas}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Dog className="vet-field-icon" />
                  <span>Especie</span>
                </label>
                <select
                  id="especie"
                  className="vet-form-input"
                  value={formData.especie}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Male className="vet-field-icon" />
                  <span>Género</span>
                </label>
                <div className="vet-gender-options">
                  <label className="vet-gender-option">
                    <input type="radio" name="genero" value="Macho" onChange={handleChange} required />
                    <div className="vet-gender-radio-button">
                      <Male className="vet-gender-icon vet-male-icon" />
                      <span>Macho</span>
                    </div>
                  </label>
                  <label className="vet-gender-option">
                    <input type="radio" name="genero" value="Hembra" onChange={handleChange} required />
                    <div className="vet-gender-radio-button">
                      <Female className="vet-gender-icon vet-female-icon" />
                      <span>Hembra</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Award className="vet-field-icon" />
                  <span>Raza</span>
                </label>
                <input
                  type="text"
                  id="raza"
                  className="vet-form-input"
                  placeholder="Raza de la mascota"
                  value={formData.raza}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-row">
                <div className="vet-form-group">
                  <label className="vet-form-label">
                    <Calendar className="vet-field-icon" />
                    <span>Edad (años)</span>
                  </label>
                  <input
                    type="number"
                    id="edad"
                    className="vet-form-input"
                    placeholder="Edad"
                    value={formData.edad}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="30"
                    required
                  />
                </div>

                <div className="vet-form-group">
                  <label className="vet-form-label">
                    <Weight className="vet-field-icon" />
                    <span>Peso (kg)</span>
                  </label>
                  <input
                    type="number"
                    id="peso"
                    className="vet-form-input"
                    placeholder="Peso"
                    value={formData.peso}
                    onChange={handleChange}
                    step="0.1"
                    min="0.1"
                    max="200"
                    required
                  />
                </div>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <CreditCard className="vet-field-icon" />
                  <span>ID del Propietario</span>
                </label>
                <input
                  type="text"
                  id="id_pro"
                  className="vet-form-input"
                  placeholder="Número de documento del propietario"
                  value={formData.id_pro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-actions">
                <button type="submit" className="vet-submit-button" disabled={uploading}>
                  {uploading ? "Subiendo imagen..." : "Registrar Paciente"}
                </button>
                <button type="button" className="vet-cancel-button" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal Ver Paciente
function VerPacienteModal({ mascota, onClose }) {
  return (
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-simple">
        <div className="vet-modal-header">
          <h2>Información del Paciente</h2>
          <button className="vet-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="vet-modal-body">
          <div className="vet-paciente-details-view">
            <div className="vet-paciente-photo">
              <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
            </div>

            <div className="vet-detail-group">
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

            <div className="vet-detail-group">
              <h3>Propietario</h3>
              <p>
                <strong>Nombre:</strong> {mascota.propietario}
              </p>
              <p>
                <strong>ID:</strong> {mascota.id_pro}
              </p>
            </div>
          </div>
        </div>
        <div className="vet-modal-footer">
          <button className="vet-submit-button" onClick={onClose}>
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
    const { id, value, name } = e.target
    setFormData((prev) => ({
      ...prev,
      [id || name]: value,
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
    <div className="vet-modal-overlay" onClick={(e) => e.target.classList.contains("vet-modal-overlay") && onClose()}>
      <div className="vet-modal-container">
        {/* Panel izquierdo decorativo */}
        <div className="vet-modal-left-panel">
          <div className="vet-modal-decoration">
            <div className="vet-modal-icon-container">
              <Edit className="vet-modal-icon" />
            </div>
            <h2>Editar Paciente</h2>
            <p>Actualiza los datos del paciente</p>
          </div>
          <div className="vet-modal-circles">
            <div className="vet-circle vet-circle-1"></div>
            <div className="vet-circle vet-circle-2"></div>
            <div className="vet-circle vet-circle-3"></div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="vet-modal-right-panel">
          <div className="vet-modal-header">
            <button className="vet-modal-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="vet-modal-content">
            <form onSubmit={handleSubmit}>
              {/* Upload de imagen */}
              <div className="vet-image-upload-container">
                <label htmlFor="vet-file-upload-edit" className="vet-image-upload-label">
                  <div className="vet-image-preview">
                    {imagePreview ? (
                      <img src={imagePreview || "/placeholder.svg"} alt="Foto del paciente" />
                    ) : (
                      <img src={mascota.foto || "/placeholder.svg"} alt={mascota.nom_mas} />
                    )}
                  </div>
                </label>
                <input
                  id="vet-file-upload-edit"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  style={{ display: "none" }}
                />
                {uploading && <p className="vet-uploading-text">Subiendo imagen...</p>}
              </div>

              {/* Campos del formulario */}
              <div className="vet-form-group">
                <label className="vet-form-label">
                  <User className="vet-field-icon" />
                  <span>Nombre</span>
                </label>
                <input
                  type="text"
                  id="nom_mas"
                  className="vet-form-input"
                  placeholder="Nombre de la mascota"
                  value={formData.nom_mas}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Dog className="vet-field-icon" />
                  <span>Especie</span>
                </label>
                <select
                  id="especie"
                  className="vet-form-input"
                  value={formData.especie}
                  onChange={handleChange}
                  required
                >
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Male className="vet-field-icon" />
                  <span>Género</span>
                </label>
                <div className="vet-gender-options">
                  <label className="vet-gender-option">
                    <input
                      type="radio"
                      name="genero"
                      value="Macho"
                      checked={formData.genero === "Macho"}
                      onChange={handleChange}
                      required
                    />
                    <div className="vet-gender-radio-button">
                      <Male className="vet-gender-icon vet-male-icon" />
                      <span>Macho</span>
                    </div>
                  </label>
                  <label className="vet-gender-option">
                    <input
                      type="radio"
                      name="genero"
                      value="Hembra"
                      checked={formData.genero === "Hembra"}
                      onChange={handleChange}
                      required
                    />
                    <div className="vet-gender-radio-button">
                      <Female className="vet-gender-icon vet-female-icon" />
                      <span>Hembra</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <Award className="vet-field-icon" />
                  <span>Raza</span>
                </label>
                <input
                  type="text"
                  id="raza"
                  className="vet-form-input"
                  placeholder="Raza de la mascota"
                  value={formData.raza}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-row">
                <div className="vet-form-group">
                  <label className="vet-form-label">
                    <Calendar className="vet-field-icon" />
                    <span>Edad (años)</span>
                  </label>
                  <input
                    type="number"
                    id="edad"
                    className="vet-form-input"
                    placeholder="Edad"
                    value={formData.edad}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="30"
                    required
                  />
                </div>

                <div className="vet-form-group">
                  <label className="vet-form-label">
                    <Weight className="vet-field-icon" />
                    <span>Peso (kg)</span>
                  </label>
                  <input
                    type="number"
                    id="peso"
                    className="vet-form-input"
                    placeholder="Peso"
                    value={formData.peso}
                    onChange={handleChange}
                    step="0.1"
                    min="0.1"
                    max="200"
                    required
                  />
                </div>
              </div>

              <div className="vet-form-group">
                <label className="vet-form-label">
                  <CreditCard className="vet-field-icon" />
                  <span>ID del Propietario</span>
                </label>
                <input
                  type="text"
                  id="id_pro"
                  className="vet-form-input"
                  placeholder="Número de documento del propietario"
                  value={formData.id_pro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vet-form-actions">
                <button type="submit" className="vet-submit-button" disabled={uploading}>
                  {uploading ? "Subiendo imagen..." : "Actualizar Paciente"}
                </button>
                <button type="button" className="vet-cancel-button" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
