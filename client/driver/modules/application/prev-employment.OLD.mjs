import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { telMask, dateMask } from '/modules/events/imask.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import patterns from '/modules/registry/patterns.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import formId, { check, onInput, onAccept, onChange, onComplete, onBlur, onSubmit, addressPredictions } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const RS = selector.id.radio
const TS = selector.class.text, SS = selector.class.select
const employedId = RS.prevEmployed

const $card = $('#apl-card')
const $form = $('#preempl-form')
const $submit = $('#preempl-submit')
const $help = {
    form: $('#preempl-form-help'),
}
const $section = $('#pre-employments')
const $emplList = $('#preempl-list')
const $emplForm = $('#preempl-form-template')
const $addButton = $('#add-preempl-button')
const $removeButton = $('#remove-preempl-button')
const $deleteModal = $('#delete-preempl-modal')
const $deleteTarget = $('#delete-preempl-target')
const $deleteEmplDesc = $('#delete-preempl-desc')

const appliedOn = $(selector.id.hidden.appliedOn).val()
const emplExpStartDate = $('#empl-exp-start-date').val()

const countEmplList = () => $emplList.children().length


let selected = false

if ($(employedId.yes).is(':checked')) {
    selected = true
    drawEmployerForms()
}

inputEvent(employedId.yes, {
    onChange() {
        selected = true

        drawEmployerForms()
    },
})

inputEvent(employedId.no, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your pre-employment data will be erased!')) {
                $section.hide()
                $emplList.html(null)

                selected = false
            } else {
                $el.prop('checked', false)
                $(employedId.yes).prop('checked', true)
            }
        }
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

$removeButton.click(() => {
    document.activeElement.blur()
    const target = $deleteTarget.val()

    $(`#${target}`).remove()
    $deleteTarget.val(null)
    $deleteModal.modal('hide')
    $deleteEmplDesc.html(null)

    if (!$emplList.html()) $emplList.append(cloneEmplForm())
    resetEvents()
    resetEmplIdx()
})

$addButton.click(() => {
    $emplList.append(cloneEmplForm(countEmplList()))
    resetEvents()
})


onSubmit($form, $help, $submit, $card)


function cloneEmplForm(i = 0, data = null) {
    const tsi = `${Date.now()}-${i}`
    const $clone = $emplForm.clone().attr('id', `preempl-form-${tsi}`)

    $clone.find('input:not(.still-employed), select, textarea').each(function() {
        const $field = $(this)

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${tsi}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name').replace('[]', '')
        $field.prop('disabled', false).attr('name', name + `[${i}]`)

        if (data) {
            const type = $field.attr('type')
            const value = data[i][name]

            if (value !== null) {
                if (type === 'radio') {
                    const _value = $field.attr('value')

                    if ((_value === 'Y' && value) || (_value === 'N' && !value))
                        $field.prop('checked', true)
                } else {
                    $field.val(value)
                    if ($field.is(':required')) $field.addClass('is-valid')

                    if ($field.is('select')) $field.find('option[value=""]').remove()
                    if ($field.parent().is(':hidden')) $field.parent().show()
                }
            }

            if (name === 'leftOn' && !value) {
                $clone.find('.still-employed').prop('checked', true)
                $clone.find('.termination-date-field').hide().find('input').prop('disabled', true)
            }
        }
    })

    return $clone.show()
}


function drawEmployerForms() {
    $.ajax(`/api/list/application/${formId()}/employers`, {
        method: 'POST',
        success(response) {
            let { data } = response

            if (!data.length) data = null
            else {
                data = sortArrayByObjectKey(data, 'startedOn', false)

                data.forEach(row => {
                    row.phone = formatTel(row.phone)
                    row.startedOn = moment(row.startedOn).format('MM/DD/YYYY')
                    row.earnings = row.earnings.toLocaleString()
                    if (row.leftOn) row.leftOn = moment(row.leftOn).format('MM/DD/YYYY')
                })
            }

            const count = data?.length || 1
            for (let i = 0; i < count; i++) $emplList.append(cloneEmplForm(i, data))

            resetEvents()
            $section.show()
        },
    })
}


