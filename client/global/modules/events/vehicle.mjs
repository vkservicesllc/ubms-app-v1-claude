/* jQuery required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/utils/string.mjs'


export const makeEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(make, $make, pos) {
            make = capitalizeEach(make)
            make = patterns.replace(make, 'vhlMake')

            $make.val(make)
            if (onInput) onInput(make, $make, pos)
        },
        onChange,
        onFocus,
        onBlur,
    })
}


export const modelEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(model, $model, pos) {
            model = capitalizeEach(model)
            model = patterns.replace(model, 'vhlModel')

            $model.val(model)
            if (onInput) onInput(model, $model, pos)
        },
        onChange,
        onFocus,
        onBlur,
    })
}