import selector from '/modules/registry/selectors/driver-application.mjs';
import application from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { startPref, operType } = application.preference;
  const RS = selector.class.radio;

  $(`${RS.startPref}[value="${startPref}"]`).prop('checked', true);
  $(`${RS.operType}[value="${operType}"]`).prop('checked', true);
})();
