import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createUsStateForm,
} from './reusable.mjs'

import selector from '../../../client/global/modules/registry/selectors/carrier.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

import { permits } from '../../settings/carrier.mjs'

const required = true


const createNumberForm = (target, props = {}, alpha = false) => createForm({
    selector,
    target,
    name: target,
    maxLength: length.carrier[target].max,
    ...props,
    validator: {
        rule: alpha === true ? 'alphanumeric' : 'numeric',
    },
})


class CarrierForm {
    constructor(options = {}) {
        getStaticProps(CarrierForm)
            .forEach(target => this[target] = constructForm(CarrierForm, target, options))
    }

    static id = createIdForm({ selector })

    static mc = createNumberForm('mc', { required })
    static usdot = createNumberForm('usdot', { required })
    static ifta = createNumberForm('ifta', { name: 'ifta[number]' })
    static scac = createNumberForm('scac', {}, true)
    static irp = createNumberForm('irp')
    static efs = createNumberForm('efs')
    static fleetOne = createNumberForm('fleetOne')
    static transflo = createNumberForm('transflo', {}, true)

    static iftaJur = createUsStateForm({
        selector,
        target: 'iftaJur',
        name: 'ifta[jurisdiction]',
    })

}

for (const key in permits) {
    const { content, title } = permits[key]
    const target = `${key}Permit`
    selector.id.text[target]

    CarrierForm[target] = createForm({
        selector,
        target,
        group: 'permit',
        name: `stateTax[${key}]`,
        maxLength: length.carrier.permit.max[key],
        label: { content, title },
    })
}

export default CarrierForm