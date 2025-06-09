const express = require("express")
const router = express.Router()
const pool = require("../db/conexion")
const authenticateToken = require("../middlewares/authenticateToken")


// OBTENER TODAS LAS MASCOTAS (NUEVA RUTA PARA VET/ADMIN)
router.get("/todas", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query("CALL ObtenerTodasMascotas()");
    res.json(rows[0] || []);
  } catch (error) {
    console.error("Error al obtener todas las mascotas:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint para crear mascota (Funcionalidad existente)
router.post("/create", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { nom_mas, especie, raza, edad, genero, peso, id_pro, foto = "" } = req.body;
    if (!nom_mas || !especie || !raza || !edad || !genero || !peso || !id_pro) {
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios" });
    }
    connection = await pool.getConnection();
    await connection.query(
      `CALL CrearMascota(?, ?, ?, ?, ?, ?, ?, ?, @cod_mas)`,
      [nom_mas, especie, raza, Number.parseFloat(edad), genero, Number.parseFloat(peso), Number.parseInt(id_pro), foto]
    );
    const [result] = await connection.query("SELECT @cod_mas as cod_mas");
    res.status(201).json({ success: true, message: "Mascota creada correctamente", cod_mas: result[0].cod_mas });
  } catch (err) {
    console.error("Error al crear mascota:", err);
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ success: false, message: "El propietario con el ID proporcionado no existe" });
    }
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// ACTUALIZAR MASCOTA (NUEVA RUTA)
router.put("/:cod_mas", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_mas } = req.params;
    const { nom_mas, especie, raza, edad, genero, peso, id_pro, foto } = req.body;
    
    connection = await pool.getConnection();
    await connection.query(
      "CALL ActualizarMascota(?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cod_mas, nom_mas, especie, raza, Number.parseFloat(edad), genero, Number.parseFloat(peso), Number.parseInt(id_pro), foto]
    );
    res.json({ success: true, message: "Paciente actualizado exitosamente." });
  } catch (error) {
    console.error("Error al actualizar mascota:", error);
    res.status(500).json({ success: false, message: error.sqlMessage || "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// ELIMINAR MASCOTA (NUEVA RUTA)
router.delete("/:cod_mas", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_mas } = req.params;
    connection = await pool.getConnection();
    await connection.query("CALL EliminarMascota(?)", [cod_mas]);
    res.json({ success: true, message: "Paciente eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar mascota:", error);
    res.status(500).json({ success: false, message: error.sqlMessage || "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});





// OBTENER MASCOTAS POR ID DE PROPIETARIO (NUEVO)
router.get("/propietario/:id_pro", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id_pro } = req.params;
    connection = await pool.getConnection();
    
    // Usamos el procedimiento que ya existe
    const [rows] = await connection.query("CALL ObtenerMascotasPorPropietario(?)", [id_pro]);
    
    res.json({ success: true, mascotas: rows[0] });
  } catch (error) {
    console.error("Error al obtener mascotas por propietario:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router