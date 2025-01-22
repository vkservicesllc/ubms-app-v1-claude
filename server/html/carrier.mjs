import Address from '../../client/global/modules/assets/address.us.mjs'
import { formLabel, formInput, formSelect } from '../../client/global/modules/assets/html.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import { permits } from '../settings/carrier.mjs'


const { mcId, usdotId, scacId, iftaId, iftaJurId, irpId, efsId, fleetOneId, transfloId } = formSelectors.carrier


const varFormInput = (props = {}, current = false, id, name, maxLength, required = false, type = 'text') => {
    if (current === true) {
        type = 'hidden'
        id = `current-${id}`
        maxLength = undefined
        name = undefined
    }

    return formInput({
        ...props,
        type,
        id,
        name,
        maxLength,
        required: required && current === false,
    })
}


export class Label {

    static mc = (props = {}) => formLabel({
        content: 'MC',
        title: 'Motor Carrier ID',
        ...props,
        for: mcId,
        addClass: 'required',
    })

    static usdot = (props = {}) => formLabel({
        content: 'US-DOT',
        title: 'US Department of Transportation Number',
        ...props,
        for: usdotId,
        addClass: 'required',
    })

    static scac = (props = {}) => formLabel({
        content: 'SCAC',
        title: 'Standard Carrier Alpha Code',
        ...props,
        for: scacId,
    })

    static ifta = (props = {}) => formLabel({
        content: 'IFTA',
        title: 'International Fuel Tax Agreement ID',
        ...props,
        for: iftaId,
    })

    static iftaJur = (props = {}) => formLabel({
        content: 'IFTA Jurisdiction',
        ...props,
        for: iftaJurId,
    })

    static irp = (props = {}) => formLabel({
        content: 'IRP',
        title: 'International Registration Plan ID',
        ...props,
        for: irpId,
    })

    static permit = (target, props = {}) => {
        if (!Object.keys(permits).includes(target)) return

        const { content, title } = permits[target]

        return formLabel({
            ...props,
            content,
            title,
            for: formSelectors.carrier.permit(target),
        })
    }

    static efs = (props = {}) => formLabel({
        content: 'EFS Carrier ID',
        ...props,
        for: efsId,
    })

    static fleetOne = (props = {}) => formLabel({
        content: 'Fleet One Carrier ID',
        ...props,
        for: fleetOneId,
    })

    static tranflo = (props = {}) => formLabel({
        content: 'Transflo ID',
        ...props,
        for: transfloId,
    })

}


export class Input {

    static mc = (props = {}, current = false) => varFormInput(props, current, mcId, 'mc', inputLength.carrier.mc.max, true)

    static usdot = (props = {}, current = false) => varFormInput(props, current, usdotId, 'usdot', inputLength.carrier.usdot.max, true)

    static ifta = (props = {}, current = false) => varFormInput(props, current, iftaId, 'ifta[number]', inputLength.carrier.ifta.max)

    static scac = (props = {}, current = false) => varFormInput(props, current, scacId, 'scac', inputLength.carrier.scac.max)

    static irp = (props = {}, current = false) => varFormInput(props, current, irpId, 'irp', inputLength.carrier.irp.max)

    static permit = (target, props = {}, current = false) => {
        if (!Object.keys(permits).includes(target)) return

        const name = `stateTax[${target}]`
        const maxLength = inputLength.carrier.permit.max[target]

        return varFormInput(props, current, formSelectors.carrier.permit(target), name, maxLength)
    }

    static efs = (props = {}, current = false) => varFormInput(props, current, efsId, 'efs', inputLength.carrier.efs.max)

    static fleetOne = (props = {}, current = false) => varFormInput(props, current, fleetOneId, 'fleetOne', inputLength.carrier.fleetOne.max)

    static transflo = (props = {}, current = false) => varFormInput(props, current, transfloId, 'transflo', inputLength.carrier.transflo.max)

}


export class Select {

    static iftaJur = (props = {}) => {
        const data = Address.stateList
        let { options } = props
        if (!options) options = {}
        if (!options.emptyOpt) options.emptyOpt = ''

        return formSelect({
            name: 'ifta[jurisdiction]',
            id: iftaJurId,
            ...props,
            required: true,
        }, data, options)
    }

}