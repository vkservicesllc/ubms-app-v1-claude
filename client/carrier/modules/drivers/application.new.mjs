import table from './applications.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text
const emailId = TS.email

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
const $registerApl = $('#register-new-apl')
const $selfAssign = $('#self-assign')
const $posRole = $('.position-role')
const formAction = $form.attr('action')

const $dropdown = {
    carrier: $('#new-apl-carrier-dropdown'),
    team: $('#new-apl-team-dropdown'),
    suffix: $('#suffix-dropdown'),
    gender: $('#gender-dropdown'),
    position: $('#position-dropdown'),
}
const $field = {
    applicant: $('.applicant-field'),
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

// const calSettings = {
//     type: 'date',
//     formatter: {
//         date(date) {
//             if (!date) return ''

//             return moment(date).format('MMM D, YYYY')
//         },
//     },
// }

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

// $('#dob-calendar').calendar({
//     ...calSettings,
//     maxDate: moment().subtract(18, 'years').toDate(),
// })


const enableApplicant = () => {
    $field.applicant.removeClass('disabled').find('input').prop('disabled', false)
    $form.attr('action', formAction.replace('/invite/', '/insert/'))
    // $('#self-assign-field').removeClass('disabled').find('input').prop('disabled', false)
    $submit.text('Register & Invite')
}

const disableApplicant = () => {
    $field.applicant.addClass('disabled').find('input').prop('disabled', true)
    $(`${selector.class.global}:not([type=hidden])`).val(null)
    $dropdown.suffix.dropdown('clear')
    $dropdown.gender.dropdown('clear')
    $dropdown.position.dropdown('clear')
    // $('#self-assign-field').addClass('disabled').find('input').prop('disabled', true).prop('checked', true)
    $form.attr('action', formAction)
    $submit.text('Invite')
}

$registerApl.on('change', function() {
    if ($(this).prop('checked')) enableApplicant()
    else disableApplicant()
})

$dropdown.carrier.dropdown().on('change', function() {
    const _carrierId = $(this).dropdown('get value')
    const route = $dropdown.carrier.find(`.item[data-value="${_carrierId}"]`).data('route')
    let [ base ] = aplUrl.split('?')
    let query = $aplUrl.attr('href').split('?')[1]

    if (route) base += `/${route}`

    const url = base + '?' + query
    $aplUrl.text(url).attr('href', url)
    $pdfLink.attr('href', pdfUrl + (route ? `/${route}` : ''))
})
$dropdown.suffix.dropdown()
$dropdown.gender.dropdown()
$dropdown.position.dropdown()

if ($dropdown.team.length) {
    // const { teams } = response
    // let items = ''

    // teams.forEach(team => {
    //     const { _id, name } = team
    //     items += `<div class="item" data-id="${_id}" data-value="${_id}">${name}</div>`
    // })
    // $dropdown.team.find('.menu').html(items)

    $dropdown.team.dropdown().on('change', function() {
        const _id = $(this).dropdown('get value') || 'global'
        let [ base, query ] = aplUrl.split('?')
        query = query.split('&')

        query[0] = `env=${_id}`

        const url = `${base}?${query.join('&')}`
        $aplUrl.text(url).attr('href', url)
    })

}


nameEvent(TS.firstName)

nameEvent(TS.middleName)

nameEvent(TS.lastName, {
    sfxId: true,
    onChange(lastName, $lastName, suffix) {
        if (suffix) $dropdown.suffix.dropdown('set selected', suffix)
    },
})

// ssnEvent(TS.ssn)

telEvent(TS.phone)


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('#create-apl').off('click')

    if (actions.data.create === true) {
        $(table.column(table.columns().count() - 1).header())
            .html('<button class="ui mini circular right floated basic violet icon button" id="create-apl"><i class="plus icon"></i></button>')

        $('#create-apl').on('click', function() {
            const cdl = aplUrl.split('?')[1].split('&')[1].split('=')[1]
            $(`.position-role[value="${cdl}"]`).prop('checked', true)

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

            // $.ajax('/api/lists', {
            //     method: 'POST',
            //     success(response) {
            //         const { carriers } = response
            //         let items = ''

            //         carriers.forEach(carrier => {
            //             const { _id, route, name } = carrier
            //             items += `<div class="item" data-id="${_id}" data-value="${route}">${name}</div>`
            //         })
            //         $dropdown.carrier.find('.menu').html(items)

            //         $dropdown.carrier.dropdown().on('change', function() {
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
            //                 $dropdown.carrier.dropdown('clear')
            //                 $email.val(null)
            //                 $message.email.html(message.email)
            //                 $registerApl.prop('checked', false)
            //                 $selfAssign.prop('checked', true)
            //                 disableApplicant()
            //                 $posRole.prop('checked', false)
            //                 if ($dropdown.team.length) $dropdown.team.dropdown('clear')
            //             },
            //         }).modal('show')

            //         if ($dropdown.team.length) {
            //             const { teams } = response
            //             let items = ''

            //             teams.forEach(team => {
            //                 const { _id, name } = team
            //                 items += `<div class="item" data-id="${_id}" data-value="${_id}">${name}</div>`
            //             })
            //             $dropdown.team.find('.menu').html(items)

            //             $dropdown.team.dropdown().on('change', function() {
            //                 const _id = $(this).dropdown('get value') || 'global'
            //                 let [ base, query ] = aplUrl.split('?')
            //                 query = query.split('&')

            //                 query[0] = `env=${_id}`

            //                 const url = `${base}?${query.join('&')}`
            //                 $aplUrl.text(url).attr('href', url)
            //             })

            //         }
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
    }

    this.submit()
})