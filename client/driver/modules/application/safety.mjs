import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const accidents = $.ajax('/api/local-source/application?filter=accidents', { method: 'POST', async: false }).responseJSON

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


if ($(accidentsId.yes).is(':checked')) drawAccidentForms()

inputEvent(selector.class.radio.accidents, {
    onChange(value) {
        if (value === 'N') {
            $accidents.hide()
            $accList.html(null)
            return
        }

        drawAccidentForms()
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
})

$addButton.click(() => {
    $accList.append(cloneAccForm(countAccList()))
    resetEvents()
})


onSubmit($form, $help, $submit, $card)


function cloneAccForm(i = 0, data = null) {
    const tsi = `${Date.now()}-${i}`
    const $clone = $accForm.clone().attr('id', `accident-form-${tsi}`)

    $clone.find('input, select').each(function() {
        const $field = $(this)
        let filled = false

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${tsi}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name').replace('[]', '')

        $field.prop('disabled', false)

        if (data) {
            const type = $field.attr('type')
            const value = data[i][name]

            if (value !== null) {
                if (type === 'radio') {
                    const _value = $field.attr('value')
                    if ((_value === 'Y' && value === true) || (_value === 'N' && value === false))
                        $field.prop('checked', true)
                } else {
                    $field.val(value).addClass('is-valid')

                    if ($field.is('select')) $field.find('option[value=""]').remove()
                    if ($field.parent().is(':hidden')) $field.parent().show()
                }
            } else if (filled) $field.val('-')
        }
    })

    return $clone.show()
}


function drawAccidentForms() {
    $.ajax(`/api/application/${formId()}/accidents`, {
        method: 'POST',
        success(response) {
            const { data, error } = response
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
            else data.forEach(row => row.date = moment(row.date).format('MM/DD/YYYY'))

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
                if (type != 'other') type = accidents[reason]
                else {
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
            $otherType
                .val('-')
                .parent().hide()

            if (type === 'other')
                $otherType
                    .val(null).removeClass('is-valid')
                    .parent().show()
        },
    })

    inputEvent(TS.accOtherType, { strip: true, word: true, onInput, onChange })

    inputEvent(TS.accDate, {
        mask: '99/99/9999',
        placeholder: 'MM/DD/YYYY',
        onInput(date, $date) {
            $date.removeClass('is-valid is-invalid').next().text(null)
        },
        onChange(date, $date) {
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
        onBlur,
    })
    
    selectEvent(SS.accState, { fill: true, onChange })

}