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
            cdlSchool: 'cdl-school',
        },
        text: {
            citDate: 'citation-date',
            accDate: 'accident-date',
            citOtherReason: 'citation-other-reason',
            accOtherType: 'accident-other-type',
            expHours: 'experience-daily-hours',
        },
        select: {
            gender: 'gender',
            marital: 'marital-status',
            citReason: 'citation-reason',
            citState: 'citation-state',
            accType: 'accident-type',
            accState: 'accident-state',
        },
        radio: {
            gender: 'gender',
            marital: 'marital-status',
            dlCategory: 'driver-license-category',
            duiInDecade: 'had-dui-in-decade',
            citations: 'citations',
            accidents: 'accidents',
        },
        checkbox: {
            straightExp: 'straight-truck-experience',
            semiExp: 'trailer-type-experience',
        },
    },
    id: {
        hidden: {
            id: 'id',
            deleteId: 'delete-id',
            appliedOn: 'applied-on',
        },
        text: {
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
            citDate: 'citation-date',
            citOtherReason: 'citation-other-reason',
            accDate: 'accident-date',
            accOtherType: 'accident-other-type',
            expStartDate: 'experience-start-date',
            expEndDate: 'experience-end-date',
            expMileage: 'experience-mileage',
            schName: 'school-name',
            schPhone: 'school-phone',
            schEndDate: 'school-end-date',

            //! gap
            // currentVhlMake: 'current-vehicle-make',
            // currentVhlModel: 'current-vehicle-model',
        },
        select: {
            suffix: 'suffix',
            gender: 'gender',
            marital: 'marital-status',
            addrState: 'address-state',
            status: 'legal-status',
            position: 'position',
            dlState: 'driver-license-state',
            citReason: 'citation-reason',
            citState: 'citation-state',
            accType: 'accident-type',
            accState: 'accident-state',
            schState: 'school-state',
            schDuration: 'school-duration',

            //!gap
            // currentVhlYear: 'current-vehicle-year',
            // currentVhlMMT: 'current-vehicle-make-model-type',
            // currentVhlType: 'current-vehicle-type',
            // currentVhlLen: 'current-vehicle-length',
        },
        radio: {
            gender: {
                male: 'gender-male',
                female: 'gender-female',
            },
            marital: {
                single: 'marital-single',
                married: 'marital-married',
                separated: 'marital-separated',
                divorced: 'marital-divorced',
                widowed: 'marital-widowed',
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
            duiInDecade: {
                yes: 'had-dui-in-decade',
                no: 'had-dui-before-decade',
            },
            criminal: {
                yes: 'had-criminal',
                no: 'had-no-criminal',
            },
            citations: {
                yes: 'had-citations',
                no: 'had-no-citations',
            },
            accidents: {
                yes: 'had-accidents',
                no: 'had-no-accidents',
            },
            accInjuries: {
                yes: 'had-accident-injuries',
                no: 'had-no-accident-injuries',
            },
            accFatalities: {
                yes: 'had-accident-fatalities',
                no: 'had-no-accident-fatalities',
            },
            cmvExp: {
                yes: 'has-cmv-experience',
                no: 'has-no-cmv-experience',
            },
            cdlSchool: {
                yes: 'attended-cdl-school',
                no: 'no-cdl-school',
            },

            //! gap -- NO NEED IN THIS QUESTION
            // currentVhl: {
            //     yes: 'currently-driving',
            //     no: 'currently-not-driving', 
            // },
        },
        checkbox: {
            noMec: 'no-med-card',
            noExp: 'no-experience',
            straightExp: {
                box: 'box-truck-experience',
                cube: 'cube-truck-experience',
                dump: 'dump-truck-experience',
                pickup: 'pickup-truck-experience',
            },
            semiExp: {
                van: 'dry-van-semi-experience',
                reefer: 'reefer-semi-experience',
                flat: 'flatbed-semi-experience',
                step: 'step-deck-semi-experience',
                tanker: 'tanker-semi-experience',
                lowboy: 'lowboy-semi-experience',
                // other: 'other-trailer-experience',
            },
            tandemExp: 'tandem-experience',
            vanExp: 'cargo-van-experience',
        },
    },
}

initialize(prefix, selector)

export default selector