import initialize from './support.mjs'

const prefix = 'driver-application-file'

const selector = {
    class: {},
    id: {
        hidden: {
            appId: 'app-id',
        },
        text: {
            dlNumber: 'driver-license-number',
            dlClass: 'driver-license-class',
            dlIss: 'driver-license-issue-date',
            dlExp: 'driver-license-expiration-date',
            dlEndrs: 'driver-license-endrosement',
            dlRestr: 'driver-license-restriction',
            dlFirstName: 'dl-first-name',
            dlMiddleName: 'dl-middle-name',
            dlLastName: 'dl-last-name',
            dlSuffix: 'dl-suffix',
            dlDob: 'dl-dob',
        },
        select: {
            dlGender: 'dl-gender',
        },
        radio: {
            dlCommercial: {
                yes: 'dl-commercial',
                no: 'dl-non-commercial',
            },
            dlGender: {
                male: 'dl-gender-male',
                female: 'dl-gender-female',
            },
        },
        checkbox: {
            dlCommercial: 'dl-commercial',
            dlState: 'dl-state',
        },
    },
}

initialize(prefix, selector)

export default selector