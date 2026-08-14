SELECT 'Creating table `app_person`.`individuals`...';
CREATE TABLE individuals (

    id          MEDIUMINT UNSIGNED  AUTO_INCREMENT,  -- max 16,777,215 / 3 bytes
    -- dob         DATE                NOT NULL,
    dob         DATE                DEFAULT '0000-00-00',

    -- These 2 parameters are optional but extremely powerful when set
    gender      ENUM('M', 'F')      NOT NULL,
    _ssn        VARBINARY(32)       DEFAULT NULL UNIQUE,  -- AES_ENCRYPT

    -- Create/update location required
    createdBy   SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                NOT NULL,
    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_person`.`names`...';
CREATE TABLE names (

    personId    MEDIUMINT UNSIGNED  NOT NULL,
    since       DATE                NOT NULL,
    -- Typically an individual should have the same `since` date as `dob`
    -- If `dob` is set, this parameter must be set up also by default
    -- A name change must contain a new `since` date

    prefix      VARCHAR(10)         DEFAULT NULL,
    firstName   VARCHAR(30)         NOT NULL,
    alias       VARCHAR(30)         DEFAULT NULL,
    middleName  VARCHAR(30)         DEFAULT NULL,
    lastName    VARCHAR(30)         NOT NULL,
    suffix      VARCHAR(10)         DEFAULT NULL,

    -- Create/update location required
    createdBy   SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                NOT NULL,
    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);


SELECT 'Creating table `app_person`.`legal_presence`...';
CREATE TABLE legal_presence (

    personId   MEDIUMINT UNSIGNED   NOT NULL,
    since      DATE                 NOT NULL,  -- Always shows the last registered status

    `status`   TINYINT              NOT NULL,  -- idx for Array [ 'US Citizen', 'Permanent Resident', 'Authorized to work' ]
    expiresOn  DATE                 DEFAULT NULL,
    issuedOn   DATE                 DEFAULT NULL,  -- NOT sorted by Issue/Expiration Dates
    docNumber  VARCHAR(20)          DEFAULT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED    DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                 NOT NULL,
    updateLog  JSON                 DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);


SELECT 'Creating table `app_person`.`maritals`...';
CREATE TABLE maritals (

    personId   MEDIUMINT UNSIGNED             NOT NULL,
    since      DATE                           NOT NULL,  -- Automatic (createdOn)

    `status`   ENUM('s', 'm', 'd', 'p', 'w')  NOT NULL,  -- 'Single', 'Married', 'Divorced', 'Separated (Parted)', 'Widowed'

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED              DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                           NOT NULL,
    updateLog  JSON                           DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);


SELECT 'Creating table `app_person`.`phones`...';
CREATE TABLE phones ( -- Refers to Cell Phones in the modern World

    personId   MEDIUMINT UNSIGNED  NOT NULL,
    since      DATE                NOT NULL,
    -- Typically an individual should have the same `since` date as `dob`
    -- If `since` not provided, 'dob' should be used in its place

    phone      CHAR(10)            NOT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);

-- SELECT 'Creating table `app_person`.`work_phones`...';
-- CREATE TABLE work_phones LIKE phones;

-- SELECT 'Creating table `app_person`.`landline_phones`...';
-- CREATE TABLE landline_phones LIKE phones;


SELECT 'Creating table `app_person`.`addresses`...';
CREATE TABLE addresses (

    personId   MEDIUMINT UNSIGNED  NOT NULL,
    placeId    VARCHAR(255)        DEFAULT NULL,
    since      DATE                NOT NULL,
    -- Automatic (DOB) unless provided explicitly

    address1   VARCHAR(35)         NOT NULL,
    address2   VARCHAR(25)         DEFAULT NULL,
    city       VARCHAR(30)         NOT NULL,
    `state`    CHAR(2)             NOT NULL,
    zip        VARCHAR(10)         NOT NULL,

    -- Create/update location required
    createdBy   SMALLINT UNSIGNED  DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON               NOT NULL,
    updateLog   JSON               DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);

-- SELECT 'Creating table `app_person`.`mail_addresses`...';
-- CREATE TABLE mail_addresses LIKE addresses;


SELECT 'Creating table `app_person`.`emails`...';
CREATE TABLE emails (

    personId   MEDIUMINT UNSIGNED  NOT NULL,
    since      DATE                NOT NULL,  -- Automatic if not provided

    email      VARCHAR(100)        NOT NULL,

    -- Create/update location required
    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    PRIMARY KEY (personId, since)

);


SELECT 'Creating table `app_person`.`identifications`...';
CREATE TABLE identifications (

    id             MEDIUMINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    personId       MEDIUMINT UNSIGNED  NOT NULL,
    addrSince      DATE                DEFAULT NULL,  -- If not NULL, then use the address based on personId and addrSince

    driver         BOOLEAN             NOT NULL DEFAULT TRUE,
    commercial     BOOLEAN             DEFAULT NULL, -- NULL when when not a driver's license
    `number`       VARCHAR(15)         NOT NULL,
    `class`        VARCHAR(5)          DEFAULT NULL,
    `state`        VARCHAR(2)          NOT NULL,
    issuedOn       DATE                DEFAULT NULL, -- Allow NULL since old applications may not have this info
    expiresOn      DATE                NOT NULL,
    endorsement    VARCHAR(65)         DEFAULT NULL,
    restriction    VARCHAR(65)         DEFAULT NULL,

    -- Backup Address on ID only, no residence registered
    address1       VARCHAR(35)         DEFAULT NULL,
    address2       VARCHAR(25)         DEFAULT NULL,
    addrCity       VARCHAR(30)         DEFAULT NULL,
    addrState      VARCHAR(2)          DEFAULT NULL,
    addrZip        VARCHAR(10)         DEFAULT NULL,

    -- Create/update location required
    createdBy      SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn      JSON                NOT NULL,
    updateLog      JSON                DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (personId) REFERENCES individuals(id) ON DELETE CASCADE,
    FOREIGN KEY (personId, addrSince) REFERENCES addresses(personId, since) ON UPDATE CASCADE  -- Should work when addrSince is not null

);