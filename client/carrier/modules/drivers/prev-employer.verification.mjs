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
import selector from '/modules/registry/selectors/driver-application-employment.mjs'

const TS = selector.id.text, CS = selector.id.checkbox
const $id = $(selector.id.hidden.id)
const $appId = $(selector.id.hidden.appId)
// const $cdlRole = $('#employment-cdl-role')
const $employer = $(TS.employer)
const $startDate = $(TS.startDate)
const $endDate = $(TS.endDate)
const $phone = $(TS.phone)
const $address1 = $(TS.address1)
const $address2 = $(TS.address2)
const $addrZip = $(TS.addrZip)
const $addrCity = $(TS.addrCity)
const $position = $(TS.position)
const $earnings = $(TS.earnings)
const $rfl = $(TS.rfl)
const $fmcsr = $(CS.fmcsr)
const $dotDat = $(CS.dotDat)
const $usdot = $(TS.usdot)

const $inqAdd = $('#add-inquiry')
const $inqCancel = $('#cancel-inquiry')
const $inqSubmit = $('#submit-inquiry')

const $dropdown = {
    inqMethod: $('#empl-inquiry-method-dropdown'),
    inqResponse: $('#empl-inquiry-response-dropdown'),
    addrState: $('#empl-addr-state-dropdown'),
}

const $calendar = {
    startDate: $('#empl-start-date-calendar'),
    endDate: $('#empl-end-date-calendar'),
}

const $modal = {
    manage: $('#empl-manage-card-modal'),
}
const $item = {
    verification: $('#verification-item'),
}
const $form = {
    inquiry: $('#inquiry-form'),
}
const $message = {
    noCarrier: $('#no-carrier-message'),
}

const $emplData = {
    employer: {
        all: $('.employer-data'),
        name: $('#employer-data'),
        phone: $('#employer-phone-data'),
        address: $('#employer-address-data'),
        period: $('#employer-period-data'),
        usdot: $('#employer-usdot-data'),
    },
    applicant: {
        all: $('.applicant-data'),
        name: $('#applicant-data'),
        phone: $('#applicant-phone-data'),
        address: $('#applicant-address-data'),
        form: $('#applicant-form-data'),
        submission: $('#applicant-submission-data'),
        // ssn: $('#applicant-ssn-data'),
    },
    carrier: {
        all: $('.carrier-data'),
        name: $('#carrier-data'),
        phone: $('#carrier-phone-data'),
        address: $('#carrier-address-data'),
    },
}

