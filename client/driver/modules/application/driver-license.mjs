import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { driverLicenseEvent } from '/modules/events/person.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { onInput, onChange, onBlur, onSubmit } from './support.mjs'

const {
    class: aplClass,
    sexId,
    dlNumId,
    dlClassId,
    dlStateId,
    dlIssId,
    dlExpId,
    dlEndorseId,
    dlRestrId,
} = formSelectors.driver

const $card = $('#apl-card')
const $help = {
    issued: $('#dl-iss-help'),
    expires: $('#dl-exp-help'),
    form: $('#pdl-form-help'),
}
const $submit = $('#dl-submit')
const $form = $('#dl-form')

selectEvent(dlStateId, { fill: true, onChange })

driverLicenseEvent(dlNumId, { onChange })

selectEvent(dlClassId, { fill: true, onChange })

selectEvent(sexId, { fill: true, onChange })

onSubmit($form, $help, $submit, $card)