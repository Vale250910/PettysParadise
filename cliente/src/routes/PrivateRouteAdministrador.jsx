"use client"

import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import Loading from "../pages/Loading"
import axios from "axios"

const PrivateRouteAdministrador = () => {
  const [loading, setLoading] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    let isMounted = true

    const verificarAdministrador = async () => {
      try {
        const token = localStorage.getItem("token")
        const userStr = localStorage.getItem("user")
        
        if (!token || !userStr) {
          console.log("❌ No hay token o usuario en localStorage")
          if (isMounted) setAutorizado(false)
          return
        }

        const user = JSON.parse(userStr)
        console.log("Usuario parseado:", user)

        // Verificación rápida del rol en el frontend primero
        if (user.id_rol !== 1) {
          console.log("❌ Usuario no es administrador (frontend check)")
          if (isMounted) setAutorizado(false)
          return
        }

        console.log("✅ Usuario parece administrador, verificando con backend...")
        
        try {
          const response = await axios.get(
            "http://localhost:5000/api/roles/verificar-administrador", 
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            }
          )

          console.log("Respuesta del servidor:", response.data)
          if (isMounted) setAutorizado(response.data.success)
        } catch (error) {
          console.error("Error en verificación:", error.response?.data || error.message)
          if (isMounted) setAutorizado(false)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verificarAdministrador()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <Loading fullPage={true} />

  return autorizado ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRouteAdministrador
