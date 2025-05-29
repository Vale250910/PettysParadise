const express = require("express")
const router = express.Router()
const pool = require("../db/conexion")
const authenticateToken = require("../middlewares/authenticateToken")
const bcrypt = require("bcrypt")

// Middleware para verificar que el usuario es administrador
const verificarAdmin = async (req, res, next) => {
  let connection
  try {
    const userId = req.user.id_usuario
    connection = await pool.getConnection()

    const [userRows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (userRows.length === 0 || userRows[0].id_rol !== 1) {
      return res.status(403).json({ success: false, message: "Acceso denegado: se requiere rol de administrador" })
    }

    next()
  } catch (error) {
    console.error("Error verificando admin:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Endpoint para verificar si un usuario es propietario
 */
router.get("/verificar-propietario", authenticateToken, async (req, res) => {
  let connection
  try {
    const userId = req.user.id_usuario

    connection = await pool.getConnection()

    // Primero verificar el rol del usuario
    const [userRows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (userRows.length === 0) {
      return res.sendStatus(403) // Usuario no encontrado
    }

    // Si el usuario no tiene rol de propietario (id_rol = 3), denegar acceso
    if (userRows[0].id_rol !== 3) {
      return res.sendStatus(403) // No es propietario por rol
    }

    // Usar el procedimiento almacenado VerificarSiEsPropietario
    const [rows] = await connection.query("CALL VerificarSiEsPropietario(?)", [userId])
    const resultado = rows[0][0].resultado

    if (resultado === "ES_PROPIETARIO") {
      res.sendStatus(200) // ✅ Es propietario
    } else {
      res.sendStatus(403) // ❌ No es propietario
    }
  } catch (err) {
    console.error("Error al verificar propietario:", err)
    return res.status(500).json({ message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Endpoint para verificar si un usuario es administrador
 */
router.get("/verificar-administrador", authenticateToken, async (req, res) => {
  let connection
  try {
    const userId = req.user.id_usuario

    connection = await pool.getConnection()

    // Consultar si el usuario es administrador
    const [rows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "Usuario no encontrado" })
    }

    const userRole = rows[0].id_rol

    if (userRole === 1) {
      // 1 es el id_rol para administradores según tu base de datos
      res.status(200).json({ success: true, message: "Usuario autorizado como administrador" })
    } else {
      res.status(403).json({ success: false, message: "No es administrador" })
    }
  } catch (err) {
    console.error("Error al verificar administrador:", err)
    return res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Obtener estadísticas del dashboard
 */
router.get("/dashboard/stats", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    console.log("📊 Obteniendo estadísticas del dashboard...")
    connection = await pool.getConnection()

    // Contar usuarios (excluyendo administradores)
    const [usuariosCount] = await connection.query("SELECT COUNT(*) as total FROM usuarios WHERE id_rol != 1")
    console.log("👥 Usuarios encontrados:", usuariosCount[0].total)

    // Contar veterinarios (rol 2)
    const [veterinariosCount] = await connection.query("SELECT COUNT(*) as total FROM usuarios WHERE id_rol = 2")
    console.log("🩺 Veterinarios encontrados:", veterinariosCount[0].total)

    // Contar mascotas
    const [mascotasCount] = await connection.query("SELECT COUNT(*) as total FROM mascotas")
    console.log("🐕 Mascotas encontradas:", mascotasCount[0].total)

    // Contar servicios
    const [serviciosCount] = await connection.query("SELECT COUNT(*) as total FROM servicios")
    console.log("🛠️ Servicios encontrados:", serviciosCount[0].total)

    const stats = {
      totalUsuarios: usuariosCount[0].total,
      veterinariosActivos: veterinariosCount[0].total,
      totalMascotas: mascotasCount[0].total,
      totalServicios: serviciosCount[0].total,
    }

    console.log("📈 Estadísticas finales:", stats)

    res.json({
      success: true,
      stats: stats,
    })
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error)
    res.status(500).json({ success: false, message: "Error del servidor", error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// ==================== GESTIÓN DE USUARIOS ====================

/**
 * Obtener todos los usuarios (excepto administradores) - CORREGIDO
 */
router.get("/usuarios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    console.log("📋 Obteniendo lista de usuarios...")
    connection = await pool.getConnection()

    const [usuarios] = await connection.query(`
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.id_rol,
        u.telefono,
        u.ciudad,
        u.cuenta_bloqueada,
        COALESCE(u.fecha_registro, NOW()) as fecha_registro,
        CASE 
          WHEN u.id_rol = 1 THEN 'Administrador'
          WHEN u.id_rol = 2 THEN 'Veterinario'
          WHEN u.id_rol = 3 THEN 'Propietario'
          ELSE 'Sin rol'
        END as nombre_rol,
        v.especialidad,
        v.horario
      FROM usuarios u 
      LEFT JOIN veterinarios v ON u.id_usuario = v.id_vet
      WHERE u.id_rol != 1 
      ORDER BY u.id_usuario DESC
    `)

    console.log(`✅ ${usuarios.length} usuarios encontrados`)
    res.json({ success: true, usuarios })
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Crear nuevo usuario - CORREGIDO COMPLETAMENTE
 */
router.post("/usuarios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const {
      id_usuario,
      tipo_doc,
      nombre,
      apellido,
      ciudad,
      direccion,
      telefono,
      fecha_nacimiento,
      email,
      password,
      id_rol,
      especialidad,
      horario,
    } = req.body

    // Validaciones
    if (!id_usuario || !nombre || !apellido || !email || !password || !id_rol) {
      return res.status(400).json({
        success: false,
        message: "Los campos id_usuario, nombre, apellido, email, password y rol son requeridos",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres" })
    }

    // Validaciones específicas para veterinarios
    if (id_rol == 2 && (!especialidad || !horario)) {
      return res
        .status(400)
        .json({ success: false, message: "Especialidad y horario son requeridos para veterinarios" })
    }

    connection = await pool.getConnection()
    await connection.beginTransaction()

    // Verificar si el ID de usuario ya existe
    const [existingUserId] = await connection.query("SELECT id_usuario FROM usuarios WHERE id_usuario = ?", [
      id_usuario,
    ])

    if (existingUserId.length > 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: "El número de documento ya está registrado" })
    }

    // Verificar si el email ya existe
    const [existingUser] = await connection.query("SELECT id_usuario FROM usuarios WHERE email = ?", [email])

    if (existingUser.length > 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: "El email ya está registrado" })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar usuario - QUERY CORREGIDA
    const insertQuery = `
      INSERT INTO usuarios (
        id_usuario, tipo_doc, nombre, apellido, ciudad, direccion, telefono,
        fecha_nacimiento, email, contrasena, id_tipo, id_rol, fecha_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const params = [
      id_usuario,
      tipo_doc || "C.C",
      nombre,
      apellido,
      ciudad || "No especificada",
      direccion || "No especificada",
      telefono || "No especificado",
      fecha_nacimiento || "1990-01-01",
      email,
      hashedPassword,
      id_rol, // id_tipo = id_rol
      id_rol,
    ]

    await connection.query(insertQuery, params)

    // Si es veterinario, crear registro en tabla veterinarios
    if (id_rol == 2) {
      await connection.query("INSERT INTO veterinarios (id_vet, especialidad, horario) VALUES (?, ?, ?)", [
        id_usuario,
        especialidad,
        horario,
      ])
    }

    await connection.commit()

    console.log(`✅ Usuario creado: ${nombre} ${apellido} (ID: ${id_usuario})`)
    res.json({ success: true, message: "Usuario creado exitosamente", id: id_usuario })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("❌ Error al crear usuario:", error)
    res.status(500).json({ success: false, message: "Error del servidor: " + error.message })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Actualizar usuario - MEJORADO PARA VETERINARIOS
 */
router.put("/usuarios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const userId = req.params.id
    const { nombre, apellido, email, telefono, ciudad, direccion, id_rol, especialidad, horario } = req.body

    connection = await pool.getConnection()
    await connection.beginTransaction()

    // Verificar que el usuario existe y no es administrador
    const [userCheck] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (userCheck.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }

    if (userCheck[0].id_rol === 1) {
      await connection.rollback()
      return res.status(403).json({ success: false, message: "No se puede editar un administrador" })
    }

    // Verificar email único (excluyendo el usuario actual)
    const [emailCheck] = await connection.query("SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?", [
      email,
      userId,
    ])

    if (emailCheck.length > 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: "El email ya está en uso por otro usuario" })
    }

    // Actualizar usuario
    await connection.query(
      `
      UPDATE usuarios 
      SET nombre = ?, apellido = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, id_rol = ?, id_tipo = ?
      WHERE id_usuario = ?
    `,
      [
        nombre,
        apellido,
        email,
        telefono || "No especificado",
        ciudad || "No especificada",
        direccion || "No especificada",
        id_rol,
        id_rol,
        userId,
      ],
    )

    // Manejar datos de veterinario
    if (id_rol == 2) {
      // Verificar si ya existe registro de veterinario
      const [vetCheck] = await connection.query("SELECT id_vet FROM veterinarios WHERE id_vet = ?", [userId])

      if (vetCheck.length > 0) {
        // Actualizar registro existente
        await connection.query("UPDATE veterinarios SET especialidad = ?, horario = ? WHERE id_vet = ?", [
          especialidad,
          horario,
          userId,
        ])
      } else {
        // Crear nuevo registro
        await connection.query("INSERT INTO veterinarios (id_vet, especialidad, horario) VALUES (?, ?, ?)", [
          userId,
          especialidad,
          horario,
        ])
      }
    } else {
      // Si cambió de veterinario a otro rol, eliminar registro de veterinarios
      await connection.query("DELETE FROM veterinarios WHERE id_vet = ?", [userId])
    }

    await connection.commit()

    console.log(`✅ Usuario actualizado: ${nombre} ${apellido} (ID: ${userId})`)
    res.json({ success: true, message: "Usuario actualizado exitosamente" })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("❌ Error al actualizar usuario:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Cambiar estado de usuario (activar/desactivar) - MEJORADO
 */
router.patch("/usuarios/:id/toggle-status", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const userId = req.params.id

    connection = await pool.getConnection()

    // Verificar que el usuario existe y no es administrador
    const [userCheck] = await connection.query(
      "SELECT id_rol, cuenta_bloqueada, nombre, apellido FROM usuarios WHERE id_usuario = ?",
      [userId],
    )

    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }

    if (userCheck[0].id_rol === 1) {
      return res.status(403).json({ success: false, message: "No se puede cambiar el estado de un administrador" })
    }

    // Cambiar estado usando cuenta_bloqueada (invertir lógica)
    const nuevoEstado = userCheck[0].cuenta_bloqueada === 1 ? 0 : 1
    await connection.query("UPDATE usuarios SET cuenta_bloqueada = ? WHERE id_usuario = ?", [nuevoEstado, userId])

    const estadoTexto = nuevoEstado === 0 ? "activado" : "desactivado"
    const nombreCompleto = `${userCheck[0].nombre} ${userCheck[0].apellido}`

    console.log(`✅ Usuario ${estadoTexto}: ${nombreCompleto} (ID: ${userId})`)
    res.json({
      success: true,
      message: `Usuario ${nombreCompleto} ${estadoTexto} exitosamente`,
      bloqueado: nuevoEstado === 1,
    })
  } catch (error) {
    console.error("❌ Error al cambiar estado:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Eliminar usuario - CON MANEJO DE FOREIGN KEYS
 */
router.delete("/usuarios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const userId = req.params.id

    connection = await pool.getConnection()

    // Verificar que el usuario existe y no es administrador
    const [userCheck] = await connection.query("SELECT id_rol, nombre, apellido FROM usuarios WHERE id_usuario = ?", [
      userId,
    ])

    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }

    if (userCheck[0].id_rol === 1) {
      return res.status(403).json({ success: false, message: "No se puede eliminar un administrador" })
    }

    // Verificar si tiene registros relacionados
    const [propietarioCheck] = await connection.query("SELECT COUNT(*) as count FROM propietarios WHERE id_pro = ?", [
      userId,
    ])
    const [veterinarioCheck] = await connection.query("SELECT COUNT(*) as count FROM veterinarios WHERE id_vet = ?", [
      userId,
    ])

    if (propietarioCheck[0].count > 0 || veterinarioCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el usuario porque tiene registros relacionados (mascotas, citas, etc.). Considere desactivarlo en su lugar.",
      })
    }

    // Eliminar usuario
    await connection.query("DELETE FROM usuarios WHERE id_usuario = ?", [userId])

    console.log(`✅ Usuario eliminado: ${userCheck[0].nombre} ${userCheck[0].apellido} (ID: ${userId})`)
    res.json({ success: true, message: "Usuario eliminado exitosamente" })
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      res.status(400).json({
        success: false,
        message: "No se puede eliminar el usuario porque tiene registros relacionados. Desactívelo en su lugar.",
      })
    } else {
      res.status(500).json({ success: false, message: "Error del servidor" })
    }
  } finally {
    if (connection) connection.release()
  }
})

// ==================== GESTIÓN DE ROLES ====================

/**
 * Obtener todos los roles - FUNCIONAL
 */
router.get("/roles", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    console.log("📋 Obteniendo lista de roles...")
    connection = await pool.getConnection()

    const [roles] = await connection.query(`
      SELECT 
        r.id_rol,
        r.rol as nombre_rol,
        COUNT(u.id_usuario) as total_usuarios
      FROM rol r
      LEFT JOIN usuarios u ON r.id_rol = u.id_rol
      GROUP BY r.id_rol, r.rol
      ORDER BY r.id_rol
    `)

    console.log(`✅ ${roles.length} roles encontrados`)
    res.json({ success: true, roles })
  } catch (error) {
    console.error("❌ Error al obtener roles:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Obtener usuarios por rol específico
 */
router.get("/roles/:id/usuarios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const rolId = req.params.id
    console.log(`📋 Obteniendo usuarios del rol ${rolId}...`)

    connection = await pool.getConnection()

    const [usuarios] = await connection.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.cuenta_bloqueada,
        u.fecha_registro,
        CASE 
          WHEN u.id_rol = 1 THEN 'Administrador'
          WHEN u.id_rol = 2 THEN 'Veterinario'
          WHEN u.id_rol = 3 THEN 'Propietario'
          ELSE 'Sin rol'
        END as nombre_rol
      FROM usuarios u 
      WHERE u.id_rol = ?
      ORDER BY u.id_usuario DESC
    `,
      [rolId],
    )

    console.log(`✅ ${usuarios.length} usuarios encontrados para el rol ${rolId}`)
    res.json({ success: true, usuarios })
  } catch (error) {
    console.error("❌ Error al obtener usuarios por rol:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

// ==================== GESTIÓN DE SERVICIOS ====================

/**
 * Obtener todos los servicios - FUNCIONAL
 */
router.get("/servicios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    console.log("📋 Obteniendo lista de servicios...")
    connection = await pool.getConnection()

    const [servicios] = await connection.query(`
      SELECT 
        cod_ser as id_servicio,
        nom_ser as nombre,
        descrip_ser as descripcion,
        precio,
        1 as activo,
        NOW() as fecha_creacion
      FROM servicios 
      ORDER BY cod_ser
    `)

    console.log(`✅ ${servicios.length} servicios encontrados`)
    res.json({ success: true, servicios })
  } catch (error) {
    console.error("❌ Error al obtener servicios:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Crear nuevo servicio - FUNCIONAL
 */
router.post("/servicios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const { nombre, descripcion, precio } = req.body

    // Validaciones
    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ success: false, message: "Todos los campos son requeridos" })
    }

    if (precio <= 0) {
      return res.status(400).json({ success: false, message: "El precio debe ser mayor a 0" })
    }

    connection = await pool.getConnection()

    // Insertar servicio
    const [result] = await connection.query(
      `
      INSERT INTO servicios (nom_ser, descrip_ser, precio) 
      VALUES (?, ?, ?)
    `,
      [nombre, descripcion, precio],
    )

    console.log(`✅ Servicio creado: ${nombre} (ID: ${result.insertId})`)
    res.json({ success: true, message: "Servicio creado exitosamente", id: result.insertId })
  } catch (error) {
    console.error("❌ Error al crear servicio:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Actualizar servicio - FUNCIONAL
 */
router.put("/servicios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const servicioId = req.params.id
    const { nombre, descripcion, precio } = req.body

    connection = await pool.getConnection()

    // Verificar que el servicio existe
    const [serviceCheck] = await connection.query("SELECT cod_ser FROM servicios WHERE cod_ser = ?", [servicioId])

    if (serviceCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" })
    }

    // Actualizar servicio
    await connection.query(
      `
      UPDATE servicios 
      SET nom_ser = ?, descrip_ser = ?, precio = ? 
      WHERE cod_ser = ?
    `,
      [nombre, descripcion, precio, servicioId],
    )

    console.log(`✅ Servicio actualizado: ${nombre} (ID: ${servicioId})`)
    res.json({ success: true, message: "Servicio actualizado exitosamente" })
  } catch (error) {
    console.error("❌ Error al actualizar servicio:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Eliminar servicio - FUNCIONAL
 */
router.delete("/servicios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const servicioId = req.params.id

    connection = await pool.getConnection()

    // Verificar que el servicio existe
    const [serviceCheck] = await connection.query("SELECT nom_ser FROM servicios WHERE cod_ser = ?", [servicioId])

    if (serviceCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" })
    }

    // Verificar si tiene citas relacionadas
    const [citasCheck] = await connection.query("SELECT COUNT(*) as count FROM citas WHERE cod_ser = ?", [servicioId])

    if (citasCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el servicio porque tiene citas programadas.",
      })
    }

    // Eliminar servicio
    await connection.query("DELETE FROM servicios WHERE cod_ser = ?", [servicioId])

    console.log(`✅ Servicio eliminado: ${serviceCheck[0].nom_ser} (ID: ${servicioId})`)
    res.json({ success: true, message: "Servicio eliminado exitosamente" })
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

module.exports = router
