import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const accidents = $.ajax('/api/local-source/application?filter=accidents', { method: 'POST', async: false }).responseJSON

const RS = selector.id.radio
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

    //! Will have radio buttons as well
    $clone.find('input, select').each(function() {
        const $field = $(this)

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${tsi}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name').replace('[]', '')

        $field.prop('disabled', false)

        //! Need to handle radio buttons as well
        if (data) {
            const value = data[i][name]

            if (value) {
                $field.val(value)

                if ($field.is('select'))
                    $field.find('option[value=""]').remove()

                if ($field.parent().is(':hidden'))
                    $field.parent().show()

                $field.addClass('is-valid')
            } else $field.val('-')
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
                    //! will continue
                })
            else data.forEach(row => row.date = moment(row.date).format('MM/DD/YYYY'))

            const count = data.length
            for (let i = 0; i < count; i++) $accList.append(cloneAccForm(i, data))

            resetEvents()

            $accidents.show()
        },
    })
}


function resetEvents() {}