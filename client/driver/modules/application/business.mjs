import { inputEvent, selectEvent } from '/modules/events/form.mjs';
import { idMask } from '/modules/events/imask.mjs';
import { busNameEvent } from '/modules/events/company.mjs';
import { onInput, onChange, onSubmit, onYesNoRadioChange } from './support.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';

const TS = selector.id.text,
  SS = selector.id.select,
  RS = selector.id.radio;
const llcNameId = TS.llcName;
const llcStateId = SS.llcState;
const llcEinId = TS.llcEin;
// const llcAssistanceId = RS.llcAssistance
// const proposedNameId = TS.llcProposedName

const $card = $('#apl-card');
const $form = $('#business-form');
const $submit = $('#business-submit');

inputEvent(selector.class.radio.activeLLC, {
  onChange(value) {
    const $businessDetails = $('#business-details');
    // const $businessAssistance = $('#business-assistance')
    const $business = $(selector.class.combo.llcDetails);
    // const $assistance = $(selector.class.radio.llcAssistance)
    // const $proposedName = $(proposedNameId)

    switch (value) {
      case 'Y':
        // $businessAssistance.hide()
        // $assistance.prop('disabled', true)
        // $proposedName.prop('disabled', true)
        $business.prop('disabled', false);
        $businessDetails.show();
        break;

      case 'N':
        $businessDetails.hide();
        $business.prop('disabled', true);
        // $assistance.prop('disabled', false)
        // if ($(llcAssistanceId.yes).prop('checked')) $proposedName.prop('disabled', false)
        // $businessAssistance.show()
        break;
    }
  },
});

busNameEvent(llcNameId, true, {
  onInput,
  onChange(busName, coType, $busName) {
    onChange(busName, $busName);
  },
});

selectEvent(llcStateId, { fill: true, onChange });

idMask(llcEinId, 'ein');

// onYesNoRadioChange(llcAssistanceId, proposedNameId, 2)

// busNameEvent(proposedNameId, true, {
//     onInput,
//     onChange(busName, coType, $busName) {
//         onChange(busName, $busName)
//     },
// })

onSubmit($form, null, $submit, $card);
