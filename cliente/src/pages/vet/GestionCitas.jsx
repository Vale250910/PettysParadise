"use client"

import { useState, useEffect } from "react";
import {
  List,
  Eye,
  Edit,
  X,
  Check,
  RefreshCw,
  Calendar as CalendarIcon,
  RotateCcw,
  Plus,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "../../stylos/vet/GestionCitas.css";
import "../../stylos/vet/loadingvet.css";
import { apiService } from "../../services/api-service";
import Swal from "sweetalert2";

// =================================================================================
// COMPONENTE PRINCIPAL
// =================================================================================
export default function GestionCitas() {
  const [showModal, setShowModal] = useState(false);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCita, setSelectedCita] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [propietarios, setPropietarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);

  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchCitas();
    fetchServicios();
    fetchVeterinarios();
    fetchPropietarios();
  }, []);

  const showNotification = (message, type = "success") => {
    Swal.fire({
      icon: type,
      title: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  };

  const fetchCitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get("/api/citas");
      setCitas(response || []);
    } catch (err) {
      setError("Error al cargar las citas asignadas.");
      showNotification("Error al cargar las citas", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPropietarios = async () => {
    try {
      const response = await apiService.get("/api/roles/propietarios");
      if (response.success) {
        setPropietarios(response.propietarios || []);
      }
    } catch (err) {
      console.error("Error al cargar propietarios:", err);
    }
  };

  const fetchMascotasPorPropietario = async (idPropietario) => {
    if (!idPropietario) return [];
    try {
      const response = await apiService.get(`/api/mascota/propietario/${idPropietario}`);
      return response.success ? response.mascotas : [];
    } catch (err) {
      console.error("Error al cargar mascotas:", err);
      return [];
    }
  };

  const fetchServicios = async () => {
    try {
      const data = await apiService.get("/api/servicios/servicios");
      setServicios(data || []);
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    }
  };

  const fetchVeterinarios = async () => {
    try {
      const data = await apiService.get("/api/servicios/veterinarios");
      setVeterinarios(data || []);
    } catch (err) {
      console.error("Error al cargar veterinarios:", err);
    }
  };
  
  const crearCita = async (citaData) => {
    try {
      await apiService.post("/api/citas", citaData);
      await fetchCitas();
      setShowModal(false);
      showNotification("Cita creada exitosamente");
    } catch (err) {
      showNotification(err.message || "Error al crear la cita", "error");
    }
  };

  const actualizarCita = async (citaData) => {
    try {
      await apiService.put(`/api/citas/${citaData.cod_cit}`, citaData);
      await fetchCitas();
      setShowEditModal(false);
      showNotification("Cita actualizada exitosamente");
    } catch (err) {
      showNotification(err.message || "Error al actualizar la cita", "error");
    }
  };

  const cancelarCita = async (codigo) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?', text: "No podrás revertir la cancelación fácilmente.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar cita', cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
      try {
        await apiService.put(`/api/citas/${codigo}/cancelar`);
        await fetchCitas();
        showNotification("Cita cancelada exitosamente");
      } catch (err) {
        showNotification(err.message || "Error al cancelar la cita", "error");
      }
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado("all");
    setFiltroFecha("");
  };

  const citasFiltradas = citas.filter((cita) => {
    if (filtroEstado !== "all" && cita.estado !== filtroEstado) return false;
    if (filtroFecha) {
      const citaFecha = new Date(cita.fech_cit).toDateString();
      const filtroFechaObj = new Date(filtroFecha).toDateString();
      if (citaFecha !== filtroFechaObj) return false;
    }
    return true;
  });

  return (
    <div className="vet-gestion-citas-container">
      <div className="vet-citas-header">
        <div className="vet-citas-title"><h2>Gestión de Citas</h2><p>Administra las citas de tus pacientes</p></div>
        <button className="vet-add-cita-btn" onClick={() => setShowModal(true)}><Plus size={20} /> Nueva Cita</button>
      </div>
      
      <div className="vet-citas-filters">
        <div className="vet-filter-group"><label htmlFor="filter-status">Estado:</label><select id="filter-status" className="vet-filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}><option value="all">Todos</option><option value="PENDIENTE">Pendiente</option><option value="CONFIRMADA">Confirmada</option><option value="CANCELADA">Cancelada</option><option value="REALIZADA">Realizada</option><option value="NO_ASISTIDA">No Asistida</option></select></div>
        <div className="vet-filter-group"><label htmlFor="filter-date">Fecha:</label><div className="vet-date-input-container"><input type="date" id="filter-date" className="vet-filter-input" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} /><CalendarIcon size={16} className="vet-calendar-icon" /></div></div>
        <div className="vet-filter-actions"><button className="vet-clear-filters-btn" onClick={limpiarFiltros}><RotateCcw size={16} /> Limpiar filtros</button><button className="vet-refresh-btn" onClick={fetchCitas}><RefreshCw size={16} /> Actualizar</button></div>
      </div>
      
      <div className="vet-citas-list">
        {loading ? <div className="vet-loading-message"><div className="vet-loading-spinner"></div>Cargando citas...</div> : error ? <div className="vet-error-message"><AlertCircle size={20} />{error}</div> : citasFiltradas.length === 0 ? <div className="vet-empty-message"><CalendarIcon size={48} /><h3>No hay citas</h3><p>No hay citas que coincidan con los filtros seleccionados.</p></div> : (
          citasFiltradas.map((cita) => (
            <CitaCard key={cita.cod_cit} cita={cita} onView={() => { setSelectedCita(cita); setShowViewModal(true); }} onEdit={() => { setSelectedCita(cita); setShowEditModal(true); }} onCancel={() => cancelarCita(cita.cod_cit)} />
          ))
        )}
      </div>

      {showModal && <NuevaCitaModal onClose={() => setShowModal(false)} onSubmit={crearCita} propietarios={propietarios} servicios={servicios} veterinarios={veterinarios} fetchMascotasPorPropietario={fetchMascotasPorPropietario} currentVetId={userData.id_usuario} />}
      {showViewModal && selectedCita && <VerCitaModal cita={selectedCita} onClose={() => setShowViewModal(false)} />}
      {showEditModal && selectedCita && <EditarCitaModal cita={selectedCita} onClose={() => setShowEditModal(false)} onSubmit={actualizarCita} servicios={servicios} veterinarios={veterinarios} />}
    </div>
  );
}


