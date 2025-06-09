const express = require("express");
const router = express.Router();
const pool = require("../db/conexion");
const authenticateToken = require("../middlewares/authenticateToken");

/* // Obtener citas del propietario (usando procedimiento)
router.get("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    const id_pro = req.user.id_usuario;
    connection = await pool.getConnection();
    const [rows] = await connection.query(`CALL MostrarCitasPorPropietario(?)`, [id_pro]);

    res.json(rows[0]); // El resultado está en rows[0]
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ success: false, message: "Error al obtener citas", error: error.message });
  } finally {
    if (connection) connection.release();
  }
}); */

// OBTENER CITAS (MODIFICADO PARA MANEJAR ROLES)
router.get("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id_usuario, id_rol } = req.user;
    connection = await pool.getConnection();

    let query;
    let params;

    if (id_rol === 2) { // Rol Veterinario
      query = "CALL MostrarCitasPorVeterinario(?)";
      params = [id_usuario];
    } else if (id_rol === 3) { // Rol Propietario
      query = "CALL MostrarCitasPorPropietario(?)";
      params = [id_usuario];
    } else { // Administrador u otro rol pueden ver todas
      query = `
        SELECT c.*, 
               m.nom_mas AS mascota,
               CONCAT(u_pro.nombre, ' ', u_pro.apellido) AS propietario,
               CONCAT(u_vet.nombre, ' ', u_vet.apellido) AS veterinario,
               s.nom_ser AS servicio
        FROM citas c
        LEFT JOIN mascotas m ON c.cod_mas = m.cod_mas
        LEFT JOIN propietarios pro ON c.id_pro = pro.id_pro
        LEFT JOIN usuarios u_pro ON pro.id_pro = u_pro.id_usuario
        LEFT JOIN veterinarios v ON c.id_vet = v.id_vet
        LEFT JOIN usuarios u_vet ON v.id_vet = u_vet.id_usuario
        LEFT JOIN servicios s ON c.cod_ser = s.cod_ser
        ORDER BY c.fech_cit DESC, c.hora DESC
      `;
      params = [];
    }

    const [rows] = await connection.query(query, params);

    // Si la consulta es una llamada a un procedimiento, el resultado está en rows[0]
    res.json(rows[0] || rows);

  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ success: false, message: "Error al obtener citas", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Crear cita (MODIFICADO para tomar id_pro del body)
router.post("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    // Obtenemos todos los datos necesarios desde el cuerpo de la petición.
    // Esto funciona tanto si crea la cita un propietario para sí mismo
    // como si la crea un veterinario para un propietario.
    const { cod_mas, cod_ser, id_vet, fech_cit, hora, notas, id_pro } = req.body;
    
    // Validación crucial: nos aseguramos que el id_pro venga en la petición
    if (!id_pro) {
      return res.status(400).json({ success: false, message: "Falta el ID del propietario." });
    }

    connection = await pool.getConnection();

    // Llamamos al procedimiento almacenado corregido, pasando todos los parámetros.
    const [result] = await connection.query(
      `CALL InsertarCita(?, ?, ?, ?, ?, ?, ?, @new_cita_id)`, 
      [
        fech_cit,
        hora,
        cod_ser,
        id_vet,
        cod_mas,
        id_pro, // Usamos el id_pro del formulario
        notas || ''
      ]
    );

    const [[{ new_cita_id }]] = await connection.query(`SELECT @new_cita_id AS new_cita_id`);

    res.status(201).json({ success: true, message: "Cita creada exitosamente", citaId: new_cita_id });
  } catch (error) {
    console.error("Error al crear cita:", error);
    // Devuelve el mensaje de error de la base de datos si existe, es más informativo.
    res.status(500).json({ success: false, message: error.sqlMessage || "Error al crear la cita", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Actualizar cita (MODIFICADO con lógica de permisos mejorada)
router.put("/:cod_cit", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_cit } = req.params;
    const { id_usuario, id_rol } = req.user; // Obtenemos el rol del usuario logueado

    connection = await pool.getConnection();

    // 1. Primero, obtenemos la cita para verificar los permisos
    const [citasExistentes] = await connection.query(
      `SELECT id_pro, id_vet FROM citas WHERE cod_cit = ?`, 
      [cod_cit]
    );

    if (citasExistentes.length === 0) {
      return res.status(404).json({ success: false, message: "La cita no fue encontrada." });
    }

    const cita = citasExistentes[0];
    const esPropietario = id_rol === 3 && cita.id_pro === id_usuario;
    const esVeterinarioAsignado = id_rol === 2 && cita.id_vet === id_usuario;
    const esAdmin = id_rol === 1;

    // 2. Si no es Propietario, ni el Veterinario asignado, ni un Admin, denegar acceso.
    if (!esPropietario && !esVeterinarioAsignado && !esAdmin) {
      return res.status(403).json({ success: false, message: "No tienes permiso para modificar esta cita" });
    }

    // 3. Si tiene permiso, proceder con la actualización
    const { cod_mas, cod_ser, id_vet, fech_cit, hora, estado, notas } = req.body;

    await connection.query(`CALL ActualizarCita(?, ?, ?, ?, ?, ?, ?, ?)`, [
      cod_cit,
      fech_cit,
      hora,
      cod_ser,
      id_vet,
      cod_mas,
      estado,
      notas,
    ]);

    res.json({ success: true, message: "Cita actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la cita", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Cancelar cita (usando procedimiento)
router.put("/:cod_cit/cancelar", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { cod_cit } = req.params;
    const id_pro = req.user.id_usuario;
    connection = await pool.getConnection();

    await connection.query(`CALL CancelarCita(?, ?)`, [cod_cit, id_pro]);

    res.json({ success: true, message: "Cita cancelada exitosamente" });
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    res.status(500).json({ success: false, message: "Error al cancelar la cita", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// NUEVO: Endpoint para obtener estadísticas del dashboard del veterinario
router.get("/veterinario/stats", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id_usuario } = req.user; // Obtenemos el ID del veterinario logueado

    connection = await pool.getConnection();

    // 1. Contar citas programadas para este veterinario (Pendientes o Confirmadas)
    const [citasResult] = await connection.query(
      "SELECT COUNT(*) as total FROM citas WHERE id_vet = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')",
      [id_usuario]
    );
    const totalCitas = citasResult[0].total;

    // 2. Contar el total de pacientes registrados en la clínica
    const [pacientesResult] = await connection.query("SELECT COUNT(*) as total FROM mascotas");
    const totalPacientes = pacientesResult[0].total;

    // 3. Contar el total de historiales médicos registrados
    const [historialesResult] = await connection.query("SELECT COUNT(*) as total FROM historiales_medicos");
    const totalHistoriales = historialesResult[0].total;

    res.json({
      success: true,
      stats: {
        citasProgramadas: totalCitas,
        pacientes: totalPacientes,
        historialesMedicos: totalHistoriales,
      },
    });

  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
