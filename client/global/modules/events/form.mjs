/* jQuery required; jQuery Caret, jQuery Masked Input & jQuery UI optional */
import { capitalizeEach, capitalizeFirst } from '../tools/utils/string.mjs'
import { slim, strip as _strip, word as _word, english } from './supplies.mjs'


export const inputEvent = (selector, options = {}) => {
    if (!selector) return

    const $input = $(selector)
    const { onFocus, onKeydown, onKeyup, onBlur, mask, onCompleted, strip, word, value } = options
    let { placeholder, caret, lower, upper, datepicker, capitalize } = options
    if (!['each', 'first'].includes(capitalize)) capitalize = false

    if (mask) {
        if (!placeholder) placeholder = '#'
        if (!caret) caret = 0
        const { onInput } = options

        $input
            .mask(mask, {
                placeholder,
                completed() {
                    $(this).blur()
                    if (onCompleted) onCompleted($(this).val(), $(this))
                },
            })
            .click(reset)
            .focus(reset)

        if (onInput) //! needs more testing
            $input
                .off('keydown')
                .on('keydown', function() { //? not sure about this method...
                    const value = slim(english($(this).val()))

                    onInput(value, $(this))
                })

        function reset() {
            if ($(this).val() === mask.replace(/9/g, placeholder))
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
            .off('input')
            .on('input', function() {
                $(this).val(null)
            })
            .datepicker(datepicker)
    }

    if (onFocus)
        $input
            .off('focus')
            .on('focus', function() {
                onFocus($(this).val(), $(this))
            })

    if (onKeydown)
        $input
            .off('keydown')
            .on('keydown', function() {
                onKeydown($(this).val(), $(this))
            })

    if (onKeyup)
        $input
            .off('keyup')
            .on('keyup', function() {
                onKeyup($(this).val(), $(this))
            })

    $input
        .off('input')
        .on('input', function() {
            const { onInput } = options
            let value = slim(english($(this).val()))
            if (lower) value = value.toLowerCase()
            if (upper) value = value.toUpperCase()
            if (capitalize === 'each') value = capitalizeEach(value)
            else if (capitalize === 'first') value = capitalizeFirst(value)

            $(this).val(value)
            if (onInput) onInput(value, $(this))
        })
        .off('change')
        .on('change', function() {
            const { onChange } = options
            let value = $(this).val()
            if (word) value = _word(value)
            if (strip) value = _strip(value)

            $(this).val(value)
            if (onChange) onChange(value, $(this))
        })

    if (onBlur)
        $input
            .off('blur')
            .on('blur', function() {
                onBlur($(this).val(), $(this))
            })

    if (value !== undefined) $input.val(value)
}


export const selectEvent = (selector, options = {}) => {
    const $select = $(selector)
    const { fill, onChange, onFocus, onBlur, value } = options

    if (fill || onChange)
        $select
            .off('change')
            .on('change', function() {
                const value = $(this).val()

                if (fill && value) $(this).find('option[value=""]').remove()
                if (onChange) onChange($(this).val(), $(this))
            })

    if (onFocus)
        $select
            .off('focus')
            .on('focus', function() {
                onFocus($(this).val(), $(this))
            })

    if (onBlur)
        $select
            .off('blur')
            .on('blur', function() {
                onBlur($(this).val(), $(this))
            })

    if (value !== undefined) $select.val(value)
}