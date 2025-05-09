import { inputEvent } from '/modules/events/form.mjs'
import { check, onInput, onChange, onBlur, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const RS = selector.id.radio
const duiId = RS.dui
const criminalId = RS.criminal
const criminalExplId = selector.id.text.criminalExpl
const citationId = RS.citation

const $card = $('#apl-card')

onYesNoRadioChange(duiId, selector.class.radio.duiInDecade, 2)

onYesNoRadioChange(criminalId, criminalExplId)