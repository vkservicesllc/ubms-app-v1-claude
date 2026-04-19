SELECT 'Creating table `app_business`.`companies`...';
CREATE TABLE companies (

    id         SMALLINT UNSIGNED  AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    category   VARCHAR(3)         NOT NULL,
    _ein       VARBINARY(32)      DEFAULT NULL UNIQUE,  -- AES_ENCRYPT
    duns       VARCHAR(9)         UNIQUE DEFAULT NULL,
    website    VARCHAR(100)       DEFAULT NULL,

    active     BOOLEAN            NOT NULL DEFAULT TRUE,
    confirmed  BOOLEAN            NOT NULL DEFAULT FALSE,
    locked     BOOLEAN            NOT NULL DEFAULT FALSE,
    global     BOOLEAN            NOT NULL DEFAULT TRUE,  -- is visible in global list if TRUE, can optionally be set to FALSE if the company is assigned to a site
    lastLogo   DATE               DEFAULT NULL,
    since      DATE               NOT NULL,
    until      DATE               DEFAULT NULL,  -- active while NULL, (if canceled, must be final ???, per NAZAR)

    style      JSON               DEFAULT NULL,

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_business`.`company_names`...';
CREATE TABLE company_names (

    companyId  SMALLINT UNSIGNED  NOT NULL,
    since      DATE               NOT NULL,  -- Automatic when Company first created (will match companies.since)

    busName    VARCHAR(35)        NOT NULL,  -- Must not contain Co Type in the Name, because it is a separate entity
    coType     VARCHAR(6)         NOT NULL,
    alias      VARCHAR(6)         NOT NULL UNIQUE,

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (companyId, since)

);


SELECT 'Creating table `app_business`.`company_addresses`...';
CREATE TABLE company_addresses (

    companyId  SMALLINT UNSIGNED  NOT NULL,
    placeId    VARCHAR(255)       DEFAULT NULL,
    since      DATE               NOT NULL,  -- Automatic when Company first created (will match companies.since)

    address1   VARCHAR(35)        NOT NULL,
    address2   VARCHAR(25)        DEFAULT NULL,
    city       VARCHAR(30)        NOT NULL,
    `state`    CHAR(2)            NOT NULL,
    zip        VARCHAR(10)        NOT NULL,
    mail       BOOLEAN            NOT NULL DEFAULT TRUE,

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (companyId, since)

);


SELECT 'Creating table `app_business`.`company_mail`...';
CREATE TABLE company_mail LIKE company_addresses;
ALTER TABLE company_mail
DROP COLUMN mail;


SELECT 'Creating table `app_business`.`company_phones`...';
CREATE TABLE company_phones (

    companyId  SMALLINT UNSIGNED  NOT NULL,
    since      DATE               NOT NULL,  -- Automatic when Company first created (will match companies.since)

    phone      CHAR(10)           NOT NULL,

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (companyId, since)

);


SELECT 'Creating table `app_business`.`company_faxes`...';
CREATE TABLE company_faxes LIKE company_phones;
ALTER TABLE company_faxes
RENAME COLUMN phone TO fax;


SELECT 'Creating table `app_business`.`company_emails`...';
CREATE TABLE company_emails LIKE company_phones;
ALTER TABLE company_emails
CHANGE COLUMN phone email VARCHAR (100) NOT NULL;


SELECT 'Creating table `app_business`.`owners`...';
CREATE TABLE owners (

    id         SMALLINT UNSIGNED   AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    personId   MEDIUMINT UNSIGNED  NOT NULL,
    signature  BOOLEAN             NOT NULL DEFAULT FALSE,
    -- A person must not be deleted when an owner is deleted

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED   NOT NULL,
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (personId) REFERENCES app_person.individuals(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_business`.`company_ownerships`...';
CREATE TABLE company_ownerships (

    companyId   SMALLINT UNSIGNED  NOT NULL,
    ownerId     SMALLINT UNSIGNED  NOT NULL,
    since       DATE               NOT NULL,  -- Automatically insert Effective Date when New Company recorded

    -- Created/Updated in ADMIN only
    createdBy   SMALLINT UNSIGNED  NOT NULL,
    createdAt   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog   JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (ownerId) REFERENCES owners(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (companyId, ownerId, since)

);


SELECT 'Creating table `app_business`.`refsources`...';
CREATE TABLE refsources (

    id         SMALLINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,

    name       VARCHAR(30)        NOT NULL,

    -- Created in ADMIN only; Not updated
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_business`.`user_company_map`...';
CREATE TABLE user_company_map (

    companyId  SMALLINT UNSIGNED NOT NULL,
    userId     SMALLINT UNSIGNED NOT NULL,

    -- Created in ADMIN only; Not updated
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (userId) REFERENCES app_online.users(id) ON DELETE CASCADE,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    PRIMARY KEY (userId, companyId)

);


SELECT 'Creating table `app_business`.`company_refsource_map`...';
CREATE TABLE company_refsource_map (

    companyId  SMALLINT UNSIGNED NOT NULL,
    refSrcId   SMALLINT UNSIGNED NOT NULL,

    -- Created in ADMIN only; Not updated
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (refSrcId) REFERENCES app_online.users(id) ON DELETE CASCADE,
    PRIMARY KEY (companyId, refSrcId)

);