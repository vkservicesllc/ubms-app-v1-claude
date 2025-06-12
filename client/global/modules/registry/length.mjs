export default {

    user: {
        username: { min: 3, max: 16 },
        password: { min: 12, max: 24 },
        token: { min: 12, max: 12 },
        formId: { min: 24, max: 24 },
        roleName: { max: 24 },
    },

    person: {
        firstName: { min: 1, max: 30 },
        middleName: { min: 1, max: 30 },
        lastName: { min: 1, max: 30 },
        alias: { min: 1, max: 30 },
    },

    contact: {
        email: { max: 100 },
    },

    web: {
        url: { max: 100 },
    },

    company: {
        busName: { max: 30 },
        alias: { max: 6 },
    },

    team: {
        name: { min: 2, max: 12 },
        desc: { max: 50 },
    },

    carrier: {
        mc: { max: 7 },
        usdot: { max: 8 },
        scac: { max: 5 },
        ifta: { max: 9 },
        irp: { max: 8 },
        permit: {
            max: {
                ca: 7,
                fl: 8,
                il: 9,
                in: 6,
                ky: 6,
                nj: 8,
                nm: 8,
                nv: 8,
                ny: 8,
                or: 8,
                tx: 7,
                wa: 8,
            },
        },
        efs: { max: 7 },
        fleetOne: { max: 7 },
        transflo: { max: 7 },
    },

    address: {
        address1: { max: 35 },
        address2: { max: 25 },
        city: { max: 30 },
        zip: { min: 3, max: 5 },
    },

    driverLicense: {
        number: { min: 6, max: 15 },
        class: { max: 5 },
        endorsement: { max: 65 },
        restriction: { max: 65 },
        problemExpl: { max: 100 },
    },

    medicalCard: {
        number: { max: 10 },
        medList: { max: 100 },
    },

    vehicle: {
        make: { max: 20 },
        model: { max: 25 },
    },

}