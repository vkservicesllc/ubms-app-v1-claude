import extractFormId from './support.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const $card = $('#apl-card')
const duration = 750
const formId = extractFormId(2)

const relocate = href => {
    $card.fadeOut(duration)
    setTimeout(() => {
        location.href = href
    }, duration)
}


$.ajax(`/api/application/${formId}/addresses`, {
    method: 'POST',
    success(response) {
        let { data, error } = response
        if (error) return alert(error)

        if (data.length) {
            let html = ''
            data = sortArrayByObjectKey(data, 'since', false)
            console.log(data)

            data.forEach(row => {
                const address = new Address(row)

                html += '<tr><th class="text-secondary">Address:</th>'
                html += `<td>${address.html({ inline: false })}<br/>`
                html += `<small>Lived since</small> ${moment(row.since).format('ll')}</td></tr>`
            })

            $('#addresses').prepend(html)
        }
    },
})


$card.fadeIn(duration)

$('a.btn').click(function(evt) {
    evt.preventDefault()

    const href = $(this).attr('href')
    relocate(href)
})

$('#edit-link').click(function() {
    const href = $(this).data('href')
    relocate(href)
})

$('#no-mistakes').click(function() {
    let action = 'hide', disabled = false

    if ($(this).prop('checked')) {
        action = 'show'
        disabled = true
    }

    $('#edit-link').prop('disabled', disabled)
    $('#certified-section')[action]()
})

$('#certify-form').submit(function(evt) {
    evt.preventDefault()

    $card.fadeOut(duration)
    setTimeout(() => {
        this.submit()
    }, duration)
})