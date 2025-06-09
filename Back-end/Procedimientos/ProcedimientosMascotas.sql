DELIMITER $$

-- Primero, verificar si el procedimiento existe y sus parámetros

CREATE PROCEDURE CrearMascota(
    IN p_nom_mas VARCHAR(100),
    IN p_especie VARCHAR(100),
    IN p_raza VARCHAR(100),
    IN p_edad DECIMAL(10,2),
    IN p_genero VARCHAR(25),
    IN p_peso DECIMAL(10,2),
    IN p_id_pro INT,
    IN p_foto VARCHAR(255),
    OUT p_cod_mas INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insertar la mascota
    INSERT INTO mascotas (nom_mas, especie, raza, edad, genero, peso, id_pro, foto)
    VALUES (p_nom_mas, p_especie, p_raza, p_edad, p_genero, p_peso, p_id_pro, p_foto);
    
    -- Obtener el ID generado
    SET p_cod_mas = LAST_INSERT_ID();
    
    COMMIT;
END$$

-- Verificar que el procedimiento se creó correctamente


-- Obtener todas las mascotas
CREATE PROCEDURE ObtenerMascotas()
BEGIN
    SELECT m.*, u.nom_mas AS nombre_propietario, u.apellido AS apellido_propietario
    FROM mascotas m
    JOIN propietarios p ON m.id_pro = p.id_pro
    JOIN usuarios u ON p.id_pro = u.id_usuario;
END$$

-- Obtener mascotas por propietario
CREATE PROCEDURE ObtenerMascotasPorPropietario(
    IN p_id_pro INT
)
BEGIN
    SELECT * FROM mascotas WHERE id_pro= p_id_pro;
END$$

-- Obtener mascota por código
CREATE PROCEDURE ObtenerMascotaPorCodigo(
    IN p_cod_mas  INT
)
BEGIN
    SELECT m.*, u.nom_mas AS nombre_propietario, u.apellido AS apellido_propietario
    FROM mascotas m
    JOIN propietarios p ON m.id_pro = p.id_pro
    JOIN usuarios u ON p.id_pro = u.id_usuario
    WHERE m.cod_mas  = p_cod_mas ;
END$$

DELIMITER ;

DELIMITER $$

-- Procedimiento para Obtener TODAS las mascotas (para el veterinario)
DROP PROCEDURE IF EXISTS ObtenerTodasMascotas$$
CREATE PROCEDURE ObtenerTodasMascotas()
BEGIN
    SELECT m.*, CONCAT(u.nombre, ' ', u.apellido) AS propietario
    FROM mascotas m
    JOIN propietarios p ON m.id_pro = p.id_pro
    JOIN usuarios u ON p.id_pro = u.id_usuario
    ORDER BY m.cod_mas DESC;
END$$


-- Procedimiento para Actualizar Mascota (NUEVO Y CORREGIDO)
DROP PROCEDURE IF EXISTS ActualizarMascota$$
CREATE PROCEDURE ActualizarMascota(
    IN p_cod_mas  INT,
    IN p_nom_mas VARCHAR(100),
    IN p_especie VARCHAR(100),
    IN p_raza VARCHAR(100),
    IN p_edad DECIMAL(10,2),
    IN p_genero VARCHAR(25),
    IN p_peso DECIMAL(10,2),
    IN p_id_pro INT,
    IN p_foto VARCHAR(255)
)
BEGIN
    UPDATE mascotas SET
        nom_mas = p_nom_mas,
        especie = p_especie,
        raza = p_raza,
        edad = p_edad,
        genero = p_genero,
        peso = p_peso,
        id_pro = p_id_pro,
        foto = p_foto
    WHERE cod_mas = p_cod_mas;
END$$


-- Procedimiento para Eliminar Mascota (NUEVO)
DROP PROCEDURE IF EXISTS EliminarMascota$$
CREATE PROCEDURE EliminarMascota(
    IN p_cod_mas INT
)
BEGIN
    -- Primero, eliminar registros dependientes para evitar errores de llave foránea
    DELETE FROM historiales_medicos WHERE cod_mas = p_cod_mas;
    DELETE FROM citas WHERE cod_mas = p_cod_mas;
    
    -- Finalmente, eliminar la mascota
    DELETE FROM mascotas WHERE cod_mas = p_cod_mas;
END$$

DELIMITER ;


