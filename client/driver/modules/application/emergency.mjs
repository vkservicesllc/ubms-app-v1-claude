import { inputEvent } from '/modules/events/form.mjs';
import { telMask } from '/modules/events/imask.mjs';
import { nameEvent } from '/modules/events/person.mjs';
import { onInput, onAccept, onChange, onComplete, onSubmit } from './support.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import cb from './addresses.mjs';

const TS = selector.id.text;
const phoneId = TS.emergPhone;
const nameId = TS.emergName;
const relationId = TS.emergRelation;

const $card = $('#apl-card');
const $form = $('#misc-form');
const $submit = $('#misc-submit');

telMask(phoneId, { onAccept, onComplete });

nameEvent(nameId, {
  sfxId: true,
  onChange(name, $name, suffix) {
    if (suffix) $name.val(`${name}, ${suffix}`);
  },
});

inputEvent(relationId, { strip: true, word: true, capitalize: 'first', onInput, onChange });

onSubmit($form, null, $submit, $card, cb);
