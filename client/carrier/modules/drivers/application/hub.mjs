const _id = $('#id').val()

const response = $.ajax(`/api/data/drivers/application/${_id}?sensitive=true`, { method: 'POST', async: false }).responseJSON
const { data, error } = response

if (error) alert(error)
const { application, identity, count, unmatchedIdx } = data

export default application
export { identity, count, unmatchedIdx }


export const errorIcon = '<i class="ui red exclamation triangle icon"></i>'


export const dropdownEvent = $dropdown => {
    Object.keys($dropdown).forEach(prop => {
        const [ $el, value, onChange ] = $dropdown[prop]

        $el.dropdown('set value', value).dropdown({ onChange })
    })
}


export function errorMessage(header, message, list) {
    const $message = $('<div class="ui icon error message"></div>')
    $message.append('<i class="exclamation triangle icon"></i>')

    const $content = $('<div class="content"></div>')
    $content.append(`<div class="header">${header}</div>`)
    if (message) $content.append(`<p>${message}</p>`)
    if (Array.isArray(list)) {
        const $list = $('<ul class="list"></ul>')
        list.forEach(item => $list.append(`<li>${item}</li>`))

        $content.append($list)
    }

    return $message.append($content)
}