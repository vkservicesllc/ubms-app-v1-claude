SELECT 'Creating table `app_vehicle`.`vehicles`...';
CREATE TABLE vehicles (

    id          MEDIUMINT UNSIGNED  AUTO_INCREMENT,  -- max 16,777,215 / 3 bytes
    vin         CHAR(17)            NOT NULL UNIQUE,
    category    CHAR(3)             NOT NULL,

    make        VARCHAR(30)         NOT NULL,
    model       VARCHAR(30)         NOT NULL,
    `year`      YEAR(4)             NOT NULL,

    PRIMARY KEY (id)

);