import table from './applications.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text
const emailId = TS.email
const addr1Id = TS.address1
const addr2Id = TS.address2
const zipId = TS.addrZip
const cityId = TS.addrCity

const modalId = '#new-apl-modal'
const $modal = $(modalId)
const $aplUrl = $('#apl-url')
const aplUrl = $aplUrl.attr('href')
const $pdfLink = $('#pdf-link')
const pdfUrl = $pdfLink.attr('href')
const $message = {
    email: $('#email-help'),
}
const message = {
    email: $message.email.html(),
}

const $submit = $('#new-apl-submit')
const $form = $('#new-apl-form')
const $email = $(emailId)
const $expiration = $(TS.statusExp)
const $registerApl = $('#register-new-apl')
const $selfAssign = $('#self-assign')
const $posRole = $('.position-role')

const $dropdown = {
    carrier: $('#new-apl-carrier-dropdown'),
    team: $('#new-apl-team-dropdown'),
    suffix: $('#suffix-dropdown'),
    gender: $('#gender-dropdown'),
    marital: $('#marital-dropdown'),
    addrState: $('#addr-state-dropdown'),
    position: $('#position-dropdown'),
}
const $field = {
    applicant: $('.applicant-field'),
    status: $('#applicant-legal-status-field'),
    expiration: $('#applicant-legal-status-expiration-field'),
}


emailEvent(emailId, {
    onInput() {
        $message.email.html(message.email)
    },
    onChange(email, valid, $email) {
        if (!valid) {
            $message.email
                .html(`<span class="ui red text">
                    <i class="close icon"></i>
                    "<b>${email}</b>" is not valid
                </span>`)
            $email.val(null)
        }
    },
})

const calSettings = {
    type: 'date',
    formatter: {
        date(date) {
            if (!date) return ''

            return moment(date).format('MMM D, YYYY')
        },
    },
}

$posRole.on('change', function() {
    const cdl = $(this).val()
    let [ base, query ] = $aplUrl.attr('href').split('?')
    query = query.split('&')

    query[1] = `cdl=${cdl}`

    const url = base + '?' + query.join('&')
    $aplUrl.text(url).attr('href', url)
})

$selfAssign.click(function() {
    const checked = $(this).prop('checked')
    let [ base, query ] = $aplUrl.attr('href').split('?')
    query = query.split('&')

    if (!checked) query = query.filter(item => !item.startsWith('rec='))
    else query.push(`rec=${$('#recruiter-id').val()}`)

    const url = base + '?' + query.join('&')
    $aplUrl.text(url).attr('href', url)
})

$('#dob-calendar').calendar({
    ...calSettings,
    maxDate: moment().subtract(18, 'years').toDate(),
})
$('#addr-since-calendar').calendar({
    ...calSettings,
    maxDate: moment().toDate(),
})
$('#status-exp-calendar').calendar({
    ...calSettings,
    minDate: moment().add(1, 'months').toDate(),
})


const enableApplicant = () => {
    $field.applicant.removeClass('disabled').find('input').prop('disabled', false)
    // $('#self-assign-field').removeClass('disabled').find('input').prop('disabled', false)
    $submit.text('Register & Invite')
}

const disableApplicant = () => {
    $field.applicant.addClass('disabled').find('input').prop('disabled', true)
    $(`${selector.class.global}:not([type=hidden])`).val(null)
    $dropdown.suffix.dropdown('clear')
    $dropdown.gender.dropdown('clear')
    $dropdown.marital.dropdown('clear')
    $dropdown.addrState.dropdown('clear')
    $dropdown.position.dropdown('clear')
    $('.new-apl-eligibility, .new-apl-legal-status').prop('checked', false).prop('disabled', true)
    $expiration.val(null)
    $field.status.addClass('disabled')
    $field.expiration.addClass('disabled')
    // $('#self-assign-field').addClass('disabled').find('input').prop('disabled', true).prop('checked', true)
    $submit.text('Invite')
}

$registerApl.on('change', function() {
    if ($(this).prop('checked')) enableApplicant()
    else disableApplicant()
})

$dropdown.suffix.dropdown()
$dropdown.gender.dropdown()
$dropdown.marital.dropdown()
$dropdown.addrState.dropdown()
$dropdown.position.dropdown()


nameEvent(TS.firstName)

nameEvent(TS.middleName)

nameEvent(TS.lastName, {
    sfxId: true,
    onChange(lastName, $lastName, suffix) {
        if (suffix) $dropdown.suffix.dropdown('set selected', suffix)
    },
})

ssnEvent(TS.ssn)

telEvent(TS.phone)

addr1Event(addr1Id, { addr2Id })

addr2Event(addr2Id)

zipEvent(zipId, {
    cityId,
    onChange(zip, $zip, city, state) {
        if (state) $dropdown.addrState.dropdown('set selected', state)
    },
})

cityEvent(cityId)


$('#qualification-check').on('change', function() {
    if ($(this).prop('checked')) $field.status.removeClass('disabled').find('input').prop('disabled', false)
    else {
        $('.new-apl-legal-status').prop('checked', false)
        $expiration.val(null).prop('disabled', true)
        $field.status.addClass('disabled').find('input').prop('disabled', true)
        $field.expiration.addClass('disabled').find('input')
    }
})

