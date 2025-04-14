import initialize from './support.mjs'

const prefix = 'carrier'

const selector = {
    class: {},
    id: {
        hidden: {
            id: 'id',
        },
        text: {
            mc: 'mc',
            usdot: 'usdot',
            scac: 'scac',
            ifta: 'ifta',
            iftaJur: 'ifta-jurisdiction',
            irp: 'irp',
            efs: 'efs',
            fleetOne: 'fleet-one',
            transflo: 'transflo',
        },
    },
}

initialize(prefix, selector)

selector.id.text.permit = target => `${target}-permit`

export default selector