import extractFormId from './support.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

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

            data.forEach((row, i) => {
                const address = new Address(row)

                html += '<tbody class="table-group-divider">'
                html += `<tr><th class="text-secondary">Address ${i + 1}:</th>`
                html += `<td>${address.html({ inline: false })}</td></tr>`
                html += `<tr><th class="text-secondary">Lived since</th><td>${moment(row.since).format('ll')}</td></tr>`
                html += '</tbody>'
            })

            $('#addresses').after(html)
        }
    },
})


$.ajax(`/api/application/${formId}/citations`, {
    method: 'POST',
    success(response) {
        const { data, error } = response
        if (error) return alert(error)

        if (!data.length) return

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

            html += '<tbody class="table-group-divider">'
            html += `<tr><th class="text-secondary">Violation ${i + 1}:</th><td>${reason}</td></tr>`
            html += `<tr><th class="text-secondary">Date:</th><td>${moment(citedOn).format('ll')}</td></tr>`
            html += `<tr><th class="text-secondary">State:</th><td>${Address.stateList[state]}</td></tr>`
            html += '</tbody>'
        })

        $('#citations').append(html)
    },
})


$.ajax(`/api/application/${formId}/accidents`, {
    method: 'POST',
    success(response) {
        const { data, error } = response
        if (error) return alert(error)

        if (!data.length) return

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

            html += '<tbody class="table-group-divider">'
            html += `<tr><th class="text-secondary">Accident ${i + 1}:</th><td>${type}</td></tr>`
            html += `<tr><th class="text-secondary">Date:</th><td>${moment(date).format('ll')}</td></tr>`
            html += `<tr><th class="text-secondary">State:</th><td>${Address.stateList[state]}</td></tr>`
            html += `<tr><th class="text-secondary">Casualties:</th><td>${injuries}<br/>${fatalities}</td></tr>`
            html += '</tbody>'
        })

        $('#accidents').append(html)
    },
})


$.ajax(`/api/application/${formId}/employers`, {
    method: 'POST',
    success(response) {
        let { data, error } = response
        if (error) return alert(error)

        if (data.length) {
            let html = ''

            data.forEach((row, i) => {
                const address = new Address(row)
                let period = `${moment(row.startedOn).format('ll')} — `
                period += row.leftOn ? moment(row.leftOn).format('ll') : 'Present day'
                let subject = ''
                if (row.fmcsr !== null) subject += `<small>FMCSR —</small> ${row.fmcsr ? 'Yes' : 'No'}`
                if (subject) subject += '<br/>'
                subject += `<small>Drug/Alcohol Testing —</small> ${row.dotDat ? 'Yes' : 'No'}`

                html += '<tbody class="table-group-divider">'
                html += `<tr><th class="text-secondary">Employer ${i + 1}:</th><td>${row.employer}</td></tr>`
                html += `<tr><th class="text-secondary">Phone:</th><td>${formatTel(row.phone)}</td></tr>`
                html += `<tr><th class="text-secondary">Address:</th><td>${address.html({ inline: false })}</td></tr>`
                html += `<tr><th class="text-secondary">Period:</th><td>${period}</td></tr>`
                html += `<tr><th class="text-secondary">Position/Title:</th><td>${row.position}</td></tr>`
                html += `<tr><th class="text-secondary">Earnings/Salary:</th><td>$${row.earnings.toLocaleString()} per month</td></tr>`
                html += `<tr><th class="text-secondary">Subject to:</th><td>${subject}</td></tr>`
                html += `<tr><th class="text-secondary">Reason for Leaving:</th><td>${row.rfl}</td></tr>`
                html += '</tbody>'
            })

            $('#pre-employments').append(html)
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