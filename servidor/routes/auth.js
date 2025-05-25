// routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/conexion");

const router = express.Router();

const JWT_SECRET = "tu_clave_secreta"; // Asegúrate de usar la misma clave en todos los lugares
const JWT_EXPIRES_IN = "2h";

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
    const [rows] = await connection.query("CALL ObtenerUsuarioPorEmail(?)", [email]);
    const users = rows[0];

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        id_rol: user.id_rol // Añadir el rol al token
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    delete user.contrasena;

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});
router.post("/register", async (req, res) => {
  let connection;
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
    } = req.body;

    if (!email || !contrasena || !id_usuario || !nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: "Campos obligatorios faltantes",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(contrasena, 10);
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
    ]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Usuario y propietario creados con éxito",
      userId: id_usuario,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
