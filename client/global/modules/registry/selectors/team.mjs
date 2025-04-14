import initialize from './support.mjs'

const prefix = 'app-team'

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
            name: 'name',
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
            busType: 'business-type',
            addrState: 'address-state',
        },
    },
}


initialize(prefix, selector)

export default selector