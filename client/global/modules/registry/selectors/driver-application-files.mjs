import initialize from './support.mjs'

const prefix = 'driver-application-file'

const selector = {
    class: {
        combo: {
            driverLicense: 'driver-license',
        },
        radio: {
            dlCommercial: 'dl-commercial',
        },
    },
    id: {
        hidden: {
            dlAddrSince: 'dl-address-start-date',
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
            dlDob: 'dl-dob',
            dlAddress1: 'dl-address-1',
            dlAddress2: 'dl-address-2',
            dlAddrZip: 'dl-address-zip',
            dlAddrCity: 'dl-address-city',
        },
        select: {
            dlState: 'dl-state',
            dlSuffix: 'dl-suffix',
            dlGender: 'dl-gender',
            dlAddrState: 'dl-address-state',
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
        },
    },
}

initialize(prefix, selector)

export default selector