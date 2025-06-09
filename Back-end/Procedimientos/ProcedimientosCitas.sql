USE mascotas_db;

DELIMITER $$
-- Procedimiento corregido para insertar cita
DROP PROCEDURE IF EXISTS InsertarCita$$
CREATE PROCEDURE InsertarCita (
    IN p_fech_cit DATE,
    IN p_hora TIME,
    IN p_cod_ser INT,
    IN p_id_vet INT,
    IN p_cod_mas INT,
    IN p_id_pro INT,
    IN p_notas TEXT, -- Parámetro de notas añadido
    OUT new_cita_id INT -- Parámetro de salida renombrado
)
BEGIN
    INSERT INTO citas (
        fech_cit, hora, cod_ser, id_vet, cod_mas, id_pro, estado, notas
    )
    VALUES (
        p_fech_cit, p_hora, p_cod_ser, p_id_vet, p_cod_mas, p_id_pro, 'PENDIENTE', p_notas
    );
    
    SET new_cita_id = LAST_INSERT_ID();
END$$

DELIMITER ;




-- Obtener todas las citas
DELIMITER $$
DROP PROCEDURE IF EXISTS MostrarCitasPorPropietario$$
CREATE PROCEDURE MostrarCitasPorPropietario (
    IN p_id_pro INT
)
BEGIN
    SELECT c.*, 
           m.nom_mas AS mascota,
           s.nom_ser AS servicio,
           CONCAT(u.nombre, ' ', u.apellido) AS veterinario
    FROM citas c
    LEFT JOIN mascotas m ON c.cod_mas = m.cod_mas
    LEFT JOIN servicios s ON c.cod_ser = s.cod_ser
    LEFT JOIN veterinarios v ON c.id_vet = v.id_vet
    LEFT JOIN usuarios u ON v.id_vet = u.id_usuario
    WHERE c.id_pro = p_id_pro
    ORDER BY c.fech_cit DESC, c.hora DESC;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS MostrarCitasPorVeterinario$$
CREATE PROCEDURE MostrarCitasPorVeterinario (
    IN p_id_vet INT
)
BEGIN
    SELECT c.*, 
           m.nom_mas AS mascota,
           s.nom_ser AS servicio,
           -- Se añade la unión a usuarios para obtener el nombre del propietario
           CONCAT(u_pro.nombre, ' ', u_pro.apellido) AS propietario_nombre
    FROM citas c
    LEFT JOIN mascotas m ON c.cod_mas = m.cod_mas
    LEFT JOIN servicios s ON c.cod_ser = s.cod_ser
    LEFT JOIN propietarios pro ON c.id_pro = pro.id_pro
    LEFT JOIN usuarios u_pro ON pro.id_pro = u_pro.id_usuario -- La unión que faltaba
    WHERE c.id_vet = p_id_vet
    ORDER BY c.fech_cit DESC, c.hora DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE ActualizarCita (
    IN p_cod_cit INT,
    IN p_fech_cit DATE,
    IN p_hora TIME,
    IN p_cod_ser INT,
    IN p_id_vet INT,
    IN p_cod_mas INT,
    IN p_estado ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'REALIZADA', 'NO_ASISTIDA'),
    IN p_notas TEXT
)
BEGIN
    UPDATE citas
    SET fech_cit = p_fech_cit,
        hora = p_hora,
        cod_ser = p_cod_ser,
        id_vet = p_id_vet,
        cod_mas = p_cod_mas,
        estado = p_estado,
        notas = p_notas
    WHERE cod_cit = p_cod_cit;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE CancelarCita (
    IN p_cod_cit INT,
    IN p_id_pro INT
)
BEGIN
    DECLARE cita_valida INT;

    SELECT COUNT(*) INTO cita_valida
    FROM citas
    WHERE cod_cit = p_cod_cit AND id_pro = p_id_pro;

    IF cita_valida = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No tienes permiso para cancelar esta cita.';
    ELSE
        UPDATE citas
        SET estado = 'CANCELADA'
        WHERE cod_cit = p_cod_cit;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS CancelarCita$$
CREATE PROCEDURE CancelarCita (
    IN p_cod_cit INT,
    IN p_id_usuario_actual INT -- Ahora es un ID de usuario genérico
)
BEGIN
    DECLARE cita_valida INT;

    -- Modificado: Verificar si el usuario actual es el propietario O el veterinario de la cita
    SELECT COUNT(*) INTO cita_valida
    FROM citas
    WHERE cod_cit = p_cod_cit 
      AND (id_pro = p_id_usuario_actual OR id_vet = p_id_usuario_actual);

    IF cita_valida = 0 THEN
        -- Si no es ni el propietario ni el veterinario, se lanza el error.
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No tienes permiso para cancelar esta cita.';
    ELSE
        -- Si tiene permiso, se actualiza el estado.
        UPDATE citas
        SET estado = 'CANCELADA'
        WHERE cod_cit = p_cod_cit;
    END IF;
END$$
DELIMITER ;
