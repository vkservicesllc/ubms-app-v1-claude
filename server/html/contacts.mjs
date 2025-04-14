import { formLabel, formInput } from '../../client/global/modules/tools/utils/html/form.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import { capitalizeFirst } from '../../client/global/modules/tools/utils/string.mjs'


export class Label {

    static tel = (purpose, props = {}) => {
        if (!['phone', 'fax'].includes(purpose)) return

        return formLabel({
            content: capitalizeFirst(purpose),
            ...props,
            for: props.for || props.id,
        })
    }

    static email = (props = {}) => formLabel({
        content: 'Email',
        ...props,
        for: props.for || props.id,
    })

}


export class Input {

    static tel = (purpose, props = {}) => {
        if (!['phone', 'fax'].includes(purpose)) return

        let { type } = props
        if (type != 'text') type = 'tel'

        return formInput({
            name: purpose,
            ...props,
            type,
        })
    }

    static email = (props = {}) => formInput({
        name: 'email',
        ...props,
        type: 'email',
        maxLength: inputLength.contact.email.max,
    })

}