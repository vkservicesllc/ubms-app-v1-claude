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
            usdot: 'us-dot',
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
            inquiryDate: 'employment-verification-date',
            inquiryResponse: 'employment-verification-response',
        },
        select: {
            addrState: 'employer-address-state',
            inquirer: 'employment-verification-inquirer',
            inquiryMethod: 'employment-verification-method',
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
            usdot: 'us-dot',
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
            inquiryDate1: 'employment-verification-date-1',
            inquiryDate2: 'employment-verification-date-2',
            inquiryDate3: 'employment-verification-date-3',
            inquiryResponse1: 'employment-verification-response-1',
            inquiryResponse2: 'employment-verification-response-2',
            inquiryResponse3: 'employment-verification-response-3',
            verifComment: 'employment-verification-comment',
        },
        select: {
            addrState: 'employer-address-state',
            inquirer1: 'employment-verification-inquirer-1',
            inquirer2: 'employment-verification-inquirer-2',
            inquirer3: 'employment-verification-inquirer-3',
            inquiryMethod1: 'employment-verification-method-1',
            inquiryMethod2: 'employment-verification-method-2',
            inquiryMethod3: 'employment-verification-method-3',
            verifStatus: 'employment-verification-status',
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