import React from "react";
import '../stylos/ModalConfirm.css';

export default function ModalConfirm({ message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar" }) {
  return (
    <div className="modal-overlay">
      <div className="modal-confirm">
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn btn-cancel" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}