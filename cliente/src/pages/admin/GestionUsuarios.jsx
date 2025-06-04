// cliente/src/pages/admin/GestionUsuarios.jsx
"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import "../../stylos/Admin/GestionUsuarios.css"; 
import { FaToggleOn, FaToggleOff, FaEdit } from 'react-icons/fa'; // Importar iconos

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const initialFormData = {
    id_usuario: "",
    tipo_doc: "C.C",
    nombre: "",
    apellido: "",
    ciudad: "",
    direccion: "",
    telefono: "",
    fecha_nacimiento: "",
    email: "",
    password: "",
    id_rol: 3, 
    especialidad: "",
    horario: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/roles/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUsuarios(response.data.usuarios);
        setError("");
      } else {
        setError("Error al cargar usuarios: " + (response.data.message || ""));
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      setError("Error al conectar con el servidor. " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "id_rol" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingUser) {
      if (!formData.password) {
        alert("La contraseña es obligatoria para nuevos usuarios.");
        return;
      }
      if (formData.password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        alert("Contraseña no válida. Requisitos: Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
        return;
      }
    } else if (formData.password && formData.password.length > 0) { 
        if (formData.password.length < 8) {
            alert("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            alert("La nueva contraseña no cumple los requisitos: Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
            return;
        }
    }

    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        alert("El usuario debe ser mayor de 18 años.");
        return;
      }
    } else {
        alert("La fecha de nacimiento es obligatoria.");
        return;
    }

    try {
      const token = localStorage.getItem("token");
      let response;
      const dataToSend = { ...formData };
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        response = await axios.put(`${API_URL}/api/roles/usuarios/${editingUser.id_usuario}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`${API_URL}/api/roles/usuarios`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.success) {
        alert(editingUser ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente");
        fetchUsuarios();
        closeModal();
      } else {
        alert(response.data.message || (editingUser ? "Error al actualizar usuario" : "Error al crear usuario"));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.response?.data?.message || "Error al procesar la solicitud");
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      id_usuario: usuario.id_usuario,
      tipo_doc: usuario.tipo_doc || "C.C",
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono || "",
      ciudad: usuario.ciudad && usuario.ciudad !== "No especificada" ? usuario.ciudad : "",
      direccion: usuario.direccion && usuario.direccion !== "No especificada" ? usuario.direccion : "",
      fecha_nacimiento: usuario.fecha_nacimiento ? new Date(usuario.fecha_nacimiento).toISOString().split('T')[0] : "",
      password: "", 
      id_rol: usuario.id_rol,
      especialidad: usuario.especialidad || "",
      horario: usuario.horario || "",
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión de nuevo.");
        return;
      }

      const usuario = usuarios.find(u => u.id_usuario === userId);
      const estadoActual = usuario.cuenta_bloqueada ? "inactivo" : "activo";
      const nuevoEstadoAccion = usuario.cuenta_bloqueada ? "activar" : "desactivar";
      
      if (!window.confirm(`¿Estás seguro de que quieres ${nuevoEstadoAccion} al usuario ${usuario.nombre} ${usuario.apellido} (actualmente ${estadoActual})?`)) {
        return;
      }

      const response = await axios.patch(
        `${API_URL}/api/roles/usuarios/${userId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchUsuarios();
      } else {
        alert(`Error: ${response.data.message || "No se pudo cambiar el estado."}`);
      }
    } catch (error) {
      console.error("Error al intentar cambiar estado:", error);
      let errorMessage = "Error al cambiar el estado del usuario.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  // Se comenta la función handleDelete para priorizar la desactivación
  /*
  const handleDelete = async (userId, userName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}? Esta acción es irreversible.`)) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`${API_URL}/api/roles/usuarios/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          alert("Usuario eliminado permanentemente");
          fetchUsuarios();
        } else {
          alert(response.data.message || "Error al eliminar usuario");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(error.response?.data?.message || "Error al eliminar usuario permanentemente");
      }
    }
  };
  */

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const searchLower = searchTerm.toLowerCase();
    const searchNumber = searchTerm.replace(/\D/g, ""); // Obtener solo números para búsqueda de ID

    if (searchNumber && usuario.id_usuario.toString().includes(searchNumber)) {
      return true;
    }

    return (
      (usuario.nombre && usuario.nombre.toLowerCase().includes(searchLower)) ||
      (usuario.apellido && usuario.apellido.toLowerCase().includes(searchLower)) ||
      (usuario.email && usuario.email.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    // Intentar parsear la fecha, si es inválida, devolver 'Fecha inválida'
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }
    // Formatear a un formato legible, ej: "15/may/2024"
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short", // 'short' para 'may', 'long' para 'mayo'
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="gestion-usuarios-container">
        <div className="usuarios-loading-container">
          <div className="usuarios-loading-spinner"></div>
          <p className="usuarios-loading-text">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios-container">
      <div className="usuarios-page-header">
        <div className="usuarios-header-content">
          <div className="usuarios-title-section">
            <h1>Gestión de Usuarios</h1>
            <p>Administra usuarios del sistema</p>
          </div>
          <button className="usuarios-create-btn" onClick={openCreateModal}>
            + Crear Usuario
          </button>
        </div>
        <div className="usuarios-search-container">
          <input
            type="text"
            placeholder="🔍 Buscar por ID, nombre, apellido o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="usuarios-search-input"
          />
        </div>
      </div>

      {error && (
        <div className="usuarios-error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchUsuarios} className="usuarios-btn-retry">
            Reintentar
          </button>
        </div>
      )}

      <div className="usuarios-stats-grid">
        {/* Aquí podrías poner tarjetas de estadísticas si las tienes */}
      </div>

      <div className="usuarios-table-container">
         <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan="7" className="usuarios-no-data">
                  {searchTerm ? "No se encontraron usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."}
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>
                    <span style={{ fontWeight: 600 }}>#{usuario.id_usuario}</span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {usuario.nombre} {usuario.apellido}
                      </div>
                      {usuario.telefono && (
                        <div style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>📞 {usuario.telefono}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "14px" }}>{usuario.email}</span>
                  </td>
                  <td>
                    <span className={`usuarios-badge usuarios-badge-${(usuario.nombre_rol || 'desconocido').toLowerCase().replace(/\s+/g, '-')}`}>
                      {usuario.nombre_rol || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`usuarios-badge ${usuario.cuenta_bloqueada ? "usuarios-badge-inactive" : "usuarios-badge-active"}`}
                    >
                      {usuario.cuenta_bloqueada ? "Inactivo" : "Activo"}
                    </span>
                  </td>
                  <td>
                    {formatDate(usuario.fecha_registro)} {/* Mostrar fecha formateada */}
                  </td>
                  <td>
                    <div className="usuarios-action-buttons">
                      <button 
                        className="usuarios-btn-icon edit" 
                        onClick={() => handleEdit(usuario)} 
                        title="Editar Usuario"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`usuarios-btn-icon ${usuario.cuenta_bloqueada ? "toggle-status-inactive" : "toggle-status-active"}`}
                        onClick={() => handleToggleStatus(usuario.id_usuario)}
                        title={usuario.cuenta_bloqueada ? "Activar Usuario" : "Desactivar Usuario"}
                      >
                        {usuario.cuenta_bloqueada ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      {/* Se comenta el botón de eliminar
                      <button
                        className="usuarios-btn-icon delete"
                        onClick={() => handleDelete(usuario.id_usuario, `${usuario.nombre} ${usuario.apellido}`)}
                        title="Eliminar Usuario (¡Permanente!)"
                      >
                        🗑️
                      </button>
                      */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="usuarios-modal-overlay" onClick={closeModal}>
          <div className="usuarios-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="usuarios-modal-header">
              <h3 className="usuarios-modal-title">{editingUser ? "Editar Usuario" : "Crear Usuario"}</h3>
              <button className="usuarios-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="usuarios-form">
              {/* Campos del formulario como los tenías, incluyendo tipo_doc, fecha_nacimiento, etc. */}
              <div className="usuarios-form-grid">
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Tipo de Documento *</label>
                  <select
                    name="tipo_doc"
                    value={formData.tipo_doc}
                    onChange={handleInputChange}
                    className="usuarios-form-select"
                    required
                  >
                    <option value="C.C">C.C</option>
                    <option value="C.E">C.E</option>
                  </select>
                </div>
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Número de Documento *</label>
                  <input
                    type="text"
                    name="id_usuario"
                    value={formData.id_usuario}
                    onChange={handleInputChange}
                    className="usuarios-form-input"
                    required
                    disabled={!!editingUser}
                    placeholder="Ej: 1234567890"
                    pattern="\d{7,12}"
                    title="Debe ser un número entre 7 y 12 dígitos."
                  />
                </div>
              </div>

              <div className="usuarios-form-grid">
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Nombre *</label>
                  <input
                    type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    pattern="[A-Za-záéíóúÁÉÍÓÚñÑ\s]{3,50}"
                    title="Solo letras y espacios, entre 3 y 50 caracteres."
                  />
                </div>
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Apellido *</label>
                  <input
                    type="text" name="apellido" value={formData.apellido} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    pattern="[A-Za-záéíóúÁÉÍÓÚñÑ\s]{3,50}"
                    title="Solo letras y espacios, entre 3 y 50 caracteres."
                  />
                </div>
              </div>
              
              <div className="usuarios-form-grid">
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Email *</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    title="Ingrese un correo electrónico válido."
                  />
                </div>
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Teléfono *</label>
                  <input
                    type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    pattern="\d{10}"
                    title="Debe ser un número de 10 dígitos."
                  />
                </div>
              </div>

              <div className="usuarios-form-grid">
                 <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Ciudad *</label>
                  <input
                    type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    pattern="[A-Za-záéíóúÁÉÍÓÚñÑ\s]{3,50}"
                    title="Solo letras y espacios, entre 3 y 50 caracteres."
                  />
                </div>
                <div className="usuarios-form-group">
                  <label className="usuarios-form-label">Dirección *</label>
                  <input
                    type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                    className="usuarios-form-input" required
                    minLength="10" maxLength="200"
                    title="Mínimo 10 caracteres, máximo 200."
                  />
                </div>
              </div>
              
              <div className="usuarios-form-group">
                <label className="usuarios-form-label">Fecha de Nacimiento *</label>
                <input
                  type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange}
                  className="usuarios-form-input" required
                />
              </div>

              <div className="usuarios-form-group">
                <label className="usuarios-form-label">Rol *</label>
                <select
                  name="id_rol" value={formData.id_rol} onChange={handleInputChange}
                  className="usuarios-form-select" required
                >
                  <option value={3}>Propietario</option>
                  <option value={2}>Veterinario</option>
                </select>
              </div>

              {formData.id_rol === 2 && (
                <div className="usuarios-form-grid">
                  <div className="usuarios-form-group">
                    <label className="usuarios-form-label">Especialidad *</label>
                    <input
                      type="text" name="especialidad" value={formData.especialidad} onChange={handleInputChange}
                      className="usuarios-form-input" required={formData.id_rol === 2}
                      placeholder="Ej: Medicina General, Cirugía..."
                    />
                  </div>
                  <div className="usuarios-form-group">
                    <label className="usuarios-form-label">Horario *</label>
                    <input
                      type="text" name="horario" value={formData.horario} onChange={handleInputChange}
                      className="usuarios-form-input" required={formData.id_rol === 2}
                      placeholder="Ej: Lunes a Viernes 8:00-17:00"
                    />
                  </div>
                </div>
              )}
              
              <div className="usuarios-form-group">
                <label className="usuarios-form-label">
                  {editingUser ? "Nueva Contraseña (opcional)" : "Contraseña *"}
                </label>
                <input
                  type="password" name="password" value={formData.password} onChange={handleInputChange}
                  className="usuarios-form-input"
                  required={!editingUser}
                  minLength={editingUser && !formData.password ? undefined : 8} 
                  placeholder={editingUser ? "Dejar en blanco si no cambia" : "Mínimo 8 caracteres, con requisitos"}
                />
                 {(!editingUser || formData.password) && ( 
                    <small className="password-requirements-modal">
                        Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (ej: !@#$%^&*).
                    </small>
                )}
              </div>

              <div className="usuarios-form-actions">
                <button type="button" className="usuarios-btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="usuarios-btn-primary">
                  {editingUser ? "Actualizar" : "Crear"} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;