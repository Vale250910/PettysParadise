USE mascotas_db;
DELIMITER $$

-- Crear historial médico
DROP PROCEDURE IF EXISTS CrearHistorial$$
CREATE PROCEDURE CrearHistorial(
    IN p_cod_mas INT,
    IN p_fecha DATE,
    IN p_descripcion TEXT,
    IN p_tratamiento TEXT
)
BEGIN
    INSERT INTO historiales_medicos (cod_mas, fech_his, descrip_his, tratamiento)
    VALUES (p_cod_mas, p_fecha, p_descripcion, p_tratamiento);
END$$

-- Obtener todos los historiales médicos
DROP PROCEDURE IF EXISTS ObtenerTodosLosHistoriales$$
CREATE PROCEDURE ObtenerTodosLosHistoriales()
BEGIN
    SELECT 
        h.cod_his,
        h.fech_his AS fecha,
        h.descrip_his AS descripcion,
        h.tratamiento,
        h.cod_mas,
        m.nom_mas AS nombre_mascota,
        CONCAT(u.nombre, ' ', u.apellido) AS nombre_propietario
    FROM historiales_medicos h
    JOIN mascotas m ON h.cod_mas = m.cod_mas
    JOIN propietarios p ON m.id_pro = p.id_pro
    JOIN usuarios u ON p.id_pro = u.id_usuario
    ORDER BY h.fech_his DESC;
END$$

-- Obtener historiales médicos por mascota
CREATE PROCEDURE ObtenerHistorialesPorMascota(
    IN p_cod_mas INT
)
BEGIN
    SELECT * FROM historiales_medicos WHERE cod_mas = p_cod_mas
    ORDER BY fecha DESC;
END$$

-- Obtener historial médico por código
CREATE PROCEDURE ObtenerHistorialPorCodigo(
    IN p_cod_his INT,
    IN p_cod_mas INT
)
BEGIN
    SELECT h.*, m.nom_masAS nombre_mascota, m.especie, m.raza
    FROM historiales_medicos h
    JOIN mascotas m ON h.cod_mas = m.cod_mas
    WHERE h.cod_his = p_cod_his AND h.codigo_mascota = p_codigo_mascota;
END$$

-- Actualizar historial médico
DROP PROCEDURE IF EXISTS ActualizarHistorial$$
CREATE PROCEDURE ActualizarHistorial(
    IN p_cod_his INT, -- Corregido de id_his a cod_his
    IN p_fecha DATE,
    IN p_descripcion TEXT,
    IN p_tratamiento TEXT
)
BEGIN
    UPDATE historiales_medicos
    SET
        fech_his = p_fecha,
        descrip_his = p_descripcion,
        tratamiento = p_tratamiento
    WHERE cod_his = p_cod_his;
END$$

-- Eliminar un historial (NUEVO)
DROP PROCEDURE IF EXISTS EliminarHistorial$$
CREATE PROCEDURE EliminarHistorial(
    IN p_cod_his INT -- Corregido de id_his a cod_his
)
BEGIN
    DELETE FROM historiales_medicos WHERE cod_his = p_cod_his;
END$$

DELIMITER ;