// =================================================================================
// SUB-COMPONENTES
// =================================================================================

function CitaCard({ cita, onView, onEdit, onCancel }) {
    const fecha = new Date(cita.fech_cit);
    const mes = fecha.toLocaleString("es", { month: "short" }).toUpperCase();
    const dia = fecha.getDate();
    const año = fecha.getFullYear();
    const hora = cita.hora ? cita.hora.substring(0, 5) : "Sin hora";
    const cardClass = `vet-cita-card ${cita.estado === 'CANCELADA' ? 'canceled' : ''}`;
    let statusClass = ""; let statusIcon = null;
    switch (cita.estado) { case "CONFIRMADA": statusClass = "confirmed"; statusIcon = <Check size={16}/>; break; case "PENDIENTE": statusClass = "pending"; statusIcon = <Clock size={16}/>; break; case "CANCELADA": statusClass = "canceled"; statusIcon = <X size={16}/>; break; case "REALIZADA": statusClass = "completed"; statusIcon = <CheckCircle size={16}/>; break; case "NO_ASISTIDA": statusClass = "missed"; statusIcon = <AlertCircle size={16}/>; break; default: statusClass = "pending"; statusIcon = <Clock size={16}/>; }
    return (<div className={cardClass}><div className="vet-cita-date"><div className="month">{mes}</div><div className="day">{dia}</div><div className="year">{año}</div><div className="time">{hora}</div></div><div className="vet-cita-details"><div className="vet-cita-info"><h3>{cita.servicio || "Servicio no especificado"}</h3><div className="vet-cita-meta"><span className="vet-meta-item"><User size={16}/> {cita.propietario_nombre || "Propietario no especificado"}</span><span className="vet-meta-item"><Stethoscope size={16}/> {cita.mascota || "Mascota no especificada"}</span></div><div className="vet-cita-status"><span className={`vet-status-badge ${statusClass}`}>{statusIcon} {cita.estado}</span></div></div><div className="vet-cita-actions"><button className="vet-action-btn vet-view-btn" onClick={onView}><Eye size={16}/> Ver</button>{cita.estado !== "CANCELADA" && cita.estado !== "REALIZADA" && (<><button className="vet-action-btn vet-edit-btn" onClick={onEdit}><Edit size={16}/> Editar</button><button className="vet-action-btn vet-cancel-btn" onClick={onCancel}><X size={16}/> Cancelar</button></>)}</div></div></div>);
}

