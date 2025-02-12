import { sortObjectByKey, sortObjectByValue } from '../tools/sorter.mjs'



const escape = html => html.replace(/[&<>"']/g, function(match) {
    return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;',
        '=': '&#61;',
    }[match]
})

export default escape


export const formLabel = props => {
    if (!props) props = {}
    const { for: forId, class: className, addClass, title, content } = props
    if (!content) return

    const forAttr = forId ? ` for="${forId}"` : ''
    const classAttr = createClassAttr(className, addClass)
    const titleAttr = title ? ` title="${title}"` : ''
    const attrs = forAttr + classAttr + titleAttr

    return `<label${attrs}>${content}</label>`
}


export const formInput = props => {
    if (!props) props = {}
    let { type } = props
    const {
        class: className,
        addClass,
        id,
        name,
        value,
        placeholder,
        minLength,
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

    if (!type) type = 'text'
    const classAttr = createClassAttr(className, addClass)
    const idAttr = id ? ` id="${id}"` : ''
    const nameAttr = name ? ` name="${name}"` : ''
    const valueAttr = value ? ` value="${value}"` : ''
    const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : ''
    const minLengthAttr = minLength ? ` minlength="${minLength}"` : ''
    const maxLengthAttr = maxLength ? ` maxlength="${maxLength}"` : ''
    const minAttr = min ? ` min="${min}"` : ''
    const maxAttr = max ? ` max="${max}"` : ''
    const stepAttr = step ? ` step="${step}"` : ''
    const autoCompleteAttr = autoComplete ? ` autocomplete="${autoComplete}"` : ''
    const contextMenuAttr = typeof contextMenu == 'boolean' ? ` oncontextmenu="return ${contextMenu};"` : ''
    const requiredAttr = required === true ? ' required' : ''
    const checkedAttr = checked === true ? ' checked' : ''
    const disabledAttr = disabled === true ? ' disabled' : ''
    const readOnlyAttr = readOnly === true ? ' readonly' : ''
    const attrs = classAttr
        + idAttr
        + nameAttr
        + valueAttr
        + placeholderAttr
        + minLengthAttr
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


export const formTextArea = props => {
    if (!props) props = {}

    let { tabs, value } = props
    const {
        class: className,
        addClass,
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
    if (!tabs) tabs = 0

    let nl = ''
    if (!value) value = ''
    if (tabs && value) {
        nl = `\n${'\t'.repeat(tabs)}`
        value = `\n${'\t'.repeat(tabs - 1) + value}`
    }

    const classAttr = createClassAttr(className, addClass)
    const idAttr = id ? ` id="${id}"` : ''
    const nameAttr = name ? ` name="${name}"` : ''
    const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : ''
    const wrapAttr = wrap ? ` wrap="${wrap}"` : ''
    const maxLengthAttr = maxLength ? ` maxlength="${maxLength}"` : ''
    const colsAttr = cols ? ` cols="${cols}"` : ''
    const rowsAttr = rows ? ` cols="${rows}"` : ''
    const autoCompleteAttr = autoComplete ? ` autocomplete="${autoComplete}"` : ''
    const contextMenuAttr = typeof contextMenu == 'boolean' ? ` oncontextmenu="return ${contextMenu};"` : ''
    const requiredAttr = required === true ? ' required' : ''
    const disabledAttr = disabled === true ? ' disabled' : ''
    const readOnlyAttr = readOnly === true ? ' readonly' : ''
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


export const formSelectOptions = (data = {}, options = {}) => {
    let html = ''
    let { value, tabs, valOpt, emptyOpt, order, disabled } = options

    if (!value) value = null
    if (!tabs) tabs = 0

    valOpt = valOpt === true ? true : false

    if (!emptyOpt && emptyOpt != '') emptyOpt = null
    if (!order || (order != 'asc' && order != 'desc')) order = null
    if (!disabled) disabled = []

    let depth = 1
    for (let key in data) {
        if (typeof data[key] != 'object') break
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
            const sel = value && key == value ? ' selected' : ''
            const dis = disabled.includes(key) ? ' disabled' : ''
            const opt = !valOpt ? data[key] : key

            html += nl + tabs + `<option value="${key}"${sel + dis}>${opt}</option>`
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
                const sel = value && opts[key] == value ? ' selected' : ''
                const dis = disabled.includes(key) ? ' disabled' : ''
                const opt = !valOpt ? opts[key] : key
                const tabspls = tabs ? tabs + `\t` : tabs

                html += nl + tabspls + `<option value="${val}"${sel + dis}>${opt}</option>`
            }

            html += nl + tabs + '</optgroup>'
        }
    }

    return html
}


export const formSelect = (props, data = {}, options = {}) => {
    if (!props) props = {}
    let { tabs } = props
    const {
        class: className,
        addClass,
        id,
        name,
        value,
        required,
        disabled,
    } = props

    const classAttr = createClassAttr(className, addClass)
    const idAttr = id ? ` id="${id}"` : ''
    const nameAttr = name ? ` name="${name}"` : ''
    const requiredAttr = required === true ? ' required' : ''
    const disabledAttr = disabled === true ? ' disabled' : ''
    let valueAttr = ''
    if (value) {
        valueAttr = ` value="${value}"`
        options.value = value
        if (required === true) options.emptyOpt = null
        // if (typeof options == 'object' && 'value' in options)
        //     delete options.value
    }
    if (!tabs) tabs = 0

    const nl = tabs ? `\n${'\t'.repeat(tabs)}` : ''
    const attrs = classAttr
        + idAttr
        + nameAttr
        + valueAttr
        + requiredAttr
        + disabledAttr

    let html = `<select${attrs}>`

    html += formSelectOptions(data, { ...options, tabs: tabs && tabs + 1 })
    html += `${nl}</select>`

    return html
}


export const button = props => {
    if (!props) props = {}
    const {
        type, 
        class: className,
        addClass,
        id,
        form,
        disabled,
        content,
    } = props
    if (!content) return

    const typeAttr = type ? ` type="${type}"` : ' type="button"'
    const classAttr = createClassAttr(className, addClass)
    const idAttr = id ? ` id="${id}"` : ''
    const formAttr = form ? ` form="${form}"` : ''
    const disabledAttr = disabled === true ? ' disabled' : ''

    const attrs = typeAttr
        + classAttr
        + idAttr
        + formAttr
        + disabledAttr

    return `<button${attrs}>${content}</button>`
}



function createClassAttr(className = '', addClass) {
    if (addClass)
        className += (className ? ' ' : '') + addClass

    return className ? ` class="${className}"` : ''
}