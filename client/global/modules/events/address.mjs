/* jQuery & jQuery Caret required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/string.mjs'


export const addr1Event = (id, options = {}) => {
    const { addr2Id, onInput, onChange, onFocus, onBlur } = options
    let { mail } = options
    if (mail === undefined || typeof mail != 'boolean') mail = false

    inputEvent(id, {
        strip: true,
        onInput(addr1, $addr1, caret) {
            addr1 = capitalizeEach(addr1)

            $addr1.val(addr1).caret(caret || caret.end)
            if (onInput) onInput(addr1, $addr1, caret)
        },
        onChange(addr1, $addr1) {
            addr1 = patterns.replace(addr1, 'addr1')
            const poBox = /\bPO Box\b/gi.test(addr1)

            if (!mail && poBox) addr1 = null
            else if (addr2Id) {
                const $addr2 = $(`#${addr2Id}`)
                if (poBox) $addr2.val(null)
                else {
                    const addr2Patt = patterns.match.addr2
                    let addr2 = addr2Patt.test(addr1)
                        ? addr2Patt.exec(addr1)[0].toUpperCase()
                        : null
                    addr1 = addr1.replace(addr2Patt, '').trim()
                    if (addr2) addr2 = patterns.replace(addr2, 'addr2')

                    $addr2.val(addr2)
                }
            }

            $addr1.val(addr1)
            if (onChange) onChange(addr1, $addr1)
        },
        onFocus,
        onBlur,
    })
}


export const addr2Event = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        strip: true,
        onInput(addr2, $addr2, caret) {
            addr2 = capitalizeEach(addr2)

            $addr2.val(addr2).caret(caret || caret.end)
            if (onInput) onInput(addr2, $addr2, caret)
        },
        onChange(addr2, $addr2) {
            addr2 = patterns.replace(addr2, 'addr2')

            $addr2.val(addr2)
            if (onChange) onChange(addr2, $addr2)
        },
        onFocus,
        onBlur,
    })
}


export const zipEvent = (id, options = {}) => {
    const { cityId, stateId, onInput, onChange, onFocus, onBlur } = options

    inputEvent(id, {
        onInput(zip, $zip, caret) {
            zip = patterns.replace(zip, 'zip')

            const { length } = zip
            const maxLength = $zip.attr('maxlength')

            $zip.val(zip).caret(caret || caret.end)
            if (length == maxLength) $zip.blur()
            if (onInput) onInput(zip, $zip, caret)
        },
        onChange(zip, $zip) {
            if (cityId || stateId)
                $.ajax(`/api/public/us-zips/${zip}`, {
                    success(response) {
                        if (!('data' in response)) return
                        const { city, state } = response.data

                        if (city && state) {
                            if (cityId) $(`#${cityId}`).val(city)
                            if (stateId) $(`#${stateId}`).val(state)
                        }
                    },
                })

            if (onChange) onChange(zip, $zip)
        },
        onFocus,
        onBlur,
    })
}


export const cityEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        strip: true,
        onInput(city, $city, caret) {
            city = capitalizeEach(city)
            city = patterns.replace(city, 'city')

            $city.val(city).caret(caret || caret.end)
            if (onInput) onInput(city, $city, caret)
        },
        onChange,
        onFocus,
        onBlur,
    })
}