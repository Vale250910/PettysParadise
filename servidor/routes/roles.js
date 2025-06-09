// vale250910/pettysparadise/PettysParadise-master/servidor/routes/roles.js
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
    const [userRows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (userRows.length === 0) {
      return res.sendStatus(403) 
    }
    if (userRows[0].id_rol !== 3) {
      return res.sendStatus(403) 
    }

    const [rows] = await connection.query("CALL VerificarSiEsPropietario(?)", [userId])
    const resultado = rows[0][0].resultado

    if (resultado === "ES_PROPIETARIO") {
      res.sendStatus(200)
    } else {
      res.sendStatus(403)
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
    const [rows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])

    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "Usuario no encontrado" })
    }

    const userRole = rows[0].id_rol
    if (userRole === 1) {
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
 * Endpoint para verificar si un usuario es veterinario
 */
router.get("/verificar-veterinario", authenticateToken, async (req, res) => {
  // El middleware authenticateToken ya habrá poblado req.user si el token es válido
  // y este contiene id_rol.
  if (req.user && req.user.id_rol === 2) { // 2 es el id_rol para Veterinario
    res.status(200).json({ success: true, message: "Usuario autorizado como veterinario" });
  } else {
    // Opcional: Log para depuración en el servidor si la verificación falla
    console.log("Intento de acceso a /verificar-veterinario fallido. Rol del usuario:", req.user ? req.user.id_rol : "No hay usuario en req");
    res.status(403).json({ success: false, message: "Acceso denegado: se requiere rol de veterinario" });
  }
});

// OBTENER TODOS LOS PROPIETARIOS (NUEVO)
router.get("/propietarios", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    // Usamos el procedimiento que ya existe
    const [rows] = await connection.query("CALL ObtenerPropietarios()");
    res.json({ success: true, propietarios: rows[0] });
  } catch (error) {
    console.error("Error al obtener propietarios:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

/**
 * Obtener estadísticas del dashboard
 */
router.get("/dashboard/stats", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    console.log("📊 Obteniendo estadísticas del dashboard...")
    connection = await pool.getConnection()
    const [usuariosCount] = await connection.query("SELECT COUNT(*) as total FROM usuarios WHERE id_rol != 1")
    const [veterinariosCount] = await connection.query("SELECT COUNT(*) as total FROM usuarios WHERE id_rol = 2")
    const [mascotasCount] = await connection.query("SELECT COUNT(*) as total FROM mascotas")
    const [serviciosCount] = await connection.query("SELECT COUNT(*) as total FROM servicios")

    const stats = {
      totalUsuarios: usuariosCount[0].total,
      veterinariosActivos: veterinariosCount[0].total,
      totalMascotas: mascotasCount[0].total,
      totalServicios: serviciosCount[0].total,
    }
    res.json({ success: true, stats: stats })
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error)
    res.status(500).json({ success: false, message: "Error del servidor", error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// ==================== GESTIÓN DE USUARIOS ====================

/**
 * Obtener todos los usuarios (excepto administradores)
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
        u.id_tipo,
        u.tipo_doc,
        u.telefono,
        u.ciudad,
        u.direccion,
        u.fecha_nacimiento,
        u.cuenta_bloqueada,
        u.fecha_registro, -- Tomar directamente de la BD
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
      ORDER BY u.fecha_registro DESC, u.id_usuario DESC
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
 * Crear nuevo usuario
 */
router.post("/usuarios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const {
      id_usuario, tipo_doc, nombre, apellido, ciudad, direccion, telefono,
      fecha_nacimiento, email, password, id_rol, especialidad, horario,
    } = req.body

    if (!id_usuario || !tipo_doc || !nombre || !apellido || !email || !password || !id_rol || !fecha_nacimiento || !ciudad || !direccion || !telefono) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos marcados con * son requeridos.",
      })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 8 caracteres" })
    }
    if (id_rol == 2 && (!especialidad || !horario)) {
      return res.status(400).json({ success: false, message: "Especialidad y horario son requeridos para veterinarios" })
    }

    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [existingUserId] = await connection.query("SELECT id_usuario FROM usuarios WHERE id_usuario = ?", [id_usuario])
    if (existingUserId.length > 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: "El número de documento ya está registrado" })
    }

    const [existingUser] = await connection.query("SELECT id_usuario FROM usuarios WHERE email = ?", [email])
    if (existingUser.length > 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: "El email ya está registrado" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    let id_tipo_asignado;
    if (id_rol === 3) id_tipo_asignado = 1;
    else if (id_rol === 2) id_tipo_asignado = 2;
    else id_tipo_asignado = 1; // Por defecto o manejar error

    // `fecha_registro` se insertará con DEFAULT CURRENT_TIMESTAMP
    const insertQuery = `
      INSERT INTO usuarios (
        id_usuario, tipo_doc, nombre, apellido, ciudad, direccion, telefono,
        fecha_nacimiento, email, contrasena, id_tipo, id_rol, 
        activo, intentos_fallidos, cuenta_bloqueada 
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0)
    `
    const params = [
      id_usuario, tipo_doc, nombre, apellido, ciudad, direccion, telefono,
      fecha_nacimiento, email, hashedPassword, id_tipo_asignado, id_rol,
    ]
    await connection.query(insertQuery, params)

    if (id_rol == 2) {
      await connection.query("INSERT INTO veterinarios (id_vet, especialidad, horario) VALUES (?, ?, ?)", [id_usuario, especialidad, horario])
    }
    if (id_rol == 3) {
      const [existingPropietario] = await connection.query("SELECT id_pro FROM propietarios WHERE id_pro = ?", [id_usuario]);
      if (existingPropietario.length === 0) {
          await connection.query("INSERT INTO propietarios (id_pro) VALUES (?)", [id_usuario]);
      }
    }

    await connection.commit()
    console.log(`✅ Usuario creado: ${nombre} ${apellido} (ID: ${id_usuario}), Rol: ${id_rol}, Tipo: ${id_tipo_asignado}`)
    res.status(201).json({ success: true, message: "Usuario creado exitosamente", id: id_usuario })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("❌ Error al crear usuario:", error)
    res.status(500).json({ success: false, message: "Error del servidor: " + error.message, error: error })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Actualizar usuario
 */
router.put("/usuarios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const userId = req.params.id
    const { nombre, apellido, email, telefono, ciudad, direccion, id_rol, tipo_doc, fecha_nacimiento, password, especialidad, horario } = req.body

    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [userCheck] = await connection.query("SELECT id_rol, id_tipo FROM usuarios WHERE id_usuario = ?", [userId])
    if (userCheck.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }
    if (userCheck[0].id_rol === 1 && userId !== req.user.id_usuario) {
      await connection.rollback()
      return res.status(403).json({ success: false, message: "No se puede editar un administrador" })
    }

    if (email) {
      const [emailCheck] = await connection.query("SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?", [email, userId])
      if (emailCheck.length > 0) {
        await connection.rollback()
        return res.status(400).json({ success: false, message: "El email ya está en uso por otro usuario" })
      }
    }
    
    let id_tipo_asignado;
    if (id_rol == 3) id_tipo_asignado = 1;
    else if (id_rol == 2) id_tipo_asignado = 2;
    else id_tipo_asignado = userCheck[0].id_tipo;

    let updateQuery = "UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, tipo_doc = ?, fecha_nacimiento = ?, id_rol = ?, id_tipo = ?"
    const queryParams = [
      nombre, apellido, email, telefono || null, ciudad || null, direccion || null,
      tipo_doc, fecha_nacimiento, id_rol, id_tipo_asignado,
    ]

    if (password && password.length > 0) {
      if (password.length < 8) { // Asegurar validación de contraseña también en backend al actualizar
        await connection.rollback();
        return res.status(400).json({ success: false, message: "La nueva contraseña debe tener al menos 8 caracteres." });
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "La nueva contraseña no cumple los requisitos." });
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      updateQuery += ", contrasena = ?"
      queryParams.push(hashedPassword)
    }
    updateQuery += " WHERE id_usuario = ?"
    queryParams.push(userId)
    
    await connection.query(updateQuery, queryParams)

    if (id_rol == 2) {
      const [vetCheck] = await connection.query("SELECT id_vet FROM veterinarios WHERE id_vet = ?", [userId])
      if (vetCheck.length > 0) {
        await connection.query("UPDATE veterinarios SET especialidad = ?, horario = ? WHERE id_vet = ?", [especialidad || null, horario || null, userId])
      } else {
        await connection.query("INSERT INTO veterinarios (id_vet, especialidad, horario) VALUES (?, ?, ?)", [userId, especialidad || null, horario || null])
      }
    } else {
      await connection.query("DELETE FROM veterinarios WHERE id_vet = ?", [userId])
    }
    
    if (id_rol == 3) {
      const [propCheck] = await connection.query("SELECT id_pro FROM propietarios WHERE id_pro = ?", [userId]);
      if (propCheck.length === 0) {
        await connection.query("INSERT INTO propietarios (id_pro) VALUES (?)", [userId]);
      }
    } else {
      // Considera si se debe eliminar de propietarios si cambia de rol propietario a otro.
      // Por ahora, se mantiene para roles duales. Si no es el caso, agregar:
      // await connection.query("DELETE FROM propietarios WHERE id_pro = ?", [userId]);
    }

    await connection.commit()
    console.log(`✅ Usuario actualizado: ${nombre} ${apellido} (ID: ${userId})`)
    res.json({ success: true, message: "Usuario actualizado exitosamente" })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("❌ Error al actualizar usuario:", error)
    res.status(500).json({ success: false, message: "Error del servidor: " + error.message, error: error })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Cambiar estado de usuario (activar/desactivar)
 */
router.patch("/usuarios/:id/toggle-status", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const userId = req.params.id
    connection = await pool.getConnection()
    const [userRows] = await connection.query("SELECT id_rol, cuenta_bloqueada, nombre, apellido FROM usuarios WHERE id_usuario = ?", [userId])

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" })
    }
    const user = userRows[0]

    if (user.id_rol === 1) {
      return res.status(403).json({ success: false, message: "No se puede cambiar el estado de un administrador" })
    }

    const nuevoEstadoBloqueo = user.cuenta_bloqueada === 1 ? 0 : 1
    let queryAdicional = "";
    let razon = "";
    if (nuevoEstadoBloqueo === 0) { // Desbloqueando
        queryAdicional = ", intentos_fallidos = 0, fecha_bloqueo = NULL, razon_bloqueo = NULL";
    } else { // Bloqueando
        razon = 'Bloqueo manual por administrador';
        queryAdicional = ", fecha_bloqueo = NOW(), razon_bloqueo = ?";
    }
    
    const queryParams = [nuevoEstadoBloqueo];
    if (razon) queryParams.push(razon);
    queryParams.push(userId);

    await connection.query(
        `UPDATE usuarios SET cuenta_bloqueada = ? ${queryAdicional} WHERE id_usuario = ?`, 
        queryParams
    );

    const estadoTexto = nuevoEstadoBloqueo === 0 ? "activado" : "desactivado"
    const nombreCompleto = `${user.nombre} ${user.apellido}`

    console.log(`✅ Usuario ${estadoTexto}: ${nombreCompleto} (ID: ${userId})`)
    res.json({
      success: true,
      message: `Usuario ${nombreCompleto} ${estadoTexto} exitosamente`,
      bloqueado: nuevoEstadoBloqueo === 1,
    })
  } catch (error) {
    console.error("❌ Error al cambiar estado:", error)
    res.status(500).json({ success: false, message: "Error del servidor: " + error.message })
  } finally {
    if (connection) connection.release()
  }
})