// Modal de Nueva Cita con Validaciones
function NuevaCitaModal({ onClose, onSubmit, propietarios, servicios, veterinarios, fetchMascotasPorPropietario, currentVetId }) {
  const [formData, setFormData] = useState({
    id_pro: "",
    cod_mas: "",
    cod_ser: "",
    id_vet: currentVetId || "",
    fech_cit: "",
    hora: "",
    notas: "",
  });
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.fech_cit) {
        const selectedDate = new Date(formData.fech_cit + 'T00:00:00');
        if (selectedDate <= today) {
            newErrors.fech_cit = "La cita debe ser para una fecha futura.";
        }
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 1);
        if (selectedDate > maxDate) {
            newErrors.fech_cit = "La cita no puede ser a más de un mes.";
        }
    } else {
        newErrors.fech_cit = "La fecha es obligatoria.";
    }

    if (formData.hora) {
        const [hours] = formData.hora.split(':').map(Number);
        if (hours < 8 || hours >= 19) {
            newErrors.hora = "El horario es de 8:00 AM a 7:00 PM.";
        }
    } else {
        newErrors.hora = "La hora es obligatoria.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = async (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "id_pro") {
      setLoadingMascotas(true);
      const mascotas = await fetchMascotasPorPropietario(value);
      setMascotasDisponibles(mascotas);
      setFormData((prev) => ({ ...prev, cod_mas: "" }));
      setLoadingMascotas(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
      Swal.fire({ icon: 'error', title: 'Error de Validación', text: 'Por favor, corrige los errores en el formulario.' });
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="vet-modal" onClick={(e) => e.target.classList.contains("vet-modal") && onClose()}>
      <div className="vet-modal-content">
        <div className="vet-modal-header"><h2>Nueva Cita</h2><button className="vet-close-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="vet-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="vet-form-group"><label htmlFor="id_pro">Propietario:</label><select id="id_pro" value={formData.id_pro} onChange={handleChange} required><option value="">Seleccionar propietario</option>{propietarios.map((prop) => (<option key={prop.id_pro} value={prop.id_pro}>{prop.nombre} {prop.apellido}</option>))}</select></div>
            <div className="vet-form-group"><label htmlFor="cod_mas">Mascota:</label><select id="cod_mas" value={formData.cod_mas} onChange={handleChange} required disabled={!formData.id_pro || loadingMascotas}><option value="">{loadingMascotas ? "Cargando..." : "Seleccionar mascota"}</option>{mascotasDisponibles.map((mascota) => (<option key={mascota.cod_mas} value={mascota.cod_mas}>{mascota.nom_mas} ({mascota.raza})</option>))}</select></div>
            <div className="vet-form-group"><label htmlFor="cod_ser">Servicio:</label><select id="cod_ser" value={formData.cod_ser} onChange={handleChange} required><option value="">Seleccionar servicio</option>{servicios.map((s) => <option key={s.cod_ser} value={s.cod_ser}>{s.nom_ser}</option>)}</select></div>
            <div className="vet-form-group"><label htmlFor="id_vet">Veterinario Asignado:</label><select id="id_vet" value={formData.id_vet} onChange={handleChange} required><option value="">Seleccionar veterinario</option>{veterinarios.map((v) => <option key={v.id_usuario} value={v.id_usuario}>Dr. {v.nombre} {v.apellido}</option>)}</select></div>
            <div className="vet-form-row">
              <div className="vet-form-group"><label htmlFor="fech_cit">Fecha:</label><input type="date" id="fech_cit" value={formData.fech_cit} onChange={handleChange} min={minDateStr} max={maxDateStr} required />{errors.fech_cit && <p className="vet-error-message">{errors.fech_cit}</p>}</div>
              <div className="vet-form-group"><label htmlFor="hora">Hora:</label><input type="time" id="hora" value={formData.hora} onChange={handleChange} min="08:00" max="19:00" required />{errors.hora && <p className="vet-error-message">{errors.hora}</p>}</div>
            </div>
            <div className="vet-form-group"><label htmlFor="notas">Notas:</label><textarea id="notas" value={formData.notas} onChange={handleChange}></textarea></div>
          </form>
        </div>
        <div className="vet-modal-footer"><button className="vet-cancel-modal-btn" onClick={onClose}>Cancelar</button><button className="vet-submit-btn" onClick={handleSubmit}>Agendar Cita</button></div>
      </div>
    </div>
  );
}

