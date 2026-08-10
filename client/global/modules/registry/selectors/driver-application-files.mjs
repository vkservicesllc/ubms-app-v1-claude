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
            dlNumber2: 'driver-license-number-2',
            dlClass: 'driver-license-class',
            dlIss: 'driver-license-issue-date',
            dlIss2: 'driver-license-issue-date-2',
            dlExp: 'driver-license-expiration-date',
            dlExp2: 'driver-license-expiration-date-2',
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
            dlState2: 'dl-state-2',
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