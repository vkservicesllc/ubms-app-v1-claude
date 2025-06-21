import { inputEvent } from '/modules/events/form.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { onInput, onChange, onKeyup, onCompleted, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import cb from './addresses.mjs'

const TS = selector.id.text
const phoneId = TS.emergPhone
const nameId = TS.emergName
const relationId = TS.emergRelation

const $card = $('#apl-card')
const $form = $('#misc-form')
const $submit = $('#misc-submit')
const $help = {
    form: $('#misc-form-help'),
}

telEvent(phoneId, { onKeyup, onCompleted })

nameEvent(nameId, { onChange })

inputEvent(relationId, { strip: true, word: true, capitalize: 'first', onInput, onChange })

onSubmit($form, $help, $submit, $card, cb)