import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { telMask, dateMask } from '/modules/events/imask.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import patterns from '/modules/registry/patterns.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import formId, { check, onInput, onAccept, onChange, onComplete, onBlur, onSubmit, addressPredictions } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application-employment.mjs'
import appSelector from '/modules/registry/selectors/driver-application.mjs'

const HS = selector.id.hidden, TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio
const employedId = appSelector.id.radio.prevEmployed

const $card = $('#apl-card')
const $form = {
    employment: $('#prevempl-form'),
    employer: $('#employer-form'),
}
const $submit = {
    employment: $('#prevempl-submit'),
    employer: $('#employer-submit'),
}
const $button = {
    cancel: $('#employer-cancel'),
    add: $('#add-prevempl-button'),
    delete: $('#remove-prevempl-button'),
}
const $help = {
    form: $('#prevempl-form-help'),
}

const $section = $('#prev-employments')
const $message = $('#employment-message')
const $emplList = $('#prevempl-list')
const $btnContainer = {
    employment: $submit.employment.parent().parent().parent(),
    employerCancel: $button.cancel.parent().parent(),
}
const $stillEmployed = $('#still-employed')
const $noAdditional = $('#no-additional-employers')

const $deleteModal = $('#delete-prevempl-modal')
const $deleteTarget = $('#delete-prevempl-target')
const $deleteEmplDesc = $('#delete-prevempl-desc')
const $leftOnContainer = $('#termination-date-field')

const appliedOn = $(selector.id.hidden.appliedOn).val()

let selected = false

if ($(employedId.yes).is(':checked')) {
    selected = true
    $message.show()
    drawEmployerList()
}

inputEvent(employedId.yes, {
    onChange() {
        selected = true

        drawEmployerList()
        $message.show()
    },
})

inputEvent(employedId.no, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your pre-employment data will be erased!')) {
                $section.hide()
                $emplList.html(null)
                $message.hide()
                closeForm()

                selected = false
            } else {
                $el.prop('checked', false)
                $(employedId.yes).prop('checked', true)
            }
        }
    },
})

$button.cancel.click(function(evt) {
    evt.preventDefault()
    closeForm()
    drawEmployerList()
    scroll()
})

$button.add.click(function(evt) {
    evt.preventDefault()
    $section.hide()
    $emplList.html(null)
    openAddForm()
})

$button.delete.click(function(evt) {
    evt.preventDefault()
    const _id = $deleteTarget.val()

    $.ajax(`/api/resource/application/employer/${_id}`, {
        method: 'DELETE',
        success(response) {
            if (response.status === 'OK') {
                $deleteTarget.val(null)
                $deleteEmplDesc.html(null)
                $deleteModal.modal('hide')

                const duration = 750
                $card.fadeOut(duration)
                setTimeout(() => {
                    drawEmployerList()
                    $card.fadeIn(duration)
                    scroll()
                }, duration + 250)
            }
        },
    })

    
})

$noAdditional.click(function() {
    let action1 = 'show', action2 = 'hide'
    if ($(this).prop('checked')) {
        action1 = 'hide'
        action2 = 'show'
    }
    $button.add[action1]()
    $btnContainer.employment[action2]()
})


busNameEvent(TS.employer, true, {
    onInput,
    onChange(busName, coType, $busName) {
        if (coType) $busName.val(`${busName}, ${coType}`)
        onChange(busName, $busName)
    },
})

dateMask(TS.startDate, {
    pattern: 'us',
    onAccept(mask, $date) {
        $date.removeClass('is-valid is-invalid').next().text(null)
    },
    onComplete(mask, $start) {
        let start = mask.value

        if (start) {
            const $help = $start.next()
            start = moment(start, 'MM/DD/YYYY', true)

            if (!start.isValid()) {
                $start.addClass('is-invalid')
                $help.text('* Invalid date')
            } else {
                const today = moment(appliedOn)

                if (start.isAfter(today)) {
                    $start.addClass('is-invalid')
                    $help.text('* Future date forbidden')
                } else {
                    const $end = $(TS.endDate)
                    let end = $end.val()
                    if (end) end = moment(end, 'MM/DD/YYYY', true)

                    if (end && start.isAfter(end)) {
                        $start.addClass('is-invalid')
                        $help.text('* Started after left')
                    } else $start.addClass('is-valid')
                }
            }
        }

        if (check($form.employer)) $help.form.hide().html(null)
    },
})

telMask(TS.phone, { onAccept, onComplete })


let timer
addr1Event(TS.address1, {
    onInput(addr1, $addr1) {
        clearTimeout(timer)
        timer = setTimeout(() => addressPredictions($addr1, addr1), 500)
        onInput(addr1, $addr1)
    },
    onChange(addr1, $addr1) {
        const $addr2 = $(TS.address2)
        const addr2Patt = patterns.match.addr2
        let addr2 = addr2Patt.test(addr1)
            ? addr2Patt.exec(addr1)[0].toUpperCase()
            : null

        addr1 = addr1.replace(addr2Patt, '').trim()
        if (addr2) addr2 = patterns.replace(addr2, 'addr2')
        $addr1.val(addr1)
        $addr2.val(addr2)

        onChange(addr1, $addr1)
    },
    onBlur(add1, $addr1) {
        setTimeout(() => $addr1.parent().parent().find('.address-predictions').html(null), 250)
    },
})

