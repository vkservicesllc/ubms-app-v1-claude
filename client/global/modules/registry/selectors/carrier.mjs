import initialize from './support.mjs'

const prefix = 'carrier'

const selector = {
    class: {
        text: {
            permit: 'permit',
        },
    },
    id: {
        hidden: {
            id: 'id',
        },
        text: {
            mc: 'mc',
            usdot: 'usdot',
            scac: 'scac',
            ifta: 'ifta',
            
            irp: 'irp',
            efs: 'efs',
            fleetOne: 'fleet-one',
            transflo: 'transflo',
        },
        select: {
            iftaJur: 'ifta-jurisdiction',
        },
    },
}

initialize(prefix, selector)

selector.id.text.permit = target => `${target}-permit`

export default selector