SELECT 'Creating table `app_office`.`offices`...';
CREATE TABLE offices (

    id          TINYINT UNSIGNED   AUTO_INCREMENT,  -- max 255 / 1 bytes
    `location`  CHAR(2)            NOT NULL,

    name        VARCHAR(30)        NOT NULL UNIQUE,
    since       DATE               NOT NULL,

    -- Create/update location required
    createdBy   SMALLINT UNSIGNED  NOT NULL,
    createdAt   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON               NOT NULL,
    updateLog   JSON               DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_office`.`office_phones`...';
CREATE TABLE office_phones (

    officeId   TINYINT UNSIGNED   NOT NULL,
    since      DATE NOT NULL,  -- Automatically insert Effective Date when New Company recorded

    `number`   CHAR(10)           NOT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON               NOT NULL,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (officeId) REFERENCES offices(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (officeId, since)

);


SELECT 'Creating table `app_office`.`office_emails`...';
CREATE TABLE office_emails (

    officeId   TINYINT UNSIGNED   NOT NULL,
    since      DATE               NOT NULL,

    email      VARCHAR(100)       NOT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON               NOT NULL,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (officeId) REFERENCES offices(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (officeId, since)

);


SELECT 'Creating table `app_office`.`office_addresses`...';
CREATE TABLE office_addresses (

    officeId   TINYINT UNSIGNED   NOT NULL,
    placeId    VARCHAR(255)       DEFAULT NULL,
    since      DATE               NOT NULL,

    country    CHAR(2)            NOT NULL,
    address1   VARCHAR(35)        NOT NULL,
    address2   VARCHAR(25)        DEFAULT NULL,
    city       VARCHAR(30)        NOT NULL,
    `state`    CHAR(2)            DEFAULT NULL,
    oblast     VARCHAR(30)        DEFAULT NULL,
    zip        VARCHAR(10)        DEFAULT NULL,
    postal     VARCHAR(10)        DEFAULT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON               NOT NULL,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (officeId) REFERENCES offices(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (officeId, since)

);


SELECT 'Creating table `app_office`.`employees`...';
CREATE TABLE employees (

    id         SMALLINT UNSIGNED   AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    personId   MEDIUMINT UNSIGNED  NOT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED   NOT NULL,
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (personId) REFERENCES app_person.individuals(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


-- CREATE TABLE phoneline_providers (

--     id         TINYINT UNSIGNED AUTO_INCREMENT,  -- max 255 / 1 bytes

--     name       VARCHAR(30) NOT NULL UNIQUE,
--     alias      VARCHAR(5) DEFAULT NULL,

--     createdBy  SMALLINT UNSIGNED NOT NULL,
--     createdAt  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updateLog  JSON DEFAULT NULL,

--     FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
--     PRIMARY KEY (id)

-- );


-- CREATE TABLE provider_accounts (

--     id          SMALLINT UNSIGNED AUTO_INCREMENT,
--     providerId  TINYINT UNSIGNED NOT NULL,
--     phone       CHAR(10) NOT NULL UNIQUE,

--     createdBy  SMALLINT UNSIGNED NOT NULL,
--     createdAt  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updateLog  JSON DEFAULT NULL,

--     FOREIGN KEY (providerId) REFERENCES phoneline_providers(id),
--     FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
--     PRIMARY KEY (id)

-- );


-- CREATE TABLE work_phones (

--     accountId   SMALLINT UNSIGNED NOT NULL,
--     employeeId  SMALLINT UNSIGNED NOT NULL,

--     directLine  CHAR(10) NOT NULL,
--     primaryExt  VARCHAR(5) NOT NULL,

--     createdBy   SMALLINT UNSIGNED NOT NULL,
--     createdAt   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updateLog   JSON DEFAULT NULL,

--     FOREIGN KEY (accountId) REFERENCES provider_accounts(id),
--     FOREIGN KEY (employeeId) REFERENCES employees(id),
--     FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
--     PRIMARY KEY (accountId, employeeId)

-- );


SELECT 'Creating table `app_office`.`office_employee_map`...';
CREATE TABLE office_employee_map (

    officeId    TINYINT UNSIGNED   NOT NULL,
    employeeId  SMALLINT UNSIGNED  NOT NULL,
    since       DATE               NOT NULL,

    -- Create/update location required
    createdBy   SMALLINT UNSIGNED  NOT NULL,
    createdAt   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog   JSON               DEFAULT NULL,

    FOREIGN KEY (officeId) REFERENCES offices(id),
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    PRIMARY KEY (officeId, employeeId)

);