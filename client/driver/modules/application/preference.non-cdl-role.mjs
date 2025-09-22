import { onSubmit } from './support.mjs'

const $card = $('#apl-card')
const $form = $('#preference-form')
const $submit = $('#preference-submit')


onSubmit($form, null, $submit, $card)