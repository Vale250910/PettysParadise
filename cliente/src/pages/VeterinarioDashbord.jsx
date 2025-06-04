"use client"

import { Link, Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  MdEmail as IconMail,
  MdDashboard as IconDashboard,
  MdLogout as IconLogout,
  MdArrowForward as IconArrowRight,
  MdAdd as IconPlus,
  MdPets as IconPets,
  MdCalendarToday as IconCalendar,
  MdAssignment as IconAssignment,
  MdMenu as IconMenu,
  MdClose as IconClose,
  MdLocalHospital as IconMedical,
} from "react-icons/md"
import "../stylos/Vet.css"

const VeterinarioDashboard = () => {
  const location = useLocation()
  const [userData, setUserData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    especialidad: "",
    citasHoy: 0,
    pacientesActivos: 0,
    historialesPendientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isMainDashboard = location.pathname === "/veterinario"

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

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
            especialidad: user.especialidad || "Medicina General",
          }))
        }

        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos del dashboard veterinario:", error)
        setError("Error al cargar los datos del veterinario")
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
    if (path === "/veterinario") return "Dashboard Veterinario"
    if (path.includes("/veterinario/citas")) return "Gestión de Citas"
    if (path.includes("/veterinario/pacientes")) return "Mis Pacientes"
    if (path.includes("/veterinario/historiales")) return "Historiales Médicos"
    return "Panel Veterinario"
  }

  if (loading && isMainDashboard) {
    return (
      <div className="vet-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando panel veterinario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="vet-dashboard">
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {sidebarOpen && <div className="mobile-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar con clase condicional para móvil */}
      <div className={`vet-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="vet-sidebar-header">
          {/* Botón para cerrar sidebar en móvil */}
          <button className="vet-sidebar-close" onClick={toggleSidebar}>
            <IconClose size={24} />
          </button>
        </div>

        <div className="vet-user-info">
          <div className="vet-avatar">
            {userData.nombre.charAt(0).toUpperCase()}
            {userData.apellido.charAt(0).toUpperCase()}
          </div>
          <div className="vet-user-details">
            <h3 className="user-name">
              Dr. {userData.nombre} {userData.apellido}
            </h3>
            <p className="vet-user-email">
              <IconMail size={16} /> {userData.email}
            </p>
            <span className="vet-user-role">VETERINARIO</span>
            {userData.especialidad && <p className="vet-user-specialty">{userData.especialidad}</p>}
          </div>
        </div>

        <nav className="vet-nav">
          <ul>
            <li className={location.pathname === "/veterinario" ? "active" : ""}>
              <Link to="/veterinario" onClick={() => setSidebarOpen(false)}>
                <IconDashboard /> Dashboard
              </Link>
            </li>
            <li className={location.pathname.includes("/veterinario/citas") ? "active" : ""}>
              <Link to="/veterinario/citas" onClick={() => setSidebarOpen(false)}>
                <IconCalendar /> Gestión de Citas
              </Link>
            </li>
            <li className={location.pathname.includes("/veterinario/pacientes") ? "active" : ""}>
              <Link to="/veterinario/pacientes" onClick={() => setSidebarOpen(false)}>
                <IconPets /> Mis Pacientes
              </Link>
            </li>
            <li className={location.pathname.includes("/veterinario/historiales") ? "active" : ""}>
              <Link to="/veterinario/historiales" onClick={() => setSidebarOpen(false)}>
                <IconAssignment /> Historiales Médicos
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="vet-main-content">
        <header className="vet-header">
          {/* Botón de menú hamburguesa para móvil */}
          <button className="vet-menu-toggle" onClick={toggleSidebar}>
            <IconMenu size={24} />
          </button>

          <h1>{getCurrentPageTitle()}</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="vet-logout-btn-header">
              <IconLogout size={20} />
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="vet-content">
          {/* Solo mostrar el contenido del dashboard principal si estamos en esa ruta */}
          {isMainDashboard ? (
            <div className="dashboard-summary">
              <div className="welcome-section">
                <h2>Bienvenido, Dr. {userData.nombre}</h2>
                <p className="welcome-message">
                  Panel de control veterinario de Petty's Paradise. Gestiona tus citas, pacientes e historiales médicos.
                </p>
              </div>

              <div className="vet-stats-grid">
                <div className="vet-stat-card appointments">
                  <div className="vet-stat-icon">
                    <IconCalendar size={32} />
                  </div>
                  <div className="vet-stat-content">
                    <h3>Citas de Hoy</h3>
                    <p className="vet-stat-value">{userData.citasHoy}</p>
                    <Link to="/veterinario/citas" className="card-link">
                      Ver agenda <IconArrowRight />
                    </Link>
                  </div>
                </div>

                <div className="vet-stat-card patients">
                  <div className="vet-stat-icon">
                    <IconPets size={32} />
                  </div>
                  <div className="vet-stat-content">
                    <h3>Pacientes Activos</h3>
                    <p className="vet-stat-value">{userData.pacientesActivos}</p>
                    <Link to="/veterinario/pacientes" className="card-link">
                      Ver pacientes <IconArrowRight />
                    </Link>
                  </div>
                </div>

                <div className="vet-stat-card records">
                  <div className="vet-stat-icon">
                    <IconMedical size={32} />
                  </div>
                  <div className="vet-stat-content">
                    <h3>Historiales Pendientes</h3>
                    <p className="vet-stat-value">{userData.historialesPendientes}</p>
                    <Link to="/veterinario/historiales" className="card-link">
                      Revisar historiales <IconArrowRight />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Acciones Rápidas</h3>
                <div className="action-buttons">
                  <Link to="/veterinario/citas" className="vet-btn vet-btn-primary">
                    <IconPlus /> Agendar nueva cita
                  </Link>
                  <Link to="/veterinario/pacientes" className="vet-btn vet-btn-secondary">
                    <IconPets /> Registrar paciente
                  </Link>
                  <Link to="/veterinario/historiales" className="vet-btn vet-btn-secondary">
                    <IconAssignment /> Crear historial
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

export default VeterinarioDashboard
