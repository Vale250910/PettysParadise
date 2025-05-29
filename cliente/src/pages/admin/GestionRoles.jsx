"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../../stylos/Admin/GestionRoles.css"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const GestionRoles = () => {
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState(null)
  const [showUsersModal, setShowUsersModal] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/api/roles/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setRoles(response.data.roles)
      } else {
        setError("Error al cargar roles")
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsuariosByRole = async (roleId, roleName) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/api/roles/roles/${roleId}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setUsuarios(response.data.usuarios)
        setSelectedRole(roleName)
        setShowUsersModal(true)
      } else {
        alert("Error al cargar usuarios del rol")
      }
    } catch (error) {
      console.error("Error fetching users by role:", error)
      alert("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = (roleName) => {
    const descriptions = {
      Administrador: "Control total del sistema",
      Veterinario: "Gestión de citas y pacientes",
      Propietario: "Gestión de mascotas propias",
    }
    return descriptions[roleName] || "Sin descripción"
  }

  const getRoleIcon = (roleName) => {
    const icons = {
      Administrador: "👑",
      Veterinario: "🩺",
      Propietario: "🐕",
    }
    return icons[roleName] || "👤"
  }

  const getRolePermissions = (roleName) => {
    const permissions = {
      Administrador: [
        "Gestionar usuarios",
        "Gestionar roles",
        "Gestionar servicios",
        "Ver estadísticas",
        "Configurar sistema",
      ],
      Veterinario: ["Gestionar citas", "Ver historial médico", "Crear diagnósticos", "Gestionar tratamientos"],
      Propietario: ["Registrar mascotas", "Agendar citas", "Ver historial de mascotas", "Actualizar perfil"],
    }
    return permissions[roleName] || []
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  if (loading && !showUsersModal) {
    return (
      <div className="gestion-roles-container">
        <div className="roles-loading-container">
          <div className="roles-loading-spinner"></div>
          <p className="roles-loading-text">Cargando roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gestion-roles-container">
      <div className="roles-page-header">
        <div className="roles-title-section">
          <h1>Gestión de Roles</h1>
          <p>Administra roles y permisos del sistema</p>
        </div>
      </div>

      {error && (
        <div className="roles-error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchRoles} className="roles-btn-retry">
            Reintentar
          </button>
        </div>
      )}

      <div className="roles-grid">
        {roles.map((rol) => (
          <div key={rol.id_rol} className={`role-card role-${rol.nombre_rol.toLowerCase()}`}>
            <div className="role-header">
              <div className="role-icon">{getRoleIcon(rol.nombre_rol)}</div>
              <div className="role-info">
                <h3 className="role-title">{rol.nombre_rol}</h3>
                <p className="role-description">{getRoleDescription(rol.nombre_rol)}</p>
              </div>
            </div>

            <div className="role-stats">
              <div className="stat">
                <span className="stat-number">{rol.total_usuarios}</span>
                <span className="stat-label">Usuarios</span>
              </div>
              <div className="stat">
                <span className="stat-number">#{rol.id_rol}</span>
                <span className="stat-label">ID Rol</span>
              </div>
            </div>

            <div className="role-permissions">
              <h4 className="permissions-title">Permisos principales:</h4>
              <ul className="permissions-list">
                {getRolePermissions(rol.nombre_rol)
                  .slice(0, 3)
                  .map((permission, index) => (
                    <li key={index} className="permission-item">
                      <span className="permission-check">✓</span>
                      {permission}
                    </li>
                  ))}
              </ul>
            </div>

            <button className="role-action-btn" onClick={() => fetchUsuariosByRole(rol.id_rol, rol.nombre_rol)}>
              Ver Usuarios ({rol.total_usuarios})
            </button>
          </div>
        ))}
      </div>

      {/* Modal de usuarios por rol */}
      {showUsersModal && (
        <div className="roles-modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="roles-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3 className="roles-modal-title">Usuarios con rol: {selectedRole}</h3>
              <button className="roles-modal-close" onClick={() => setShowUsersModal(false)}>
                ×
              </button>
            </div>

            <div className="roles-modal-body">
              {loading ? (
                <div className="roles-loading-container">
                  <div className="roles-loading-spinner"></div>
                  <p className="roles-loading-text">Cargando usuarios...</p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="roles-no-data">No hay usuarios con este rol</div>
              ) : (
                <div className="roles-users-table-container">
                  <table className="roles-users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id_usuario}>
                          <td>
                            <span className="user-id">#{usuario.id_usuario}</span>
                          </td>
                          <td>
                            <div className="user-info">
                              <div className="user-name">
                                {usuario.nombre} {usuario.apellido}
                              </div>
                              {usuario.telefono && <div className="user-phone">📞 {usuario.telefono}</div>}
                            </div>
                          </td>
                          <td>
                            <span className="user-email">{usuario.email}</span>
                          </td>
                          <td>
                            <span
                              className={`user-badge ${usuario.cuenta_bloqueada ? "user-badge-inactive" : "user-badge-active"}`}
                            >
                              {usuario.cuenta_bloqueada ? "Inactivo" : "Activo"}
                            </span>
                          </td>
                          <td>
                            <span className="user-date">{formatDate(usuario.fecha_registro)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionRoles
