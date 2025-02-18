/* jQuery & jQuery Caret required */
import { inputEvent, selectEvent } from './form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach, capitalizeAfterPunctuation } from '../tools/string.mjs'

const { nameId, descId } = formSelectors.team


export const teamNameEvent = (callback = {}) => {
    const { onInput, onChange, onAjax, onFocus, onBlur } = callback

    inputEvent(nameId, {
        strip: true,
        onInput(name, $name, caret) {
            name = patterns.replace(name, 'teamName')
            name = capitalizeEach(name)

            $name.val(name).caret(caret || caret.end)
            if (onInput) onInput(name, $name, caret)
        },
        onChange,
        onAjax, //? need to test, possible needs to be inside onChange
        onFocus,
        onBlur,
    })
}


export const teamDescEvent = (callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(descId, {
        onInput(desc, $desc, caret) {
            desc = capitalizeAfterPunctuation(desc)

            $desc.val(desc).caret(caret || caret.end)
            if (onInput) onInput(desc, $desc, caret)
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