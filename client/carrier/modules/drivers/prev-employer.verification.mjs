import table from './prev-employers.mjs'
import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import patterns from '/modules/registry/patterns.mjs'


const $modal = {
    manage: $('#empl-manage-card-modal'),
}

const $emplData = {
    employer: {
        all: $('.employer-data'),
        name: $('#employer-data'),
        phone: $('#employer-phone-data'),
        address: $('#employer-address-data'),
        period: $('#employer-period-data'),
    },
    applicant: {
        all: $('.applicant-data'),
        name: $('#applicant-data'),
        phone: $('#applicant-phone-data'),
        address: $('#applicant-address-data'),
        form: $('#applicant-form-data'),
        submission: $('#applicant-submission-data'),
    },
    carrier: {
        all: $('.carrier-data'),
        name: $('#carrier-data'),
        phone: $('#carrier-phone-data'),
        address: $('#carrier-address-data'),
    },
}

const $formItem = $('.form-item')
const $formBlock = $('.form-block')

$formItem.click(function() {
    const id = $(this).attr('id')
    const targetId = id.replace('-item', '-block')
    $formBlock.hide()
    $(`#${targetId}`).show()
    $formItem.removeClass('active')
    $(this).addClass('active')
})


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.manage-empl').off('click')

    if (actions.data.modify === true || actions.data.update === true) {
        $('.manage-empl').on('click', function(evt) {
            evt.preventDefault()
            const _id = $(this).data('id')

            $.ajax(`/api/resource/drivers/applications/prev-employments/${_id}`, {
                success(response) {
                    const { employer, phone, address, startedOn, leftOn, application } = response.data
                    let period = `${moment(startedOn).format('ll')} – `
                    period += leftOn ? moment(leftOn).format('ll') : ' Still Employed'

                    $emplData.employer.name.text(employer)
                    $emplData.employer.phone.text(formatTel(phone))
                    $emplData.employer.address.html(new Address(address).html({ inline: false, singleLine: true }))
                    $emplData.employer.period.text(period)
                    $emplData.applicant.name.html(
                        new Person(application).fullName()
                        + ` <small style="font-weight: normal; font-size: .7em !important;">(***-**-${application.ssn.slice(-4)})`
                    )
                    $emplData.applicant.phone.text(formatTel(application.phone))
                    $emplData.applicant.address.html(new Address(application).html({ inline: false, singleLine: true }))
                    $emplData.applicant.form.text(application.formId)
                    $emplData.applicant.submission.text(`(${moment(application.finishedAt).format('ll')})`)
                    $emplData.carrier.name.html(application.carrier || '<span class="ui red text" style="font-weight: normal;"><small><i>Undetermined</i></small></span>')
                    if (application.carrier) {
                        $emplData.carrier.phone.text(formatTel(application.carrierPhone))
                        $emplData.carrier.address.html(new Address(application.carrierAddress).html({ inline: false, singleLine: true }))
                    }

                    $modal.manage.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $emplData.employer.all.html(null)
                            $emplData.applicant.all.html(null)
                            $emplData.carrier.all.html(null)
                            $formItem.removeClass('active').first().addClass('active')
                            $formBlock.hide().first().show()
                        },
                    }).modal('show')
                }
            })
        })
    }
})