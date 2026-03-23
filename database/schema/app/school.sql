SELECT 'Creating table `app_school`.`schools`...';
CREATE TABLE schools (

    id         SMALLINT UNSIGNED  AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    companyId  SMALLINT UNSIGNED  UNIQUE NOT NULL,

    -- Created in ADMIN only; Update location required
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES app_business.companies(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_school`.`students`...';
CREATE TABLE students (

    id         MEDIUMINT UNSIGNED  AUTO_INCREMENT,  -- max 16,777,215 / 3 bytes
    personId   MEDIUMINT UNSIGNED  NOT NULL,
    schoolId   SMALLINT UNSIGNED   NOT NULL,

    _passKey   VARCHAR(256)        DEFAULT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- Student added through Application if NULL
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (personId) REFERENCES app_person.individuals(id),
    FOREIGN KEY (schoolId) REFERENCES schools(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);