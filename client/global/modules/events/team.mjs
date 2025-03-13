/* jQuery required */
import { inputEvent, selectEvent } from './form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach, capitalizeAfterPunctuation } from '../tools/string.mjs'

const { nameId, descId } = formSelectors.team


export const teamNameEvent = (callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(nameId, {
        strip: true,
        onInput(name, $name) {
            name = patterns.replace(name, 'teamName')
            name = capitalizeEach(name)

            $name.val(name)
            if (onInput) onInput(name, $name)
        },
        onChange,
        onFocus,
        onBlur,
    })
}


export const teamDescEvent = (callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(descId, {
        strip: true,
        onInput(desc, $desc) {
            desc = capitalizeAfterPunctuation(desc)

            $desc.val(desc)
            if (onInput) onInput(desc, $desc)
        },
        onChange(desc, $desc) {
            desc = desc.trim()
            $desc.val(desc)

            if (onChange) onChange(desc, $desc)
        },
        onFocus,
        onBlur,
    })
}