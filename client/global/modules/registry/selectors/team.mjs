import initialize from './support.mjs'

const prefix = 'team'

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
            name: 'current-name',
            profileId: 'profile-id',
            settingsId: 'settings-id',
        },
        text: {
            name: 'name',
            desc: 'description',
            busName: 'business-name',
            website: 'website',
            email: 'email',
            phone: 'phone',
            address1: 'address-1',
            address2: 'address-2',
            addrCity: 'address-city',
            addrZip: 'address-zip',
        },
        select: {
            category: 'category',
            coType: 'company-type',
            addrState: 'address-state',
        },
    },
}

initialize(prefix, selector)

export default selector