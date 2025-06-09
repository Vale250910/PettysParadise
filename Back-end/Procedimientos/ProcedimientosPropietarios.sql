DELIMITER $$

DROP PROCEDURE IF EXISTS ObtenerPropietarios$$
CREATE PROCEDURE ObtenerPropietarios()
BEGIN
    SELECT p.id_pro, u.nombre, u.apellido, u.email, u.telefono
    FROM propietarios p
    -- La unión correcta es con u.id_usuario
    JOIN usuarios u ON p.id_pro = u.id_usuario;
END$$

-- Obtener un propietario por ID (CORREGIDO)
DROP PROCEDURE IF EXISTS ObtenerPropietarioPorId$$
CREATE PROCEDURE ObtenerPropietarioPorId(
    IN p_id_pro INT
)
BEGIN
    SELECT p.id_pro, u.nombre, u.apellido, u.email, u.telefono, u.ciudad, u.direccion
    FROM propietarios p
    -- La unión correcta es con u.id_usuario
    JOIN usuarios u ON p.id_pro = u.id_usuario
    WHERE p.id_pro = p_id_pro;
END$$

-- Eliminar propietario
DROP PROCEDURE IF EXISTS EliminarPropietario$$
CREATE PROCEDURE EliminarPropietario(
    IN p_id_pro INT
)
BEGIN
    DELETE FROM propietarios WHERE id_pro = p_id_pro;
END$$

DELIMITER ;