"use client"
import { useForm } from "react-hook-form"
import { useState } from "react"
import Axios from "axios"
import Swal from "sweetalert2"
import { PawPrint, User, AtSign, Lock, Phone, Calendar, FileText, Building, Home, Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import "../stylos/Registrar.css"
import "bootstrap-icons/font/bootstrap-icons.css"

export default function Registrar() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
    watch,
    trigger,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      isPropietario: true, // Valor por defecto siempre true
    },
  })

  const [step, setStep] = useState(1)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Estado para mostrar/ocultar contraseña
  const password = watch("contrasena")
  const email = watch("email")

  const onSubmit = (data) => {
    addUsuario(data)
    reset()
    setStep(1)
  }

  const addUsuario = (data) => {
    Axios.post("http://localhost:5000/api/auth/register", {
      tipo_doc: data.tipo_doc,
      id_usuario: data.id_usuario,
      nombre: data.nombre,
      apellido: data.apellido,
      ciudad: data.ciudad,
      direccion: data.direccion,
      telefono: data.telefono,
      fecha_nacimiento: data.fecha_nacimiento,
      email: data.email,
      contrasena: data.contrasena,
      id_tipo: data.id_tipo || 1,
      id_rol: data.id_rol || 3,
      isPropietario: true, // Valor por defecto para Propietario
    })
      .then((response) => {
        Swal.fire({
          title: "<strong>Registro exitoso!</strong>",
          html: `<i>El usuario <strong>${data.nombre}</strong> fue registrado con éxito!</i>`,
          icon: "success",
          timer: 3000,
        })

        // Redirigir después de 3 segundos
        setTimeout(() => {
          navigate("/login")
        }, 3000)

        reset()
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "¡Usuario ya registrado!",
          html: `El correo <strong>${data.email}</strong> y el ID <strong>${data.id_usuario}</strong> ya están registrados.`,
          confirmButtonColor: "#d33",
        })
      })
  }
  const nextStep = async () => {
    let isValid = false

    if (step === 1) {
      isValid = await trigger(["tipo_doc", "id_usuario", "nombre", "apellido"])
    } else if (step === 2) {
      isValid = await trigger(["ciudad", "direccion", "telefono", "fecha_nacimiento"])
    } else if (step === 3) {
      isValid = await trigger(["email", "password", "id_tipo", "id_rol"])
    }

    if (isValid) {
      setStep(step + 1)
    }
  }

  const tipoVia = watch("tipoVia")
  const numeroPrincipal = watch("numeroPrincipal")
  const numeroSecundario = watch("numeroSecundario")
  const numeroAdicional = watch("numeroAdicional")

  const letraPrincipal = watch("letraPrincipal")
  const bis = watch("bis")
  const letraBis = watch("letraBis")
  const direccionCardinal = watch("direccionCardinal")
  const letraSecundaria = watch("letraSecundaria")
  const complemento = watch("complemento")

  const tiposVia = ["Carrera", "Calle", "Avenida", "Diagonal", "Transversal", "Circular", "Autopista", "Kilometro"]

  // Función para validar tipo de vía en onChange
  const onChangeTipoVia = async (e) => {
    const value = e.target.value
    setValue("tipoVia", value)
    await trigger("tipoVia")
  }

  const abrirGeneradorDireccion = async () => {
    const { value: formValues } = await Swal.fire({
      title: "<strong>Generar dirección</strong>",
      html: `
        <div style="text-align: left; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: #0a5483; margin-bottom: 15px; font-size: 16px;">Ejemplo</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0a5483;">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; font-size: 14px;">
                <div><strong>Dg:</strong> <span style="color: #e53935;">84*</span></div>
                <div><strong>B</strong></div>
                <div><strong>Bis</strong></div>
                <div><strong>A</strong></div>
                <div><strong>Sur</strong></div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; font-size: 14px;">
                <div><strong>#</strong> <span style="color: #e53935;">8*</span></div>
                <div><strong>B</strong></div>
                <div><strong>-</strong> <span style="color: #e53935;">62*</span></div>
                <div><strong>Este</strong></div>
              </div>
              
             
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Tipo de vía:</label>
              <select id="swal-tipoVia" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Seleccionar</option>
                <option value="Carrera">Carrera</option>
                <option value="Calle">Calle</option>
                <option value="Avenida">Avenida</option>
                <option value="Diagonal">Diagonal</option>
                <option value="Transversal">Transversal</option>
                <option value="Circular">Circular</option>
                <option value="Autopista">Autopista</option>
                <option value="Kilometro">Kilometro</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Número principal:</label>
              <input type="text" id="swal-numeroPrincipal" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="30" maxlength="4">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Letra:</label>
              <input type="text" id="swal-letraPrincipal" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-transform: uppercase;" placeholder="A" maxlength="1">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">BIS:</label>
              <select id="swal-bis" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">No</option>
                <option value="BIS">BIS</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Letra BIS:</label>
              <input type="text" id="swal-letraBis" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-transform: uppercase;" placeholder="A" maxlength="1">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Dirección:</label>
              <select id="swal-direccionCardinal" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Seleccionar</option>
                <option value="NORTE">NORTE</option>
                <option value="SUR">SUR</option>
                <option value="ESTE">ESTE</option>
                <option value="OESTE">OESTE</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Número secundario:</label>
              <input type="text" id="swal-numeroSecundario" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="36" maxlength="4">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Letra secundaria:</label>
              <input type="text" id="swal-letraSecundaria" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-transform: uppercase;" placeholder="E" maxlength="1">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Número terciario:</label>
              <input type="text" id="swal-numeroAdicional" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="35" maxlength="4">
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Complemento:</label>
            <input type="text" id="swal-complemento" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="Apartamento 101, Torre A, etc.">
          </div>
          
          <div style="background: #e8f4fc; padding: 15px; border-radius: 8px; border: 2px solid #0a5483; text-align: center; margin-bottom: 20px;">
            <strong style="color: #0a5483;">Dirección generada:</strong><br>
            <span id="direccion-preview" style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #073e61;"></span>
          </div>
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Limpiar",
      confirmButtonColor: "#0a5483",
      cancelButtonColor: "#6c757d",
      focusConfirm: false,
      didOpen: () => {
        // Función para actualizar la vista previa
        const actualizarPreview = () => {
          const tipoVia = document.getElementById("swal-tipoVia").value
          const numeroPrincipal = document.getElementById("swal-numeroPrincipal").value
          const letraPrincipal = document.getElementById("swal-letraPrincipal").value
          const bis = document.getElementById("swal-bis").value
          const letraBis = document.getElementById("swal-letraBis").value
          const direccionCardinal = document.getElementById("swal-direccionCardinal").value
          const numeroSecundario = document.getElementById("swal-numeroSecundario").value
          const letraSecundaria = document.getElementById("swal-letraSecundaria").value
          const numeroAdicional = document.getElementById("swal-numeroAdicional").value
          const complemento = document.getElementById("swal-complemento").value

          let direccion = ""

          if (tipoVia && numeroPrincipal && numeroSecundario) {
            direccion = tipoVia + " " + numeroPrincipal

            if (letraPrincipal) {
              direccion += " " + letraPrincipal
            }

            if (bis) {
              direccion += " " + bis
            }

            if (letraBis) {
              direccion += " " + letraBis
            }

            if (direccionCardinal) {
              direccion += " " + direccionCardinal
            }

            direccion += " # " + numeroSecundario

            if (letraSecundaria) {
              direccion += " " + letraSecundaria
            }

            if (numeroAdicional) {
              direccion += " - " + numeroAdicional
            }

            if (complemento) {
              direccion += ", " + complemento
            }
          }

          document.getElementById("direccion-preview").textContent = direccion || "Complete los campos obligatorios"
        }

        // Agregar event listeners
        document.getElementById("swal-tipoVia").addEventListener("change", actualizarPreview)
        document.getElementById("swal-numeroPrincipal").addEventListener("input", actualizarPreview)
        document.getElementById("swal-letraPrincipal").addEventListener("input", actualizarPreview)
        document.getElementById("swal-bis").addEventListener("change", actualizarPreview)
        document.getElementById("swal-letraBis").addEventListener("input", actualizarPreview)
        document.getElementById("swal-direccionCardinal").addEventListener("change", actualizarPreview)
        document.getElementById("swal-numeroSecundario").addEventListener("input", actualizarPreview)
        document.getElementById("swal-letraSecundaria").addEventListener("input", actualizarPreview)
        document.getElementById("swal-numeroAdicional").addEventListener("input", actualizarPreview)
        document.getElementById("swal-complemento").addEventListener("input", actualizarPreview)

        // Restricciones de entrada
        document.getElementById("swal-numeroPrincipal").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            (e.key < "0" || e.key > "9")
          ) {
            e.preventDefault()
          }
        })

        document.getElementById("swal-numeroSecundario").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            (e.key < "0" || e.key > "9")
          ) {
            e.preventDefault()
          }
        })

        document.getElementById("swal-numeroAdicional").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            (e.key < "0" || e.key > "9")
          ) {
            e.preventDefault()
          }
        })

        document.getElementById("swal-letraPrincipal").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            !/^[A-Za-z]$/.test(e.key)
          ) {
            e.preventDefault()
          }
        })

        document.getElementById("swal-letraBis").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            !/^[A-Za-z]$/.test(e.key)
          ) {
            e.preventDefault()
          }
        })

        document.getElementById("swal-letraSecundaria").addEventListener("keydown", (e) => {
          if (
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            !/^[A-Za-z]$/.test(e.key)
          ) {
            e.preventDefault()
          }
        })

        // Convertir a mayúsculas automáticamente
        document.getElementById("swal-letraPrincipal").addEventListener("input", (e) => {
          e.target.value = e.target.value.toUpperCase()
          actualizarPreview()
        })

        document.getElementById("swal-letraBis").addEventListener("input", (e) => {
          e.target.value = e.target.value.toUpperCase()
          actualizarPreview()
        })

        document.getElementById("swal-letraSecundaria").addEventListener("input", (e) => {
          e.target.value = e.target.value.toUpperCase()
          actualizarPreview()
        })
      },
      preConfirm: () => {
        const tipoVia = document.getElementById("swal-tipoVia").value;
        const numeroPrincipal = document.getElementById("swal-numeroPrincipal").value;
        const numeroSecundario = document.getElementById("swal-numeroSecundario").value;
        const numeroAdicional = document.getElementById("swal-numeroAdicional").value;
      
        if (!tipoVia || !numeroPrincipal || !numeroSecundario || !numeroAdicional) {
          Swal.showValidationMessage(
            "Por favor complete todos los campos obligatorios: Tipo de vía, Número principal, Número secundario y Número adicional"
          );
          return false;
        }
      
        return {
          tipoVia: tipoVia,
          numeroPrincipal: numeroPrincipal,
          letraPrincipal: document.getElementById("swal-letraPrincipal").value,
          bis: document.getElementById("swal-bis").value,
          letraBis: document.getElementById("swal-letraBis").value,
          direccionCardinal: document.getElementById("swal-direccionCardinal").value,
          numeroSecundario: numeroSecundario,
          letraSecundaria: document.getElementById("swal-letraSecundaria").value,
          numeroAdicional: numeroAdicional,
          complemento: document.getElementById("swal-complemento").value,
        };
      },
    })

    if (formValues) {
      // Generar la dirección
      let direccion = formValues.tipoVia + " " + formValues.numeroPrincipal

      if (formValues.letraPrincipal) {
        direccion += " " + formValues.letraPrincipal
      }

      if (formValues.bis) {
        direccion += " " + formValues.bis
      }

      if (formValues.letraBis) {
        direccion += " " + formValues.letraBis
      }

      if (formValues.direccionCardinal) {
        direccion += " " + formValues.direccionCardinal
      }

      direccion += " # " + formValues.numeroSecundario

      if (formValues.letraSecundaria) {
        direccion += " " + formValues.letraSecundaria
      }

      if (formValues.numeroAdicional) {
        direccion += " - " + formValues.numeroAdicional
      }

      if (formValues.complemento) {
        direccion += ", " + formValues.complemento
      }

      // Actualizar el campo de dirección
      setValue("direccion", direccion)
      trigger("direccion")

      // Mostrar confirmación
    
    }
  }

  return (
    <main className="register-main">
      <div className="iz-side">
        <div className="logo-container">
          <Link to="/">
            <img
              src="https://raw.githubusercontent.com/Vale250910/mascotas_app1/refs/heads/main/img/logo.png"
              alt="Logo de Akeso"
              className="regis-logo"
            />
          </Link>
        </div>
      </div>

      <div className="der-side">
        <div className="register-container">
          <div className="form-container1">
            <div className="form-header1">
              <div className="icon-container1">
                <PawPrint className="icon-paw" />
              </div>
              <h1>{step === 1 ? "Información Personal" : step === 2 ? "Información de Contacto" : "Credenciales"}</h1>
              <p>Paso {step} de 3</p>
            </div>

            <div className="form-body">
              <form onSubmit={handleSubmit(onSubmit)} id="signup-form">
                {/* Paso 1: Información personal */}
                {step === 1 && (
                  <>
                    <div className="form-group">
                      <div className="label-container">
                        <FileText className="icon-small" />
                        <label>Tipo de documento</label>
                      </div>
                      <select {...register("tipo_doc", { required: "El tipo de documento es obligatorio." })}>
                        <option value="">Seleccione un tipo</option>
                        <option value="C.C">C.C</option>
                        <option value="C.E">C.E</option>
                      </select>
                      {errors.tipo_doc && <span className="error-message1">{errors.tipo_doc.message}</span>}
                    </div>

                    <div className="form-group">
                      <div className="label-container">
                        <FileText className="icon-small" />
                        <label>Cédula</label>
                      </div>
                      <input
                        type="text"
                        {...register("id_usuario", {
                          required: "La cédula es obligatoria.",
                          minLength: { value: 7, message: "Mínimo 7 caracteres." },
                          maxLength: { value: 10, message: "Máximo 10 caracteres." },
                          pattern: { value: /^[0-9]+$/, message: "Solo números." },
                        })}
                        onKeyDown={(e) => {
                          // Permitir: teclas de control (backspace, delete, tab, etc.)
                          if (
                            ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                          ) {
                            return
                          }
                          // Prevenir entrada si no es un número
                          if (e.key < "0" || e.key > "9") {
                            e.preventDefault()
                          }
                        }}
                        onPaste={(e) => {
                          // Prevenir pegar texto no numérico
                          const pasteData = e.clipboardData.getData("text/plain")
                          if (!/^\d+$/.test(pasteData)) {
                            e.preventDefault()
                          }
                          else{
                             // Limitar el texto pegado al máximo permitido
                            const currentValue = e.target.value;
                            const remainingChars = 10 - currentValue.length;
                            if (pasteData.length > remainingChars) {
                              e.preventDefault();
                              e.target.value = currentValue + pasteData.substring(0, remainingChars);
                            }
                          }
                        }}
                        placeholder="Escribe tu número de documento"
                        inputMode="numeric" 
                        maxLength={10}// Muestra el teclado numérico en dispositivos móviles
                        
                      />
                      {errors.id_usuario && <span className="error-message1">{errors.id_usuario.message}</span>}
                    </div>

                    <div className="form-group">
                      <div className="label-container">
                        <User className="icon-small" />
                        <label>Nombre</label>
                      </div>
                      <input
                        type="text"
                        {...register("nombre", {
                          required: "El nombre es obligatorio.",
                          minLength: { value: 3, message: "Mínimo 3 caracteres." },
                          maxLength: { value: 30, message: "Máximo 30 caracteres." },
                          pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/, message: "Solo letras y espacios." },
                        })}
                        onKeyDown={(e) => {
                          // Permitir teclas de control
                          if (
                            [
                              "Backspace",
                              "Delete",
                              "Tab",
                              "ArrowLeft",
                              "ArrowRight",
                              "Home",
                              "End",
                              "Space",
                              " ",
                            ].includes(e.key)
                          ) {
                            return
                          }

                          // Permitir letras (incluye acentos cuando se usan combinaciones de teclas)
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault()
                          }
                        }}
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData("text/plain")
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/.test(pasteData)) {
                            e.preventDefault()
                            alert("Solo se permiten letras y espacios")
                          }
                          else{
                            const currentValue = e.target.value;
                            const remainingChars = 30 - currentValue.length;
                            if (pasteData.length > remainingChars) {
                              e.preventDefault();
                              e.target.value = currentValue + pasteData.substring(0, remainingChars).toUpperCase();
                            } else {
                              e.target.value = currentValue + pasteData.toUpperCase();
                            }
                          }
                        }}
                        placeholder="Escribe tu primer nombre"
                        maxLength={30}
                      />
                      {errors.nombre && <span className="error-message1">{errors.nombre.message}</span>}
                    </div>

                    <div className="form-group">
                      <div className="label-container">
                        <User className="icon-small" />
                        <label>Apellido</label>
                      </div>
                      <input
                        type="text"
                        {...register("apellido", {
                          required: "El apellido es obligatorio.",
                          minLength: { value: 3, message: "Mínimo 3 caracteres." },
                          maxLength: { value: 30, message: "Máximo 20 caracteres." },
                          pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/, message: "Solo letras y espacios." },
                        })}
                        onKeyDown={(e) => {
                          // Permitir teclas de control
                          if (
                            [
                              "Backspace",
                              "Delete",
                              "Tab",
                              "ArrowLeft",
                              "ArrowRight",
                              "Home",
                              "End",
                              "Space",
                              " ",
                            ].includes(e.key)
                          ) {
                            return
                          }

                          // Permitir letras (incluye acentos cuando se usan combinaciones de teclas)
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault()
                          }
                        }}
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData("text/plain")
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/.test(pasteData)) {
                            e.preventDefault()
                            alert("Solo se permiten letras y espacios")
                          }
                          else{
                            const currentValue = e.target.value;
                            const remainingChars = 30 - currentValue.length;
                            if (pasteData.length > remainingChars) {
                              e.preventDefault();
                              e.target.value = currentValue + pasteData.substring(0, remainingChars).toUpperCase();
                            } else {
                              e.target.value = currentValue + pasteData.toUpperCase();
                            }
                          }
                        }}
                        placeholder="Escribe tu primer apellido"
                        maxLength={30}
                      />
                      {errors.apellido && <span className="error-message1">{errors.apellido.message}</span>}
                    </div>
                  </>
                )}

                {/* Paso 2: Contacto */}
                {step === 2 && (
                  <>
                    <div className="form-group">
                      <div className="label-container">
                        <Building className="icon-small" />
                        <label>Ciudad</label>
                      </div>
                      <input
                        type="text"
                        {...register("ciudad", {
                          required: "La ciudad es obligatoria.",
                          pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/, message: "Solo letras y espacios." },
                          minLength: { value: 5, message: "Mínimo 5 caracteres." },
                          maxLength: { value: 50, message: "Máximo 50 caracteres." },
                        })}
                        onKeyDown={(e) => {
                          // Permitir teclas de control
                          if (
                            [
                              "Backspace",
                              "Delete",
                              "Tab",
                              "ArrowLeft",
                              "ArrowRight",
                              "Home",
                              "End",
                              "Space",
                              " ",
                            ].includes(e.key)
                          ) {
                            return
                          }

                          // Permitir letras (incluye acentos cuando se usan combinaciones de teclas)
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault()
                          }
                        }}
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData("text/plain")
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$/.test(pasteData)) {
                            e.preventDefault()
                            alert("Solo se permiten letras y espacios")
                          }
                          else{
                            const currentValue = e.target.value;
                            const remainingChars = 50 - currentValue.length;
                            if (pasteData.length > remainingChars) {
                              e.preventDefault();
                              e.target.value = currentValue + pasteData.substring(0, remainingChars).toUpperCase();
                            } else {
                              e.target.value = currentValue + pasteData.toUpperCase();
                            }
                          }
                        }}
                        placeholder="Escribe tu ciudad de residencia"
                        maxLength={50}
                      />
                      {errors.ciudad && <span className="error-message1">{errors.ciudad.message}</span>}
                    </div>

                    {/* Campo de dirección con botón para abrir modal */}
                      <div className="form-group">
                          <div className="label-container">
                            <Home className="icon-small" />
                            <label>
                              Dirección de residencia<span className="required-mark">*</span>
                            </label>
                          </div>
                          <div style={{ position: "relative", display: "flex" }}>
                            <input
                              type="text"
                              {...register("direccion", {
                                required: "La dirección es obligatoria.",
                                minLength: { value: 10, message: "Mínimo 10 caracteres." },
                                maxLength: { value: 70, message: "Máximo 70 caracteres." },
                                validate: {
                                  hasThreeNumbers: (value) => {
                                    const numberCount = (value.match(/\d+/g) || []).length;
                                    return numberCount >= 3 || "La dirección debe contener al menos 3 números";
                                  },
                                  validFormat: (value) => {
                                    const trimmedValue = value.trim();
                                    const hasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(trimmedValue);
                                    const hasNumber = /[0-9]/.test(trimmedValue);
                                    return (
                                      (hasLetter && hasNumber) ||
                                      "La dirección debe contener al menos una letra y un número"
                                    );
                                  },
                                },
                              })}
                              placeholder="Haz clic en Validar para ingresar tu dirección"
                              style={{ paddingRight: "90px" }}
                              readOnly // Hace que el campo sea de solo lectura
                            />
                            <button
                              type="button"
                              onClick={abrirGeneradorDireccion}
                              style={{
                                position: "absolute",
                                right: "0",
                                top: "0",
                                height: "100%",
                                padding: "0 15px",
                                backgroundColor: "#0a5483",
                                color: "white",
                                border: "none",
                                borderTopRightRadius: "8px",
                                borderBottomRightRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "14px",
                                transition: "background-color 0.2s",
                              }}
                              onMouseOver={(e) => (e.target.style.backgroundColor = "#073e61")}
                              onMouseOut={(e) => (e.target.style.backgroundColor = "#0a5483")}
                            >
                              Validar
                            </button>
                          </div>
                          {errors.direccion && <span className="error-message1">{errors.direccion.message}</span>}
                    </div>

                    <div className="form-group">
                      <div className="label-container">
                        <Phone className="icon-small" />
                        <label>Teléfono</label>
                      </div>
                      <input
                        type="tel"
                        {...register("telefono", {
                          required: "El teléfono es obligatorio.",
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: "Solo se admiten números y debe tener 10 dígitos.",
                          },
                        })}
                        onKeyDown={(e) => {
                          // Permitir: teclas de control (backspace, delete, tab, etc.)
                          if (
                            ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                          ) {
                            return
                          }
                          // Prevenir entrada si no es un número
                          if (e.key < "0" || e.key > "9") {
                            e.preventDefault()
                          }
                        }}
                        onPaste={(e) => {
                          // Prevenir pegar texto no numérico
                          const pasteData = e.clipboardData.getData("text/plain")
                          if (!/^\d+$/.test(pasteData)) {
                            e.preventDefault()
                          }
                          else{
                            const currentValue = e.target.value;
                            const remainingChars = 50 - currentValue.length;
                            if (pasteData.length > remainingChars) {
                              e.preventDefault();
                              e.target.value = currentValue + pasteData.substring(0, remainingChars).toUpperCase();
                            } else {
                              e.target.value = currentValue + pasteData.toUpperCase();
                            }
                          }
                        }}
                        placeholder="Escribe tu teléfono"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      {errors.telefono && <span className="error-message1">{errors.telefono.message}</span>}
                    </div>

                    <div className="form-group">
                      <div className="label-container">
                        <Calendar className="icon-small" />
                        <label>Fecha de nacimiento</label>
                      </div>
                      <input
                        type="date"
                        {...register("fecha_nacimiento", {
                          required: "La fecha de nacimiento es obligatoria.",
                          validate: (value) => {
                            const fecha_nacimiento = new Date(value)
                            const hoy = new Date()
                            let edad = hoy.getFullYear() - fecha_nacimiento.getFullYear()
                            const mes = hoy.getMonth() - fecha_nacimiento.getMonth()
                            if (mes < 0 || (mes === 0 && hoy.getDate() < fecha_nacimiento.getDate())) {
                              edad--
                            }
                            return edad >= 18 || "Debes ser mayor de 18 años."
                          },
                        })}
                      />
                      {errors.fecha_nacimiento && (
                        <span className="error-message1">{errors.fecha_nacimiento.message}</span>
                      )}
                    </div>
                  </>
                )}

                {/* Paso 3: Credenciales */}
                {step === 3 && (
                  <>
                    <div className="form-group">
                      <div className="label-container">
                        <AtSign className="icon-small" />
                        <label>Correo electrónico</label>
                      </div>
                      <input
                        type="email"
                        {...register("email", {
                          required: "El email es obligatorio",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Email inválido",
                          },
                        })}
                        placeholder="tu@correo.com"
                      />
                      {errors.email && <span className="error-message1">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <div className="label-container">
                        <Lock className="icon-small" />
                        <label>Contraseña</label>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register("contrasena", {
                            required: "La contraseña es obligatoria",
                            pattern: {
                              value:
                                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?])(?!.*\s).{8,}$/,
                              message: "Debe tener mayúscula, minúscula, número, carácter especial y sin espacios",
                            },
                          })}
                          onPaste={(e) => {
                            e.preventDefault()
                            return false
                          }}
                          placeholder="Crea una contraseña segura"
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "16px",
                            transform: "translateY(-50%)",
                            color: "#99a3a4",
                            fontSize: "18px",
                            cursor: "pointer",
                            zIndex: 2,
                          }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </div>
                      {errors.contrasena && <span className="error-message1">{errors.contrasena.message}</span>}

                      {/* Campo para confirmar contraseña */}
                      <div className="label-container" style={{ marginTop: "16px" }}>
                        <Lock className="icon-small" />
                        <label>Confirmar Contraseña</label>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmarContrasena", {
                            required: "Por favor confirma tu contraseña",
                            pattern: {
                              value:
                                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?])(?!.*\s).{8,}$/,
                              message: "Debe tener mayúscula, minúscula, número, carácter especial y sin espacios",
                            },
                            validate: (value) => value === getValues("contrasena") || "Las contraseñas no coinciden",
                          })}
                          onPaste={(e) => {
                            e.preventDefault()
                            return false
                          }}
                          placeholder="Repite tu contraseña"
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "16px",
                            transform: "translateY(-50%)",
                            color: "#99a3a4",
                            fontSize: "18px",
                            cursor: "pointer",
                            zIndex: 2,
                          }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </div>
                      {errors.confirmarContrasena && (
                        <span className="error-message1">{errors.confirmarContrasena.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <select
                        {...register("id_tipo", { required: "El tipo de usuario es obligatorio." })}
                        defaultValue="1"
                        style={{ display: "none" }}
                      >
                        <option value="">Seleccione un tipo</option>
                        <option value="1">Invitado/Tutor</option>
                        <option value="2">Medico</option>
                        <option value="3">Auxiliar Veterinario</option>
                        <option value="4">Administrativo</option>
                      </select>
                      {errors.id_tipo && <span className="error-message1">{errors.id_tipo.message}</span>}
                    </div>
                    <div className="form-group">
                      <select
                        {...register("id_rol", { required: "El tipo de usuario es obligatorio." })}
                        defaultValue="3"
                        style={{ display: "none" }}
                      >
                        <option value="">Seleccione un tipo</option>
                        <option value="1">Administrador</option>
                        <option value="2">Veterinario</option>
                        <option value="3">Propietario</option>
                      </select>
                      {errors.id_rol && <span className="error-message1">{errors.id_rol.message}</span>}
                    </div>
                    <input type="hidden" {...register("isPropietario")} value="true" />
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="terms"
                        {...register("terms", { required: "Debes aceptar los términos y condiciones" })}
                      />
                      <label htmlFor="terms">Acepto los términos y condiciones</label>
                      {errors.terms && <span className="error-message1">{errors.terms.message}</span>}
                    </div>
                  </>
                )}
              </form>
            </div>

            <div className="form-footer">
              <div className="button-container">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="button button-prev">
                    Anterior
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={nextStep} className="button button-next">
                    Siguiente
                  </button>
                ) : (
                  <button type="submit" form="signup-form" className="button button-submit">
                    Crear cuenta
                  </button>
                )}
              </div>
              <p className="login-link">
                ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

