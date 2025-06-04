"use client"

import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Loading from "../pages/Loading"; // Asegúrate que la ruta a Loading sea correcta
import axios from "axios"; // Importa axios

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PrivateRouteVeterinario = () => {
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState(null); // Para un mejor manejo de errores
  const navigate = useNavigate(); // Hook para navegación programática

  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones de estado en un componente desmontado

    const verificarVeterinario = async () => {
      setLoading(true); // Inicia la carga en cada verificación
      setError(null);   // Resetea el error

      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        if (isMounted) {
          setAutorizado(false);
          setLoading(false);
          setError("No hay sesión activa. Por favor, inicia sesión."); // Mensaje de error claro
        }
        return;
      }

      let user;
      try {
        user = JSON.parse(userString);
      } catch (parseError) {
        console.error("Error parseando datos de usuario desde localStorage:", parseError);
        if (isMounted) {
          setAutorizado(false);
          setLoading(false);
          setError("Datos de sesión corruptos. Por favor, inicia sesión de nuevo.");
          // Considera limpiar localStorage si los datos están corruptos
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return;
      }
      
      // Verificación rápida en frontend del rol almacenado en localStorage
      if (user.id_rol !== 2) { // 2 es el id_rol para Veterinario
        if (isMounted) {
          console.log("Verificación frontend fallida: Usuario no es veterinario, rol actual:", user.id_rol);
          setAutorizado(false);
          setLoading(false);
          setError("Acceso denegado. No tienes los permisos necesarios (rol incorrecto).");
        }
        return;
      }

      // Verificación con el backend para confirmar el rol asociado al token
      try {
        console.log("Enviando solicitud de verificación de veterinario al backend...");
        const response = await axios.get(`${API_URL}/api/roles/verificar-veterinario`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000 // Timeout de 10 segundos para la petición
        });
        
        console.log("Respuesta del backend (verificar-veterinario):", response.data);
        if (isMounted) {
          if (response.data && response.data.success === true) {
            setAutorizado(true);
          } else {
            // Si el backend dice que no es veterinario (incluso si el rol local decía que sí)
            setAutorizado(false);
            setError(response.data?.message || "La verificación de rol de veterinario falló en el servidor.");
            // Si la verificación del backend falla (ej. token ya no es válido para ese rol), limpiar sesión
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
          }
        }

      } catch (err) {
        console.error("Error en la llamada de API para /verificar-veterinario:", err);
        if (isMounted) {
          setAutorizado(false);
          if (err.response) {
            // Error con respuesta del servidor (4xx, 5xx)
            setError(err.response.data?.message || `Error del servidor (${err.response.status}) al verificar el rol.`);
            // Si el token es inválido o el acceso es denegado por el backend, limpiar la sesión
            if (err.response.status === 401 || err.response.status === 403) {
               localStorage.removeItem("token");
               localStorage.removeItem("user");
               // Podrías establecer un mensaje de error más específico para estos casos
               setError("Tu sesión ha expirado o tus permisos han cambiado. Por favor, inicia sesión de nuevo.");
            }
          } else if (err.request) {
            // La petición se hizo pero no se recibió respuesta (problema de red, servidor caído)
            setError("No se pudo conectar con el servidor para verificar el rol. Intenta más tarde.");
          } else {
            // Otro tipo de error (configuración de la petición, etc.)
            setError("Error inesperado durante la verificación de rol.");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verificarVeterinario();

    // Función de limpieza para evitar actualizaciones de estado si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar

  if (loading) {
    // Puedes usar un componente de carga más sofisticado si lo tienes
    return <Loading fullPage={true} />; 
  }

  // Si hubo un error Y el usuario no está autorizado, redirige a login
  // El mensaje de error se pasa a través del estado de la navegación (opcional, para mostrarlo en Login)
  if (!autorizado) {
     console.warn("Redirigiendo a login. Autorizado:", autorizado, "Error:", error);
     return <Navigate to="/login" replace state={{ error: error || "Acceso no autorizado. Se requiere rol de veterinario."}} />;
  }

  // Si está autorizado, renderiza las rutas hijas (el contenido del dashboard del veterinario)
  return <Outlet />; 
};

export default PrivateRouteVeterinario;