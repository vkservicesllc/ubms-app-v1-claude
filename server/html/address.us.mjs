import Address from '../../client/global/modules/tools/core/address.us.mjs'
import { formLabel, formInput, formSelect } from '../../client/global/modules/tools/utils/html/form.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'


const name = (prop, mail) => mail !== null
    ? `${mail ? 'mail' : 'physical'}[${prop}]`
    : prop


export class Label {

    static address1 = (props = {}, mail = false) => formLabel({
        content: 'Street Address' + (mail ? ' / PO Box' : ''),
        addClass: 'required',
        ...props,
        for: props.for || props.id,
    })

    static address2 = (props = {}, business = false) => formLabel({
        content: business ? 'Suite/Unit' : 'Apt/Unit',
        ...props,
        for: props.for || props.id,
    })

    static zip = (props = {}) => formLabel({
        content: 'Zip',
        addClass: 'required',
        ...props,
        for: props.for || props.id,
    })

    static city = (props = {}) => formLabel({
        content: 'City',
        addClass: 'required',
        ...props,
        for: props.for || props.id,
    })

    static state = (props = {}) => formLabel({
        content: 'State',
        addClass: 'required',
        ...props,
        for: props.for || props.id,
    })

}


export class Input {

    static address1 = (props = {}, mail = null) => formInput({
        name: name('address1', mail),
        id: props.id || `${mail ? 'mail-' : ''}address1`,
        ...props,
        addClass: 'address us-address' + (mail ? ' mail-address' : ''),
        maxLength: inputLength.address.address1.max,
        required: true,
    })

    static address2 = (props = {}, mail = null) => formInput({
        name: name('address2', mail),
        id: props.id || `${mail ? 'mail-' : ''}address2`,
        ...props,
        addClass: 'address us-address' + (mail ? ' mail-address' : ''),
        maxLength: inputLength.address.address2.max,
        required: false,
    })

    static zip = (props = {}, mail = null) => formInput({
        name: name('zip', mail),
        id: props.id || `${mail ? 'mail-' : ''}zip`,
        ...props,
        addClass: 'us-address' + (mail ? ' mail-address' : ''),
        maxLength: inputLength.address.zip.max,
        required: true,
    })

    static city = (props = {}, mail = null) => formInput({
        name: name('city', mail),
        id: props.id || `${mail ? 'mail-' : ''}city`,
        ...props,
        addClass: 'address us-address' + (mail ? ' mail-address' : ''),
        maxLength: inputLength.address.city.max,
        required: true,
    })

}


export class Select {

    static stateUS = (props = {}, mail = null) => {
        const data = Address.stateList
        let { options } = props
        if (!options) options = {}
        if (!options.emptyOpt) options.emptyOpt = ''

        return formSelect({
            name: name('state', mail),
            id: props.id || `${mail ? 'mail-' : ''}state`,
            ...props,
            addClass: 'address us-address' + (mail ? ' mail-address' : ''),
            required: true,
        }, data, options)
    }

}