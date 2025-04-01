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
            const $suffix = $(`#${sfxId}`)
            let suffix
            if (sfxId) {
                const sfxPatt = patterns.match.suffix
                suffix = sfxPatt.test(name)
                    ? sfxPatt.exec(name)[0]
                    : null
                name = name.replace(sfxPatt, '').trim()

                if (suffix) {
                    suffix = patterns.replace(suffix, 'suffix')

                    $suffix.val(suffix)
                }
            }

            $name.val(name.replace(/^'|'$/g, ''))
            if (onChange) onChange(name, $name, suffix, $suffix)
        },
        onFocus,
        onBlur,
    })
}


export const ssnEvent = (id, options = {}) => {
    const { last4, onInput, onChange, onFocus, onBlur } = options
    let mask = '999-99-9999'

    if (last4 === true) mask = '9999'

    inputEvent(id, {
        mask,
        onInput,
        onChange,
        onFocus,
        onBlur,
    })
}


export const driverLicenseEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        strip: true,
        onInput(dl, $dl) {
            dl = patterns.replace(dl, 'driverLicense')
            dl = dl.toUpperCase()

            $dl.val(dl)
            if (onInput) onInput(dl, $dl)
        },
        onChange,
        onFocus,
        onBlur,
    })
}