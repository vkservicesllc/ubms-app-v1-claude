/* jQuery, jQuery Caret & jQuery Masked Input required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'


export const telEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        mask: '(999) 999-9999',
        caret: 1,
        onInput,
        onChange,
        onFocus,
        onBlur,
    })
}


export const emailEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        lower: true,
        onInput(email, $email, caret) {
            email = patterns.replace(email, 'email')

            $email.val(email)
            if (caret) $email.caret(caret || caret.end)
            if (onInput) onInput(email, $email, caret)
        },
        onChange(email, $email) {
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