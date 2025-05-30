"use client"
import { useForm } from "react-hook-form"
import Swal from "sweetalert2"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Link } from "react-router-dom"
import "../stylos/Login.css"
import { FaEye, FaEyeSlash, FaAt, FaLock } from "react-icons/fa"
import { useState, useEffect } from "react"


export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [intentosFallidos, setIntentosFallidos] = useState(0)
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [horaDesbloqueo, setHoraDesbloqueo] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  })

  const validateEmail = (value) => {
    if (!value) return "El email es obligatorio"
    if (!value.includes("@")) return "Falta el símbolo @ en el email"
    const parts = value.split("@")
    if (parts.length < 2 || !parts[1]) return "Falta el dominio después del @"
    if (parts[1] && !parts[1].includes(".")) return "Falta el punto (.) en el dominio"
    const pattern = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/
    if (!pattern.test(value)) return "El formato del email no es válido"
    return true
  }

  const validatePassword = (value) => {
    if (!value) return "La contraseña es obligatoria"
    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres"

    const requirements = []
    if (!/[A-Z]/.test(value)) requirements.push("una mayúscula")
    if (!/[a-z]/.test(value)) requirements.push("una minúscula")
    if (!/[0-9]/.test(value)) requirements.push("un número")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) requirements.push("un carácter especial")

    if (requirements.length > 0) {
      return `La contraseña debe contener ${requirements.join(", ")}`
    }

    return true
  }
  // En Login.jsx, añade este useEffect
