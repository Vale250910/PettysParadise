"use client";

import { useState, useEffect } from "react";
import axios from "axios"; // Asegúrate de tener axios importado
import Swal from "sweetalert2"; // Importamos Swal para las notificaciones
import {
  Plus, Search, Eye, Edit, Trash2, PawPrint, Calendar, Weight, Heart, X,
  CheckCircle, XCircle, AlertCircle, Upload, User, Dog, Award, CreditCard,
  User as Male, User as Female
} from "lucide-react";
import "../../stylos/vet/GestionMascotas.css";
import "../../stylos/vet/loadingvet.css";
import { apiService } from "../../services/api-service";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// =================================================================================
// COMPONENTE PRINCIPAL
// =================================================================================
export default function MisPacientes() {
  const [showModal, setShowModal] = useState(false);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMascota, setSelectedMascota] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchMascotas();
  }, []);

  const showNotification = (message, type = "success") => {
    const icon = type === 'success' ? 'success' : 'error';
    Swal.fire({
      icon: icon,
      title: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  };

  const fetchMascotas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get("/api/mascota/todas");
      setMascotas(response || []);
    } catch (err) {
      setError("Error al cargar los pacientes");
      showNotification("Error al cargar los pacientes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (mascotaData) => {
    try {
      if (isEditing) {
        await apiService.put(`/api/mascota/${mascotaData.cod_mas}`, mascotaData);
        showNotification("Paciente actualizado exitosamente.");
      } else {
        await apiService.post("/api/mascota/create", mascotaData);
        showNotification("Paciente registrado exitosamente.");
      }
      closeModal();
      await fetchMascotas();
    } catch (err) {
      const action = isEditing ? 'actualizar' : 'registrar';
      showNotification(`Error al ${action} el paciente: ${err.message}`, "error");
    }
  };

  const handleDelete = async (mascotaId, mascotaNombre) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar a ${mascotaNombre}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await apiService.delete(`/api/mascota/${mascotaId}`);
        showNotification("Paciente eliminado correctamente.");
        await fetchMascotas();
      } catch (err) {
        showNotification(`Error al eliminar el paciente: ${err.message}`, "error");
      }
    }
  };

  const openCreateModal = () => {
    setSelectedMascota(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (mascota) => {
    setSelectedMascota(mascota);
    setIsEditing(true);
    setShowModal(true);
  }

  const closeModal = () => {
    setShowModal(false);
    setSelectedMascota(null);
    setIsEditing(false);
  };

  const mascotasFiltradas = mascotas.filter(
    (m) =>
      m.nom_mas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.raza?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="vet-pacientes-container">
      <div className="vet-pacientes-header">
        <div className="vet-pacientes-title">
            <h2>Mis Pacientes</h2>
            <p>Gestiona la información de todos los pacientes de la clínica</p>
        </div>
        <button className="vet-add-paciente-btn" onClick={openCreateModal}>
            <Plus size={20} /> Registrar Paciente
        </button>
      </div>

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

      <div className="vet-pacientes-grid">
        {loading ? (
            <div className="vet-loading-message"><div className="vet-loading-spinner"></div>Cargando pacientes...</div>
        ) : error ? (
            <div className="vet-error-message"><AlertCircle size={20} />{error}</div>
        ) : mascotasFiltradas.length === 0 ? (
            <div className="vet-empty-message"><PawPrint size={48} /><h3>No hay pacientes</h3><p>No se encontraron pacientes registrados.</p></div>
        ) : (
          mascotasFiltradas.map((mascota) => (
            <PacienteCard 
                key={mascota.cod_mas} 
                mascota={mascota} 
                onView={() => { setSelectedMascota(mascota); setShowViewModal(true); }} 
                onEdit={() => openEditModal(mascota)} 
                onDelete={() => handleDelete(mascota.cod_mas, mascota.nom_mas)} 
            />
          ))
        )}
      </div>

      {showModal && <PacienteModal onClose={closeModal} onSubmit={handleSave} mascota={selectedMascota} isEditing={isEditing} showNotification={showNotification} />}
      
      {showViewModal && selectedMascota && <VerPacienteModal mascota={selectedMascota} onClose={() => setShowViewModal(false)} />}
    </div>
  );
}


// =================================================================================
// SUB-COMPONENTES
// =================================================================================

function PacienteCard({ mascota, onView, onEdit, onDelete }) {
  return (
    <div className="vet-paciente-card">
      <div className="vet-paciente-avatar">
        <img src={mascota.foto || "https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg"} alt={mascota.nom_mas} />
      </div>
      <div className="vet-paciente-info">
        <h3>{mascota.nom_mas}</h3>
        <p className="vet-paciente-raza">{mascota.especie} • {mascota.raza}</p>
        <p className="vet-paciente-propietario">Propietario: {mascota.propietario || 'N/A'}</p>
        <div className="vet-paciente-stats">
          <div className="vet-stat-item"><Calendar size={14} /><span>{mascota.edad} años</span></div>
          <div className="vet-stat-item"><Weight size={14} /><span>{mascota.peso} kg</span></div>
          <div className="vet-stat-item"><Heart size={14} /><span className={`vet-genero ${mascota.genero?.toLowerCase()}`}>{mascota.genero}</span></div>
        </div>
      </div>
      <div className="vet-paciente-actions">
        <button className="vet-action-btn vet-view-btn" onClick={onView} title="Ver Detalles"><Eye size={16} /></button>
        <button className="vet-action-btn vet-edit-btn" onClick={onEdit} title="Editar"><Edit size={16} /></button>
        <button className="vet-action-btn vet-delete-btn" onClick={onDelete} title="Eliminar"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

// MODAL PARA CREAR Y EDITAR, CON LA LÓGICA DE IMAGEN CORRECTA
function PacienteModal({ onClose, onSubmit, mascota, isEditing, showNotification }) {
  const [formData, setFormData] = useState({
    nom_mas: mascota?.nom_mas || "",
    especie: mascota?.especie || "",
    raza: mascota?.raza || "",
    edad: mascota?.edad?.toString() || "",
    genero: mascota?.genero || "",
    peso: mascota?.peso?.toString() || "",
    id_pro: mascota?.id_pro?.toString() || "",
    foto: mascota?.foto || "",
    cod_mas: mascota?.cod_mas || null,
  });

  const [imagePreview, setImagePreview] = useState(mascota?.foto || null);
  const [imageUrl, setImageUrl] = useState(mascota?.foto || "");
  const [uploading, setUploading] = useState(false);
  
  const token = localStorage.getItem("token");

  // LÓGICA DE SUBIDA DE IMAGEN REPLICADA DE TU COMPONENTE Mascota.jsx
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showNotification("Solo se permiten archivos JPG, PNG o WebP.", "error");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification("La imagen debe ser menor a 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formPayload = new FormData();
    formPayload.append("file", file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/image`, formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.url) {
        setImageUrl(response.data.url);
        showNotification("Imagen subida exitosamente", "success");
      } else {
        throw new Error(response.data.message || "Respuesta del servidor inválida");
      }
    } catch (error) {
      showNotification(`Error al subir imagen: ${error.message}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, name, type, checked } = e.target;
    const propName = id || name;
    if (type === 'radio') {
      if (checked) {
        setFormData((prev) => ({...prev, [propName]: value}));
      }
    } else {
      setFormData((prev) => ({...prev, [propName]: value}));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      foto: imageUrl || formData.foto, // Usa la nueva URL si existe, si no, la que ya tenía
    };
    onSubmit(finalData);
  };

  return (
    <div className="vet-modal-overlay" onClick={onClose}>
        <div className="vet-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="vet-modal-left-panel">
                <div className="vet-modal-decoration">
                    <div className="vet-modal-icon-container"><PawPrint className="vet-modal-icon" /></div>
                    <h2>{isEditing ? "Editar Paciente" : "Registro de Paciente"}</h2>
                    <p>{isEditing ? "Actualiza los datos del paciente" : "Completa los datos del nuevo paciente"}</p>
                </div>
            </div>
            <div className="vet-modal-right-panel">
                <div className="vet-modal-header"><button className="vet-modal-close-btn" onClick={onClose}><X size={24} /></button></div>
                <div className="vet-modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="vet-image-upload-container">
                          <label htmlFor="vet-file-upload" className="vet-image-upload-label">
                            <div className="vet-image-preview">
                              {imagePreview ? (<img src={imagePreview} alt="Vista previa" />) : (<div className="vet-upload-placeholder"><Upload className="vet-upload-icon" /><span>Subir foto</span></div>)}
                            </div>
                          </label>
                          <input id="vet-file-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                          {uploading && <p className="vet-uploading-text">Subiendo...</p>}
                        </div>
                        <div className="vet-form-group"><label className="vet-form-label"><User className="vet-field-icon"/><span>Nombre</span></label><input type="text" id="nom_mas" className="vet-form-input" placeholder="Nombre de la mascota" value={formData.nom_mas} onChange={handleChange} required /></div>
                        <div className="vet-form-group"><label className="vet-form-label"><Dog className="vet-field-icon" /><span>Especie</span></label><select id="especie" className="vet-form-input" value={formData.especie} onChange={handleChange} required><option value="">Seleccionar especie</option><option value="Perro">Perro</option><option value="Gato">Gato</option><option value="Ave">Ave</option><option value="Conejo">Conejo</option><option value="Hamster">Hámster</option><option value="Otro">Otro</option></select></div>
                        <div className="vet-form-group"><label className="vet-form-label"><Heart className="vet-field-icon" /><span>Género</span></label><div className="vet-gender-options"><label className="vet-gender-option"><input type="radio" name="genero" value="Macho" checked={formData.genero === "Macho"} onChange={handleChange} required /><div className="vet-gender-radio-button"><Male className="vet-gender-icon vet-male-icon"/><span>Macho</span></div></label><label className="vet-gender-option"><input type="radio" name="genero" value="Hembra" checked={formData.genero === "Hembra"} onChange={handleChange} required /><div className="vet-gender-radio-button"><Female className="vet-gender-icon vet-female-icon"/><span>Hembra</span></div></label></div></div>
                        <div className="vet-form-group"><label className="vet-form-label"><Award className="vet-field-icon" /><span>Raza</span></label><input type="text" id="raza" className="vet-form-input" placeholder="Raza de la mascota" value={formData.raza} onChange={handleChange} required /></div>
                        <div className="vet-form-row"><div className="vet-form-group"><label className="vet-form-label"><Calendar className="vet-field-icon" /><span>Edad (años)</span></label><input type="number" id="edad" className="vet-form-input" placeholder="Edad" value={formData.edad} onChange={handleChange} step="0.1" min="0" max="30" required /></div><div className="vet-form-group"><label className="vet-form-label"><Weight className="vet-field-icon" /><span>Peso (kg)</span></label><input type="number" id="peso" className="vet-form-input" placeholder="Peso" value={formData.peso} onChange={handleChange} step="0.1" min="0.1" max="200" required /></div></div>
                        <div className="vet-form-group"><label className="vet-form-label"><CreditCard className="vet-field-icon" /><span>ID del Propietario</span></label><input type="text" id="id_pro" className="vet-form-input" placeholder="Documento del propietario" value={formData.id_pro} onChange={handleChange} required /></div>

                        <div className="vet-form-actions">
                          <button type="submit" className="vet-submit-button" disabled={uploading}>{uploading ? "Subiendo..." : isEditing ? "Actualizar Paciente" : "Registrar Paciente"}</button>
                          <button type="button" className="vet-cancel-button" onClick={onClose}>Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
}

function VerPacienteModal({ mascota, onClose }) {
  return (
    <div className="vet-modal-overlay" onClick={onClose}>
      <div className="vet-modal-simple" onClick={(e) => e.stopPropagation()}>
        <div className="vet-modal-header">
          <h2>Información del Paciente</h2>
          <button className="vet-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="vet-modal-body">
          <div className="vet-paciente-details-view">
            <div className="vet-paciente-photo"><img src={mascota.foto || "https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg"} alt={mascota.nom_mas} /></div>
            <div className="vet-detail-group"><h3>Información Básica</h3><p><strong>Nombre:</strong> {mascota.nom_mas}</p><p><strong>Especie:</strong> {mascota.especie}</p><p><strong>Raza:</strong> {mascota.raza}</p><p><strong>Edad:</strong> {mascota.edad} años</p><p><strong>Género:</strong> {mascota.genero}</p><p><strong>Peso:</strong> {mascota.peso} kg</p></div>
            <div className="vet-detail-group"><h3>Propietario</h3><p><strong>Nombre:</strong> {mascota.propietario || 'No disponible'}</p><p><strong>ID:</strong> {mascota.id_pro}</p></div>
          </div>
        </div>
        <div className="vet-modal-footer"><button className="vet-submit-button" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}