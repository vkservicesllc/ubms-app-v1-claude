import initialize from './support.mjs'

const prefix = 'company-owner'


const select = {
    class: {
        combo: {
            gender: 'gender',
            since: 'update-date',
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
            delId: 'delete-id',
        },
        text: {
            firstName: 'first-name',
            middleName: 'middle-name',
            lastName: 'last-name',
            suffix: 'suffix',
            dob: 'dob',
            ssn: 'ssn',
            phone: 'phone',
            nameSince: 'name-update-date',
        },
        select: {
            gender: 'gender',
        },
        radio: {
            gender: {
                male: 'gender-male',
                female: 'gender-female',
            },
        },
    },
}

initialize(prefix, selector)

export default selector