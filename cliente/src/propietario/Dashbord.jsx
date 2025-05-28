// src/componentes/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Notification from "../componentes/Notification";
import ModalConfirm from "../componentes/ModalConfirm";
import { Link } from "react-router-dom";
import {
  FaPaw,
  FaBars,
  FaEnvelope,
  FaCalendarAlt,
  FaSignOutAlt,
  FaChartLine,
  FaHome
} from "react-icons/fa";
import '../stylos/Dashbord.css';

export default function Dashboard() {
  const [userData, setUserData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    role: "Administrador"
  });
  const [notification, setNotification] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("inicio");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Logout manual con confirmación modal
  const logout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setNotification("Sesión cerrada correctamente.");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Logout automático sin confirmación, usando notificación estilizada
  const autoLogout = () => {
    setNotification("Sesión cerrada por inactividad.");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setTimeout(() => {
      window.location.href = "/";
    }, 4000);
  };

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user) {
        setUserData({
          nombre: user.nombre || "",
          apellido: user.apellido || "",
          email: user.email || "",
          role: user.role || "Administrador",
          petsCount: user.petsCount || 0,
          upcomingAppointments: user.upcomingAppointments || 0,
          remindersCount: user.remindersCount || 0,
        });
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavClick = (item) => {
    setActiveItem(item);

    // Ejemplo: mostrar notificación al ir a "citas"
    if (item === "citas") {
      setNotification("Tienes citas próximas.");
    } else {
      setNotification("");
    }
  };

  // ⏱ Inactividad de 15 minutos
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        autoLogout();
      }, 15 * 60 * 1000); // 15 minutos (ajustado)
    };

    // Eventos que reinician el temporizador
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // iniciar por primera vez

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FaChartLine />
            <span>DashBoard</span>
          </div>
          <button className="mobile-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {userData.nombre.charAt(0).toUpperCase()}
            {userData.apellido.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{`${userData.nombre} ${userData.apellido}`}</h3>
            <p><FaEnvelope /> {userData.email}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeItem === "inicio" ? "active" : ""}>
              <Link to="/propietario" onClick={() => handleNavClick("inicio")}>
                <FaHome />
                <span>Inicio</span>
              </Link>
            </li>

            <li className={activeItem === "mascotas" ? "active" : ""}>
              <Link to="/propietario/infomas" onClick={() => handleNavClick("mascotas")}>
                <FaPaw />
                <span>Mis Mascotas</span>
              </Link>
            </li>

            <li className={activeItem === "citas" ? "active" : ""}>
              <Link to="/propietario/citas" onClick={() => handleNavClick("citas")}>
                <FaCalendarAlt />
                <span>Citas</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Aquí va la notificación */}
      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}

      {/* Modal para confirmar logout */}
      {showLogoutConfirm && (
        <ModalConfirm 
          message="¿Estás seguro de que deseas cerrar sesión?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </div>
  );
}
