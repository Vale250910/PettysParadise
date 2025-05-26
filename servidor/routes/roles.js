const express = require('express');
const router = express.Router();
const pool = require('../db/conexion');

// Importa el middleware (asegúrate de que la ruta sea correcta)
const authenticateToken = require('../middlewares/authenticateToken')
// Nota: Sin llaves {} porque el export es directo

// Ruta para verificar si es propietario
router.get("/verificar-propietario", authenticateToken, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id_usuario;
    connection = await pool.getConnection();

    // Verifica el rol del usuario
    const [userRows] = await connection.query(
      "SELECT id_rol FROM usuarios WHERE id_usuario = ?", 
      [userId]
    );

    if (userRows.length === 0) return res.sendStatus(403); // Usuario no existe
    if (userRows[0].id_rol !== 3) return res.sendStatus(403); // No es propietario

    // Llama al procedimiento almacenado
    const [rows] = await connection.query(
      "CALL VerificarSiEsPropietario(?)", 
      [userId]
    );
    const resultado = rows[0][0].resultado;

    if (resultado === "ES_PROPIETARIO") {
      res.sendStatus(200); // ✅ Es propietario
    } else {
      res.sendStatus(403); // ❌ No es propietario
    }
  } catch (err) {
    console.error("Error al verificar propietario:", err);
    res.status(500).json({ message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta para verificar si es administrador
router.get("/verificar-administrador", authenticateToken, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id_usuario;
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      "SELECT id_rol FROM usuarios WHERE id_usuario = ?", 
      [userId]
    );

    if (rows.length === 0) return res.sendStatus(403); // Usuario no existe
    if (rows[0].id_rol === 1) {
      res.sendStatus(200); // ✅ Es administrador
    } else {
      res.sendStatus(403); // ❌ No es administrador
    }
  } catch (err) {
    console.error("Error al verificar administrador:", err);
    res.status(500).json({ message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
