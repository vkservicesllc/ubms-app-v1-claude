SELECT 'Creating table `app_carrier`.`carriers`...';
CREATE TABLE carriers (

    id         SMALLINT UNSIGNED  AUTO_INCREMENT,  -- max 65,535 / 2 bytes
    companyId  SMALLINT UNSIGNED  UNIQUE NOT NULL,

    mc         VARCHAR(7)         UNIQUE NOT NULL,
    usdot      VARCHAR(8)         UNIQUE NOT NULL,
    scac       VARCHAR(5)         UNIQUE DEFAULT NULL,
    irp        VARCHAR(8)         UNIQUE DEFAULT NULL,
    -- stateTax   JSON               DEFAULT NULL,
    efs        VARCHAR(7)         UNIQUE DEFAULT NULL,
    fleetOne   VARCHAR(7)         UNIQUE DEFAULT NULL,
    transflo   VARCHAR(7)         UNIQUE DEFAULT NULL,

    -- Created in ADMIN only; Update location required
    createdBy  SMALLINT           UNSIGNED NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (companyId) REFERENCES app_business.companies(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_carrier`.`carrier_ifta`...';
CREATE TABLE carrier_ifta (

    carrierId     SMALLINT           UNSIGNED NOT NULL,
    since         DATE               NOT NULL,  -- Automatically insert Effective Date when New Carrier recorded

    `number`      VARCHAR(9)         UNIQUE DEFAULT NULL,
    jurisdiction  CHAR(2)            NOT NULL,

    -- Created in ADMIN only; Update location required
    createdBy     SMALLINT UNSIGNED  NOT NULL,
    createdAt     TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog     JSON               DEFAULT NULL,

    FOREIGN KEY (carrierId) REFERENCES carriers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`carrier_state_permits`...';
CREATE TABLE carrier_state_permits (

    carrierId  SMALLINT           UNSIGNED NOT NULL UNIQUE,

    `ca`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `fl`       VARCHAR(8)         UNIQUE DEFAULT NULL,
    `il`       VARCHAR(9)         UNIQUE DEFAULT NULL,
    `in`       VARCHAR(6)         UNIQUE DEFAULT NULL,
    `ky`       VARCHAR(6)         UNIQUE DEFAULT NULL,
    `nj`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `nm`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `nv`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `ny`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `or`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `tx`       VARCHAR(7)         UNIQUE DEFAULT NULL,
    `wa`       VARCHAR(7)         UNIQUE DEFAULT NULL,

    -- Created in ADMIN only; Update location required
    createdBy  SMALLINT UNSIGNED  NOT NULL,
    createdAt  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateLog  JSON               DEFAULT NULL,

    FOREIGN KEY (carrierId) REFERENCES carriers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (carrierId)
);


SELECT 'Creating table `app_carrier`.`drivers`...';
CREATE TABLE drivers (

    -- Identification
    id           MEDIUMINT UNSIGNED  AUTO_INCREMENT,  -- max 16,777,215 / 3 bytes
    personId     MEDIUMINT UNSIGNED  NOT NULL UNIQUE,
    locked       BOOLEAN             DEFAULT FALSE,  -- When driver's application in status 'p', keep the driver locked for other applications
    blackListed  BOOLEAN             DEFAULT FALSE,

    -- Login
    _passKey     VARCHAR(256)        DEFAULT NULL,

    -- Create/update location required
    createdBy    SMALLINT UNSIGNED   DEFAULT NULL,  -- Driver added through Application if NULL
    createdAt    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn    JSON                NOT NULL,
    updateLog    JSON                DEFAULT NULL,

    FOREIGN KEY (personId) REFERENCES app_person.individuals(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_carrier`.`driver_appdefs`...';
CREATE TABLE driver_appdefs (

    -- Identification
    driverId     MEDIUMINT UNSIGNED  NOT NULL,

    appCount     TINYINT UNSIGNED    DEFAULT 1,
    complete     BOOLEAN             DEFAULT FALSE,
    prevCountry  VARCHAR(2)          DEFAULT NULL,
    expDate      DATE                DEFAULT NULL,
    cache        JSON                DEFAULT NULL,

    createdBy    SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn    JSON                NOT NULL,
    updateLog    JSON                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (driverId)

);


SELECT 'Creating table `app_carrier`.`driver_medcards`...';
CREATE TABLE driver_medcards (

    -- Identification
    id         MEDIUMINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    driverId   MEDIUMINT UNSIGNED  NOT NULL,

    expiresOn  DATE                NOT NULL,
    issuedOn   DATE                DEFAULT NULL, -- Allow NULL since old applications may not have this info
    nrcme      VARCHAR(12)         DEFAULT NULL, -- Allow NULL since old applications may not have this info

    -- Create/Update location required
    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`driver_citations`...';
CREATE TABLE driver_citations (

    id         INT UNSIGNED        AUTO_INCREMENT PRIMARY KEY,
    driverId   MEDIUMINT UNSIGNED  NOT NULL,

    violation  VARCHAR(20)         NOT NULL,
    other      VARCHAR(25)         DEFAULT NULL,
    citedOn    DATE                NOT NULL,
    `state`    CHAR(2)             NOT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`driver_accidents`...';
CREATE TABLE driver_accidents (

    id          INT UNSIGNED        AUTO_INCREMENT PRIMARY KEY,
    driverId    MEDIUMINT UNSIGNED  NOT NULL,

    collision   VARCHAR(20)         NOT NULL,
    other       VARCHAR(25)         DEFAULT NULL,
    `date`      DATE                NOT NULL,
    `state`     CHAR(2)             NOT NULL,
    injuries    BOOLEAN             NOT NULL,
    fatalities  BOOLEAN             NOT NULL,

    createdBy   SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`driver_cdlschools`...';
CREATE TABLE driver_cdlschools (

    driverId   MEDIUMINT UNSIGNED  NOT NULL,

    name       VARCHAR(25)         NOT NULL,
    phone      VARCHAR(10)         NOT NULL,
    state      VARCHAR(2)          NOT NULL,
    endDate    DATE                NOT NULL,
    duration   VARCHAR(5)          NOT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (driverId)

);


SELECT 'Creating table `app_carrier`.`driver_employments`...';
CREATE TABLE driver_employments (

    id         INT UNSIGNED         AUTO_INCREMENT PRIMARY KEY,  -- max 4,294,967,295 / 4 bytes
    driverId   MEDIUMINT UNSIGNED   NOT NULL,
    placeId    VARCHAR(255)         DEFAULT NULL,
    usdot      VARCHAR(8)           DEFAULT NULL,
    locked     BOOLEAN              DEFAULT FALSE,

    employer   VARCHAR(40)          NOT NULL,
    phone      CHAR(10)             NOT NULL,
    fax        VARCHAR(10)          DEFAULT NULL,
    email      VARCHAR(100)         DEFAULT NULL,
    address1   VARCHAR(35)          NOT NULL,
    address2   VARCHAR(25)          DEFAULT NULL,
    city       VARCHAR(30)          NOT NULL,
    `state`    CHAR(2)              NOT NULL,
    zip        VARCHAR(10)          NOT NULL,
    startedOn  DATE                 DEFAULT NULL,

    position   VARCHAR(20)          DEFAULT NULL,
    earnings   SMALLINT             DEFAULT NULL,  -- Monthly

    fmcsr      BOOLEAN              DEFAULT NULL,
    dotDat     BOOLEAN              DEFAULT NULL,

    rfl        VARCHAR(75)          DEFAULT NULL,  -- Reason for Leaving
    leftOn     DATE                 DEFAULT NULL,
    gapExpl    VARCHAR(75)          DEFAULT NULL,  -- Explanation of unemployment gap between the leftOn and the next date if exists

    createdBy  SMALLINT UNSIGNED    DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                 NOT NULL,
    updateLog  JSON                 DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`driver_businesses`...';
CREATE TABLE driver_businesses (

    id         MEDIUMINT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,  -- max 4,294,967,295 / 4 bytes
    driverId   MEDIUMINT UNSIGNED   NOT NULL,

    busName    VARCHAR(35)          DEFAULT NULL,
    coType     VARCHAR(6)           DEFAULT 'LLC',
    `state`    VARCHAR(2)           DEFAULT NULL,
    _ein       VARBINARY(32)        DEFAULT NULL,

    createdBy  SMALLINT UNSIGNED    DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                 NOT NULL,
    updateLog  JSON                 DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id)

);


SELECT 'Creating table `app_carrier`.`applications`...';
CREATE TABLE applications (

    -- Identification and Crusial Properties
    id               MEDIUMINT UNSIGNED                  AUTO_INCREMENT,  -- max 16,777,215 / 3 bytes
    formId           VARCHAR(12)                         NOT NULL UNIQUE,
    driverId         MEDIUMINT UNSIGNED                  DEFAULT NULL,
    teamId           TINYINT UNSIGNED                    DEFAULT NULL,
    userId           SMALLINT UNSIGNED                   DEFAULT NULL,
    carrierId        SMALLINT UNSIGNED                   DEFAULT NULL,
    refSrcId         SMALLINT UNSIGNED                   DEFAULT NULL,
    vhlCode          VARCHAR(3)                          DEFAULT NULL,
    dlId             MEDIUMINT UNSIGNED                  DEFAULT NULL,
    mecId            MEDIUMINT UNSIGNED                  DEFAULT NULL,
    busId            MEDIUMINT UNSIGNED                  DEFAULT NULL,

    -- Properties
    count            TINYINT UNSIGNED                    DEFAULT 1,
    cdlRole          BOOLEAN                             NOT NULL,
    position         ENUM('CD', 'OO', 'OD', 'LP')        DEFAULT NULL,  -- 'Company Driver', 'Owner Operator', 'Driver for Owner', 'Lease Purachser'
    `condition`      ENUM('p', 'c', 'a', 'r', 'b', 'h')  NOT NULL DEFAULT 'p',  -- 'pending', 'complete', 'approved', 'rejected', 'blacklisted', 'hired'
    public           BOOLEAN                             DEFAULT TRUE,  -- Available for public listing
    locked           BOOLEAN                             DEFAULT FALSE,  -- Impossible to delete when locked
    step             TINYINT                             NOT NULL DEFAULT 1, -- 0 when Pre-Application
    rehire           BOOLEAN                             DEFAULT FALSE,  -- The applicant is returning (recognized), so his ssn, dob and gender remain untouched
    imported         BOOLEAN                             DEFAULT FALSE,  -- Imported from old HRM
    cloud            BOOLEAN                             DEFAULT FALSE,  -- TRUE when online documents are uploaded to server (take server space)

    -- Address Info
    addrComplete     BOOLEAN                             DEFAULT NULL,

    -- Driver's License Additional Info
    dlDenied         BOOLEAN                             DEFAULT NULL,
    dlDeniedExpl     VARCHAR(100)                        DEFAULT NULL,
    dlRevoked        BOOLEAN                             DEFAULT NULL,
    dlRevokedExpl    VARCHAR(100)                        DEFAULT NULL,

    -- Fitness
    underMeds        BOOLEAN                             DEFAULT NULL,
    medList          VARCHAR(100)                        DEFAULT NULL,

    -- Legal Compliance
    dui              BOOLEAN                             DEFAULT NULL,
    duiInDecade      BOOLEAN                             DEFAULT NULL,
    criminal         BOOLEAN                             DEFAULT NULL,
    criminalExpl     VARCHAR(100)                        DEFAULT NULL,
    dotDat           BOOLEAN                             DEFAULT NULL,
    citations        BOOLEAN                             DEFAULT NULL,

    -- Safety
    accidents        BOOLEAN                             DEFAULT NULL,

    -- Experience
    experience       BOOLEAN                             DEFAULT NULL,
    cdlSchool        BOOLEAN                             DEFAULT NULL,

    -- Pre-Employment
    prevEmployed     BOOLEAN                             DEFAULT NULL,
    -- prevEmplGaps     BOOLEAN                             DEFAULT NULL,

    -- Business
    activeBusiness   BOOLEAN                             DEFAULT NULL,

    -- Signature Strings
    applicant_       VARCHAR(75)                         DEFAULT NULL,
    recruiter_       VARCHAR(75)                         DEFAULT NULL,
    coOwner_         VARCHAR(75)                         DEFAULT NULL,

    -- Create/Update location required
    createdBy        SMALLINT UNSIGNED                   DEFAULT NULL,  -- NULL when self registered
    createdAt        TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn        JSON                                NOT NULL,
    finishedAt       TIMESTAMP                           DEFAULT NULL,
    reviewedBy       SMALLINT UNSIGNED                   DEFAULT NULL,  -- `condition` => 'a': 'approvedBy/At, 'r': 'rejectedBy/At'
    reviewedAt       TIMESTAMP                           DEFAULT NULL,
    archivedBy       SMALLINT UNSIGNED                   DEFAULT NULL,
    archivedAt       TIMESTAMP                           DEFAULT NULL,
    updateLog        JSON                                DEFAULT NULL,

    FOREIGN KEY (driverId) REFERENCES drivers(id),
    FOREIGN KEY (teamId) REFERENCES app_online.teams(id),
    FOREIGN KEY (userId) REFERENCES app_online.users(id),
    FOREIGN KEY (carrierId) REFERENCES carriers(id),
    FOREIGN KEY (refSrcId) REFERENCES app_business.refsources(id),
    FOREIGN KEY (dlId) REFERENCES app_person.identifications(id),
    FOREIGN KEY (mecId) REFERENCES driver_medcards(id),
    FOREIGN KEY (busId) REFERENCES driver_businesses(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    FOREIGN KEY (reviewedBy) REFERENCES app_online.users(id),
    FOREIGN KEY (archivedBy) REFERENCES app_online.users(id),
    PRIMARY KEY (id)

);


SELECT 'Creating table `app_carrier`.`pre_applications`...';
CREATE TABLE pre_applications (

    -- Identification
    appId       MEDIUMINT UNSIGNED            NOT NULL,
    personId    MEDIUMINT UNSIGNED            DEFAULT NULL,  -- DRIVER+ / PERSON-
    _ssn        VARBINARY(32)                 DEFAULT NULL UNIQUE,  -- DRIVER- / PERSON- (AES_ENCRYPT)
    dob         DATE                          DEFAULT NULL,  -- DRIVER- / PERSON-

    -- Individual
    prefix      VARCHAR(10)                   DEFAULT NULL,
    firstName   VARCHAR(30)                   DEFAULT NULL,
    middleName  VARCHAR(30)                   DEFAULT NULL,
    lastName    VARCHAR(30)                   DEFAULT NULL,
    suffix      VARCHAR(10)                   DEFAULT NULL,
    gender      ENUM('M', 'F')                DEFAULT NULL,

    -- Contacts
    email       VARCHAR(100)                  DEFAULT NULL,
    phone       CHAR(10)                      DEFAULT NULL,

    -- Create/Update location required
    createdBy   SMALLINT UNSIGNED             DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                          NOT NULL,
    updateLog   JSON                          DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


-- SELECT 'Creating table `carrier_app`.`application_matchers`';
-- CREATE TABLE application_matchers (

--     -- Identification
--     appId         MEDIUMINT UNSIGNED  NOT NULL,
--     personId      MEDIUMINT UNSIGNED  DEFAULT NULL,
--     driverId      MEDIUMINT UNSIGNED  DEFAULT NULL,
--     companyId     SMALLINT UNSIGNED   DEFAULT NULL,
--     ownerId       SMALLINT UNSIGNED   DEFAULT NULL,
--     owPersonId    MEDIUMINT UNSIGNED  DEFAULT NULL,

--     -- nameSince     DATE                DEFAULT NULL,
--     -- legalSince    DATE                DEFAULT NULL,
--     -- maritalSince  DATE                DEFAULT NULL,
--     -- phoneSince    DATE                DEFAULT NULL,
--     -- emailSince    DATE                DEFAULT NULL,
--     -- addrSince     DATE                DEFAULT NULL,
--     dlId          MEDIUMINT UNSIGNED  DEFAULT NULL,
--     -- mecUntil      DATE                DEFAULT NULL,
--     busId         MEDIUMINT UNSIGNED  DEFAULT NULL,

--     -- coNameSince   DATE                DEFAULT NULL,
--     -- coAddrSince   DATE                DEFAULT NULL,
--     -- coMailSince   DATE                DEFAULT NULL,
--     -- coPhoneSince  DATE                DEFAULT NULL,
--     -- coFaxSince    DATE                DEFAULT NULL,
--     -- coEmailSince  DATE                DEFAULT NULL,
--     -- coOwnerSince  DATE                DEFAULT NULL,
--     -- owNameSince   DATE                DEFAULT NULL,

--     -- Create/Update location required
--     createdBy     SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
--     createdAt     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     createdIn     JSON                NOT NULL,
--     updateLog     JSON                DEFAULT NULL,

--     FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
--     FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
--     FOREIGN KEY (personId, nameSince) REFERENCES app_person.names(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (personId, legalSince) REFERENCES app_person.legal_presence(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (personId, maritalSince) REFERENCES app_person.maritals(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (personId, phoneSince) REFERENCES app_person.phones(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (personId, emailSince) REFERENCES app_person.emails(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (personId, addrSince) REFERENCES app_person.addresses(personId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (dlId) REFERENCES app_person.identifications(id),
--     FOREIGN KEY (driverId, mecUntil) REFERENCES driver_medcards(driverId, expiresOn) ON UPDATE CASCADE,
--     FOREIGN KEY (busId) REFERENCES driver_businesses(id),
--     FOREIGN KEY (companyId, coNameSince) REFERENCES app_business.company_names(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, coAddrSince) REFERENCES app_business.company_addresses(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, coMailSince) REFERENCES app_business.company_mail(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, coPhoneSince) REFERENCES app_business.company_phones(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, coFaxSince) REFERENCES app_business.company_faxes(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, coEmailSince) REFERENCES app_business.company_emails(companyId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (companyId, ownerId, coOwnerSince) REFERENCES app_business.company_ownerships(companyId, ownerId, since) ON UPDATE CASCADE,
--     FOREIGN KEY (owPersonId, owNameSince) REFERENCES app_person.names(personId, since) ON UPDATE CASCADE,
--     PRIMARY KEY (appId)

-- );


SELECT 'Creating table `app_carrier`.`addresses`...';
CREATE TABLE application_addresses (

    -- Identification
    appId        MEDIUMINT UNSIGNED  NOT NULL,
    personId     MEDIUMINT UNSIGNED  NOT NULL,
    since        DATE                NOT NULL,

    enough       BOOLEAN             NOT NULL,
    livedAbroad  BOOLEAN             DEFAULT NULL,

    -- Create/Update location required
    createdBy    SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn    JSON                NOT NULL,
    updateLog    JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (personId, since) REFERENCES app_person.addresses(personId, since) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId, since)

);


SELECT 'Creating table `app_carrier`.`application_citations`...';
CREATE TABLE application_citations (

    citId      INT UNSIGNED        NOT NULL,
    appId      MEDIUMINT UNSIGNED  NOT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (citId) REFERENCES driver_citations(id) ON DELETE CASCADE,
    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY(citId, appId)

);


SELECT 'Creating table `app_carrier`.`application_accidents`...';
CREATE TABLE application_accidents (

    accId      INT UNSIGNED        NOT NULL,
    appId      MEDIUMINT UNSIGNED  NOT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (accId) REFERENCES driver_accidents(id) ON DELETE CASCADE,
    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY(accId, appId)

);


SELECT 'Creating table `app_carrier`.`application_experiences`...';
CREATE TABLE application_experiences (

    appId      MEDIUMINT UNSIGNED  NOT NULL,

    cmv        BOOLEAN             DEFAULT NULL,
    vehicles   JSON                DEFAULT NULL,
    -- lastDate   DATE                NOT NULL,
    mileage    INT UNSIGNED        DEFAULT NULL,
    -- hours      JSON                DEFAULT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_employments`...';
CREATE TABLE application_employments (

    emplId       INT UNSIGNED              NOT NULL,
    appId        MEDIUMINT UNSIGNED        NOT NULL,
    verify       BOOLEAN                   DEFAULT NULL,
    unreported   BOOLEAN                   DEFAULT FALSE,
    status       ENUM('p', 'c', 'u')       DEFAULT 'p',  -- In Progress / Completed / Unobtainable
    comment      VARCHAR(100)              DEFAULT NULL,

    createdBy    SMALLINT UNSIGNED         DEFAULT NULL,  -- NULL when self registered
    createdAt    TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn    JSON                      NOT NULL,
    updateLog    JSON                      DEFAULT NULL,

    FOREIGN KEY (emplId) REFERENCES driver_employments(id) ON DELETE CASCADE,
    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (emplId, appId)

);


SELECT 'Creating table `app_carrier`.`application_employment_inquiries`...';
CREATE TABLE application_employment_inquiries (

    emplId      INT UNSIGNED                       NOT NULL,
    appId       MEDIUMINT UNSIGNED                 NOT NULL,
    method      ENUM('p', 'f', 'e', 'm')           NOT NULL,  -- 'Phone', 'Fax', 'Email', 'Mail'
    response    ENUM('pu', 'nr', 'vm', 'cb', 'w')  DEFAULT 'w',  -- 'Picked up', 'No Response', 'Left Voicemail', 'Received a callback', 'Waiting' (for non-phone inquries)
    inquiredOn  DATE                               NOT NULL,

    inquiredBy  SMALLINT UNSIGNED                  NOT NULL,
    inquirer_   VARCHAR(75)                        NOT NULL,  -- Signature string, in case user's name will change later

    phone       CHAR(10)                           DEFAULT NULL,
    fax         VARCHAR(10)                        DEFAULT NULL,
    email       VARCHAR(100)                       DEFAULT NULL,
    address1    VARCHAR(35)                        DEFAULT NULL,
    address2    VARCHAR(25)                        DEFAULT NULL,
    city        VARCHAR(30)                        DEFAULT NULL,
    `state`     CHAR(2)                            DEFAULT NULL,
    zip         VARCHAR(10)                        DEFAULT NULL,
    note        VARCHAR(75)                        DEFAULT NULL,

    createdBy   SMALLINT UNSIGNED                  DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                               NOT NULL,
    updateLog   JSON                               DEFAULT NULL,

    FOREIGN KEY (emplId, appId) REFERENCES application_employments(emplId, appId) ON DELETE CASCADE,
    FOREIGN KEY (inquiredBy) REFERENCES app_online.users(id),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (emplId, appId, method, response, inquiredOn)

);


SELECT 'Creating table `app_carrier`.`application_employment_verifications`...';
CREATE TABLE application_employment_verifications (  -- PHONE INTERVIEW

    emplId      INT UNSIGNED         NOT NULL,
    appId       MEDIUMINT UNSIGNED   NOT NULL,
    method      ENUM('p')            DEFAULT 'p',
    response    ENUM('pu', 'cb')     NOT NULL,
    inquiredOn  DATE                 NOT NULL,

    -- Verification
    correct     BOOLEAN              NOT NULL,
    termType    ENUM('r', 'l', 'd')  NOT NULL,  -- 'Resigned', 'Laid off', 'Discharged'
    rehire      ENUM('y', 'n', 'r')  NOT NULL,  -- 'Yes', 'No', 'Review'
    driver      BOOLEAN              NOT NULL,
    fmcsr       BOOLEAN              DEFAULT NULL,
    dotDat      BOOLEAN              DEFAULT NULL,
    logs        BOOLEAN              DEFAULT NULL,
    vehicles    JSON                 DEFAULT NULL,
    haulRegion  JSON                 DEFAULT NULL,
    safe        BOOLEAN              DEFAULT NULL,
    accidents   JSON                 DEFAULT NULL,
    alcohol     BOOLEAN              DEFAULT NULL,
    drugs       BOOLEAN              DEFAULT NULL,
    datRefusal  BOOLEAN              DEFAULT NULL,
    otherDat    BOOLEAN              DEFAULT NULL,
    rtd         BOOLEAN              DEFAULT NULL,  -- Return-to-duty process (follow-up)
    remarks     VARCHAR(75)          DEFAULT NULL,

    createdBy   SMALLINT UNSIGNED    DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                 NOT NULL,
    updateLog   JSON                 DEFAULT NULL,

    FOREIGN KEY (emplId, appId, method, response, inquiredOn) REFERENCES application_employment_inquiries(emplId, appId, method, response, inquiredOn),
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (emplId, appId)

);


SELECT 'Creating table `app_carrier`.`application_preferences`...';
CREATE TABLE application_preferences (

    appId       MEDIUMINT UNSIGNED  NOT NULL,

    operType    ENUM('s', 't')      NOT NULL,  -- 'Solo', 'Team'
    teamName    VARCHAR(50)         DEFAULT NULL,
    teamPhone   VARCHAR(10)         DEFAULT NULL,
    haulRegion  JSON                DEFAULT NULL,
    equipment   JSON                DEFAULT NULL,
    startPref   TINYINT UNSIGNED    NOT NULL,

    createdBy   SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                NOT NULL,
    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_vehicles`...';
CREATE TABLE application_vehicles (

    appId      MEDIUMINT UNSIGNED  NOT NULL,

    mmt        VARCHAR(60)         DEFAULT NULL,
    make       VARCHAR(20)         DEFAULT NULL,
    model      VARCHAR(25)         DEFAULT NULL,
    `year`     YEAR                DEFAULT NULL,
    `type`     VARCHAR(20)         DEFAULT NULL,
    `length`   TINYINT             DEFAULT NULL,  -- ft

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_beneficiaries`...';
CREATE TABLE application_beneficiaries (

    appId       MEDIUMINT UNSIGNED  NOT NULL,

    prefix      VARCHAR(10)         DEFAULT NULL,
    firstName   VARCHAR(30)         NOT NULL,
    middleName  VARCHAR(30)         DEFAULT NULL,
    lastName    VARCHAR(30)         NOT NULL,
    suffix      VARCHAR(10)         DEFAULT NULL,
    relation    VARCHAR(20)         NOT NULL,
    otherRel    VARCHAR(20)         DEFAULT NULL,
    phone       VARCHAR(10)         NOT NULL,
    _ssn        VARBINARY(32)       DEFAULT NULL,  -- AES_ENCRYPT

    createdBy   SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn   JSON                NOT NULL,
    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_emergencies`...';
CREATE TABLE application_emergencies (

    appId      MEDIUMINT UNSIGNED  NOT NULL,

    phone      CHAR(10)            NOT NULL,
    `name`     VARCHAR(20)         DEFAULT NULL,
    relation   CHAR(20)            DEFAULT NULL,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_uploads`';
CREATE TABLE application_uploads (

    appId  MEDIUMINT UNSIGNED  NOT NULL,

    dlF    BOOLEAN             DEFAULT FALSE,
    dlB    BOOLEAN             DEFAULT FALSE,
    mec    BOOLEAN             DEFAULT FALSE,
    ssc    BOOLEAN             DEFAULT FALSE,
    leg    BOOLEAN             DEFAULT FALSE,
    reg    BOOLEAN             DEFAULT FALSE,

    createdBy  SMALLINT UNSIGNED   DEFAULT NULL,  -- NULL when self registered
    createdAt  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdIn  JSON                NOT NULL,
    updateLog  JSON                DEFAULT NULL,

    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_checklists`...';
CREATE TABLE application_checklists (

    appId      MEDIUMINT UNSIGNED  NOT NULL,

    dlScn      BOOLEAN             DEFAULT FALSE,
    dlScnId    SMALLINT UNSIGNED   DEFAULT NULL,
    dlVrfId    SMALLINT UNSIGNED   DEFAULT NULL,
    mecScn     BOOLEAN             DEFAULT FALSE,
    mecScnId   SMALLINT UNSIGNED   DEFAULT NULL,
    mecVrfId   SMALLINT UNSIGNED   DEFAULT NULL,
    docScn     BOOLEAN             DEFAULT FALSE,
    docScnId   SMALLINT UNSIGNED   DEFAULT NULL,
    docVrfId   SMALLINT UNSIGNED   DEFAULT NULL,

    mvrUplId   SMALLINT UNSIGNED   DEFAULT NULL,
    pspUplId   SMALLINT UNSIGNED   DEFAULT NULL,

    updateLog  JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (dlScnId) REFERENCES app_online.users(id),
    FOREIGN KEY (dlVrfId) REFERENCES app_online.users(id),
    FOREIGN KEY (mecScnId) REFERENCES app_online.users(id),
    FOREIGN KEY (mecVrfId) REFERENCES app_online.users(id),
    FOREIGN KEY (docScnId) REFERENCES app_online.users(id),
    FOREIGN KEY (docVrfId) REFERENCES app_online.users(id),
    FOREIGN KEY (mvrUplId) REFERENCES app_online.users(id),
    FOREIGN KEY (pspUplId) REFERENCES app_online.users(id),
    PRIMARY KEY (appId)

);


SELECT 'Creating table `app_carrier`.`application_decisions`...';
CREATE TABLE application_decisions (

    appId       MEDIUMINT UNSIGNED  NOT NULL,

    experience  VARCHAR(1)          DEFAULT NULL,
    position    VARCHAR(2)          DEFAULT NULL,

    updateLog   JSON                DEFAULT NULL,

    FOREIGN KEY (appId) REFERENCES applications(id) ON DELETE CASCADE,
    PRIMARY KEY (appId)

);