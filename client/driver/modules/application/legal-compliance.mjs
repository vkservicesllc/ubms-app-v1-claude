import { inputEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const RS = selector.id.radio
const duiId = RS.dui
const criminalId = RS.criminal
const criminalExplId = selector.id.text.criminalExpl
const citationsId = RS.citations

const $card = $('#apl-card')
const $citations = $('#citations')
const $citList = $('#citation-list')
const $citForm = $('#citation-form-template')
const $addButton = $('#add-citation-button')
const $deleteTarget = $('#citation-delete-target')
const $removeButton = $('#remove-citation-button')
const $deleteModal = $('#delete-citation-modal')

const countCitList = () => $citList.children().length


if ($(citationsId.yes).is(':checked')) drawCitationForms()

onYesNoRadioChange(duiId, selector.class.radio.duiInDecade, 2)

onYesNoRadioChange(criminalId, criminalExplId)

inputEvent(selector.class.radio.citations, {
    onChange(value) {
        if (value === 'N') {
            $citations.hide()
            $citList.html(null)
            return
        }

        drawCitationForms()
    },
})

$deleteModal.on('hidden.bs.modal', () => $deleteTarget.val(null))

$removeButton.click(() => {
    document.activeElement.blur()
    const target = $deleteTarget.val()

    $(`#${target}`).remove()
    $deleteTarget.val(null)
    $deleteModal.modal('hide')

    if (!$citList.html()) $citList.append(cloneCitForm())
    resetDeleteButtons()
})

$addButton.click(() => {
    $citList.append(cloneCitForm(countCitList()))
    resetDeleteButtons()
})


//! Missing event listeners for Citation Form


function cloneCitForm(i = 0, data = null) {
    const tsi = `${Date.now()}-${i}`
    const $clone = $citForm.clone().attr('id', `citation-form-${i}`)

    $clone.find('input, select').each(function() {
        const $field = $(this)

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${tsi}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name')
        $field.attr('name', `${name}[]`)

        if (data) {
            const value = data[i][name]

            if (value) {
                $field.val(value)

                if ($field.is('select'))
                    $field.find('option[value=""]').remove()

                if ($field.prop('disabled'))
                    $field.prop('disabled', false).parent().show()

                $field.addClass('is-valid')
            }
        }
    })

    return $clone.show()
}


function drawCitationForms() {
    $.ajax(`/api/application/${formId()}/citations`, {
        method: 'POST',
        success(response) {
            const { data, error } = response
            if (error) return alert(error)

            if (!data.length)
                data.push({
                    _id: null,
                    citedOn: null,
                    state: null,
                    reason: null,
                    otherReason: null,
                })
            else data.forEach(row => row.citedOn = moment(row.citedOn).format('MM/DD/YYYY'))

            const count = data.length
            for (let i = 0; i < count; i++) $citList.append(cloneCitForm(i, data))

            resetDeleteButtons()
            if (countCitList())

            $citations.show()
        },
    })
}


function resetDeleteButtons() {
    $('.delete-citation-button')
        .off('click')
        .on('click', function() {
            const target = $(this).parent().parent().parent().parent().attr('id')

            $deleteTarget.val(target)
        })
        .parent().parent()
        .attr('style', countCitList() > 1 ? '' : 'display: none !important;')
}