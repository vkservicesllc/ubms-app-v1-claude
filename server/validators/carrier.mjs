import inputLength from '../../client/global/modules/registry/length.mjs'
import { validateNumberId, validateStateUS } from './default.mjs'



export const validateCarrier = [
    validateNumberId('mc', inputLength.carrier.mc.max, true),
    validateNumberId('usdot', inputLength.carrier.usdot.max, true),
    validateNumberId('scac', inputLength.carrier.scac.max),
    validateNumberId('irp', inputLength.carrier.irp.max),
    validateNumberId('ifta[number]', inputLength.carrier.ifta.max),
    validateStateUS('ifta[jurisdiction]', true),
    validateNumberId('efs', inputLength.carrier.efs.max),
    validateNumberId('fleetOne', inputLength.carrier.fleetOne.max),
    validateNumberId('transflo', inputLength.carrier.transflo.max, false, false),
]