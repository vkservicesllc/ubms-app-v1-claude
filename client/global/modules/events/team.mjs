/* jQuery required */
import { inputEvent } from './form.mjs'
import selector from '../registry/selectors/team.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach, capitalizeAfterPunctuation } from '../tools/utils/string.mjs'


export const teamNameEvent = (callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(selector.id.text.name, {
        strip: true,
        word: true,
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

    inputEvent(selector.id.text.desc, {
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