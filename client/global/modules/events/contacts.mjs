/* jQuery, jQuery Caret & jQuery Masked Input required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import strip, { tel as formatTel } from '../tools/utils/formatter.mjs'


export const telEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, onKeydown, onKeyup, onCompleted, value } = options

    inputEvent(id, {
        mask: '(999) 999-9999',
        caret: 1,
        onInput,
        onChange,
        onFocus,
        onBlur,
        onKeydown,
        onKeyup,
        onCompleted,
        value: formatTel(strip(value)),
    })
}


export const emailEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options
    let { multiple } = options
    if (typeof multiple != 'boolean') multiple = false

    inputEvent(id, {
        lower: true,
        value,
        onInput(email, $email) {
            email = patterns.replace(email, 'email')

            $email.val(email)
            if (onInput) onInput(email, $email)
        },
        onChange(email, $email) {
            if (!multiple) $email.val(email.replace(',', ''))

            if (onChange) {
                const valid = email
                    ? patterns.match.email.test(email)
                    : null

                onChange(email, valid, $email)
            }
        },
        onFocus,
        onBlur,
    })
}