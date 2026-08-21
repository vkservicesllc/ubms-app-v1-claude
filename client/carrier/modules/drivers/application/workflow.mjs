import selector from '/modules/registry/selectors/driver-application.mjs';
import application, { dropdownEvent, errorMessage } from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { experience, position } = application.decision || {};

  const $form = $('#assign-form');
  const $dropdown = {
    refSrc: $('#refsrc-dropdown'),
    user: $('#user-dropdown'),
    carrier: $('#carrier-dropdown'),
    team: $('#team-dropdown'),
    condition: $('#condition-dropdown'),
    experience: $('#experience-dropdown'),
    apprPosition: $('#approved-position-dropdown'),
  };

  for (const prop in $dropdown) $dropdown[prop].dropdown();

  $form.find('input').on('change', () => {
    $form.find('[type="submit"]').prop('disabled', false);
    $form.find('.unsaved-changes').show();
  });
})();
