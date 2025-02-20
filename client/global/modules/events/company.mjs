/* jQuery & jQuery Caret required */
import { inputEvent, selectEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/string.mjs'
import strip from '../tools/formatter.mjs'

const categories = $.ajax('/api/assets/company?filter=categories', { async: false, method: 'POST' }).responseJSON


export const catIdEvent = (id, iconId, onChange, callback = {}) => {
    const { onFocus, onBlur } = callback

    selectEvent(id, {
        fill: true,
        onChange(catId, $catId) {
            if (iconId) {
                const $icon = $(`#${iconId}`)
                const icon = '<i class="fas fa-file-circle-question"></i>'

                $icon.html(categories[catId].icon || icon)
            }

            if (onChange) onChange(catId, $catId)
        },
        onFocus,
        onBlur,
    })
}


export const busNameEvent = (id, coTypeId, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        strip: true,
        onInput(busName, $busName, caret) {
            busName = capitalizeEach(busName)
            busName = patterns.replace(busName, 'busName')

            $busName.val(busName).caret(caret || caret.end)
            if (onInput) onInput(busName, $busName, caret)
        },
        onChange(busName, $busName) {
            const $coType = $(`#${coTypeId}`)
            const coTypePatt = patterns.match.coType
            let coType = coTypePatt.test(busName)
                    ? coTypePatt.exec(busName)[0]
                    : null
            busName = busName.replace(coTypePatt, '').trim()

            if (coType) {
                coType = patterns.replace(coType, 'coType')

                $coType.val(coType).find('option[value=""]').remove()
            }

            $busName.val(busName)
            if (onChange) {
                if (!coType) coType = $coType.val()
                onChange(busName, coType, $busName, $coType)
            }
        },
        onFocus,
        onBlur,
    })
}


export const coTypeEvent = (id, busNameId, onChange, callback = {}) => {
    const { onFocus, onBlur } = callback

    selectEvent(id, {
        fill: true,
        onChange(coType, $coType) {
            if (onChange) {
                const $busName = $(`#${busNameId}`)
                const busName = $busName.val()

                onChange(coType, busName, $coType, $busName)
            }
        },
        onFocus,
        onBlur,
    })
}


export const aliasEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        upper: true,
        onInput(alias, $alias, caret) {
            alias = alias.replace(/[^A-Z]/, '')

            $alias.val(alias).caret(caret || caret.end)
            if (onInput) onInput(alias, $alias, caret)
        },
        onChange,
        onFocus,
        onBlur,
    })
}


export const einEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        mask: '99-9999999',
        onInput,
        onChange(ein, $ein) {
            if (onChange) {
                ein = strip(ein)
                onChange(ein, $ein)
            }
        },
        onFocus,
        onBlur,
    })
}


export const dunsEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        mask: '99-999-9999',
        onInput,
        onChange(duns, $duns) {
            if (onChange) {
                duns = strip(duns)
                onChange(duns, $duns)
            }
        },
        onFocus,
        onBlur,
    })
}