function VerCitaModal({ cita, onClose }) {
  return (<div className="vet-modal" onClick={(e) => e.target.classList.contains("vet-modal") && onClose()}><div className="vet-modal-content vet-modal-view"><div className="vet-modal-header"><h2>Detalles de la Cita</h2><button className="vet-close-btn" onClick={onClose}><X size={18} /></button></div><div className="vet-modal-body"><div className="vet-cita-details-view"><div className="vet-detail-group"><h3>Información General</h3><p><strong>Estado:</strong>{" "}<span className={`vet-status-text ${cita.estado.toLowerCase()}`}>{cita.estado}</span></p><p><strong>Fecha:</strong> {new Date(cita.fech_cit).toLocaleDateString()}</p><p><strong>Hora:</strong> {cita.hora ? cita.hora.substring(0, 5) : "Sin hora"}</p></div><div className="vet-detail-group"><h3>Paciente</h3><p><strong>Propietario:</strong> {cita.propietario_nombre || "No especificado"}</p><p><strong>Mascota:</strong> {cita.mascota || "No especificada"}</p></div><div className="vet-detail-group"><h3>Servicio</h3><p>{cita.servicio || "No especificado"}</p></div>{cita.notas && (<div className="vet-detail-group"><h3>Notas</h3><p>{cita.notas}</p></div>)}</div></div><div className="vet-modal-footer"><button className="vet-submit-btn" onClick={onClose}>Cerrar</button></div></div></div>);
}

function EditarCitaModal({ cita, onClose, onSubmit, servicios, veterinarios }) {
  const [formData, setFormData] = useState({ ...cita, fech_cit: new Date(cita.fech_cit).toISOString().split("T")[0] });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (formData.fech_cit) {
        const selectedDate = new Date(formData.fech_cit + 'T00:00:00');
        if (selectedDate <= today) { newErrors.fech_cit = "La cita debe ser para una fecha futura."; }
        const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 1);
        if (selectedDate > maxDate) { newErrors.fech_cit = "La cita no puede ser a más de un mes."; }
    } else { newErrors.fech_cit = "La fecha es obligatoria."; }
    if (formData.hora) {
        const [hours] = formData.hora.split(':').map(Number);
        if (hours < 8 || hours >= 19) { newErrors.hora = "El horario es de 8:00 AM a 7:00 PM."; }
    } else { newErrors.hora = "La hora es obligatoria."; }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
      Swal.fire({ icon: 'error', title: 'Error de Validación', text: 'Por favor, corrige los errores en el formulario.' });
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="vet-modal" onClick={(e) => e.target.classList.contains("vet-modal") && onClose()}>
      <div className="vet-modal-content">
        <div className="vet-modal-header"><h2>Editar Cita</h2><button className="vet-close-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="vet-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="vet-form-group"><label>Paciente:</label><input type="text" value={`${cita.mascota} (Propietario: ${cita.propietario_nombre})`} disabled /></div>
            <div className="vet-form-group"><label htmlFor="id_vet">Veterinario:</label><select id="id_vet" value={formData.id_vet} onChange={handleChange} required><option value="">Seleccionar</option>{veterinarios.map((v) => (<option key={v.id_usuario} value={v.id_usuario}>Dr. {v.nombre} {v.apellido}</option>))}</select></div>
            <div className="vet-form-group"><label htmlFor="cod_ser">Servicio:</label><select id="cod_ser" value={formData.cod_ser} onChange={handleChange} required><option value="">Seleccionar</option>{servicios.map((s) => (<option key={s.cod_ser} value={s.cod_ser}>{s.nom_ser}</option>))}</select></div>
            <div className="vet-form-row">
              <div className="vet-form-group"><label htmlFor="fech_cit">Fecha:</label><input type="date" id="fech_cit" value={formData.fech_cit} onChange={handleChange} min={minDateStr} max={maxDateStr} required />{errors.fech_cit && <p className="vet-error-message">{errors.fech_cit}</p>}</div>
              <div className="vet-form-group"><label htmlFor="hora">Hora:</label><input type="time" id="hora" value={formData.hora} onChange={handleChange} min="08:00" max="19:00" required />{errors.hora && <p className="vet-error-message">{errors.hora}</p>}</div>
            </div>
            <div className="vet-form-group"><label htmlFor="estado">Estado:</label><select id="estado" value={formData.estado} onChange={handleChange}><option value="PENDIENTE">Pendiente</option><option value="CONFIRMADA">Confirmada</option><option value="REALIZADA">Realizada</option><option value="CANCELADA">Cancelada</option><option value="NO_ASISTIDA">No Asistida</option></select></div>
            <div className="vet-form-group"><label htmlFor="notas">Notas:</label><textarea id="notas" rows={3} value={formData.notas} onChange={handleChange}></textarea></div>
          </form>
        </div>
        <div className="vet-modal-footer"><button className="vet-cancel-modal-btn" onClick={onClose}>Cancelar</button><button className="vet-submit-btn" onClick={handleSubmit}><Edit size={16} /> Actualizar Cita</button></div>
      </div>
    </div>
  );
}