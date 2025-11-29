import initializeAttr, { initializeClass } from './support.mjs'
import { sortObjectByKey, sortObjectByValue } from '../sorter.mjs'


export const formLabel = (props = {}) => {
    const { id, title, hidden, content } = props
    const classes = initializeClass(props)
    let forId = props.for
    if (typeof forId === 'string') forId = forId.replace(/#/g, '')

    const classAttr = initializeAttr('class', classes)
    const idAttr = initializeAttr('id', id)
    const forAttr = ` for="${forId || ''}"`
    const titleAttr = initializeAttr('title', title)
    const hiddenAttr = initializeAttr('hidden', hidden)

    return `<label${classAttr + idAttr + forAttr + titleAttr + hiddenAttr}>${content || ''}</label>`
}


export const formInput = (props = {}) => {
    const {
        mode,
        id,
        name,
        value,
        pattern,
        placeholder,
        maxLength,
        min,
        max,
        step,
        autoComplete,
        contextMenu,
        required,
        checked,
        disabled,
        readOnly,
    } = props
    const classes = initializeClass(props)
    const type = props.type || 'text'

    const modeAttr = initializeAttr('inputmode',mode)
    const classAttr = initializeAttr('class', classes)
    const idAttr = initializeAttr('id', id)
    const nameAttr = initializeAttr('name', name)
    const valueAttr = initializeAttr('value', value)
    const patternAttr = initializeAttr('pattern', pattern)
    const placeholderAttr = initializeAttr('placeholder', placeholder)
    const maxLengthAttr = initializeAttr('maxlength', maxLength)
    const minAttr = initializeAttr('min', min)
    const maxAttr = initializeAttr('max', max)
    const stepAttr = initializeAttr('step', step)
    const autoCompleteAttr = initializeAttr('autocomplete', autoComplete)
    const contextMenuAttr = initializeAttr('contextmenu', contextMenu)
    const requiredAttr = initializeAttr('required', required)
    const checkedAttr = initializeAttr('checked', checked)
    const disabledAttr = initializeAttr('disabled', disabled)
    const readOnlyAttr = initializeAttr('readonly', readOnly)
    const attrs = modeAttr
        + classAttr
        + idAttr
        + nameAttr
        + valueAttr
        + patternAttr
        + placeholderAttr
        + maxLengthAttr
        + minAttr
        + maxAttr
        + stepAttr
        + autoCompleteAttr
        + contextMenuAttr
        + requiredAttr
        + checkedAttr
        + disabledAttr
        + readOnlyAttr

    return `<input type="${type}"${attrs} />`
}


export const formTextArea = (props = {}) => {
    const {
        id,
        name,
        placeholder,
        wrap,
        autoComplete,
        maxLength,
        cols,
        rows,
        contextMenu,
        required,
        disabled,
        readOnly,
    } = props
    const classes = initializeClass(props)
    const tabs = props.tabs || -1
    let value = props.value || ''

    let nl = ''
    if (tabs && !isNaN(tabs) && tabs > -1) {
        nl = `\n${'\t'.repeat(tabs)}`
        value = `\n${'\t'.repeat(tabs - 1) + value}`
    }

    const classAttr = initializeAttr('class', classes)
    const idAttr = initializeAttr('id', id)
    const nameAttr = initializeAttr('name', name)
    const placeholderAttr = initializeAttr('placeholder', placeholder)
    const wrapAttr = initializeAttr('wrap', wrap)
    const maxLengthAttr = initializeAttr('maxlength', maxLength)
    const colsAttr = initializeAttr('cols', cols)
    const rowsAttr = initializeAttr('rows', rows)
    const autoCompleteAttr = initializeAttr('autocomplete', autoComplete)
    const contextMenuAttr = initializeAttr('contextmenu', contextMenu)
    const requiredAttr = initializeAttr('required', required)
    const disabledAttr = initializeAttr('disabled', disabled)
    const readOnlyAttr = initializeAttr('readonly', readOnly)
    const attrs = classAttr
        + idAttr
        + nameAttr
        + placeholderAttr
        + wrapAttr
        + maxLengthAttr
        + colsAttr
        + rowsAttr
        + autoCompleteAttr
        + contextMenuAttr
        + requiredAttr
        + disabledAttr
        + readOnlyAttr

    return `<textarea${attrs}>${value + nl}</textarea>`
}


const formSelectOptions = (data = {}, options = {}) => {
    let html = ''
    let { value, tabs, valOpt, emptyOpt, order, disabled } = options

    if (!value) value = null
    if (tabs === undefined || isNaN(tabs) || tabs < 0) tabs = 0
    valOpt = valOpt === true
    if (!emptyOpt && emptyOpt !== '') emptyOpt = null
    if (!order || (order !== 'asc' && order !== 'desc')) order = null
    if (!disabled) disabled = []

    let depth = 1
    for (let key in data) {
        if (typeof data[key] !== 'object') break
        if (depth === 1) depth = 2
        if (!order) break

        let sortedData
        if (valOpt) sortedData = sortObjectByKey(data[key], order)
        else sortedData = sortObjectByValue(data[key], order)

        data[key] = sortedData
    }

    const nl = tabs ? `\n` : ''
    tabs = `\t`.repeat(tabs)

    if (emptyOpt !== null)
        html = nl + tabs + `<option value="">${emptyOpt}</option>`

    if (depth === 1) {
        if (order) {
            let sortedData

            if (valOpt) sortedData = sortObjectByKey(data, order)
            else sortedData = sortObjectByValue(data, order)

            data = sortedData
        }

        for (let key in data) {
            let attrs = initializeAttr('selected', value && key == value)
            attrs += initializeAttr('disabled', disabled.includes(key))
            const option = !valOpt ? data[key] : key

            html += nl + tabs + `<option value="${key}"${attrs}>${option}</option>`
        }
    }

    else if (depth === 2) {
        for (let group in data) {
            const opts = data[group]
            let groupId = ''

            if (group.indexOf(':') > -1) {
                group = group.split(':')
                groupId = `${group[0]}:`
                group = group[1]
            }

            html += nl + tabs + `<optgroup label="${group}">`
            for (let key in opts) {
                const val = groupId + key
                const sel = initializeAttr('selected', value && key == value)
                const dis = initializeAttr('disabled', disabled.includes(key))
                const opt = !valOpt ? opts[key] : key
                const tabspls = tabs ? tabs + `\t` : tabs

                html += nl + tabspls + `<option value="${val}"${sel + dis}>${opt}</option>`
            }

            html += nl + tabs + '</optgroup>'
        }
    }

    return html
}


export const formSelect = (props = {}, data = {}, options = {}) => {
    const {
        id,
        name,
        value,
        size,
        multiple,
        required,
        disabled,
    } = props
    let { emptyOpt } = props
    const classes = initializeClass(props)
    const tabs = props.tabs >= -1 ? props.tabs : -1

    const classAttr = initializeAttr('class', classes)
    const idAttr = initializeAttr('id', id)
    const sizeAttr = initializeAttr('size', size)
    const nameAttr = initializeAttr('name', name)
    const multipleAttr = initializeAttr('multiple', multiple)
    const requiredAttr = initializeAttr('required', required)
    const disabledAttr = initializeAttr('disabled', disabled)

    if (value) {
        options.value = value
        if (required === true) emptyOpt = null
    } else options.value = null

    const nl = tabs > -1 ? `\n${'\t'.repeat(tabs)}` : ''
    const attrs = classAttr
        + idAttr
        + nameAttr
        + sizeAttr
        + multipleAttr
        + requiredAttr
        + disabledAttr

    let html = `<select${attrs}>`

    html += formSelectOptions(data, { ...options, tabs: tabs + 1, emptyOpt })
    html += `${nl}</select>`

    return html
}


const formCheck = (type, props = {}) => {
    const exclude = [
        'placeholder',
        'minLength',
        'maxLength',
        'min',
        'max',
        'step',
        'autoComplete',
        'contextMenu',
    ]

    for (const key in props)
        if (exclude.includes(key)) delete props[key]

    return formInput({ ...props, type })
}


export const formCheckbox = (props = {}) => formCheck('checkbox', props)

export const formRadio = (props = {}) => formCheck('radio', props)