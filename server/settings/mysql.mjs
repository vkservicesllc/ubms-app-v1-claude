import Query from "../tools/utils/query.mjs"



const db = {
    public: 'app_public',
    store: 'app_store',
    online: 'app_online',
    person: 'app_person',
    office: 'app_office',
    business: 'app_business',
    carrier: 'app_carrier',
    // ...
}

export default db


export const query = {

    user: {
        main: new Query(db.online, 'users'),
        registration: new Query(db.online, 'user_registration'),
        passReset: new Query(db.online, 'user_passreset'),
    },
    role: {
        main: new Query(db.online, 'roles'),
    },
    session: {
        main: new Query(db.online, 'sessions'),
        token: new Query(db.online, 'tokens'),
    },
    site: {
        main: new Query(db.online, 'sites'),
    },

    team : {
        main: new Query(db.online, 'teams'),
        profile: new Query(db.online, 'team_profiles'),
    },

    person: {
        main: new Query(db.person, 'individuals'),
        names: new Query(db.person, 'names'),  //* 1-to-many
        legal: new Query(db.person, 'legal_presence'),  //* 1-to-many
        maritals: new Query(db.person, 'maritals'),  //* 1-to-many
        phones: new Query(db.person, 'phones'),  //* 1-to-many
        addresses: new Query(db.person, 'addresses'),  //* 1-to-many
        emails: new Query(db.person, 'emails'),  //* 1-to-many
        identifications: new Query(db.person, 'identifications'),  //* 1-to-many
        //! ...Add more if needed
    },

    company: {
        main: new Query(db.business, 'companies'),
        names: new Query(db.business, 'company_names'),  //* 1-to-many
        ownerships: new Query(db.business, 'company_ownerships'),  //* 1-to-many
        addresses: new Query(db.business, 'company_addresses'),  //* 1-to-many
        mail: new Query(db.business, 'company_mail'),  //* 1-to-many
        phones: new Query(db.business, 'company_phones'),  //* 1-to-many
        faxes: new Query(db.business, 'company_faxes'),  //* 1-to-many
        emails: new Query(db.business, 'company_emails'),  //* 1-to-many
        //! ...Add more if needed
    },
    company_owner: {
        main: new Query(db.business, 'owners'),
    },

    carrier: {
        main: new Query(db.carrier, 'carriers'),
        ifta: new Query(db.carrier, 'carrier_ifta'),  //* 1-to-many
        stateTax: new Query(db.carrier, 'carrier_state_permits'),
    },

    driver: {
        main: new Query(db.carrier, 'drivers'),
    },
    driver_application: {
        main: new Query(db.carrier, 'applications'),
        addresses: new Query(db.carrier, 'application_addresses'),  //* 1-to-many
        license: new Query(db.carrier, 'application_DLs'),
        medical: new Query(db.carrier, 'application_MECs'),
        citations: new Query(db.carrier, 'application_citations'),  //* 1-to-many
        accidents: new Query(db.carrier, 'application_accidents'),  //* 1-to-many
        experience: new Query(db.carrier, 'application_experiences'),
        school: new Query(db.carrier, 'application_cdlschools'),
        preference: new Query(db.carrier, 'application_preferences'),
        business: new Query(db.carrier, 'application_businesses'),
        vehicle: new Query(db.carrier, 'application_vehicles'),
        beneficiary: new Query(db.carrier, 'application_beneficiaries'),
        emergency: new Query(db.carrier, 'application_emergencies'),
        checklist: new Query(db.carrier, 'application_checklists'),
        decision: new Query(db.carrier, 'application_decisions'),
    },
    driver_appemployer: {
        main: new Query(db.carrier, 'application_employments'),
    },

    jx: {
        users_roles: new Query(db.online, 'user_role_map'),
        users_teams: new Query(db.online, 'user_team_map'),
        users_companies: new Query(db.business, 'user_company_map'),
    },

}


export const algorithm = {
    carrier: 'SHA-224',
}