/**
 * Eliminar usuario
 */
router.delete("/usuarios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection;
  try {
    const userId = req.params.id;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [userCheck] = await connection.query("SELECT id_rol, nombre, apellido FROM usuarios WHERE id_usuario = ?", [userId]);
    if (userCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    const userToDelete = userCheck[0];

    if (userToDelete.id_rol === 1) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "No se puede eliminar un administrador" });
    }

    // Si es veterinario, verificar citas y luego eliminar de 'veterinarios'
    if (userToDelete.id_rol === 2) {
      const [citasVetCheck] = await connection.query("SELECT COUNT(*) as count FROM citas WHERE id_vet = ?", [userId]);
      if (citasVetCheck[0].count > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "No se puede eliminar el veterinario porque tiene citas asignadas. Reasigne o cancele las citas primero.",
        });
      }
      await connection.query("DELETE FROM veterinarios WHERE id_vet = ?", [userId]);
    }

    // Si es propietario, eliminar mascotas y sus dependencias (historiales, citas de mascotas)
    if (userToDelete.id_rol === 3) {
      const [mascotasPropietario] = await connection.query("SELECT cod_mas FROM mascotas WHERE id_pro = ?", [userId]);
      for (const mascota of mascotasPropietario) {
        // Eliminar historiales médicos de la mascota
        await connection.query("DELETE FROM historiales_medicos WHERE cod_mas = ?", [mascota.cod_mas]);
        // Eliminar citas de la mascota
        await connection.query("DELETE FROM citas WHERE cod_mas = ?", [mascota.cod_mas]);
      }
      // Eliminar las mascotas del propietario
      await connection.query("DELETE FROM mascotas WHERE id_pro = ?", [userId]);
      // Finalmente, eliminar de la tabla 'propietarios'
      await connection.query("DELETE FROM propietarios WHERE id_pro = ?", [userId]);
    }
    
    // Eliminar citas donde el usuario es el solicitante (id_pro en citas)
    // Esto es importante si un usuario (ej. veterinario) también puede ser propietario y tener citas.
    await connection.query("DELETE FROM citas WHERE id_pro = ?", [userId]);

    // Eliminar al usuario de la tabla 'usuarios'
    const [deleteResult] = await connection.query("DELETE FROM usuarios WHERE id_usuario = ?", [userId]);
    if (deleteResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Usuario no encontrado al intentar eliminar." });
    }

    await connection.commit();
    console.log(`✅ Usuario eliminado: ${userToDelete.nombre} ${userToDelete.apellido} (ID: ${userId})`);
    res.json({ success: true, message: "Usuario eliminado exitosamente" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al eliminar usuario:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      res.status(400).json({
        success: false,
        message: "No se puede eliminar el usuario porque tiene registros relacionados que no pudieron ser eliminados. Considere desactivarlo.",
      });
    } else {
      res.status(500).json({ success: false, message: "Error del servidor: " + error.message, error: error });
    }
  } finally {
    if (connection) connection.release();
  }
});


