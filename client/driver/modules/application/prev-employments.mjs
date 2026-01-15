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

const RS = selector.id.radio
const TS = selector.class.text, SS = selector.class.select
const employedId = appSelector.radio.prevEmployed

const $card = $('#apl-card')
const $form = {
    employment: $('#prevempl-form'),
    employer: $('#employer-form'),
}
const $submit = {
    employment: $('#prevempl-submit'),
    employer: $('#employer-submit')
}
const $help = {
    form: $('#prevempl-form-help'),
}

const $section = $('#prev-employments')
const $emplList = $('#prevempl-list')

const appliedOn = $(selector.id.hidden.appliedOn).val()