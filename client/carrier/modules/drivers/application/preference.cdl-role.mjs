import { nameEvent } from '/modules/events/person.mjs';
import { telEvent } from '/modules/events/contacts.mjs';
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import application from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { operType, teamName, teamPhone, haulRegion, equipmentType } = application.preference;
  const TS = selector.id.text;
  const $partners = $('.cdl-role-partner');

  nameEvent(TS.teamName, { sfx: true });
  telEvent(TS.teamPhone);

  if (operType === 't') {
    $partners.show().find('input').prop('disabled', false);
    $(TS.teamName).val(teamName);
    if (teamPhone) $(TS.teamPhone).val(formatTel(teamPhone));
  }

  $(selector.class.radio.operType).on('change', function () {
    let action = 'show',
      disabled = false;

    if ($(this).val() === 's') {
      action = 'hide';
      disabled = true;
    }

    $partners[action]().find('input').prop('disabled', disabled);
  });

  if (haulRegion)
    haulRegion.forEach((prop) => $(selector.id.checkbox.haulRegion[prop]).prop('checked', true));
  if (equipmentType)
    equipmentType.forEach((prop) =>
      $(selector.id.checkbox.equipmentType[prop]).prop('checked', true),
    );
})();
