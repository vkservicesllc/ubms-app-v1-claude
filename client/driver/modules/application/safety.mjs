import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { dateMask } from '/modules/events/imask.mjs'
import formId, { check, onInput, onChange, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { capitalizeEach } from '/modules/tools/utils/string.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const accidents = $.ajax('/api/public/enum/driver-application?filter=accidents', { method: 'POST', async: false }).responseJSON

const RS = selector.id.radio
const TS = selector.class.text, SS = selector.class.select
const accidentsId = RS.accidents

const $card = $('#apl-card')
const $form = $('#safety-form')
const $submit = $('#safety-submit')
const $help = {
    form: $('#safety-form-help'),
}
const $accidents = $('#accidents')
const $accList = $('#accident-list')
const $accForm = $('#accident-form-template')
const $addButton = $('#add-accident-button')
const $removeButton = $('#remove-accident-button')
const $deleteModal = $('#delete-accident-modal')
const $deleteTarget = $('#delete-accident-target')
const $deleteAccDesc = $('#delete-accident-desc')
const appliedOn = $(selector.id.hidden.appliedOn).val()

const countAccList = () => $accList.children().length
let selected = false

if ($(accidentsId.yes).is(':checked')) {
    selected = true
    drawAccidentForms()
}


inputEvent(accidentsId.yes, {
    onChange() {
        selected = true
        drawAccidentForms()
    },
})

inputEvent(accidentsId.no, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your accident data will be erased!')) {
                $accidents.hide()
                $accList.html(null)

                selected = false
            } else {
                $el.prop('checked', false)
                $(accidentsId.yes).prop('checked', true)
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
        $deleteAccDesc.html(null)
    })

$removeButton.click(() => {
    document.activeElement.blur()
    const target = $deleteTarget.val()

    $(`#${target}`).remove()
    $deleteTarget.val(null)
    $deleteModal.modal('hide')
    $deleteAccDesc.html(null)

    if (!$accList.html()) $accList.append(cloneAccForm())
    resetEvents()
    resetAccIdx()
})

$addButton.click(() => {
    $accList.append(cloneAccForm(countAccList()))
    resetEvents()
})


onSubmit($form, $help, $submit, $card)


function cloneAccForm(i = 0, data = null) {
    const tsi = `${Date.now()}-${i}`
    const $clone = $accForm.clone().attr('id', `accident-form-${tsi}`)
    const otherTypeCls = TS.accOtherType.replace('.', '')

    $clone.find('input, select').each(function() {
        const $field = $(this)

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${tsi}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name').replace('[]', '')
        $field.attr('name', name + `[${i}]`)
        if ($field.hasClass(otherTypeCls)) $field.prop('required', false)

        if (data) {
            const type = $field.attr('type')
            const value = data[i][name]

            if (value !== null) {
                if (type === 'radio') {
                    const _value = $field.attr('value')
                    if ((_value === 'Y' && value === 1) || (_value === 'N' && value === 0))
                        $field.prop('checked', true)
                } else {
                    $field.val(value).addClass('is-valid')
                    if ($field.hasClass(otherTypeCls)) $field.prop('required', true)

                    if ($field.is('select')) $field.find('option[value=""]').remove()
                    if ($field.parent().is(':hidden')) $field.parent().show()
                }
            }
        }
    })

    return $clone.show()
}


function drawAccidentForms() {
    $.ajax(`/api/resource/application/${formId()}/accidents`, {
        success(response) {
            let { data, error } = response
            if (error) return alert(error)

            if (!data.length)
                data.push({
                    collision: null,
                    other: null,
                    date: null,
                    state: null,
                    injuries: null,
                    fatalities: null,
                })
            else {
                data = sortArrayByObjectKey(data, 'date', false)
                data.forEach(row => row.date = moment(row.date).format('MM/DD/YYYY'))
            }

            const count = data.length
            for (let i = 0; i < count; i++) $accList.append(cloneAccForm(i, data))

            resetEvents()
            $accidents.show()
        },
    })
}


function resetEvents() {
    $('.delete-accident-button')
        .off('click')
        .on('click', function() {
            const target = $(this).parent().parent().parent().parent().attr('id')

            $deleteTarget.val(target)

            const $target = $(`#${target}`)
            let type = $target.find(SS.accType).val()
            let desc = '<em class="text-danger">Empty Form</em>'

            if (type) {
                if (type != 'other') {
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
                } else {
                    const otherType = $target.find(TS.accOtherType).val()
                    if (otherType) type = otherType
                    else type = ''
                }

                if (type) {
                    desc = `<strong>${type}</strong>`

                    const accDate = $target.find(TS.accDate).val()
                    const accState = $target.find(SS.accState).val()

                    if (accDate) desc += ` on ${accDate}`
                    if (accState) desc += ` in ${accState}`
                }
            }

            $deleteAccDesc.html(desc)
        })
        .parent()
        .attr('style', countAccList() > 1 ? '' : 'display: none !important;')
        
    selectEvent(SS.accType, {
        fill: true,
        onChange(type, $type) {
            onChange(type, $type)

            const $otherType = $type.parent().parent().next().find(TS.accOtherType)
            let required = false, action = 'hide'
            if (type === 'other') {
                required = true
                action = 'show'
            }

            $otherType.prop('required', required)
                .parent()[action]()
        },
    })

    inputEvent(TS.accOtherType, {
        strip: true,
        word: true,
        onInput(accident, $accident) {
            $accident.val(capitalizeEach(accident))
            onInput(accident, $accident)
        },
        onChange,
    })

    dateMask(TS.accDate, {
        pattern: 'us',
        onAccept(mask, $date) {
            $date.removeClass('is-valid is-invalid').next().text(null)
        },
        onComplete(mask, $date) {
            let date = mask.value

            if (date) {
                const $help = $date.next()
                date = moment(date, 'MM/DD/YYYY', true)

                if (!date.isValid()) {
                    $date.addClass('is-invalid')
                    $help.text('* Invalid date')
                } else {
                    const today = moment(appliedOn)

                    if (date.isAfter(today)) {
                        $date.addClass('is-invalid')
                        $help.text('* Future date forbidden')
                    } else {
                        const limit = today.clone().subtract(3, 'years')

                        if (date.isBefore(limit)) {
                            $date.addClass('is-invalid')
                            $help.text('* Over 3 years ago')
                        } else $date.addClass('is-valid')
                    }
                }
            }

            if (check($form)) $help.form.hide().html(null)
        },
    })
    
    selectEvent(SS.accState, { fill: true, onChange })

}


function resetAccIdx() {
    $accList.find('.accident-form').each(function(i) {
        $(this).find('input, select').each(function() {
            $(this).attr('name', $(this).attr('name').split('[')[0] + `[${i}]`)
        })
    })
}