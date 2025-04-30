import initialize from './support.mjs'

const prefix = 'driver-application'

const selector = {
    class: {
        combo: {
            gender: 'gender',
            address: 'address',
            since: 'update-date',
            position: 'position',
        },
        select: {
            gender: 'gender',
        },
        radio: {
            gender: 'gender',
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
            dlEndorse: 'driver-license-endrosement',
            dlRestr: 'driver-license-restriction',
            dlDenied: 'driver-license-denied',
            dlRevoked: 'driver-license-revoked',
            mecIss: 'med-card-exam-date',
            mecExp: 'med-card-expiration-date',
            mecNumber: 'med-card-number',
            medList: 'medicine-list',
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
        },
        checkbox: {
            statusValid: 'valid-legal-status',
            dlValid: 'valid-driver-license',
            dlCommercial: 'commercial-driver-license',
            dlDenied: 'driver-license-denied',
            dlRevoked: 'driver-license-revoked',
            mecAvail: 'med-card-available',
            medTaken: 'medicine-taken',
        },
    },
}

initialize(prefix, selector)

export default selector