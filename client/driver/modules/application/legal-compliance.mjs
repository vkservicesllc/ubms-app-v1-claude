import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onSubmit, onYesNoRadioChange, onCompleted } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { capitalizeEach } from '/modules/tools/utils/string.mjs'

const violations = $.ajax('/api/local-source/application?filter=violations', { method: 'POST', async: false }).responseJSON

const RS = selector.id.radio
const TS = selector.class.text, SS = selector.class.select
const duiId = RS.dui
const criminalId = RS.criminal
const criminalExplId = selector.id.text.criminalExpl
const citationsId = RS.citations

const $card = $('#apl-card')
const $form = $('#legal-form')
const $submit = $('#legal-submit')
const $help = {
    form: $('#legal-form-help'),
}
const $citations = $('#citations')
const $citList = $('#citation-list')
const $citForm = $('#citation-form-template')
const $addButton = $('#add-citation-button')
const $removeButton = $('#remove-citation-button')
const $deleteModal = $('#delete-citation-modal')
const $deleteTarget = $('#delete-citation-target')
const $deleteCitDesc = $('#delete-citation-desc')
const appliedOn = $(selector.id.hidden.appliedOn).val()

const countCitList = () => $citList.children().length


if ($(citationsId.yes).is(':checked')) drawCitationForms()

onYesNoRadioChange(duiId, selector.class.radio.duiInDecade, 2)

onYesNoRadioChange(criminalId, criminalExplId)

inputEvent(criminalExplId, { strip: true, capitalize: 'first', onInput, onChange })

let selected = false

inputEvent(citationsId.yes, {
    onChange() {
        selected = true

        drawCitationForms()
    },
})

inputEvent(citationsId.no, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your citation data will be erased!')) {
                $citations.hide()
                $citList.html(null)

                selected = false
            } else {
                $el.prop('checked', false)
                $(citationsId.yes).prop('checked', true)
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
        $deleteCitDesc.html(null)
    })

$removeButton.click(() => {
    document.activeElement.blur()
    const target = $deleteTarget.val()

    $(`#${target}`).remove()
    $deleteTarget.val(null)
    $deleteModal.modal('hide')
    $deleteCitDesc.html(null)

    if (!$citList.html()) $citList.append(cloneCitForm())
    resetEvents()
})

$addButton.click(() => {
    $citList.append(cloneCitForm(countCitList()))
    resetEvents()
})


onSubmit($form, $help, $submit, $card)


function cloneCitForm(i = 0, data = null) {
    const tsi = `${Date.now()}-${i}`
    const $clone = $citForm.clone().attr('id', `citation-form-${tsi}`)

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

        // $field.prop('disabled', false)

        if (data) {
            const value = data[i][name]

            if (value) {
                $field.val(value).addClass('is-valid')
                if ($field.prop('disabled') === true)
                    $field.prop('disabled', false)

                if ($field.is('select'))
                    $field.find('option[value=""]').remove()

                if ($field.parent().is(':hidden'))
                    $field.parent().show()

                filled = true
            } else if (filled) $field.val('-')
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
                    violation: null,
                    other: null,
                    citedOn: null,
                    state: null,
                })
            else data.forEach(row => row.citedOn = moment(row.citedOn).format('MM/DD/YYYY'))

            const count = data.length
            for (let i = 0; i < count; i++) $citList.append(cloneCitForm(i, data))

            resetEvents()
            $citations.show()
        },
    })
}


function resetEvents() {
    $('.delete-citation-button')
        .off('click')
        .on('click', function() {
            const target = $(this).parent().parent().parent().parent().attr('id')

            $deleteTarget.val(target)

            const $target = $(`#${target}`)
            let reason = $target.find(SS.citReason).val()
            let desc = '<em class="text-danger">Empty Form</em>'

            if (reason) {
                if (reason != 'other') {
                    violationLoop:
                    for (const group in violations) {
                        const set = violations[group]

                        if (typeof set === 'object')
                            for (const prop in set) {
                                if (reason !== prop) continue

                                reason = set[prop]
                                break violationLoop
                            }
                    }
                } else {
                    const otherReason = $target.find(TS.citOtherReason).val()
                    if (otherReason) reason = otherReason
                    else reason = ''
                }

                if (reason) {
                    desc = `<strong>${reason}</strong>`

                    const citedOn = $target.find(TS.citDate).val()
                    const citState = $target.find(SS.citState).val()

                    if (citedOn) desc += ` on ${citedOn}`
                    if (citState) desc += ` in ${citState}`
                }
            }

            $deleteCitDesc.html(desc)
        })
        .parent()
        .attr('style', countCitList() > 1 ? '' : 'display: none !important;')

    selectEvent(SS.citReason, {
        fill: true,
        onChange(reason, $reason) {
            onChange(reason, $reason)

            const $otherReason = $reason.parent().parent().next().find(TS.citOtherReason)
            $otherReason
                .val('-')
                .parent().hide()

            if (reason === 'other')
                $otherReason
                    .val(null).removeClass('is-valid')
                    .parent().show()
        },
    })

    inputEvent(TS.citOtherReason, {
        strip: true,
        word: true,
        onInput(citation, $citation) {
            $citation.val(capitalizeEach(citation))
            onInput(citation, $citation)
        },
        onChange,
    })

    inputEvent(TS.citDate, {
        mask: '99/99/9999',
        placeholder: 'MM/DD/YYYY',
        onKeyup(date, $date) {
            $date.removeClass('is-valid is-invalid').next().text(null)
        },
        onCompleted(date, $date) {
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

    selectEvent(SS.citState, { fill: true, onChange })

}