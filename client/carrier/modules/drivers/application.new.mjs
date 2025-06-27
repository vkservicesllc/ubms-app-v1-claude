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
const aplUrl = $aplUrl.text()
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

const $dropdown = {
    company: $('#new-apl-company-dropdown'),
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

$selfAssign.click(function() {
    let url = ''
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
        if (suffix)
            $dropdown.suffix.dropdown('set selected', suffix)
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
            $.ajax('/api/team/companies', {
                method: 'POST',
                success(companies) {
                    let items = ''

                    companies.forEach(company => {
                        const { _id, route, name } = company

                        items += `<div class="item" data-id="${_id}" data-value="${route}">${name}</div>`

                    })
                    $dropdown.company.find('.menu').html(items)

                    $dropdown.company.dropdown().on('change', function() {
                        const route = $(this).dropdown('get value')
                        let url = aplUrl

                        if (route) {
                            let [ base, query ] = aplUrl.split('?')
                            base += `/${route}`

                            url = base + '?' + query
                        }

                        $aplUrl.text(url).attr('href', url)
                    })

                    $modal.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $aplUrl.text(aplUrl).attr('href', aplUrl)
                            $dropdown.company.dropdown('clear')
                            $email.val(null)
                            $message.email.html(message.email)
                            $registerApl.prop('checked', false)
                            disableApplicant()
                        },
                    }).modal('show')
                }
            })
        })
    }
})


$('#copy-apl-url').click(function(evt) {
    evt.preventDefault()

    navigator.clipboard.writeText($aplUrl.text())
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
                left: `${$aplUrl.outerWidth() + 50}px`,
            })
        })
})


$form.submit(function(evt) {
    evt.preventDefault()

    if (!$dropdown.gender.dropdown('get value'))
        return alert("Applicant's gender is required")

    if (!$dropdown.marital.dropdown('get value'))
        return alert("Applicant's marital status is required")

    if (!$dropdown.addrState.dropdown('get value'))
        return alert("Applicant's address state is required")

    if (!$dropdown.position.dropdown('get value'))
        return alert("Applicant's position is required")

    this.submit()
})