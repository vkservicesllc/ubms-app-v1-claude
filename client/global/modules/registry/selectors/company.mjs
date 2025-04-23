import initialize from './support.mjs'

const prefix = 'company'

const selector = {
    class: {
        combo: {
            busName: 'business-name',
            address: 'address',
            contacts: 'contacts',
        },
    },
    id: {
        hidden: {
            id: 'id',
            deleteId: 'delete-id',
            busName: 'business-name',
            coType: 'company-type',
            name: 'name',  //? full company name: perfect for matching
        },
        text: {
            since: 'start-date',
            ein: 'ein',
            duns: 'duns',
            busName: 'business-name',
            alias: 'alias',
            confirmAlias: 'confirm-alias',
            website: 'website',
            ownership: 'ownership',
            address1: 'address-1',
            address2: 'address-2',
            addrCity: 'address-city',
            addrZip: 'address-zip',
            mailAddress1: 'mail-address-1',
            mailAddress2: 'mail-address-2',
            mailAddrCity: 'mail-address-city',
            mailAddrZip: 'mail-address-zip',
            phone: 'phone',
            fax: 'fax',
            email: 'email',
            addrSince: 'address-update-date',
            mailAddrSince: 'mail-address-update-date',
            phoneSince: 'phone-update-date',
            faxSince: 'fax-update-date',
            emailSince: 'email-update-date',
            until: 'end-date',
        },
        select: {
            category: 'category',
            coType: 'company-type',
            addrState: 'address-state',
            mailAddrState: 'mail-address-state',
        },
    },
}

initialize(prefix, selector)

export default selector