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


const driverAppQuery = new Query(db.carrier, 'applications')
const driverAppEmplQuery = new Query(db.carrier, 'application_employments')


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
        name: new Query(db.person, 'names'),
        legal: new Query(db.person, 'legal_presence'),
        marital: new Query(db.person, 'maritals'),
        phone: new Query(db.person, 'phones'),
        address: new Query(db.person, 'addresses'),
        email: new Query(db.person, 'emails'),
        identification: new Query(db.person, 'identifications'),
        //! ...Add more if needed
    },

    company: {
        main: new Query(db.business, 'companies'),
        name: new Query(db.business, 'company_names'),
        ownership: new Query(db.business, 'company_ownerships'),
        address: new Query(db.business, 'company_addresses'),
        mail: new Query(db.business, 'company_mail'),
        phone: new Query(db.business, 'company_phones'),
        fax: new Query(db.business, 'company_faxes'),
        email: new Query(db.business, 'company_emails'),
        //! ...Add more if needed
    },
    company_owner: {
        main: new Query(db.business, 'owners'),
    },

    carrier: {
        main: new Query(db.carrier, 'carriers'),
        ifta: new Query(db.carrier, 'carrier_ifta'),
        stateTax: new Query(db.carrier, 'carrier_state_permits'),
    },

    driver: {
        main: new Query(db.carrier, 'drivers'),
        application: driverAppQuery,
    },
    driver_application: {
        main: driverAppQuery,
        address: new Query(db.carrier, 'application_addresses'),
        license: new Query(db.carrier, 'application_DLs'),
        medical: new Query(db.carrier, 'application_MECs'),
        citation: new Query(db.carrier, 'application_citations'),
        accident: new Query(db.carrier, 'application_accidents'),
        experience: new Query(db.carrier, 'application_experiences'),
        school: new Query(db.carrier, 'application_cdlschools'),
        employer: driverAppEmplQuery,
        preference: new Query(db.carrier, 'application_preferences'),
        business: new Query(db.carrier, 'application_businesses'),
        vehicle: new Query(db.carrier, 'application_vehicles'),
        beneficiary: new Query(db.carrier, 'application_beneficiaries'),
        emergency: new Query(db.carrier, 'application_emergencies'),
        checklist: new Query(db.carrier, 'application_checklists'),
        decision: new Query(db.carrier, 'application_decisions'),
    },
    driver_appemployer: {
        main: driverAppEmplQuery,
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