import initialize from './support.mjs'

const prefix = 'driver-application-employment'

const selector = {
    class: {
        hidden: {
            id: 'id',
            appId: 'app-id',
        },
        text: {
            employer: 'employer',
            phone: 'employer-phone',
            address1: 'employer-address-1',
            address2: 'employer-address-2',
            addrZip: 'employer-address-zip',
            addrCity: 'employer-address-city',
            startDate: 'employment-start-date',
            position: 'employment-position',
            earnings: 'employment-earnings',
            endDate: 'employment-end-date',
            rfl: 'employment-reason-for-leaving',
            gapExpl: 'employment-gap-explanation',
        },
        select: {
            addrState: 'employer-address-state',
        },
        radio: {
            fmcsr: 'employment-subject-to-fmcsr',
            dotDat: 'employment-subject-to-dot-drug-alcohol-test',
        },
        checkbox: {
            fmcsr: 'employment-subject-to-fmcsr',
            dotDat: 'employment-subject-to-dot-drug-alcohol-test',
        },
    },
    id: {
        hidden: {
            id: 'id',
            appId: 'app-id',
        },
        text: {
            employer: 'employer',
            phone: 'employer-phone',
            address1: 'employer-address-1',
            address2: 'employer-address-2',
            addrZip: 'employer-address-zip',
            addrCity: 'employer-address-city',
            startDate: 'employment-start-date',
            position: 'employment-position',
            earnings: 'employment-earnings',
            endDate: 'employment-end-date',
            rfl: 'employment-reason-for-leaving',
            gapExpl: 'employment-gap-explanation',
        },
        select: {
            addrState: 'employer-address-state',
        },
        radio: {
            fmcsr: {
                yes: 'employment-subject-to-fmcsr',
                no: 'employment-not-subject-to-fmcsr',
            },
            dotDat: {
                yes: 'employment-subject-to-dot-drug-alcohol-test',
                no: 'employment-not-subject-to-dot-drug-alcohol-test',
            },
        },
        checkbox: {
            fmcsr: 'employment-subject-to-fmcsr',
            dotDat: 'employment-subject-to-dot-drug-alcohol-test',
        },
    },
}

initialize(prefix, selector)

export default selector