addr2Event(TS.address2, { onInput, onChange })

zipEvent(TS.addrZip, {
    onInput,
    onChange(zip, $zip, city, state) {
        if (city && state) {
            const $city = $(TS.addrCity)
            const $state = $(SS.addrState)

            $city.val(city).addClass('is-valid')
            $state.val(state).addClass('is-valid').find('option[value=""]').remove()
        }

        onChange(zip, $zip)
    },
})

cityEvent(TS.addrCity, { onInput, onChange })

selectEvent(SS.addrState, { fill: true, onChange })


inputEvent(TS.position, {
    capitalize: 'each',
    strip: true,
    word: true,
    onInput,
    onChange,
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
        amount = (+amount).toLocaleString()

        $amount.val(amount)
        onBlur(amount, $amount)
    },
})

$stillEmployed.on('click', function() {
    let disabled = false, action = 'show'
    if ($(this).prop('checked')) {
        disabled = true
        action = 'hide'
    }
    $leftOnContainer[action]().find('input').prop('disabled', disabled)
})

inputEvent(TS.rfl, {
    capitalize: 'first',
    strip: true,
    word: true,
    onInput,
    onChange,
})

dateMask(TS.endDate, {
    pattern: 'us',
    onAccept(mask, $date) {
        $date
            .removeClass('is-invalid')
            .next()
                .removeClass('text-danger')
    },
    onComplete(mask, $end) {
        let end = mask.value

        if (end) {
            const $help = $end.next()
            end = moment(end, 'MM/DD/YYYY', true)

            if (!end.isValid()) {
                $end.addClass('is-invalid')
                $help.text('* Invalid date')
            } else {
                const today = moment(appliedOn)

                if (end.isAfter(today)) {
                    $end.addClass('is-invalid')
                    $help.text('* Future date forbidden')
                } else {
                    const $start = $(TS.startDate)
                    let start = $start.val()
                    start = moment(start, 'MM/DD/YYYY', true)

                    if (start && end.isBefore(start)) {
                        $end.addClass('is-invalid')
                        $help.text('* Left before started')
                    } else {
                        const limit = today.clone().subtract(10, 'years')

                        if (end.isBefore(limit)) {
                            $end.addClass('is-invalid')
                            $help.text('* Over 10 years ago')
                        } else $end.addClass('is-valid')
                    }
                }
            }
        }

        if (check($form.employer)) $help.form.hide().html(null)
    },
})

$deleteModal
    .on('hide.bs.modal', () => {
        $('.btn').blur()
    })
    .on('hidden.bs.modal', () => {
        $deleteTarget.val(null)
        $deleteEmplDesc.html(null)
    })


function drawEmployerList() {
    $.ajax(`/api/list/application/${formId()}/employers`, {
        method: 'POST',
        success(response) {
            const { application, employers } = response.data
            
            if (!employers.length) {
                $btnContainer.employment.hide()
                return openAddForm(false)
            }

            let list = '<ul class="list-group">'
            let x = employers.length
            let prevDate = application.appliedOn

            employers.map(employment => {
                const { _id, employer, startedOn, leftOn, gapExpl } = employment
                let period = moment(startedOn).format('ll') + ' – '
                period += leftOn ? moment(leftOn).format('ll') : 'Present Day'

                list += '<li class="list-group-item"><div class="d-flex justify-content-between">'
                list += `<span class="employer-list-title pt-2" style="font-size: .8em;">Employer ${x--}</span>`
                list += '<div class="d-flex flex-row-reverse gap-2 my-2">'
                list += `<button class="btn btn-danger bg-danger-subtle btn-sm delete-employer" data-id="${_id}"><i class="fa fa-trash"></i></button>`
                list += `<button class="btn btn-success bg-success-subtle btn-sm edit-employer" data-id="${_id}"><i class="fa fa-pen"></i></button></div></div>`
                list += `<div class="d-flex flex-column flex-md-row justify-content-between"><span>${employer}</span><span class="text-secondary" style="font-size: .8em;">${period}</span></div>`
                list += '</li>'

                if (leftOn) {
                    const date = {
                        previous: moment(prevDate),
                        current: moment(leftOn),
                    }

                    if (date.current.isSameOrBefore(date.previous)) {
                        prevDate = startedOn

                        const period = date.current.format('ll') + ' – ' + date.previous.format('ll')
                        const difference = Math.abs(date.previous.diff(date.current, 'days'))

                        if (difference > 30) {
                            const fieldCls = gapExpl ? ' is-valid' : ''

                            list += '<li class="list-group-item"><div class="d-flex flex-column flex-md-row justify-content-between">'
                            list += `<span class="employer-list-title pt-2" style="font-size: .8em;">Employment Gap <small>(${difference} Days)</small></span>`
                            list += `<span class="text-danger pt-2" style="font-size: .8em;">${period}</span></div><div class="my-2">`
                            list += `<textarea class="form-control explain-employment-gap${fieldCls}" type="text" name="explGap[]" placeholder="Provide explanation here..." data-id="${_id}" required>${gapExpl || ''}`
                            list += '</textarea></div></li>'
                        }
                    }
                }
            })
            list += '</ul>'

            $emplList.html(list)
            resetEvents()

            $btnContainer.employment.hide()
            $noAdditional.prop('checked', false)
            $button.add.show()
            $section.show()
        },
    })
}