// ==================== GESTIÓN DE ROLES ====================
router.get("/roles", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [roles] = await connection.query(`
      SELECT r.id_rol, r.rol as nombre_rol, COUNT(u.id_usuario) as total_usuarios
      FROM rol r
      LEFT JOIN usuarios u ON r.id_rol = u.id_rol
      GROUP BY r.id_rol, r.rol
      ORDER BY r.id_rol
    `)
    res.json({ success: true, roles })
  } catch (error) {
    console.error("❌ Error al obtener roles:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

router.get("/roles/:id/usuarios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const rolId = req.params.id
    connection = await pool.getConnection()
    const [usuarios] = await connection.query(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.telefono,
             u.cuenta_bloqueada, u.fecha_registro,
        CASE 
          WHEN u.id_rol = 1 THEN 'Administrador'
          WHEN u.id_rol = 2 THEN 'Veterinario'
          WHEN u.id_rol = 3 THEN 'Propietario'
          ELSE 'Sin rol'
        END as nombre_rol
      FROM usuarios u 
      WHERE u.id_rol = ?
      ORDER BY u.id_usuario DESC
    `, [rolId])
    res.json({ success: true, usuarios })
  } catch (error) {
    console.error("❌ Error al obtener usuarios por rol:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

// ==================== GESTIÓN DE SERVICIOS ====================
router.get("/servicios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [servicios] = await connection.query(`
      SELECT cod_ser as id_servicio, nom_ser as nombre, descrip_ser as descripcion, precio,
             1 as activo, NOW() as fecha_creacion 
      FROM servicios 
      ORDER BY cod_ser
    `)
    res.json({ success: true, servicios })
  } catch (error) {
    console.error("❌ Error al obtener servicios:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

router.post("/servicios", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const { nombre, descripcion, precio } = req.body
    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ success: false, message: "Todos los campos son requeridos" })
    }
    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      return res.status(400).json({ success: false, message: "El precio debe ser un número mayor a 0" })
    }
    connection = await pool.getConnection()
    const [result] = await connection.query(
      "INSERT INTO servicios (nom_ser, descrip_ser, precio) VALUES (?, ?, ?)",
      [nombre, descripcion, parseFloat(precio)]
    )
    res.status(201).json({ success: true, message: "Servicio creado exitosamente", id: result.insertId })
  } catch (error) {
    console.error("❌ Error al crear servicio:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

router.put("/servicios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const servicioId = req.params.id
    const { nombre, descripcion, precio } = req.body
    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ success: false, message: "Todos los campos son requeridos" })
    }
    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      return res.status(400).json({ success: false, message: "El precio debe ser un número mayor a 0" })
    }
    connection = await pool.getConnection()
    const [serviceCheck] = await connection.query("SELECT cod_ser FROM servicios WHERE cod_ser = ?", [servicioId])
    if (serviceCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" })
    }
    await connection.query(
      "UPDATE servicios SET nom_ser = ?, descrip_ser = ?, precio = ? WHERE cod_ser = ?",
      [nombre, descripcion, parseFloat(precio), servicioId]
    )
    res.json({ success: true, message: "Servicio actualizado exitosamente" })
  } catch (error) {
    console.error("❌ Error al actualizar servicio:", error)
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

router.delete("/servicios/:id", authenticateToken, verificarAdmin, async (req, res) => {
  let connection
  try {
    const servicioId = req.params.id
    connection = await pool.getConnection()
    const [serviceCheck] = await connection.query("SELECT nom_ser FROM servicios WHERE cod_ser = ?", [servicioId])
    if (serviceCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" })
    }
    const [citasCheck] = await connection.query("SELECT COUNT(*) as count FROM citas WHERE cod_ser = ?", [servicioId])
    if (citasCheck[0].count > 0) {
      return res.status(400).json({ success: false, message: "No se puede eliminar el servicio porque tiene citas programadas." })
    }
    await connection.query("DELETE FROM servicios WHERE cod_ser = ?", [servicioId])
    res.json({ success: true, message: "Servicio eliminado exitosamente" })
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).json({
            success: false,
            message: "No se puede eliminar el servicio porque está referenciado en otras tablas."
        });
    }
    res.status(500).json({ success: false, message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
})

module.exports = router