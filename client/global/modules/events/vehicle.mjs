/* jQuery required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/utils/string.mjs'


export const makeEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        onInput(make, $make) {
            make = capitalizeEach(make)
            make = patterns.replace(make, 'vhlMake')

            $make.val(make)
            if (onInput) onInput(make, $make)
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
        onInput(model, $model) {
            model = capitalizeEach(model)
            model = patterns.replace(model, 'vhlModel')

            $model.val(model)
            if (onInput) onInput(model, $model)
        },
        onChange,
        onFocus,
        onBlur,
    })
}