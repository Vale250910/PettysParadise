const express = require("express");
const router = express.Router();
const pool = require("../db/conexion");
const authenticateToken = require("../middlewares/authenticateToken");

// Obtener todos los historiales médicos
router.get("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Usar el procedimiento almacenado ObtenerHistorialesMedicos
    const [rows] = await connection.query(`CALL ObtenerHistorialesMedicos()`);
    
    // Los procedimientos almacenados devuelven un array de arrays, tomamos el primer elemento
    const historiales = rows[0] || [];
    
    // Agregar información del propietario manualmente ya que el procedimiento no la incluye
    const historialesConPropietario = await Promise.all(
      historiales.map(async (historial) => {
        try {
          const [propietarioRows] = await connection.query(`
            SELECT CONCAT(u.nombre, ' ', u.apellido) AS propietario
            FROM mascotas m
            JOIN propietarios p ON m.id_pro = p.id_pro
            JOIN usuarios u ON p.id_pro = u.id_usuario
            WHERE m.cod_mas = ?
          `, [historial.cod_mas]);
          
          return {
            ...historial,
            propietario: propietarioRows[0]?.propietario || 'No disponible'
          };
        } catch (error) {
          console.error("Error al obtener propietario:", error);
          return {
            ...historial,
            propietario: 'No disponible'
          };
        }
      })
    );
    
    res.json(historialesConPropietario);
  } catch (error) {
    console.error("Error al obtener historiales:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener historiales", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Crear nuevo historial médico
router.post("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_mas, fech_his, descrip_his, tratamiento } = req.body;
    
    // Validaciones
    if (!cod_mas || !fech_his || !descrip_his || !tratamiento) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son obligatorios" 
      });
    }
    
    connection = await pool.getConnection();
    
    // Usar el procedimiento almacenado CrearHistorialMedico
    await connection.query(`CALL CrearHistorialMedico(?, ?, ?, ?, @cod_his)`, [
      fech_his,
      descrip_his,
      tratamiento,
      cod_mas
    ]);

    // Obtener el ID generado
    const [[result]] = await connection.query(`SELECT @cod_his AS cod_his`);
    const cod_his = result.cod_his;

    res.status(201).json({ 
      success: true, 
      message: "Historial médico creado exitosamente", 
      cod_his: cod_his 
    });
  } catch (error) {
    console.error("Error al crear historial:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al crear el historial", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Actualizar historial médico
router.put("/:cod_his", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_his } = req.params;
    const { cod_mas, fech_his, descrip_his, tratamiento } = req.body;

    // Validaciones
    if (!cod_mas || !fech_his || !descrip_his || !tratamiento) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son obligatorios" 
      });
    }

    connection = await pool.getConnection();
    
    // Usar el procedimiento almacenado ActualizarHistorialMedico
    await connection.query(`CALL ActualizarHistorialMedico(?, ?, ?, ?, ?)`, [
      cod_his,
      fech_his,
      descrip_his,
      tratamiento,
      cod_mas
    ]);

    res.json({ 
      success: true, 
      message: "Historial actualizado exitosamente" 
    });
  } catch (error) {
    console.error("Error al actualizar historial:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar el historial", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener historiales por mascota
router.get("/mascota/:cod_mas", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_mas } = req.params;
    
    connection = await pool.getConnection();
    
    // Usar el procedimiento almacenado ObtenerHistorialesPorMascota
    const [rows] = await connection.query(`CALL ObtenerHistorialesPorMascota(?)`, [cod_mas]);
    
    // Los procedimientos almacenados devuelven un array de arrays
    const historiales = rows[0] || [];
    
    res.json(historiales);
  } catch (error) {
    console.error("Error al obtener historiales por mascota:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener historiales", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener historial específico por código
router.get("/:cod_his", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_his } = req.params;
    
    connection = await pool.getConnection();
    
    // Como el procedimiento ObtenerHistorialPorCodigo tiene errores, usamos una consulta directa
    const [rows] = await connection.query(`
      SELECT h.*, 
             m.nom_mas AS mascota,
             m.especie, 
             m.raza,
             CONCAT(u.nombre, ' ', u.apellido) AS propietario
      FROM historiales_medicos h
      JOIN mascotas m ON h.cod_mas = m.cod_mas
      JOIN propietarios p ON m.id_pro = p.id_pro
      JOIN usuarios u ON p.id_pro = u.id_usuario
      WHERE h.cod_his = ?
    `, [cod_his]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Historial no encontrado" 
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener el historial", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Eliminar historial médico
router.delete("/:cod_his", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_his } = req.params;
    const { cod_mas } = req.body; // Necesario para el procedimiento almacenado
    
    if (!cod_mas) {
      return res.status(400).json({ 
        success: false, 
        message: "El código de la mascota es requerido" 
      });
    }
    
    connection = await pool.getConnection();
    
    // Usar el procedimiento almacenado EliminarHistorialMedico
    await connection.query(`CALL EliminarHistorialMedico(?, ?)`, [cod_his, cod_mas]);
    
    res.json({ 
      success: true, 
      message: "Historial eliminado exitosamente" 
    });
  } catch (error) {
    console.error("Error al eliminar historial:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar el historial", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta adicional para obtener historiales con información completa (para el frontend)
router.get("/obtener/completos", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Consulta completa con toda la información necesaria
    const [rows] = await connection.query(`
      SELECT h.cod_his,
             h.fech_his,
             h.descrip_his,
             h.tratamiento,
             h.cod_mas,
             m.nom_mas AS mascota,
             m.especie,
             m.raza,
             CONCAT(u.nombre, ' ', u.apellido) AS propietario
      FROM historiales_medicos h
      JOIN mascotas m ON h.cod_mas = m.cod_mas
      JOIN propietarios p ON m.id_pro = p.id_pro
      JOIN usuarios u ON p.id_pro = u.id_usuario
      ORDER BY h.fech_his DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener historiales completos:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener historiales", 
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;