useEffect(() => {
  if (cuentaBloqueada) {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verificar-desbloqueo/${watch('email')}`);
        if (response.data?.success && !response.data.cuenta_bloqueada) {
          setCuentaBloqueada(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error verificando desbloqueo:", error);
      }
    }, 300000); // Verificar cada 5 minutos

    return () => clearInterval(interval);
  }
}, [cuentaBloqueada, watch('email')]);
  // Función para calcular la hora de desbloqueo en el frontend como fallback
  const calcularHoraDesbloqueoLocal = (fechaBloqueo) => {
    if (!fechaBloqueo) return "No disponible"

    try {
      const fecha = new Date(fechaBloqueo)
      fecha.setHours(fecha.getHours() + 2) // Agregar 2 horas

      return fecha.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      console.error("Error calculando hora local:", error)
      return "Error al calcular"
    }
  }

  // Función para calcular tiempo restante en el frontend
// En Login.jsx, modifica la función calcularTiempoRestanteLocal
const calcularTiempoRestanteLocal = (fechaBloqueo) => {
  if (!fechaBloqueo) return "No disponible";

  try {
    const ahora = new Date();
    const fechaDesbloqueo = new Date(new Date(fechaBloqueo).getTime() + (2 * 60 * 60 * 1000)); // 2 horas en ms

    const diferencia = fechaDesbloqueo - ahora;

    if (diferencia <= 0) {
      return "Ya puede desbloquearse";
    }

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas} hora${horas > 1 ? "s" : ""} y ${minutos} minuto${minutos > 1 ? "s" : ""}`;
    } else {
      return `${minutos} minuto${minutos > 1 ? "s" : ""}`;
    }
  } catch (error) {
    console.error("Error calculando tiempo restante:", error);
    return "Error al calcular";
  }
};
  // Función para verificar el estado de la cuenta antes del login
  const verificarEstadoCuenta = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/estado-cuenta/${email}`)
      console.log("🔍 Estado de cuenta recibido:", response.data)
      return response.data
    } catch (error) {
      console.error("Error al verificar estado de cuenta:", error)
      return null
    }
  }

  const onSubmit = async (data) => {
    if (loading) return

    setLoading(true)

    try {
      // PASO 1: Verificar estado de la cuenta ANTES del login
      console.log("🔍 Verificando estado de cuenta para:", data.email)
      const estadoCuenta = await verificarEstadoCuenta(data.email)

      if (estadoCuenta?.data?.cuenta_bloqueada) {
        console.log("🚨 Cuenta bloqueada detectada:", estadoCuenta.data)

        // Usar datos del servidor o calcular localmente como fallback
        let horaDesbloqueo = estadoCuenta.data.hora_desbloqueo
        let tiempoDetallado = estadoCuenta.data.tiempo_restante_detallado

        // Si no hay datos del servidor, calcular localmente
        if (!horaDesbloqueo || horaDesbloqueo === "undefined") {
          console.log("⚠️ Calculando hora de desbloqueo localmente")
          horaDesbloqueo = calcularHoraDesbloqueoLocal(estadoCuenta.data.fecha_bloqueo)
        }

        if (!tiempoDetallado || !tiempoDetallado.texto) {
          console.log("⚠️ Calculando tiempo restante localmente")
          const tiempoTexto = calcularTiempoRestanteLocal(estadoCuenta.data.fecha_bloqueo)
          tiempoDetallado = { texto: tiempoTexto }
        }

        setCuentaBloqueada(true)
        setHoraDesbloqueo(horaDesbloqueo)

        // SweetAlert con información detallada de desbloqueo
        Swal.fire({
          icon: "error",
          title: "🔒 Cuenta Bloqueada",
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p><strong>Tu cuenta está bloqueada por demasiados intentos fallidos.</strong></p>
              <br>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <p><strong>🕐 Se desbloqueará automáticamente:</strong></p>
                <p style="font-size: 18px; color: #dc3545; font-weight: bold;">${horaDesbloqueo}</p>
                <p><strong>⏱️ Tiempo restante:</strong> ${tiempoDetallado.texto}</p>
              </div>
              <br>
              <p style="color: #6c757d;">💡 <em>También puedes contactar al administrador para desbloquear tu cuenta antes.</em></p>
            </div>
          `,
          confirmButtonColor: "#dc3545",
          confirmButtonText: "Entendido",
          width: 500,
        })
        setLoading(false)
        return
      }

      // PASO 2: Intentar hacer login
      console.log("🔐 Intentando login para:", data.email)
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email: data.email,
        contrasena: data.contrasena,
      })

      console.log("📋 Respuesta del servidor:", response.data)

      if (response.data?.success) {
        // PASO 3: Verificar nuevamente que la cuenta no esté bloqueada después del login
        const estadoPostLogin = await verificarEstadoCuenta(data.email)

        if (estadoPostLogin?.data?.cuenta_bloqueada) {
          console.log("⚠️ Cuenta bloqueada después del login - bloqueando acceso")
          setCuentaBloqueada(true)

          Swal.fire({
            icon: "error",
            title: "Acceso Denegado",
            text: "Tu cuenta ha sido bloqueada. Contacta al administrador.",
            confirmButtonColor: "#dc3545",
          })
          setLoading(false)
          return
        }

        // PASO 4: Login exitoso - mostrar mensaje de éxito y navegar
        console.log("✅ Login exitoso, navegando al dashboard")
        localStorage.setItem("user", JSON.stringify(response.data.user))
        localStorage.setItem("token", response.data.token)
        setIntentosFallidos(0)
        setCuentaBloqueada(false)

        // SweetAlert de éxito
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: "Inicio de sesión exitoso",
          timer: 1500,
          showConfirmButton: false,
        })

        const userRole = response.data.user.id_rol
        setTimeout(() => {
          if (userRole === 1) navigate("/administrador")
          else if (userRole === 2) navigate("/veterinario")
          else navigate("/propietario")
        }, 1500)
      } else {
        console.log("❌ Login fallido:", response.data?.message)
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: response.data?.message || "Credenciales incorrectas",
          confirmButtonColor: "#ffc107",
        })
      }
    } catch (error) {
      console.error("🚨 Error en login:", error)
      let mensaje = "Error al conectar con el servidor"
      let icon = "error"
      let titulo = "Error"

      if (error.response) {
        console.log("📊 Status de error:", error.response.status)
        console.log("📊 Datos de error:", error.response.data)

        if (error.response.status === 401) {
          const intentosRestantes = error.response.data?.intentos_restantes || 0
          setIntentosFallidos((prev) => prev + 1)

          titulo = "⚠️ Credenciales Incorrectas"
          icon = "warning"

          // SweetAlert con información de intentos restantes
          Swal.fire({
            icon: "warning",
            title: titulo,
            html: `
              <div style="text-align: center; margin: 20px 0;">
                <p><strong>Correo o contraseña incorrectos</strong></p>
                <br>
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <p><strong>⚠️ Intentos restantes:</strong></p>
                  <p style="font-size: 24px; color: #856404; font-weight: bold;">${intentosRestantes}</p>
                  ${intentosRestantes === 1 ? '<p style="color: #dc3545;"><strong>¡Cuidado! Si fallas una vez más, tu cuenta será bloqueada por 2 horas.</strong></p>' : ""}
                </div>
              </div>
            `,
            confirmButtonColor: "#ffc107",
            confirmButtonText: "Intentar de nuevo",
          })
          setLoading(false)
          reset()
          return
        } else if (error.response.status === 403) {
          if (error.response.data?.cuenta_bloqueada) {
            console.log("🚨 Cuenta recién bloqueada:", error.response.data)

            // Usar datos del servidor o calcular localmente
            let horaDesbloqueo = error.response.data?.hora_desbloqueo
            let tiempoDetallado = error.response.data?.tiempo_restante_detallado

            // Si no hay datos del servidor, calcular localmente usando la fecha actual
            if (!horaDesbloqueo || horaDesbloqueo === "undefined") {
              console.log("⚠️ Calculando hora de desbloqueo para cuenta recién bloqueada")
              horaDesbloqueo = calcularHoraDesbloqueoLocal(new Date())
            }

            if (!tiempoDetallado || !tiempoDetallado.texto) {
              tiempoDetallado = { texto: "2 horas" }
            }

            setCuentaBloqueada(true)
            setHoraDesbloqueo(horaDesbloqueo)

            // SweetAlert para cuenta recién bloqueada
            Swal.fire({
              icon: "error",
              title: "🚫 Cuenta Bloqueada",
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>Tu cuenta ha sido bloqueada por demasiados intentos fallidos.</strong></p>
                  <br>
                  <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                    <p><strong>🕐 Se desbloqueará automáticamente:</strong></p>
                    <p style="font-size: 18px; color: #721c24; font-weight: bold;">${horaDesbloqueo}</p>
                    <p><strong>⏱️ Tiempo de bloqueo:</strong> ${tiempoDetallado.texto}</p>
                  </div>
                  <br>
                  <div style="background-color: #d1ecf1; padding: 10px; border-radius: 8px;">
                    <p style="color: #0c5460; margin: 0;"><strong>💡 Opciones:</strong></p>
                    <p style="color: #0c5460; margin: 5px 0;">• Esperar hasta la hora indicada</p>
                    <p style="color: #0c5460; margin: 5px 0;">• Contactar al administrador para desbloqueo inmediato</p>
                  </div>
                </div>
              `,
              confirmButtonColor: "#dc3545",
              confirmButtonText: "Entendido",
              width: 550,
            })
          } else {
            mensaje = error.response.data?.message || "Acceso denegado"
            icon = "error"
          }
        } else {
          mensaje = error.response.data?.message || "Hubo un problema, intenta nuevamente"
        }
      }

      // SweetAlert genérico para otros errores
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        Swal.fire({
          icon: icon,
          title: titulo,
          text: mensaje,
          confirmButtonColor: "#dc3545",
        })
      }
    }

    setLoading(false)
    reset()
  }

  return (
    <main className="login-main">
      <div className="iz-side">
        <div className="logo-container">
          <Link to="/">
            <img
              src="https://raw.githubusercontent.com/Vale250910/mascotas_app1/refs/heads/main/img/logo.png"
              alt="Logo de Akeso"
              className="login-logo"
            />
          </Link>
        </div>
      </div>

      <div className="der-side">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <h1>Inicia Sesión</h1>

          {cuentaBloqueada && (
            <div className="cuenta-bloqueada-alert">
              <FaLock className="lock-icon" />
              <p>
                Cuenta bloqueada por demasiados intentos fallidos.
                {horaDesbloqueo && horaDesbloqueo !== "undefined" && (
                  <span>
                    <br />
                    <strong>Se desbloqueará el: {horaDesbloqueo}</strong>
                  </span>
                )}
                <br />
                <span>Contacte al administrador para desbloquear su cuenta antes.</span>
              </p>
            </div>
          )}

          <label>
            <strong>Email</strong>
            <div className="input-icon-container right">
              <input
                type="email"
                {...register("email", {
                  validate: validateEmail,
                })}
                className={`input-icon-field ${errors.email ? "input-error" : ""}`}
                placeholder="ejemplo@dominio.com"
                disabled={loading || cuentaBloqueada}
              />
              <FaAt className="input-icon" />
            </div>
            {errors.email && (
              <p className="error-message1">
                {errors.email.message === "El email es obligatorio" && "Por favor, ingresa tu email"}
                {errors.email.message === "Falta el símbolo @ en el email" &&
                  "El email debe contener un @. Ejemplo: usuario@dominio.com"}
                {errors.email.message === "Falta el dominio después del @" &&
                  "Falta la parte después del @. Ejemplo: usuario@dominio.com"}
                {errors.email.message === "Falta el punto (.) en el dominio del email" &&
                  "El dominio debe contener un punto. Ejemplo: usuario@dominio.com"}
                {errors.email.message === "El formato del email no es válido" &&
                  "El formato del email no es válido. Por favor revisa"}
              </p>
            )}
          </label>

          <label>
            <strong>Contraseña</strong>
            <div className="input-icon-container right">
              <input
                type={showPassword ? "text" : "password"}
                {...register("contrasena", {
                  validate: validatePassword,
                })}
                className={`input-icon-field ${errors.contrasena ? "input-error" : ""}`}
                placeholder="Ingresa tu contraseña"
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                disabled={loading || cuentaBloqueada}
              />
              <span className="toggle-password-icon" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            {passwordFocus && !errors.contrasena && (
              <div className="password-requirements">
                <p>La contraseña debe contener:</p>
                <ul>
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos una mayúscula</li>
                  <li>Al menos una minúscula</li>
                  <li>Al menos un número</li>
                  <li>Al menos un carácter especial</li>
                </ul>
              </div>
            )}
            {errors.contrasena && <p className="error-message1">{errors.contrasena.message}</p>}
          </label>

          <button type="submit" className="login-submit-btn" disabled={cuentaBloqueada || loading}>
            {loading ? "Verificando..." : "Ingresar"}
          </button>

          <div className="extras">
            <p className="signup-link">
              ¿No tienes una cuenta? <Link to="/registrar">Regístrate</Link>
              <br />
              ¿Olvidaste tu contraseña? <Link to="/recuperar">Dale aqui</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
