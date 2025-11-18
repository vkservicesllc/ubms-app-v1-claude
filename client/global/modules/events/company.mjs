/* jQuery required */
import { inputEvent, selectEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/utils/string.mjs'
import strip, { ein as formatEin } from '../tools/utils/formatter.mjs'

const categories = $.ajax('/api/public/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON


export const categoryEvent = (id, iconId, onChange, options = {}) => {
    const { onFocus, onBlur, value } = options

    selectEvent(id, {
        fill: true,
        value,
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


export const busNameEvent = (id, coTypeId, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(busName, $busName) {
            busName = capitalizeEach(busName)
            busName = patterns.replace(busName, 'busName')

            $busName.val(busName)
            if (onInput) onInput(busName, $busName)
        },
        onChange(busName, $busName) {
            const $coType = $(coTypeId)
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
                if (!coType && coTypeId !== true) coType = $coType.val()
                onChange(busName, coType, $busName, $coType)
            }
        },
        onFocus,
        onBlur,
    })
}


export const coTypeEvent = (id, busNameId, onChange, options = {}) => {
    const { onFocus, onBlur, value } = options

    selectEvent(id, {
        fill: true,
        value,
        onChange(coType, $coType) {
            if (onChange) {
                const $busName = $(busNameId)
                const busName = $busName.val()

                onChange(coType, busName, $coType, $busName)
            }
        },
        onFocus,
        onBlur,
    })
}


export const aliasEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        upper: true,
        word: true,
        value,
        onInput(alias, $alias) {
            alias = alias.replace(/[^A-Z]/, '')

            $alias.val(alias)
            if (onInput) onInput(alias, $alias)
        },
        onChange,
        onFocus,
        onBlur,
    })
}


export const einEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, onKeydown, onKeyup, onCompleted, value } = options

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
        onKeydown,
        onKeyup,
        onCompleted,
        value: formatEin(strip(value)),
    })
}


export const dunsEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, onKeydown, onKeyup, onCompleted, value } = options

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
        onKeydown,
        onKeyup,
        onCompleted,
        value,
    })
}