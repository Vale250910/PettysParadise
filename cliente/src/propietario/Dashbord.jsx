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
  const [showBackConfirm, setShowBackConfirm] = useState(false);

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

  const autoLogout = () => {
    setNotification("Sesión cerrada por inactividad.");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setTimeout(() => {
      window.location.href = "/";
    }, 4000);
  };

  const confirmBackLogout = () => {
    setShowBackConfirm(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setNotification("Sesión cerrada.");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  const goHomeWithoutLogout = () => {
    setShowBackConfirm(false);
    setNotification("Redirigiendo al inicio...");
    setTimeout(() => {
      window.location.href = "/#Inicio";
    }, 2000);
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

  // ✅ Back button detection - mejora para que funcione desde la primera carga
  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
      setShowBackConfirm(true);
    };
  
    // ✅ Forzar interacción inicial silenciosa
    const simulateInteraction = () => {
      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
  
    // ✅ Forzar que el pushState quede registrado correctamente
    setTimeout(() => {
      simulateInteraction(); // simula una interacción
      window.history.pushState(null, "", window.location.href);
    }, 100);
  
    window.addEventListener("popstate", handleBackButton);
  
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);
  

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavClick = (item) => {
    setActiveItem(item);
    if (item === "citas") {
      setNotification("Tienes citas próximas.");
    } else {
      setNotification("");
    }
  };

  // ⏱ Logout por inactividad (15 min)
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        autoLogout();
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

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

      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}

      {showLogoutConfirm && (
        <ModalConfirm
          message="¿Estás seguro de que deseas cerrar sesión?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}

      {showBackConfirm && (
        <ModalConfirm
          message="¿Deseas cerrar sesión o volver al inicio?"
          onConfirm={confirmBackLogout}
          onCancel={goHomeWithoutLogout}
          confirmText="Cerrar sesión"
          cancelText="Ir al inicio"
        />
      )}
    </div>
  );
}