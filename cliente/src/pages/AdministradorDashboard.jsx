"use client"

import { Link, Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  MdEmail as IconMail,
  MdDashboard as IconDashboard,
  MdLogout as IconLogout,
  MdArrowForward as IconArrowRight,
  MdAdd as IconPlus,
  MdPeople as IconPeople,
  MdAssignment as IconAssignment,
  MdSupervisorAccount as IconSupervisor,
} from "react-icons/md"
import "../stylos/Admin.css"
import axios from "axios"

const AdministradorDashboard = () => {
  const location = useLocation()
  const [userData, setUserData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    totalUsers: 0,
    totalRoles: 3,
    totalServices: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar si estamos en la página principal del dashboard
  const isMainDashboard = location.pathname === "/administrador"

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        // Cargar datos del usuario desde localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (user) {
          setUserData((prevState) => ({
            ...prevState,
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            email: user.email || "",
          }))
        }

        // Solo cargar estadísticas si estamos en el dashboard principal
        if (isMainDashboard) {
          const token = localStorage.getItem("token")
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }

          try {
            console.log("🔄 Cargando estadísticas del dashboard administrador...")
            const response = await axios.get("http://localhost:5000/api/roles/dashboard/stats", config)

            if (response.data.success) {
              const stats = response.data.stats
              setUserData((prevState) => ({
                ...prevState,
                totalUsers: stats.totalUsuarios || 0,
                totalServices: stats.totalServicios || 0,
              }))
              console.log("✅ Estadísticas del administrador cargadas:", stats)
            }
          } catch (apiError) {
            console.error("❌ Error al cargar estadísticas del administrador:", apiError)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos del dashboard administrador:", error)
        setError("Error al cargar los datos del administrador")
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [isMainDashboard])

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      window.location.href = "/"
    }
  }

  const getCurrentPageTitle = () => {
    const path = location.pathname
    if (path === "/administrador") return "Dashboard Administrador"
    if (path.includes("/administrador/usuarios")) return "Gestión de Usuarios"
    if (path.includes("/administrador/roles")) return "Gestión de Roles"
    if (path.includes("/administrador/servicios")) return "Gestión de Servicios"
    return "Panel de Administración"
  }

  if (loading && isMainDashboard) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-user-info">
          <div className="admin-avatar">
            {userData.nombre.charAt(0).toUpperCase()}
            {userData.apellido.charAt(0).toUpperCase()}
          </div>
          <div className="admin-user-details">
            <h3 className="user-name">
              {userData.nombre} {userData.apellido}
            </h3>
            <p className="admin-user-email">
              <IconMail size={16} /> {userData.email}
            </p>
            <span className="admin-user-role">ADMINISTRADOR</span>
          </div>
        </div>

        <nav className="admin-nav">
          <ul>
            <li className={location.pathname === "/administrador" ? "active" : ""}>
              <Link to="/administrador">
                <IconDashboard /> Dashboard
              </Link>
            </li>
            <li className={location.pathname.includes("/administrador/usuarios") ? "active" : ""}>
              <Link to="/administrador/usuarios">
                <IconPeople /> Gestión de Usuarios
              </Link>
            </li>
            <li className={location.pathname.includes("/administrador/roles") ? "active" : ""}>
              <Link to="/administrador/roles">
                <IconSupervisor /> Gestión de Roles
              </Link>
            </li>
            <li className={location.pathname.includes("/administrador/servicios") ? "active" : ""}>
              <Link to="/administrador/servicios">
                <IconAssignment /> Gestión de Servicios
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="admin-main-content">
        <header className="admin-header">
          <h1>{getCurrentPageTitle()}</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="admin-logout-btn-header">
              <IconLogout size={20} />
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="admin-content">
          {/* Solo mostrar el contenido del dashboard principal si estamos en esa ruta */}
          {isMainDashboard ? (
            <div className="dashboard-summary">
              <div className="welcome-section">
                <h2>Bienvenido, {userData.nombre}</h2>
                <p className="welcome-message">
                  Panel de control administrativo de Petty's Paradise. Gestiona usuarios, roles y servicios del sistema.
                </p>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card users">
                  <div className="admin-stat-icon">
                    <IconPeople size={32} />
                  </div>
                  <div className="admin-stat-content">
                    <h3>Total Usuarios</h3>
                    <p className="admin-stat-value">{userData.totalUsers}</p>
                    <Link to="/administrador/usuarios" className="card-link">
                      Gestionar usuarios <IconArrowRight />
                    </Link>
                  </div>
                </div>

                <div className="admin-stat-card roles">
                  <div className="admin-stat-icon">
                    <IconSupervisor size={32} />
                  </div>
                  <div className="admin-stat-content">
                    <h3>Roles del Sistema</h3>
                    <p className="admin-stat-value">{userData.totalRoles}</p>
                    <Link to="/administrador/roles" className="card-link">
                      Gestionar roles <IconArrowRight />
                    </Link>
                  </div>
                </div>

                <div className="admin-stat-card services">
                  <div className="admin-stat-icon">
                    <IconAssignment size={32} />
                  </div>
                  <div className="admin-stat-content">
                    <h3>Servicios Disponibles</h3>
                    <p className="admin-stat-value">{userData.totalServices}</p>
                    <Link to="/administrador/servicios" className="card-link">
                      Gestionar servicios <IconArrowRight />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Acciones Administrativas</h3>
                <div className="action-buttons">
                  <Link to="/administrador/usuarios" className="admin-btn admin-btn-primary">
                    <IconPlus /> Crear nuevo usuario
                  </Link>
                  <Link to="/administrador/roles" className="admin-btn admin-btn-secondary">
                    <IconSupervisor /> Gestionar roles
                  </Link>
                  <Link to="/administrador/servicios" className="admin-btn admin-btn-secondary">
                    <IconAssignment /> Registrar servicio
                  </Link>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Renderizar las páginas específicas */
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

export default AdministradorDashboard