function resetEvents() {
    $('.delete-preempl-button')
        .off('click')
        .on('click', function() {
            const target = $(this).parent().parent().parent().parent().attr('id')

            $deleteTarget.val(target)

            const $target = $(`#${target}`)
            let employer = $target.find(TS.prevEmployer).val()
            let desc = '<em class="text-danger">Empty Form</em>'

            if (employer) {
                desc = `<strong>${employer}</strong>`
                //? decide if anything else to be added
            }

            $deleteEmplDesc.html(desc)
        })
        .parent()
        .attr('style', countEmplList() > 1 ? '' : 'display: none !important;')
    $('.still-employed').off('click')

    busNameEvent(TS.prevEmployer, true, {
        onInput,
        onChange(busName, coType, $busName) {
            if (coType) $busName.val(`${busName}, ${coType}`)
            onChange(busName, $busName)
        },
    })

    telMask(TS.emplPhone, { onAccept, onComplete })

    let timer
    addr1Event(TS.emplAddress1, {
        onInput(addr1, $addr1) {
            clearTimeout(timer)
            timer = setTimeout(() => addressPredictions($addr1, addr1), 500)
            onInput(addr1, $addr1)
        },
        onChange(addr1, $addr1) {
            const $addr2 = $addr1.parent().next().find(TS.emplAddress2)
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
    })

    addr2Event(TS.emplAddress2, { onInput, onChange })

    zipEvent(TS.emplAddrZip, {
        onInput,
        onChange(zip, $zip, city, state) {
            if (city && state) {
                const $city = $zip.parent().parent().next().find(TS.emplAddrCity)
                const $state = $zip.parent().parent().next().find(SS.emplAddrState)

                $city.val(city).addClass('is-valid')
                $state.val(state).addClass('is-valid').find('option[value=""]').remove()
            }

            onChange(zip, $zip)
        },
    })

    cityEvent(TS.emplAddrCity, { onInput, onChange })

    selectEvent(SS.emplAddrState, { fill: true, onChange })

    dateMask(TS.emplStartDate, {
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
                        const $end = $start.parent().parent().next().next().find(TS.emplEndDate)
                        let end = $end.val()
                        if (end) end = moment(end, 'MM/DD/YYYY', true)

                        if (end && start.isAfter(end)) {
                            $start.addClass('is-invalid')
                            $help.text('* Started after left')
                        } else $start.addClass('is-valid')
                    }
                }
            }

            if (check($form)) $help.form.hide().html(null)
        },
    })

    inputEvent(TS.emplPosition, {
        capitalize: 'each',
        strip: true,
        word: true,
        onInput,
        onChange,
    })

    inputEvent(TS.emplEarnings, {
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

    inputEvent(TS.emplRfl, {
        capitalize: 'first',
        strip: true,
        word: true,
        onInput,
        onChange,
    })

    $('.still-employed').on('click', function() {
        const $leftOnContainer = $(this).parent().parent().parent().next().find('.termination-date-field')
        let disabled = false, action = 'show'
        if ($(this).prop('checked')) {
            disabled = true
            action = 'hide'
        }
        $leftOnContainer[action]().find('input').prop('disabled', disabled)
    })

    dateMask(TS.emplEndDate, {
        pattern: 'us',
        onAccept(mask, $date) {
            $date
                .removeClass('is-invalid')
                .next()
                    .removeClass('text-danger')
                    // .addClass('text-info')
                    // .text('Blank if still employed')
        },
        onComplete(mask, $end) {
            let end = mask.value

            if (end) {
                const $help = $end.next()
                end = moment(end, 'MM/DD/YYYY', true)

                if (!end.isValid()) {
                    $end.addClass('is-invalid')
                    $help
                        .removeClass('text-info')
                        .addClass('text-danger')
                        .text('* Invalid date')
                } else {
                    const today = moment(appliedOn)

                    if (end.isAfter(today)) {
                        $end.addClass('is-invalid')
                        $help
                            .removeClass('text-info')
                            .addClass('text-danger')
                            .text('* Future date forbidden')
                    } else {
                        const $start = $end.parent().parent().prev().prev().prev().find(TS.emplStartDate)
                        let start = $start.val()
                        start = moment(start, 'MM/DD/YYYY', true)

                        if (start && end.isBefore(start)) {
                            $end.addClass('is-invalid')
                            $help
                                .removeClass('text-info')
                                .addClass('text-danger')
                                .text('* Left before started')
                        } else {
                            const limit = today.clone().subtract(10, 'years')

                            if (end.isBefore(limit)) {
                                $end.addClass('is-invalid')
                                $help
                                    .removeClass('text-info')
                                    .addClass('text-danger')
                                    .text('* Over 10 years ago')
                            }
                        }
                    }
                }
            }

            if (check($form)) $help.form.hide().html(null)
        },
    })

}


function resetEmplIdx() {
    $emplList.find('.employer-form').each(function(i) {
        $(this).find('input, select').each(function() {
            if ($(this).attr('name'))
                $(this).attr('name', $(this).attr('name').split('[')[0] + `[${i}]`)
        })
    })
}