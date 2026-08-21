import { inputEvent } from '/modules/events/form.mjs';
import { nameEvent, ssnEvent } from '/modules/events/person.mjs';
import { telEvent } from '/modules/events/contacts.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import application, { dropdownEvent, errorMessage, errorIcon } from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { gender, marital } = application;
  const { firstName, middleName, lastName, suffix, phone, ssn } = application.beneficiary;
  let { relation, otherRel } = application.beneficiary;

  const TS = selector.id.text;
  const $otherRel = $(TS.benefOtherRel);
  const $form = $('#beneficiary-form');

  const relationOnChange = (value) => {
    let disabled = true,
      action = 'hide';

    if (value === 'Other') {
      disabled = false;
      action = 'show';
    }

    $otherRel.prop('disabled', disabled);
    $field.otherRel[action]();
  };

  const $dropdown = {
    suffix: [$('#beneficiary-suffix-dropdown'), suffix],
    relationship: [$('#beneficiary-relationship-dropdown'), relation, relationOnChange],
  };
  const $field = {
    otherRel: $('#beneficiary-other-relationship-field'),
  };

  dropdownEvent($dropdown);

  inputEvent(TS.benefOtherRel, { strip: true, word: true, capitalize: 'first' });

  nameEvent(TS.benefFirstName, { value: firstName });

  nameEvent(TS.benefMiddleName, { value: middleName });

  nameEvent(TS.benefLastName, {
    sfxId: true,
    value: lastName,
    onChange(lastName, $lastName, suffix) {
      if (suffix) $dropdown.suffix[0].dropdown('set selected', suffix);
    },
  });

  telEvent(TS.benefPhone, { value: phone });

  ssnEvent(TS.benefSsn, { value: ssn });

  if (otherRel) {
    $otherRel.val(otherRel).prop('disabled', false);
    $field.otherRel.show();
  }

  if (marital === 'm') {
    const locked = ['husband', 'wife', 'spouse'];
    const relationship = otherRel || relation;

    const displayErrorMsg = () => {
      const message =
        "The applicant's gender must align with the selected beneficiary relationship";
      const list = [
        `Applicant's Gender: ${gender[1]}`,
        `Beneficiary Relationship: ${relationship}`,
      ];
      const $errorMsg = errorMessage('Logical Error', message, list);

      $dropdown.relationship[0].parent().addClass('error');
      if (otherRel) $field.otherRel.addClass('error');
      $('#beneficiary-form').after($errorMsg);
      $('.item[data-tab="beneficiary"]').append(errorIcon);
    };

    relation = relation.toLowerCase().trim();
    if (otherRel) otherRel = otherRel.toLowerCase().trim();

    if ((relation === locked[0] || otherRel === locked[0]) && gender[0] == 'M') displayErrorMsg();

    if ((relation === locked[1] || otherRel === locked[1]) && gender[0] == 'F') displayErrorMsg();
  }

  $form.find('input').on('change', () => {
    $form.find('[type="submit"]').prop('disabled', false);
    $form.find('.unsaved-changes').show();
  });
})();
