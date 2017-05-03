--
-- File generated with SQLiteStudio v3.1.1 on mar. Feb. 28 02:48:39 2017
--
-- Text encoding used: System
--

-- Table: consumo
CREATE TABLE consumo (
    numero     INTEGER       PRIMARY KEY AUTOINCREMENT,
    mesa       NUMBER        REFERENCES mesa,
    ruc        VARCHAR (12),
    numero_doc VARCHAR (12),
    nombre     VARCHAR (120),
    fecha      DATE,
    empleado   VARCAHR (6)   REFERENCES empleado,
    cancelado  BOOLEAN
);


-- Table: consumo_detalle
CREATE TABLE consumo_detalle (
    consumo         INTEGER        REFERENCES consumo,
    numero          INTEGER        PRIMARY KEY AUTOINCREMENT,
    item            INTEGER        REFERENCES menu (numero),
    cantidad        NUMBER,
    precio_unitario NUMBER (10, 2),
    total           NUMBER (10, 2),
    descripcion     VARCHAR (50) 
);


-- Table: empleado
CREATE TABLE empleado (
    codigo   VARCHAR (6)   PRIMARY KEY,
    nombre   VARCHAR (120),
    dni      VARCHAR (8),
    cargo    VARCHAR (20),
    username VARCHAR (60) 
);


-- Table: mensaje
CREATE TABLE mensaje (
    numero     INTEGER      PRIMARY KEY AUTOINCREMENT,
    origen     VARCHAR (60) REFERENCES usuario,
    destino    TEXT,
    fecha_hora DATETIME,
    leido      BOOLEAN,
    texto      TEXT
);


-- Table: menu
CREATE TABLE menu (
    numero      INTEGER         PRIMARY KEY AUTOINCREMENT,
    titulo      VARCHAR (50),
    descripcion TEXT,
    imagen      VARCHAR (120),
    precio      DECIMAL (10, 2),
    tipo        VARCHAR (12),
    disponible  BOOLEAN
);


-- Table: mesa
CREATE TABLE mesa (
    numero      NUMBER       PRIMARY KEY,
    descripcion VARCHAR (50),
    capacidad   NUMBER
);


-- Table: pedido
CREATE TABLE pedido (
    numero   INTEGER     PRIMARY KEY AUTOINCREMENT,
    mesa     NUMBER      REFERENCES mesa,
    hora     DATETIME,
    activo   BOOLEAN,
    empleado VARCHAR (6) REFERENCES empleado
);


-- Table: pedido_detalle
CREATE TABLE pedido_detalle (
    pedido       INTEGER REFERENCES pedido,
    numero       INTEGER PRIMARY KEY AUTOINCREMENT,
    item         INTEGER REFERENCES menu,
    cantidad     NUMBER,
    indicaciones TEXT,
    atendido     BOOLEAN
);


-- Table: reserva
CREATE TABLE reserva (
    numero      INTEGER      PRIMARY KEY AUTOINCREMENT,
    descripcion VARCHAR (50),
    cantidad    NUMBER,
    inicio      DATETIME,
    fin         DATETIME,
    activa      BOOLEAN,
    mesa        NUMBER       REFERENCES mesa
);


-- Table: usuario
CREATE TABLE usuario (
    username       VARCHAR (60),
    password       VARCHAR (60),
    nombre         VARCHAR (60),
    admin          BOOLEAN,
    active         BOOLEAN,
    grupos         TEXT,
    imagen         VARCHAR (250),
    mensajesleidos DATETIME,
    PRIMARY KEY (
        username
    )
);


-- View: vista_mesa
CREATE VIEW vista_mesa AS
    SELECT numero,
           descripcion,
           capacidad,
           CASE WHEN NOT EXISTS (
                             SELECT 1
                               FROM pedido p,
                                    pedido_detalle d
                              WHERE p.activo = 1 AND 
                                    d.pedido = p.numero AND 
                                    p.mesa = m.numero
                         )
           THEN 'No Atendido' WHEN 1 = (
                                           SELECT (count( * ) - sum(d.atendido) ) / count( * ) 
                                             FROM pedido p,
                                                  pedido_detalle d
                                            WHERE p.activo = 1 AND 
                                                  d.pedido = p.numero AND 
                                                  p.mesa = m.numero
                                       )
           THEN 'Pendiente' WHEN 0 = (
                                         SELECT count( * ) - sum(d.atendido) 
                                           FROM pedido p,
                                                pedido_detalle d
                                          WHERE p.activo = 1 AND 
                                                d.pedido = p.numero AND 
                                                p.mesa = m.numero
                                     )
           THEN 'Atendido' ELSE 'Parcial' END AS estado
      FROM mesa m;


