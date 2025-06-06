"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../../stylos/Admin/GestionRoles.css" 
import { FaUsers, FaUserShield, FaUserMd, FaPaw, FaListUl, FaTimes } from "react-icons/fa"; // Iconos mejorados

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const GestionRoles = () => {
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingModal, setLoadingModal] = useState(false); // Estado de carga para el modal
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState(null)
  const [showUsersModal, setShowUsersModal] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/api/roles/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setRoles(response.data.roles)
      } else {
        setError("Error al cargar roles: " + (response.data.message || "Respuesta no exitosa"));
      }
    } catch (err) {
      console.error("Error fetching roles:", err)
      setError("Error al conectar con el servidor: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false)
    }
  }

  const fetchUsuariosByRole = async (roleId, roleName) => {
    try {
      setLoadingModal(true); // Activar carga del modal
      setError("");
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/api/roles/roles/${roleId}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setUsuarios(response.data.usuarios)
        setSelectedRole(roleName)
        setShowUsersModal(true)
      } else {
        alert("Error al cargar usuarios del rol: " + (response.data.message || "Respuesta no exitosa"))
      }
    } catch (err) {
      console.error("Error fetching users by role:", err)
      alert("Error al conectar con el servidor para usuarios del rol: " + (err.response?.data?.message || err.message))
    } finally {
      setLoadingModal(false); // Desactivar carga del modal
    }
  }

  const getRoleDescription = (roleName) => {
    const descriptions = {
      Administrador: "Control total y configuración del sistema.",
      Veterinario: "Acceso a historiales médicos y gestión de citas.",
      Propietario: "Gestión de sus mascotas y agendamiento de citas.",
    }
    return descriptions[roleName] || "Rol con permisos específicos."
  }

  const getRoleIcon = (roleName) => {
    const icons = {
      Administrador: <FaUserShield />,
      Veterinario: <FaUserMd />,
      Propietario: <FaPaw />,
    }
    return icons[roleName] || <FaUsers />
  }

  const getRolePermissions = (roleName) => {
    const permissions = {
      Administrador: [
        "Gestionar todos los usuarios",
        "Gestionar roles y permisos",
        "Administrar servicios ofrecidos",
        "Acceso a estadísticas globales",
        "Configuración general del sistema",
      ],
      Veterinario: ["Agendar y modificar citas", "Acceder y actualizar historiales médicos", "Registrar diagnósticos y tratamientos", "Gestionar su disponibilidad"],
      Propietario: ["Registrar y editar sus mascotas", "Agendar y cancelar citas", "Ver historial de sus mascotas", "Actualizar información de perfil"],
    }
    return permissions[roleName] || ["Permisos básicos de visualización"]
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible"
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString("es-CO", { // es-CO para formato colombiano
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: '2-digit', // Añadir hora
        minute: '2-digit', // Añadir minutos
        hour12: true // Formato AM/PM
      })
    } catch {
      return "Fecha inválida"
    }
  }

  if (loading && roles.length === 0) { // Mostrar carga inicial solo si no hay roles cargados
    return (
      <div className="gestion-roles-container">
        <div className="roles-loading-container">
          <div className="roles-loading-spinner"></div>
          <p className="roles-loading-text">Cargando roles del sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gestion-roles-container">
      <div className="roles-page-header">
        <div className="roles-title-section">
          <h1>Gestión de Roles del Sistema</h1>
          <p>Visualiza los roles definidos y los usuarios asociados a cada uno.</p>
        </div>
      </div>

      {error && !loading && ( // Mostrar error solo si no está cargando y hay error
        <div className="roles-error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchRoles} className="roles-btn-retry">
            Reintentar Carga
          </button>
        </div>
      )}

      <div className="roles-grid">
        {roles.map((rol) => (
          <div key={rol.id_rol} className={`role-card role-${rol.nombre_rol.toLowerCase().replace(/\s+/g, '-')}`}>
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
                <span className="stat-label">Usuarios Asignados</span>
              </div>
              <div className="stat">
                <span className="stat-number">#{rol.id_rol}</span>
                <span className="stat-label">ID del Rol</span>
              </div>
            </div>

            <div className="role-permissions">
              <h4 className="permissions-title">
                <FaListUl style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Permisos Clave:
              </h4>
              <ul className="permissions-list">
                {getRolePermissions(rol.nombre_rol)
                  .slice(0, 3) // Mostrar solo los primeros 3 para brevedad en la tarjeta
                  .map((permission, index) => (
                    <li key={index} className="permission-item">
                      <span className="permission-check">✓</span>
                      {permission}
                    </li>
                  ))}
                 {getRolePermissions(rol.nombre_rol).length > 3 && (
                    <li className="permission-item-more">... y más.</li>
                 )}
              </ul>
            </div>

            <button 
              className="role-action-btn" 
              onClick={() => fetchUsuariosByRole(rol.id_rol, rol.nombre_rol)}
              disabled={loadingModal}
            >
              {loadingModal && selectedRole === rol.nombre_rol ? 'Cargando...' : `Ver Usuarios (${rol.total_usuarios})`}
            </button>
          </div>
        ))}
      </div>

      {showUsersModal && (
        <div className="roles-modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="roles-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roles-modal-header">
              <h3 className="roles-modal-title">Usuarios con rol: {selectedRole}</h3>
              <button className="roles-modal-close" onClick={() => setShowUsersModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="roles-modal-body">
              {loadingModal ? (
                <div className="roles-loading-container">
                  <div className="roles-loading-spinner"></div>
                  <p className="roles-loading-text">Cargando usuarios...</p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="roles-no-data">No hay usuarios asignados a este rol.</div>
              ) : (
                <div className="roles-users-table-container">
                  <table className="roles-users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id_usuario}>
                          <td>
                            <span className="user-id">#{usuario.id_usuario}</span>
                          </td>
                          <td>
                            <div className="user-name-modal"> {/* Clase específica para modal */}
                                {usuario.nombre} {usuario.apellido}
                            </div>
                          </td>
                          <td>
                            <span className="user-email-modal">{usuario.email}</span> {/* Clase específica */}
                          </td>
                          <td>
                            {usuario.telefono ? (
                                <span className="user-phone-modal">📞 {usuario.telefono}</span> 
                            ) : (
                                <span className="user-phone-modal">N/A</span>
                            )}
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