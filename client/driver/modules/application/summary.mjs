import extractFormId from './support.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const $card = $('#apl-card')
const duration = 750
const formId = extractFormId(2)
const noneTr = '<tr><td colspan="2"><small class="text-danger">None</small></td></tr>'

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


$.ajax(`/api/application/${formId}/citations`, {
    method: 'POST',
    success(response) {
        const $table = $('#citations')
        const { data, error } = response
        if (error) return alert(error)

        if (!data.length) return $table.html(noneTr)

        const violations = $.ajax('/api/local-source/application?filter=violations', { method: 'POST', async: false }).responseJSON
        let html = ''

        data.forEach((row, i) => {
            let { violation: reason } = row
            const { other, citedOn, state } = row

            if (other) reason = other
            else
                violationLoop:
                for (const group in violations) {
                    const set = violations[group]

                    if (typeof set === 'object')
                        for (const prop in set) {
                            if (reason !== prop) continue

                            reason = set[prop]
                            break violationLoop
                        }
                }

            html += `<tr><th class="text-secondary">Violation ${i + 1}:</th>`
            html += `<td>${reason}<br/><small>on</small> ${moment(citedOn).format('ll')}<br/><small>in</small> ${Address.stateList[state]}</td></tr>`
        })

        $table.html(html)
    },
})


$.ajax(`/api/application/${formId}/accidents`, {
    method: 'POST',
    success(response) {
        const $table = $('#accidents')
        const { data, error } = response
        if (error) return alert(error)

        if (!data.length) return $table.html(noneTr)

        const accidents = $.ajax('/api/local-source/application?filter=accidents', { method: 'POST', async: false }).responseJSON
        let html = ''

        data.forEach((row, i) => {
            let { collision: type, injuries, fatalities } = row
            const { other, date, state } = row

            injuries = (injuries ? 'Had' : 'No') + ' injuries'
            fatalities = (fatalities ? 'Had' : 'No') + ' fatalities'

            if (other) type = other
            else
                accidentLoop:
                for (const group in accidents) {
                    const set = accidents[group]

                    if (typeof set === 'object')
                        for (const prop in set) {
                            if (type !== prop) continue

                            type = set[prop]
                            break accidentLoop
                        }
                }

            html += `<tr><th class="text-secondary">Accident ${i + 1}:</th>`
            html += `<td>${type}<br/><small>on</small> ${moment(date).format('ll')}<br/><small>in</small> ${Address.stateList[state]}`
            html += `<br/>${injuries}<br/>${fatalities}</td></tr>`
        })

        $table.html(html)
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