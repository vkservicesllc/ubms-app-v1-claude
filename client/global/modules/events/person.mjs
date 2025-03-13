/* jQuery required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/string.mjs'


export const nameEvent = (id, options = {}) => {
    const { sfxId, onInput, onChange, onFocus, onBlur } = options

    inputEvent(id, {
        strip: true,
        onInput(name, $name) {
            name = patterns.replace(name, 'name')
            name = capitalizeEach(name)

            $name.val(name)
            if (onInput) onInput(name, $name)
        },
        onChange(name, $name) {
            if (sfxId) {
                const sfxPatt = patterns.match.suffix
                let suffix = sfxPatt.test(name)
                    ? sfxPatt.exec(name)[0]
                    : null
                name = name.replace(sfxPatt, '').trim()

                if (suffix) {
                    const $suffix = $(`#${sfxId}`)
                    suffix = patterns.replace(suffix, 'suffix')

                    $suffix.val(suffix)
                }
            }

            $name.val(name)
            if (onChange) onChange(name, $name)
        },
        onFocus,
        onBlur,
    })
}


export const ssnEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        mask: '999-99-9999',
        onInput,
        onChange,
        onFocus,
        onBlur,
    })
}