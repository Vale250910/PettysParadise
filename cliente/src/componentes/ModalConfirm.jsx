// src/componentes/ModalConfirm.jsx
import React from "react";
import '../stylos/ModalConfirm.css';

export default function ModalConfirm({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-confirm">
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-confirm" onClick={onConfirm}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}
