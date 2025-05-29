"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../../stylos/Admin/GestionServicios.css"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const GestionServicios = () => {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
  })

  useEffect(() => {
    fetchServicios()
  }, [])

  const fetchServicios = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/api/roles/servicios`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setServicios(response.data.servicios)
      } else {
        setError("Error al cargar servicios")
      }
    } catch (error) {
      console.error("Error fetching servicios:", error)
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")

      if (editingService) {
        const response = await axios.put(`${API_URL}/api/roles/servicios/${editingService.id_servicio}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          alert("Servicio actualizado exitosamente")
          fetchServicios()
          closeModal()
        } else {
          alert(response.data.message || "Error al actualizar servicio")
        }
      } else {
        const response = await axios.post(`${API_URL}/api/roles/servicios`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          alert("Servicio creado exitosamente")
          fetchServicios()
          closeModal()
        } else {
          alert(response.data.message || "Error al crear servicio")
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert(error.response?.data?.message || "Error al procesar la solicitud")
    }
  }

  const handleEdit = (servicio) => {
    setEditingService(servicio)
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio.toString(),
    })
    setShowModal(true)
  }

  const handleDelete = async (servicioId, servicioName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicioName}"?`)) {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.delete(`${API_URL}/api/roles/servicios/${servicioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          alert("Servicio eliminado exitosamente")
          fetchServicios()
        } else {
          alert(response.data.message || "Error al eliminar servicio")
        }
      } catch (error) {
        console.error("Error deleting service:", error)
        alert(error.response?.data?.message || "Error al eliminar servicio")
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
    })
  }

  const openCreateModal = () => {
    setEditingService(null)
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
    })
    setShowModal(true)
  }

  // Filtrar servicios por ID y nombre
  const filteredServicios = servicios.filter((servicio) => {
    const searchLower = searchTerm.toLowerCase()
    const searchNumber = searchTerm.replace(/\D/g, "")

    if (searchNumber && servicio.id_servicio.toString().includes(searchNumber)) {
      return true
    }

    return (
      servicio.nombre.toLowerCase().includes(searchLower) || servicio.descripcion.toLowerCase().includes(searchLower)
    )
  })

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="gestion-servicios-container">
        <div className="servicios-loading-container">
          <div className="servicios-loading-spinner"></div>
          <p className="servicios-loading-text">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gestion-servicios-container">
      <div className="servicios-page-header">
        <div className="servicios-header-content">
          <div className="servicios-title-section">
            <h1>Gestión de Servicios</h1>
            <p>Administra servicios veterinarios</p>
          </div>
          <button className="servicios-create-btn" onClick={openCreateModal}>
            + Crear Servicio
          </button>
        </div>

        <div className="servicios-search-container">
          <input
            type="text"
            placeholder="🔍 Buscar por ID, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="servicios-search-input"
          />
        </div>
      </div>

      {error && (
        <div className="servicios-error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchServicios} className="servicios-btn-retry">
            Reintentar
          </button>
        </div>
      )}

      <div className="servicios-stats-grid">
        <div className="servicios-stat-card">
          <span className="servicios-stat-number">{servicios.length}</span>
          <span className="servicios-stat-label">Total Servicios</span>
        </div>
      </div>

      <div className="servicios-table-container">
        <table className="servicios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Servicio</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredServicios.length === 0 ? (
              <tr>
                <td colSpan="5" className="servicios-no-data">
                  {searchTerm ? "No se encontraron servicios" : "No hay servicios registrados"}
                </td>
              </tr>
            ) : (
              filteredServicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td>
                    <span style={{ fontWeight: 600 }}>#{servicio.id_servicio}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{servicio.nombre}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>{servicio.descripcion}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{formatPrice(servicio.precio)}</span>
                  </td>
                  <td>
                    <div className="servicios-action-buttons">
                      <button className="servicios-btn-icon" onClick={() => handleEdit(servicio)} title="Editar">
                        ✏️
                      </button>
                      <button
                        className="servicios-btn-icon"
                        onClick={() => handleDelete(servicio.id_servicio, servicio.nombre)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="servicios-modal-overlay" onClick={closeModal}>
          <div className="servicios-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="servicios-modal-header">
              <h3 className="servicios-modal-title">{editingService ? "Editar Servicio" : "Crear Servicio"}</h3>
              <button className="servicios-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="servicios-form">
              <div className="servicios-form-group">
                <label className="servicios-form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="servicios-form-input"
                  required
                />
              </div>

              <div className="servicios-form-group">
                <label className="servicios-form-label">Descripción *</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="servicios-form-textarea"
                  required
                  rows={4}
                />
              </div>

              <div className="servicios-form-group">
                <label className="servicios-form-label">Precio (COP) *</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  className="servicios-form-input"
                  required
                  min="0"
                  step="1000"
                />
              </div>

              <div className="servicios-form-actions">
                <button type="button" className="servicios-btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="servicios-btn-primary">
                  {editingService ? "Actualizar" : "Crear"} Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionServicios
