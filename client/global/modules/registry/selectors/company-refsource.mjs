import initialize from './support.mjs'

const prefix = 'company-refsource'


const selector = {
    class: {},
    id: {
        hidden: {
            id: 'id',
            deleteId: 'delete-id',
        },
        text: {
            name: 'name',
        },
    },
}

initialize(prefix, selector)

export default selector