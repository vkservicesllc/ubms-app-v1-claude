/* jQuery required; jQuery Caret, jQuery Masked Input & jQuery UI optional */
import { slim, word, english } from './supplies.mjs'


export const inputEvent = (selector, options = {}) => {
    let selection = ''

    if (Array.isArray(selector)) {
        for (const id of selector) selection += `#${id}, `
        selection = selection.slice(0, -2)
    } else if (typeof selector == 'string') {
        if (selector[0] != '#') selection = `#${selector}`
        else selection = selector
    }

    if (!selection) return

    const $input = $(selection)
    const { onFocus, onBlur, mask, strip } = options
    let { placeholder, caret, lower, upper, datepicker } = options

    if (mask) {
        if (!placeholder) placeholder = '#'
        if (!caret) caret = 0

        $input
            .mask(mask, {
                placeholder,
                completed() {
                    $(this).blur()
                },
            })
            .click(reset)
            .focus(reset)

        function reset() {
            if ($(this).val() == mask.replace(/9/g, placeholder))
                $(this).caret(caret)
        }
    }

    if (datepicker) {
        const defaults = {
            showAnim: 'slideDown',
            yearRange: '-100:+0',
            changeMonth: true,
            changeYear: true,
        }
        if (datepicker === true) datepicker = {}

        datepicker = { ...defaults, ...datepicker }

        $input
            .on('input', function() {
                $(this).val(null)
            })
            .datepicker(datepicker)
    }

    if (onFocus)
        $input.on('focus', function() {
            onFocus($(this).val(), $(this))
        })

    $input
        .on('input', function() {
            const caret = $(this).caret()
            const { onInput } = options
            let value = slim(english($(this).val()))
            if (lower) value = value.toLowerCase()
            if (upper) value = value.toUpperCase()

            $(this).val(value).caret(caret || caret.end)
            if (onInput) onInput(value, $(this), caret)
        })
        .on('change', function() {
            const { onChange } = options
            let value = $(this).val()
            if (strip) value = word(value)

            $(this).val(value)
            if (onChange) onChange(value, $(this))
        })

    if (onBlur)
        $input.on('blur', function() {
            onBlur($(this).val(), $(this))
        })
}


export const selectEvent = (id, options = {}) => {
    const $select = $(`#${id}`)
    const { fill, onChange, onFocus, onBlur } = options

    if (fill || onChange)
        $select.on('change', function() {
            const value = $(this).val()

            if (fill && value) $(this).find('option[value=""]').remove()
            if (onChange) onChange($(this).val(), $(this))
        })

    if (onFocus)
        $select.on('focus', function() {
            onFocus($(this).val(), $(this))
        })

    if (onBlur)
        $select.on('blur', function() {
            onBlur($(this).val(), $(this))
        })
}