const $a = {
    verifPdf: $('.verification-pdf-url'),
    phoneVerifPdf: $('#phone-verification-pdf-url'),
    faxVerifPdf: $('#fax-verification-pdf-url'),
    emailVerifPdf: $('#email-verification-pdf-url'),
    mailVerifPdf: $('#mail-verification-pdf-url'),
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

$inqAdd.click(function(evt) {
    evt.preventDefault()

    $inqSubmit.addClass('blue')
    $(this).hide()
    $form.inquiry.parent().show()
})

$dropdown.inqMethod.dropdown()
$dropdown.inqResponse.dropdown()

busNameEvent(TS.employer, true, {
    onChange(busName, coType, $busName) {
        if (coType) $busName.val(`${busName}, ${coType}`)
    },
})

telEvent(TS.phone)

addr1Event(TS.address1, {
    onChange(addr1, $addr1) {
        const $addr2 = $addr1.parent().next().find(TS.address2)
        const addr2Patt = patterns.match.addr2
        let addr2 = addr2Patt.test(addr1)
            ? addr2Patt.exec(addr1)[0].toUpperCase()
            : null

        addr1 = addr1.replace(addr2Patt, '').trim()
        if (addr2) addr2 = patterns.replace(addr2, 'addr2')
        $addr1.val(addr1)
        $addr2.val(addr2)
    },
})

addr2Event(TS.address2)

$dropdown.addrState.dropdown()

zipEvent(TS.addrZip, {
    onChange(zip, $zip, city, state) {
        if (city && state) {
            const $city = $zip.parent().parent().find(TS.addrCity)

            $city.val(city)
            $dropdown.addrState.dropdown('set selected', state)
        }
    },
})

cityEvent(TS.addrCity)

inputEvent(TS.position, {
    capitalize: 'each',
    strip: true,
    word: true,
})

inputEvent(TS.earnings, {
    onFocus(amount, $amount) {
        if (amount) $amount.val(Number(amount.replace(/,/g, '')))
    },
    onInput(amount, $amount) {
        amount = amount.replace(/\D/g, '')
        $amount.val(amount)
    },
    onBlur(amount, $amount) {
        amount = (+amount).toLocaleString('en-US')
        $amount.val(amount)
    },
})

inputEvent(TS.rfl, { capitalize: 'first', strip: true, word: true })

$fmcsr.on('click', function() {
    $usdot.parent()[($(this).prop('checked') ? 'remove' : 'add') + 'Class']('disabled')
})


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.manage-empl').off('click')

    if (actions.data.modify === true || actions.data.update === true) {
        $('.manage-empl').on('click', function(evt) {
            evt.preventDefault()
            const _id = $(this).data('id')
            const _appId = $(this).data('app-id')
            $calendar.startDate.calendar('destroy')
            $calendar.endDate.calendar('destroy')

            $.ajax(`/api/resource/drivers/applications/prev-employments/${_id}?app=${_appId}`, {
                success(response) {
                    const { employer, phone, address, startedOn, leftOn, usdot, application } = response.data
                    let period = `${moment(startedOn).format('ll')} – `
                    period += leftOn ? moment(leftOn).format('ll') : ' Still Employed'

                    $emplData.employer.name.text(employer)
                    $emplData.employer.phone.text(formatTel(phone))
                    $emplData.employer.address.html(new Address(address).html({ inline: false, singleLine: true }))
                    $emplData.employer.period.text(period)
                    $emplData.employer.usdot.html(usdot ? `<span class="ui dark green text"><b>${usdot}</b></small>` : '<span class="ui red text"><small><i>N/A</i></small></span>')
                    $emplData.applicant.name.html(
                        new Person(application).fullName()
                        + ''// ` <small style="font-weight: normal; font-size: .6em !important;">(***-**-${application.ssn.slice(-4)})`
                    )
                    $emplData.applicant.phone.text(formatTel(application.phone))
                    $emplData.applicant.address.html(new Address(application).html({ inline: false, singleLine: true }))
                    $emplData.applicant.form.text(application.formId)
                    $emplData.applicant.submission.text(`(${moment(application.finishedAt).format('ll')})`)
                    // $emplData.applicant.ssn.text(`***-**-${application.ssn.slice(-4)}`)
                    $emplData.carrier.name.html(application.carrier || '<span class="ui red text" style="font-weight: normal;"><small><i>Undetermined</i></small></span>')
                    if (application.carrier) {
                        $emplData.carrier.phone.text(formatTel(application.carrierPhone))
                        $emplData.carrier.address.html(new Address(application.carrierAddress).html({ inline: false, singleLine: true }))
                        $('.carrier-label').show()
                    }

                    if (!application.carrier) {
                        $message.noCarrier.show()
                    }

                    const { _id, _appId, position, earnings, rfl, fmcsr, dotDat } = response.data

                    $id.val(_id)
                    $appId.val(_appId)
                    // $cdlRole.val(application.cdlRole)
                    $employer.val(employer)
                    $startDate.val(moment(startedOn).format('ll'))
                    if (leftOn) $endDate.val(moment(leftOn).format('ll'))
                    $phone.val(formatTel(phone))
                    $address1.val(address.address1)
                    $address2.val(address.address2)
                    $addrZip.val(address.zip)
                    $addrCity.val(address.city)
                    $dropdown.addrState.dropdown('set selected', address.state)
                    $position.val(position)
                    $earnings.val((+earnings).toLocaleString('en-US'))
                    $rfl.val(rfl)
                    $fmcsr.prop('checked', fmcsr)
                    $dotDat.prop('checked', dotDat)
                    if (fmcsr) $usdot.val(usdot).parent().removeClass('disabled')
                    // if (application.cdlRole === 0) $fmcsr.parent().parent().hide()

                    const calOpts = {
                        ...calSettings,
                        minDate: moment(application.finishedAt).subtract(10, 'years').toDate(),
                        maxDate: moment(application.finishedAt).toDate(),
                    }

                    $calendar.startDate.calendar(calOpts)
                    $calendar.endDate.calendar(calOpts)

                    $a.verifPdf.each(function() {
                        const href = $(this).attr('href')
                        $(this).attr('href', `${href}?emp=${_id}&app=${_appId}`)
                    })

                    $modal.manage.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $emplData.employer.all.html(null)
                            $emplData.applicant.all.html(null)
                            $emplData.carrier.all.html(null)

                            $message.noCarrier.hide()
                            $item.verification.addClass('disabled')

                            $id.val(null)
                            $appId.val(null)
                            // $cdlRole.val(null)
                            $employer.val(null)
                            $startDate.val(null)
                            $endDate.val(null)
                            $phone.val(null)
                            $address1.val(null)
                            $address2.val(null)
                            $addrZip.val(null)
                            $addrCity.val(null)
                            $dropdown.addrState.dropdown('clear')
                            $position.val(null)
                            $earnings.val(null)
                            $rfl.val(null)
                            $fmcsr.prop('checked', false)
                            $dotDat.prop('checked', false)
                            $fmcsr.parent().parent().show()
                            $usdot.parent().addClass('disabled')
                            $('.carrier-label').hide()
                            $a.verifPdf.each(function() {
                                const href = $(this).attr('href').split('?')[0]
                                $(this).attr('href', href)
                            })

                            $formItem.removeClass('active').first().addClass('active')
                            $formBlock.hide().first().show()
                        },
                    }).modal('show')
                }
            })
        })
    }
})