/* jQuery required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/utils/string.mjs'
import strip, { ssn as formatSsn } from '../tools/utils/formatter.mjs'


export const nameEvent = (id, options = {}) => {
    const { sfx, sfxId, onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(name, $name, pos) {
            name = patterns.replace(name, 'name')
            name = capitalizeEach(name)

            $name.val(name)
            if (onInput) onInput(name, $name, pos)
        },
        onChange(name, $name) {
            const $suffix = $(sfxId)
            let suffix
            if (sfxId || sfx === true) {
                const sfxPatt = patterns.match.suffix
                suffix = sfxPatt.test(name)
                    ? sfxPatt.exec(name)[0]
                    : null
                name = name.replace(sfxPatt, '').trim()

                if (suffix) {
                    suffix = patterns.replace(suffix, 'suffix')

                    if (sfx === true) name += `, ${suffix}`
                    else $suffix.val(suffix)
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
    const { last4, onInput, onChange, onFocus, onBlur, onKeydown, onKeyup, onCompleted, value } = options
    let mask = '999-99-9999'

    if (last4 === true) mask = '9999'

    inputEvent(id, {
        mask,
        onFocus,
        onInput,
        onChange,
        onBlur,
        onKeydown,
        onKeyup,
        onCompleted,
        value: formatSsn(strip(value)),
    })
}


export const driverLicenseEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(dl, $dl, pos) {
            dl = patterns.replace(dl, 'driverLicense')
            dl = dl.toUpperCase()

            $dl.val(dl)
            if (onInput) onInput(dl, $dl, pos)
        },
        onChange,
        onFocus,
        onBlur,
    })
}


export const dlClassEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(dlClass, $dlClass, pos) {
            dlClass = patterns.replace(dlClass, 'dlClass')
            dlClass = dlClass.toUpperCase()

            $dlClass.val(dlClass)
            if (onInput) onInput(dlClass, $dlClass, pos)
        },
        onChange,
        onFocus,
        onBlur,
    })
}