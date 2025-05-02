import initialize from './support.mjs'

const prefix = 'driver'

const selector = {
    class: {},
    id: {
        hidden: {
            id: 'id',
        },
    },
}

initialize(prefix, selector)

export default selector