import { inputEvent, selectEvent } from '/modules/events/form.mjs';
import { telMask, idMask } from '/modules/events/imask.mjs';
import { nameEvent } from '/modules/events/person.mjs';
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs';
import { onInput, onAccept, onChange, onComplete, onSubmit } from './support.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import { Relationship } from '/modules/tools/core/person.mjs';

const TS = selector.id.text,
  SS = selector.id.select;
const relationId = SS.benefRelation;
const otherRelId = TS.benefOtherRel;
const firstNameId = TS.benefFirstName;
const middleNameId = TS.benefMiddleName;
const lastNameId = TS.benefLastName;
const suffixId = SS.benefSuffix;
const genderId = SS.benefGender;
const phoneId = TS.benefPhone;
// const addr1Id = TS.benefAddress1
// const addr2Id = TS.benefAddress2
// const zipId = TS.benefAddrZip
// const cityId = TS.benefAddrCity
// const stateId = SS.benefAddrState
const ssnId = TS.benefSsn;

const $card = $('#apl-card');
const $submit = $('#beneficiary-submit');
const $form = $('#beneficiary-form');

selectEvent(relationId, {
  fill: true,
  onChange(relation, $relation) {
    const gender = Relationship.gender(relation);
    let disabled = true,
      action = 'hide';

    if (relation === 'Other') {
      disabled = false;
      action = 'show';
    } else if (gender)
      $(genderId).val(gender).addClass('is-valid').find('option[value=""]').remove();

    $(otherRelId).prop('disabled', disabled).parent()[action]();
    onChange(relation, $relation);
  },
});

inputEvent(otherRelId, { strip: true, word: true, capitalize: 'first', onInput, onChange });

nameEvent(firstNameId, { onInput, onChange });

nameEvent(middleNameId, { onChange });

nameEvent(lastNameId, {
  sfxId: suffixId,
  onInput,
  onChange(lastName, $lastName, suffix, $suffix) {
    onChange(lastName, $lastName);

    if (suffix) onChange(suffix, $suffix);
  },
});

selectEvent(suffixId, { onChange });

// selectEvent(genderId, { fill: true, onChange })

// addr1Event(addr1Id, {
//     addr2Id,
//     onInput,
//     onChange(addr1, $addr1, addr2, $addr2) {
//         onChange(addr1, $addr1)
//         onChange(addr2, $addr2)
//     },
// })

// addr2Event(addr2Id, { onInput, onChange })

// zipEvent(zipId, {
//     cityId,
//     stateId,
//     onInput,
//     onChange(zip, $zip, city, state, $city, $state) {
//         onChange(zip, $zip)
//         onChange(city, $city)
//         onChange(state, $state)
//     },
// })

// cityEvent(cityId, { onInput, onChange })

// selectEvent(stateId, { onChange })

telMask(phoneId, { onAccept, onComplete });

idMask(ssnId, 'ssn');

onSubmit($form, null, $submit, $card);
