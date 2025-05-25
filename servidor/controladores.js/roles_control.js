const pool = require("../db/conexion")

const verificarPropietario = async (req, res) => {
  console.log("=== VERIFICAR PROPIETARIO ===")
  let connection
  try {
    const userId = req.user.id_usuario
    console.log("Usuario ID:", userId)
    console.log("Usuario completo:", req.user)

    connection = await pool.getConnection()

    const [userRows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])
    console.log("Resultado query usuario:", userRows)

    if (userRows.length === 0) {
      console.log("❌ Usuario no encontrado en BD")
      return res.sendStatus(403)
    }

    if (userRows[0].id_rol !== 3) {
      console.log("❌ Usuario no es propietario, rol:", userRows[0].id_rol)
      return res.sendStatus(403)
    }

    // Verificación simplificada - solo por rol
    console.log("✅ Usuario es propietario por rol")
    res.sendStatus(200)
  } catch (err) {
    console.error("❌ Error al verificar propietario:", err)
    res.status(500).json({ message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
}

const verificarAdministrador = async (req, res) => {
  console.log("=== VERIFICAR ADMINISTRADOR ===");
  console.log("Usuario del token completo:", req.user);
  
  // First check if token has admin role
  if (req.user.id_rol === 1) {
    console.log("✅ Usuario es administrador (verificado por token)");
    return res.status(200).json({ 
      success: true,
      message: "Usuario es administrador",
      user: req.user
    });
  }

  // If not in token, check database
  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.query(
      "SELECT id_rol FROM usuarios WHERE id_usuario = ?", 
      [req.user.id_usuario]
    );

    if (userRows.length === 0) {
      console.log("❌ Usuario no encontrado en BD");
      return res.status(403).json({ 
        success: false,
        message: "Usuario no encontrado" 
      });
    }

    if (userRows[0].id_rol !== 1) {
      console.log(`❌ Usuario no es administrador, rol: ${userRows[0].id_rol}`);
      return res.status(403).json({ 
        success: false,
        message: "Acceso denegado: se requiere rol de administrador",
        userRole: userRows[0].id_rol
      });
    }

    console.log("✅ Usuario es administrador (verificado por BD)");
    res.status(200).json({ 
      success: true,
      message: "Usuario es administrador"
    });
  } catch (err) {
    console.error("❌ Error al verificar administrador:", err);
    res.status(500).json({ 
      success: false,
      message: "Error del servidor",
      error: err.message 
    });
  } finally {
    if (connection) connection.release();
  }
};
const verificarVeterinario = async (req, res) => {
  console.log("=== VERIFICAR VETERINARIO ===")
  let connection
  try {
    const userId = req.user.id_usuario
    console.log("Usuario ID:", userId)
    console.log("Usuario completo:", req.user)

    connection = await pool.getConnection()

    const [userRows] = await connection.query("SELECT id_rol FROM usuarios WHERE id_usuario = ?", [userId])
    console.log("Resultado query usuario:", userRows)

    if (userRows.length === 0) {
      console.log("❌ Usuario no encontrado en BD")
      return res.sendStatus(403)
    }

    if (userRows[0].id_rol !== 2) {
      console.log("❌ Usuario no es veterinario, rol:", userRows[0].id_rol)
      return res.sendStatus(403)
    }

    // Verificación simplificada - solo por rol
    console.log("✅ Usuario es veterinario por rol")
    res.sendStatus(200)
  } catch (err) {
    console.error("❌ Error al verificar veterinario:", err)
    res.status(500).json({ message: "Error del servidor" })
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  verificarPropietario,
  verificarAdministrador,
  verificarVeterinario,
}

