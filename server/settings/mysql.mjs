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
        //? ...Add more if needed
    },

    business: {
        refSrc: new Query(db.business, 'referral_sources'),
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
        //? ...Add more if needed
    },
    company_owner: {
        main: new Query(db.business, 'owners'),
    },
    ref_source: {
        main: new Query(db.business, 'refsources'),
    },

    carrier: {
        main: new Query(db.carrier, 'carriers'),
        ifta: new Query(db.carrier, 'carrier_ifta'),  //* 1-to-many
        stateTax: new Query(db.carrier, 'carrier_state_permits'),
    },

    driver: {
        main: new Query(db.carrier, 'drivers'),
        appDef: new Query(db.carrier, 'driver_appdefs'),
        mecs: new Query(db.carrier, 'driver_medcards'),
        citations: new Query(db.carrier, 'driver_citations'),  //* 1-to-many
        accidents: new Query(db.carrier, 'driver_accidents'),  //* 1-to-many
        school: new Query(db.carrier, 'driver_cdlschools'),
        businesses: new Query(db.carrier, 'driver_businesses'),  //* 1-to-many
    },
    driver_application: {
        main: new Query(db.carrier, 'applications'),
        lead: new Query(db.carrier, 'pre_applications'),
        // matcher: new Query(db.carrier, 'application_matchers'),
        addresses: new Query(db.carrier, 'application_addresses'),  //* 1-to-many
        citations: new Query(db.carrier, 'application_citations'),  //* 1-to-many
        accidents: new Query(db.carrier, 'application_accidents'),  //* 1-to-many
        experience: new Query(db.carrier, 'application_experiences'),
        preference: new Query(db.carrier, 'application_preferences'),
        vehicle: new Query(db.carrier, 'application_vehicles'),
        beneficiary: new Query(db.carrier, 'application_beneficiaries'),
        emergency: new Query(db.carrier, 'application_emergencies'),
        checklist: new Query(db.carrier, 'application_checklists'),
        decision: new Query(db.carrier, 'application_decisions'),
    },
    driver_employment: {
        main: new Query(db.carrier, 'driver_employments'),
        verifications: new Query(db.carrier, 'application_employments'),
        attempts: new Query(db.carrier, 'application_employment_inquiries'),  //* 1-to-many
        phoneVerification: new Query(db.carrier, 'application_employment_verifications'),
    },

    jx: {
        users_roles: new Query(db.online, 'user_role_map'),
        users_teams: new Query(db.online, 'user_team_map'),
        users_companies: new Query(db.business, 'user_company_map'),
        companies_refSrc: new Query(db.business, 'company_refsource_map'),
    },

}


export const algorithm = {
    carrier: 'SHA-224',
}