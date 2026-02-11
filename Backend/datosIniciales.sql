USE sirevif;

INSERT IGNORE INTO tipo_victimas (id, tipo) VALUES
(1, 'Victima Principal'),
(2, 'Segunda Victima'),
(3, 'Tercera Victima'),
(4, 'Cuarta Victima'),
(5, 'Quinta Victima'),
(6, 'Sexta Victima');

INSERT IGNORE INTO tipo_victimarios (id, tipo) VALUES
(1, 'Victimario Principal'),
(2, 'Segundo Victimario'),
(3, 'Tercer Victimario'),
(4, 'Cuarto Victimario'),
(5, 'Quinto Victimario'),
(6, 'Sexto Victimario');

INSERT IGNORE INTO roles (id, rol) VALUES
(1, 'Administrador'),
(2, 'Personal de Comisaria');

INSERT IGNORE INTO comisarias (id, numero, lugar) VALUES
(1, 1, 'Casa de Justicia'),
(2, 2, 'Barrio Libertador'),
(3, 3, 'Barrio Cooservicios'),
(4, 4, 'Barrio Las Nieves'),
(5, 5, 'Antigua Comisaria Tercera de Flia - Barrio Los Muiscas'),
(6, 6, 'Centro de Proteccion - Casa de Doña Ines de Hinojosa');

INSERT IGNORE INTO usuarios_limites (id, comisaria_rol, limite_usuarios, fecha_actualizacion) VALUES
(1, 'Administrador', 2, NOW()),
(2, 'Comisaría Primera', 2, NOW()),
(3, 'Comisaría Segunda', 2, NOW()),
(4, 'Comisaría Tercera', 2, NOW()),
(5, 'Comisaría Cuarta', 2, NOW()),
(6, 'Comisaría Quinta', 2, NOW()),
(7, 'Comisaría Sexta', 2, NOW());

INSERT IGNORE INTO usuarios (nombre, documento, cargo, correo, telefono, `contraseña`, comisaria_rol, rol_id, comisaria_id, estado)
VALUES (
  'Administrador Uno',
  '12345678',
  'Administrador',
  'admin@sirevif.com',
  '0111111111',
  '$2a$10$fL4x5DvVX5gL5qQ8fqJ3T.xF9e8Z7YHhG6s9BwR2nJvKpN8lL0mW',
  'Administrador',
  1,
  NULL,
  'activo'
);