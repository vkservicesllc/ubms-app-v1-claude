import initialize from './support.mjs'

const prefix = 'driver-application'

const selector = {
    class: {
        combo: {
            gender: 'gender',
            address: 'address',
            since: 'update-date',
            position: 'position',
            driverLicense: 'driver-license',
            medCard: 'medical-card',
        },
        select: {
            gender: 'gender',
        },
        radio: {
            gender: 'gender',
            dlCategory: 'driver-license-category',
        },
    },
    id: {
        hidden: {
            id: 'id',
            deleteId: 'delete-id',
        },
        text: {
            // formId: 'form',
            pin: 'pin',
            firstName: 'first-name',
            middleName: 'middle-name',
            lastName: 'last-name',
            dob: 'dob',
            ssn: 'ssn',
            phone: 'phone',
            email: 'email',
            addrSince: 'address-start-date',
            address1: 'address-1',
            address2: 'address-2',
            addrZip: 'address-zip',
            addrCity: 'address-city',
            statusExp: 'status-expiration',
            dlNumber: 'driver-license-number',
            dlClass: 'driver-license-class',
            dlIss: 'driver-license-issue-date',
            dlExp: 'driver-license-expiration-date',
            dlEndrs: 'driver-license-endrosement',
            dlRestr: 'driver-license-restriction',
            dlDeniedExpl: 'driver-license-denied-explanation',
            dlRevokedExpl: 'driver-license-revoked-explanation',
            mecIss: 'med-card-exam-date',
            mecExp: 'med-card-expiration-date',
            mecNumber: 'med-card-number',
            medList: 'medicine-list',
            criminalExpl: 'criminal-explanation',
        },
        select: {
            suffix: 'suffix',
            gender: 'gender',
            addrState: 'address-state',
            status: 'legal-status',
            position: 'position',
            dlState: 'driver-license-state',
        },
        radio: {
            gender: {
                male: 'gender-male',
                female: 'gender-female',
            },
            status: {
                citizen: 'citizen-status',
                resident: 'resident-status',
                authorized: 'authorized-status',
            },
            dlCommercial: {
                yes: 'driver-license-commercial',
                no: 'driver-license-non-commercial',
            },
            dlDenied: {
                yes: 'driver-license-denied',
                no: 'driver-license-never-denied',
            },
            dlRevoked: {
                yes: 'driver-license-revoked',
                no: 'driver-license-never-revoked',
            },
            underMeds: {
                yes: 'meds-taken',
                no: 'dmeds-not-taken',
            },
            dui: {
                yes: 'had-dui',
                no: 'had-no-dui',
            },
            criminal: {
                yes: 'had-criminal',
                no: 'had-no-criminal',
            },
            citation: {
                yes: 'had-citation',
                no: 'had-no-citation',
            },
        },
        checkbox: {
            noMec: 'no-med-card',
        },
    },
}

initialize(prefix, selector)

export default selector