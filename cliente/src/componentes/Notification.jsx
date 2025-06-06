import React from "react";
import '../stylos/Notification.css';

export default function Notification({ message, onClose }) {
  return (
    <div className="notification-container">
      <div className="notification">
        <p>{message}</p>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
}