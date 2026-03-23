SELECT 'Creating table `app_online`.`users`...';
CREATE TABLE users (

    id           SMALLINT UNSIGNED         AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    `status`     ENUM('U', 'A', 'S', 'D')  NOT NULL DEFAULT 'U',  -- 'User', 'Admin', 'Super Admin', 'Developer'
    `condition`  ENUM('A', 'I', 'L')       NOT NULL DEFAULT 'A',  -- 'Active', 'Inactive', 'Locked'
    `location`   CHAR(2)                   NOT NULL,
    unscoped     BOOLEAN                   NOT NULL DEFAULT TRUE,  -- when TRUE and not DS, the user operates outside team scope

    username     VARCHAR(16)               DEFAULT NULL UNIQUE,
    _passKey     VARCHAR(256)              DEFAULT NULL,  -- hash
    passReset    BOOLEAN                   DEFAULT FALSE,
    fails        TINYINT UNSIGNED          NOT NULL DEFAULT 0,
    email        VARCHAR(100)              UNIQUE DEFAULT NULL,  -- if User should be deleted
    phone        CHAR(10)                  DEFAULT NULL,  -- US Only

    firstName    VARCHAR(30)               NOT NULL,
    lastName     VARCHAR(30)               NOT NULL,
    alias        VARCHAR(30)               DEFAULT NULL,
    gender       ENUM('M', 'F')            DEFAULT NULL,

    settings     JSON                      DEFAULT NULL,

    -- Created/Updated in ADMIN only
    createdBy    SMALLINT UNSIGNED         DEFAULT NULL,  -- NULL when created by code
    createdAt    TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog    JSON                      DEFAULT NULL,
    deletedBy    SMALLINT UNSIGNED         DEFAULT NULL,  -- User who deleted the record
    deletedAt    TIMESTAMP                 DEFAULT NULL,
    declinedAt   TIMESTAMP                 DEFAULT NULL,  -- If declined terms and conditions

    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (deletedBy) REFERENCES users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_online`.`user_registration`...';
CREATE TABLE user_registration (

    formId     CHAR(24)           NOT NULL UNIQUE,
    userId     SMALLINT UNSIGNED  NOT NULL UNIQUE,

    -- Created in ADMIN only
    invitedBy  SMALLINT UNSIGNED  NOT NULL,
    invitedAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitedBy) REFERENCES users(id),
    PRIMARY KEY (userId)

);


SELECT 'Creating table `app_online`.`user_passreset`...';
CREATE TABLE user_passreset (

    resetId    CHAR(12)           NOT NULL UNIQUE,
    userId     SMALLINT UNSIGNED  NOT NULL,

    -- Created in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    PRIMARY KEY (userId)

);


SELECT 'Creating table `app_online`.`roles`...';
CREATE TABLE roles (

    id             TINYINT UNSIGNED   AUTO_INCREMENT,  -- max 255 / 1 byte
    category       VARCHAR(3)         DEFAULT NULL,
    `location`     CHAR(2)            DEFAULT NULL,

    name           VARCHAR(24)        NOT NULL,
    permissions    JSON               NOT NULL,

    -- Created/Updated in ADMIN only
    createdBy      SMALLINT UNSIGNED  NOT NULL,
    createdAt      TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog      JSON               DEFAULT NULL,

    UNIQUE KEY unique_combination(category, `location`, name),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_online`.`sites`...';
CREATE TABLE sites (

    id         SMALLINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,  -- max 65,535 / 2 bytes
    category   VARCHAR(3)         NOT NULL,
    active     BOOLEAN            NOT NULL DEFAULT FALSE,

    domain     VARCHAR(50)        NOT NULL,
    name       VARCHAR(50)        NOT NULL,
    alias      VARCHAR(20)        DEFAULT NULL,

    -- Created via terminal only
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP

);


SELECT 'Creating table `app_online`.`sessions`...';
CREATE TABLE sessions (

    userId     SMALLINT UNSIGNED  NOT NULL,
    siteId     SMALLINT UNSIGNED  DEFAULT NULL,
    branch     VARCHAR(20)        NOT NULL,

    _clientIp  VARBINARY(16)      NOT NULL,  -- insert with INET6_ATON, select with INET6_NTOA (works both ip types)

    lastLogin  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUrl    VARCHAR(256)       NOT NULL DEFAULT '/',

    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (siteId) REFERENCES sites(id)

);


SELECT 'Creating table `app_online`.`tokens`...';
CREATE TABLE tokens (

    userId     SMALLINT UNSIGNED  NOT NULL,
    verified   BOOLEAN            DEFAULT FALSE,

    _token     VARBINARY(32)      DEFAULT NULL,  -- AES_ENCRYPT
    _clientIp  VARBINARY(16)      NOT NULL,  -- insert with INET6_ATON, select with INET6_NTOA (works both ip types)

    -- Created automatically
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES users(id)

);


SELECT 'Creating table `app_online`.`teams`...';
CREATE TABLE teams (

    id           TINYINT UNSIGNED   AUTO_INCREMENT,  -- max 255 / 1 byte
    scoped       BOOLEAN            DEFAULT FALSE,  -- When TRUE, only visible in a scope, hidden for unscoped users and can only be assigned
    -- category     VARCHAR(3)         NOT NULL,
    -- deptId       TINYINT UNSIGNED   NOT NULL,

    name         VARCHAR(12)        NOT NULL UNIQUE,
    description  VARCHAR(50)        DEFAULT NULL,
    settings     JSON               DEFAULT NULL,

    -- Created/Updated in ADMIN only
    createdBy    SMALLINT UNSIGNED  NOT NULL,
    createdAt    TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog    JSON               DEFAULT NULL,

    FOREIGN KEY (createdBy) REFERENCES users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_online`.`team_profiles`...';
CREATE TABLE team_profiles (

    teamId     TINYINT UNSIGNED   NOT NULL,
    placeId    VARCHAR(255)       DEFAULT NULL,

    busName    VARCHAR(35)        NOT NULL,  -- Must not contain Co Type in the Name, because it is a separate entity
    coType     VARCHAR(6)         NOT NULL,
    phone      CHAR(10)           NOT NULL,
    email      VARCHAR(100)       DEFAULT NULL,
    website    VARCHAR(100)       DEFAULT NULL,
    address1   VARCHAR(35)        NOT NULL,
    address2   VARCHAR(25)        DEFAULT NULL,
    city       VARCHAR(30)        NOT NULL,
    `state`    CHAR(2)            NOT NULL,
    zip        VARCHAR(10)        NOT NULL,

    -- Created/Updated in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(id),
    PRIMARY KEY (teamId)

);


SELECT 'Creating table `app_online`.`user_role_map`...';
CREATE TABLE user_role_map (

    userId     SMALLINT UNSIGNED  NOT NULL,
    roleId     TINYINT UNSIGNED   NOT NULL,

    -- Created in ADMIN only
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (userId, roleId)

);


SELECT 'Creating table `app_online`.`user_team_map`...';
CREATE TABLE user_team_map (

    teamId     TINYINT UNSIGNED   NOT NULL,
    userId     SMALLINT UNSIGNED  NOT NULL,

    -- Created in ADMIN only; Not updated
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    PRIMARY KEY (userId, teamId)

);