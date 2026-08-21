import table from './prev-employers.mjs';
import Person from '/modules/tools/core/person.mjs';
import Address from '/modules/tools/core/address.us.mjs';
import strip from '/modules/tools/utils/formatter.mjs';
import { inputEvent } from '/modules/events/form.mjs';
import { busNameEvent } from '/modules/events/company.mjs';
import { telEvent, emailEvent } from '/modules/events/contacts.mjs';
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs';
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs';
import calSettings from '/modules/settings/calendar.mjs';
import patterns from '/modules/registry/patterns.mjs';
import selector from '/modules/registry/selectors/driver-application-employment.mjs';

const TS = selector.id.text;
const $employer = $(TS.urEmployer);
const $usdot = $(TS.urUsdot);
const $phone = $(TS.urPhone);
const $address1 = $(TS.urAddress1);
const $address2 = $(TS.urAddress2);
const $addrZip = $(TS.urAddrZip);
const $addrCity = $(TS.urAddrCity);

const $modal = {
  add: $('#empl-add-card-modal'),
};

const $dropdown = {
  addrState: $('#urempl-addr-state-dropdown'),
};

busNameEvent(TS.urEmployer, true, {
  onChange(busName, coType, $busName) {
    if (coType) $busName.val(`${busName}, ${coType}`);
  },
});

inputEvent(TS.urUsdot, {
  strip: true,
  onInput(usdot, $usdot) {
    usdot = usdot.replace(/\D/g, '');
    $usdot.val(usdot);
  },
});

telEvent(TS.urPhone);

addr1Event(TS.urAddress1, {
  onChange(addr1, $addr1) {
    const $addr2 = $addr1.parent().next().find(TS.urAddress2);
    const addr2Patt = patterns.match.addr2;
    let addr2 = addr2Patt.test(addr1) ? addr2Patt.exec(addr1)[0].toUpperCase() : null;

    addr1 = addr1.replace(addr2Patt, '').trim();
    if (addr2) addr2 = patterns.replace(addr2, 'addr2');
    $addr1.val(addr1);
    $addr2.val(addr2);
  },
});

addr2Event(TS.urAddress2);

$dropdown.addrState.dropdown();

zipEvent(TS.urAddrZip, {
  onChange(zip, $zip, city, state) {
    if (city && state) {
      const $city = $zip.parent().parent().find(TS.urAddrCity);

      $city.val(city);
      $dropdown.addrState.dropdown('set selected', state);
    }
  },
});

cityEvent(TS.urAddrCity);

table.on('draw', function () {
  const { actions } = table.ajax.json();
  $('.add-empl').off('click');

  if (actions.data.create === true) {
    $('.add-empl').on('click', function (evt) {
      evt.preventDefault();
      const _appId = $(this).data('app-id');

      //* Blank Form; insert _appId to hidden input

      $modal.add
        .modal({
          autofocus: false,
          closable: false,
          onHidden() {
            $employer.val(null);
            $usdot.val(null);
            $phone.val(null);
            $address1.val(null);
            $address2.val(null);
            $addrCity.val(null);
            $addrZip.val(null);
            $dropdown.addrState.dropdown('clear');
          },
        })
        .modal('show');
    });
  }
});