function openAddForm(cancel = true) {
    $submit.employer.addClass('btn-primary bg-primary-subtle').text('Add Employer')
    $form.employer.show()
    // $btnContainer.employment.hide()
    if (cancel) $btnContainer.employerCancel.show()
}

function openUpdateForm(data) {
    const { _id, employer, startedOn, phone, address, position, earnings, fmcsr, dotDat, leftOn, rfl } = data

    $(HS.id).val(_id)
    $(TS.employer).val(employer).addClass('is-valid')
    $(TS.startDate).val(moment(startedOn).format('MM/DD/YYYY')).addClass('is-valid')
    $(TS.phone).val(formatTel(phone)).addClass('is-valid')
    $(TS.address1).val(address.address1).addClass('is-valid')
    $(TS.address2).val(address.address2)
    $(TS.addrZip).val(address.zip).addClass('is-valid')
    $(TS.addrCity).val(address.city).addClass('is-valid')
    $(SS.addrState).val(address.state).addClass('is-valid')
    $(TS.position).val(position).addClass('is-valid')
    $(TS.earnings).val(earnings.toLocaleString()).addClass('is-valid')
    $(RS.fmcsr[fmcsr ? 'yes' : 'no']).prop('checked', true)
    $(RS.dotDat[dotDat ? 'yes' : 'no']).prop('checked', true)
    $(TS.rfl).val(rfl).addClass('is-valid')
    if (leftOn) $(TS.endDate).val(moment(leftOn).format('MM/DD/YYYY')).addClass('is-valid')
    else {
        $stillEmployed.prop('checked', true)
        $leftOnContainer.hide().find('input').prop('disabled', true)
    }

    $submit.employer.addClass('btn-success bg-success-subtle').text('Update Employer')
    $form.employer.show()
    // $btnContainer.employment.hide()
    $btnContainer.employerCancel.show()
}

function closeForm() {
    $form.employer.hide()
    $form.employer.find('input:not([type=radio]):not([type=checkbox]), select, textarea').val(null).removeClass('is-valid is-invalid')
    $form.employer.find('[type=radio], [type=checkbox]').prop('checked', false)
    $form.employer.find('.form-text').text(null)
    $('#termination-date-field').show().find('input').prop('disabled', false)
    $submit.employer.removeClass('btn-primary bg-primary-subtle btn-success bg-success-subtle').text(null)
    // $btnContainer.employment.show()
    $btnContainer.employerCancel.hide()
}

function resetEvents() {
    $('.edit-employer, .delete-employer').off('click')

    $('.edit-employer, .delete-employer').on('click', function(evt) {
        evt.preventDefault()
        const _id = $(this).data('id')
        const edit = $(this).hasClass('edit-employer')

        $.ajax(`/api/data/application/employer/${_id}`, {
            method: 'POST',
            success(response) {
                const { data } = response

                if (edit) {
                    $emplList.html(null)
                    $section.hide()
                    return openUpdateForm(data)
                }

                const { _id, employer, startedOn, leftOn } = data
                let desc = `<strong>${employer}</strong><br/><small>`
                desc += moment(startedOn).format('ll') + ' – '
                desc += (leftOn ? moment(leftOn).format('ll') : 'Present Day') + '</small>'

                $deleteTarget.val(_id)
                $deleteEmplDesc.html(desc)
                $deleteModal.modal('show')
            },
        })
    })

    inputEvent('.explain-employment-gap', {
        capitalize: 'first',
        strip: true,
        word: true,
        onInput,
        onChange(gapExpl, $gapExpl) {
            const _id = $gapExpl.data('id')

            $.ajax(`/api/resource/application/employer/${_id}`, {
                method: 'PATCH',
                data: { gapExpl },
                success(response) {
                    if (response.status === 'OK') onChange(gapExpl, $gapExpl)
                },
            })
        },
    })
}


$form.employer.submit(function(evt) {
    evt.preventDefault()

    const data = {}
    $.each($(this).serializeArray(), function () {
        data[this.name] = this.value
    })

    $.ajax(`/api/resource/application/${formId()}/employer`, {
        method: 'POST',
        data,
        success(response) {
            if (response.status === 'OK') {
                const duration = 750
                $card.fadeOut(duration)
                setTimeout(() => {
                    closeForm()
                    drawEmployerList()
                    $card.fadeIn(duration)
                    scroll()
                }, duration + 250)
            }
        },
    })
})


function scroll() {
    const scrollPoint = document.querySelector('#employment-accordion-item')
    setTimeout(() => scrollPoint.scrollIntoView({ behavior: 'smooth', block: 'start' }), scrollDuration)
}