$('.new-apl-legal-status').on('change', function() {
    if ($(this).val() == 2) $field.expiration.removeClass('disabled').find('input').prop('disabled', false)
    else {
        $expiration.val(null).prop('disabled', true)
        $field.expiration.addClass('disabled')
    }
})


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('#create-apl').off('click')

    if (actions.data.create === true) {
        $(table.column(table.columns().count() - 1).header())
            .html('<button class="ui mini circular right floated basic violet icon button" id="create-apl"><i class="plus icon"></i></button>')

        $('#create-apl').on('click', function() {
            const cdl = aplUrl.split('?')[1].split('&')[1].split('=')[1]
            $(`.position-role[value="${cdl}"]`).prop('checked', true)

            $.ajax('/api/lists', {
                method: 'POST',
                success(response) {
                    const { carriers } = response
                    let items = ''

                    carriers.forEach(carrier => {
                        const { _id, route, name } = carrier
                        items += `<div class="item" data-id="${_id}" data-value="${route}">${name}</div>`
                    })
                    $dropdown.carrier.find('.menu').html(items)

                    $dropdown.carrier.dropdown().on('change', function() {
                        const route = $(this).dropdown('get value')
                        let [ base ] = aplUrl.split('?')
                        let query = $aplUrl.attr('href').split('?')[1]

                        if (route) base += `/${route}`

                        const url = base + '?' + query
                        $aplUrl.text(url).attr('href', url)
                        $pdfLink.attr('href', pdfUrl + (route ? `/${route}` : ''))
                    })

                    $modal.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $aplUrl.text(aplUrl).attr('href', aplUrl)
                            $pdfLink.attr('href', pdfUrl)
                            $dropdown.carrier.dropdown('clear')
                            $email.val(null)
                            $message.email.html(message.email)
                            $registerApl.prop('checked', false)
                            $selfAssign.prop('checked', true)
                            disableApplicant()
                            $posRole.prop('checked', false)
                            if ($dropdown.team.length) $dropdown.team.dropdown('clear')
                        },
                    }).modal('show')

                    if ($dropdown.team.length) {
                        const { teams } = response
                        let items = ''

                        teams.forEach(team => {
                            const { _id, name } = team
                            items += `<div class="item" data-id="${_id}" data-value="${_id}">${name}</div>`
                        })
                        $dropdown.team.find('.menu').html(items)

                        $dropdown.team.dropdown().on('change', function() {
                            const _id = $(this).dropdown('get value') || 'global'
                            let [ base, query ] = aplUrl.split('?')
                            query = query.split('&')

                            query[0] = `env=${_id}`

                            const url = `${base}?${query.join('&')}`
                            $aplUrl.text(url).attr('href', url)
                        })

                    }
                }
            })

            // $.ajax('/api/carriers', {
            //     method: 'POST',
            //     success(companies) {
            //         let items = ''

            //         companies.forEach(company => {
            //             const { _id, route, name } = company
            //             items += `<div class="item" data-id="${_id}" data-value="${route}">${name}</div>`
            //         })
            //         $dropdown.company.find('.menu').html(items)

            //         $dropdown.company.dropdown().on('change', function() {
            //             const route = $(this).dropdown('get value')
            //             let [ base ] = aplUrl.split('?')
            //             let query = $aplUrl.attr('href').split('?')[1]

            //             if (route) base += `/${route}`

            //             const url = base + '?' + query
            //             $aplUrl.text(url).attr('href', url)
            //             $pdfLink.attr('href', pdfUrl + (route ? `/${route}` : ''))
            //         })

            //         $modal.modal({
            //             autofocus: false,
            //             closable: false,
            //             onHidden() {
            //                 $aplUrl.text(aplUrl).attr('href', aplUrl)
            //                 $pdfLink.attr('href', pdfUrl)
            //                 $dropdown.company.dropdown('clear')
            //                 $email.val(null)
            //                 $message.email.html(message.email)
            //                 $registerApl.prop('checked', false)
            //                 $selfAssign.prop('checked', true)
            //                 disableApplicant()
            //                 $posRole.prop('checked', false)
            //                 if ($dropdown.team.length) $dropdown.team.dropdown('clear')
            //             },
            //         }).modal('show')

            //         if ($dropdown.team.length)
            //             $.ajax('/api/teams', {
            //                 method: 'POST',
            //                 success(teams) {
            //                     let items = ''

            //                     teams.forEach(team => {
            //                         const { _id, name } = team
            //                         items += `<div class="item" data-id="${_id}" data-value="${_id}">${name}</div>`
            //                     })
            //                     $dropdown.team.find('.menu').html(items)

            //                     $dropdown.team.dropdown().on('change', function() {
            //                         const _id = $(this).dropdown('get value') || 'global'
            //                         let [ base, query ] = aplUrl.split('?')
            //                         query = query.split('&')

            //                         query[0] = `env=${_id}`

            //                         const url = `${base}?${query.join('&')}`
            //                         $aplUrl.text(url).attr('href', url)
            //                     })
            //                 },
            //             })
            //     }
            // })
        })
    }
})


$('#copy-apl-url').click(function(evt) {
    evt.preventDefault()

    navigator.clipboard.writeText($aplUrl.attr('href'))
        .then(() => {
            $modal.toast({
                message: 'URL successfully copied!',
                class: 'success',
                showIcon: 'clipboard outline',
                context: modalId,
                position: 'top left',
            })

            $('.ui.toast-container').css({
                top: '75px',
                left: `${$aplUrl.outerWidth() + 65}px`,
            })
        })
})


$form.submit(function(evt) {
    evt.preventDefault()

    if ($registerApl.prop('checked')) {
        if (!$dropdown.gender.dropdown('get value'))
            return alert("Applicant's gender is required")

        if (!$dropdown.marital.dropdown('get value'))
            return alert("Applicant's marital status is required")

        if (!$dropdown.addrState.dropdown('get value'))
            return alert("Applicant's address state is required")

        if (!$dropdown.position.dropdown('get value'))
            return alert("Applicant's position is required")
    }

    this.submit()
})