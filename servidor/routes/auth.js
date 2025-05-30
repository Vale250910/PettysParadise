const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/conexion");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta";
const JWT_EXPIRES_IN = "2h";
const HORAS_BLOQUEO = 2;
const MAX_INTENTOS_FALLIDOS = 3;

// Función para formatear la hora de desbloqueo
// En auth.js, modifica la función calcularHoraDesbloqueo
const calcularHoraDesbloqueo = (fechaBloqueo) => {
  const fechaDesbloqueo = new Date(fechaBloqueo);
  fechaDesbloqueo.setHours(fechaDesbloqueo.getHours() + HORAS_BLOQUEO);
  
  // Asegurarse de usar UTC para evitar problemas de zona horaria
  return fechaDesbloqueo.toLocaleString('es-ES', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
// Función para calcular tiempo restante en formato legible
const calcularTiempoRestante = (fechaBloqueo) => {
  const ahora = new Date();
  const fechaDesbloqueo = new Date(fechaBloqueo);
  fechaDesbloqueo.setHours(fechaDesbloqueo.getHours() + HORAS_BLOQUEO);
  
  const diferencia = fechaDesbloqueo - ahora;
  
  if (diferencia <= 0) {
    return { horas: 0, minutos: 0, texto: "Ya puede desbloquearse" };
  }
  
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  
  let texto = "";
  if (horas > 0) {
    texto = `${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) {
      texto += ` y ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    }
  } else {
    texto = `${minutos} minuto${minutos > 1 ? 's' : ''}`;
  }
  
  return { horas, minutos, texto };
};

// Nuevo endpoint para verificar desbloqueo// En auth.js, asegúrate de que el endpoint verifica correctamente
router.get("/verificar-desbloqueo/:email", async (req, res) => {
  let connection;
  try {
    const { email } = req.params;
    connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      "SELECT cuenta_bloqueada, fecha_bloqueo FROM usuarios WHERE email = ?", 
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    const user = rows[0];
    
    if (!user.cuenta_bloqueada) {
      return res.json({ success: true, cuenta_bloqueada: false });
    }
    
    const fechaBloqueo = new Date(user.fecha_bloqueo);
    const fechaDesbloqueo = new Date(fechaBloqueo.getTime() + (HORAS_BLOQUEO * 60 * 60 * 1000)); // Usar getTime() para precisión
    const ahora = new Date();
    
    if (ahora >= fechaDesbloqueo) {
      await connection.query(
        `UPDATE usuarios SET 
         intentos_fallidos = 0, 
         cuenta_bloqueada = 0, 
         fecha_bloqueo = NULL,
         razon_bloqueo = NULL
         WHERE email = ?`,
        [email]
      );
      return res.json({ success: true, cuenta_bloqueada: false, auto_desbloqueada: true });
    } else {
      const tiempoRestante = calcularTiempoRestante(user.fecha_bloqueo);
      return res.json({ 
        success: true, 
        cuenta_bloqueada: true, 
        tiempo_restante: tiempoRestante,
        hora_desbloqueo: calcularHoraDesbloqueo(user.fecha_bloqueo)
      });
    }
  } catch (error) {
    console.error("Error en verificar-desbloqueo:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/login", async (req, res) => {
  let connection;
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      });
    }

    connection = await pool.getConnection();
    
    // PRIMERO: Obtener datos del usuario
    const [rows] = await connection.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const user = rows[0];

    // SEGUNDO: Verificar si la cuenta está bloqueada ANTES de verificar la contraseña
    if (user.cuenta_bloqueada) {
      const fechaBloqueo = new Date(user.fecha_bloqueo);
      const fechaDesbloqueo = new Date(fechaBloqueo);
      fechaDesbloqueo.setHours(fechaDesbloqueo.getHours() + HORAS_BLOQUEO);
      const ahora = new Date();

      // Verificar si ya pasó el tiempo de bloqueo
      if (ahora >= fechaDesbloqueo) {
        await connection.query(
          `UPDATE usuarios SET 
           intentos_fallidos = 0, 
           cuenta_bloqueada = 0, 
           fecha_bloqueo = NULL,
           razon_bloqueo = NULL
           WHERE id_usuario = ?`,
          [user.id_usuario]
        );
        console.log(`Cuenta auto-desbloqueada: ${email}`);
        // Continuar con el login normal después del auto-desbloqueo
      } else {
        // La cuenta sigue bloqueada - calcular información de desbloqueo
        const horaDesbloqueo = calcularHoraDesbloqueo(user.fecha_bloqueo);
        const tiempoRestante = calcularTiempoRestante(user.fecha_bloqueo);
        
        return res.status(403).json({
          success: false,
          message: `Cuenta bloqueada por demasiados intentos fallidos. Se desbloqueará automáticamente el ${horaDesbloqueo} (en ${tiempoRestante.texto}) o contacte al administrador.`,
          cuenta_bloqueada: true,
          tiempo_restante: tiempoRestante,
          hora_desbloqueo: horaDesbloqueo,
          tiempo_restante_detallado: tiempoRestante
        });
      }
    }

    // TERCERO: Verificar la contraseña
    const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!passwordMatch) {
      // Incrementar intentos fallidos
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      if (nuevosIntentos >= MAX_INTENTOS_FALLIDOS) {
        // Bloquear la cuenta
        await connection.query(
          `UPDATE usuarios SET 
           intentos_fallidos = ?, 
           cuenta_bloqueada = 1, 
           fecha_bloqueo = NOW(),
           razon_bloqueo = ?
           WHERE id_usuario = ?`,
          [nuevosIntentos, "Demasiados intentos fallidos de inicio de sesión", user.id_usuario]
        );

        // Calcular hora de desbloqueo para el nuevo bloqueo
        const horaDesbloqueo = calcularHoraDesbloqueo(new Date());
        const tiempoRestante = calcularTiempoRestante(new Date());

        return res.status(403).json({
          success: false,
          message: `Cuenta bloqueada por demasiados intentos fallidos. Se desbloqueará automáticamente el ${horaDesbloqueo} (en ${tiempoRestante.texto}) o contacte al administrador.`,
          cuenta_bloqueada: true,
          tiempo_restante: tiempoRestante,
          hora_desbloqueo: horaDesbloqueo
        });
      } else {
        // Actualizar intentos fallidos sin bloquear
        await connection.query("UPDATE usuarios SET intentos_fallidos = ? WHERE id_usuario = ?", [
          nuevosIntentos,
          user.id_usuario,
        ]);

        return res.status(401).json({
          success: false,
          message: `Credenciales incorrectas. Intentos restantes: ${MAX_INTENTOS_FALLIDOS - nuevosIntentos}`,
          intentos_restantes: MAX_INTENTOS_FALLIDOS - nuevosIntentos,
        });
      }
    }

    // CUARTO: Login exitoso - resetear intentos fallidos
    await connection.query("UPDATE usuarios SET intentos_fallidos = 0 WHERE id_usuario = ?", [user.id_usuario]);

    // Crear token con información completa del usuario
    const tokenPayload = {
      id_usuario: user.id_usuario,
      email: user.email,
      id_rol: user.id_rol,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Remover datos sensibles antes de enviar respuesta
    delete user.contrasena;
    delete user.intentos_fallidos;
    delete user.cuenta_bloqueada;
    delete user.fecha_bloqueo;
    delete user.razon_bloqueo;

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: {
        ...user,
        role: user.id_rol
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint para verificar estado de bloqueo (actualizado)
router.get("/estado-cuenta/:email", async (req, res) => {
  let connection
  try {
    const { email } = req.params

    connection = await pool.getConnection()
    const [rows] = await connection.query(
      `SELECT 
        intentos_fallidos, 
        cuenta_bloqueada, 
        fecha_bloqueo,
        razon_bloqueo
      FROM usuarios WHERE email = ?`,
      [email],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      })
    }

    const user = rows[0]
    
    let estadoDetallado = {
      intentos_fallidos: user.intentos_fallidos,
      cuenta_bloqueada: Boolean(user.cuenta_bloqueada),
      fecha_bloqueo: user.fecha_bloqueo,
      razon_bloqueo: user.razon_bloqueo,
    }

    if (user.cuenta_bloqueada && user.fecha_bloqueo) {
      const horaDesbloqueo = calcularHoraDesbloqueo(user.fecha_bloqueo)
      const tiempoRestante = calcularTiempoRestante(user.fecha_bloqueo)
      
      estadoDetallado = {
        ...estadoDetallado,
        hora_desbloqueo: horaDesbloqueo,
        tiempo_restante_detallado: tiempoRestante,
        puede_desbloquearse: tiempoRestante.horas === 0 && tiempoRestante.minutos === 0
      }
    }

    res.json({
      success: true,
      data: estadoDetallado,
    })
  } catch (error) {
    console.error("Error al verificar estado de cuenta:", error)
    res.status(500).json({
      success: false,
      message: "Error al verificar estado de la cuenta",
      error: error.message,
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint para obtener todas las cuentas bloqueadas (actualizado)
router.get("/cuentas-bloqueadas", async (req, res) => {
  let connection
  try {
    const adminToken = req.headers.authorization?.split(" ")[1]

    if (!adminToken) {
      return res.status(401).json({
        success: false,
        message: "Token de administrador requerido",
      })
    }

    const decoded = jwt.verify(adminToken, JWT_SECRET)
    if (decoded.id_rol !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden ver las cuentas bloqueadas",
      })
    }

    connection = await pool.getConnection()
    const [rows] = await connection.query(
      `SELECT 
        id_usuario,
        nombre,
        apellido,
        email,
        intentos_fallidos,
        fecha_bloqueo,
        razon_bloqueo
      FROM usuarios 
      WHERE cuenta_bloqueada = 1
      ORDER BY fecha_bloqueo DESC`
    )

    // Agregar información de desbloqueo a cada cuenta
    const cuentasConInfo = rows.map(cuenta => {
      const horaDesbloqueo = calcularHoraDesbloqueo(cuenta.fecha_bloqueo)
      const tiempoRestante = calcularTiempoRestante(cuenta.fecha_bloqueo)
      
      return {
        ...cuenta,
        hora_desbloqueo: horaDesbloqueo,
        tiempo_restante_detallado: tiempoRestante,
        puede_desbloquearse: tiempoRestante.horas === 0 && tiempoRestante.minutos === 0
      }
    })

    res.json({
      success: true,
      cuentas: cuentasConInfo,
      total: cuentasConInfo.length,
    })
  } catch (error) {
    console.error("Error al obtener cuentas bloqueadas:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener las cuentas bloqueadas",
      error: error.message,
    })
  } finally {
    if (connection) connection.release()
  }
})

// Resto de endpoints sin cambios...
router.post("/desbloquear-cuenta", async (req, res) => {
  let connection
  try {
    const { email, id_usuario } = req.body
    const adminToken = req.headers.authorization?.split(" ")[1]

    if (!adminToken) {
      return res.status(401).json({
        success: false,
        message: "Token de administrador requerido",
      })
    }

    const decoded = jwt.verify(adminToken, JWT_SECRET)
    if (decoded.id_rol !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden desbloquear cuentas",
      })
    }

    connection = await pool.getConnection()
    
    const whereClause = email ? "email = ?" : "id_usuario = ?"
    const whereValue = email || id_usuario

    const [result] = await connection.query(
      `UPDATE usuarios SET 
       intentos_fallidos = 0, 
       cuenta_bloqueada = 0, 
       fecha_bloqueo = NULL,
       razon_bloqueo = NULL
       WHERE ${whereClause}`,
      [whereValue]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      })
    }

    console.log(`Admin ${decoded.id_usuario} desbloqueó la cuenta: ${email || id_usuario}`)

    res.json({
      success: true,
      message: "Cuenta desbloqueada exitosamente",
    })
  } catch (error) {
    console.error("Error al desbloquear cuenta:", error)
    res.status(500).json({
      success: false,
      message: "Error al desbloquear la cuenta",
      error: error.message,
    })
  } finally {
    if (connection) connection.release()
  }
})

router.post("/register", async (req, res) => {
  let connection
  try {
    const {
      tipo_doc,
      id_usuario,
      nombre,
      apellido,
      ciudad,
      direccion,
      telefono,
      fecha_nacimiento,
      email,
      contrasena,
      id_tipo = 1,
      id_rol = 3,
    } = req.body

    if (!email || !contrasena || !id_usuario || !nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: "Campos obligatorios faltantes",
      })
    }

    connection = await pool.getConnection()
    await connection.beginTransaction()

    const hashedPassword = await bcrypt.hash(contrasena, 10)
    await connection.query("CALL InsertarUsuarioYPropietario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id_usuario,
      tipo_doc,
      nombre,
      apellido,
      ciudad,
      direccion,
      telefono,
      fecha_nacimiento,
      email,
      hashedPassword,
      id_tipo,
      id_rol,
    ])

    await connection.commit()

    res.status(201).json({
      success: true,
      message: "Usuario y propietario creados con éxito",
      userId: id_usuario,
    })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("Error en registro:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
      error: error.message,
    })
  } finally {
    if (connection) connection.release()
  }
})

module.exports = router


