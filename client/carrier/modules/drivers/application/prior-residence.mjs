import { inputEvent } from '/modules/events/form.mjs';
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs';
import Address from '/modules/tools/core/address.us.mjs';
import calSettings from '/modules/settings/calendar.mjs';
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs';
import patterns from '/modules/registry/patterns.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import application, { addresses, dropdownEvent } from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { _id, finishedAt, address } = application;
  const { country } = address;
  const TS = selector.class.text;

  const $addrForm = $('#address-form');
  const $template = $('#form-template').find('tr').clone();
  $template
    .removeAttr('id')
    .find('input')
    .each(function () {
      $(this).removeAttr('id');
    });
  $('#form-template').remove();

  const $country = $('#addr-country-dropdown');

  const minDate = moment(application.appliedOn).clone().subtract(3, 'years');
  let addrMaxDate = $('#addr-max-date').val() || null;
  if (addrMaxDate) addrMaxDate = moment(addrMaxDate).toDate();

  const enableCountry = (value) => {
    const $hidden = $country.find('[type="hidden"]');
    $hidden.prop('disabled', false);
    if (value) $hidden.val(value);
    $country.removeClass('disabled').parent().show();
  };

  const disableCountry = () => {
    $country.find('[type="hidden"]').prop('disabled', true);
    $country.addClass('disabled').parent().hide();
  };

  const enableNextRowsAfter = ($row) => {
    let hideCountry = true;
    $row.nextAll('tr').each(function () {
      $(this).show().find('input').prop('disabled', false);
      if ($(this).find('.lived-abroad').find('[type="checkbox"]').prop('checked'))
        hideCountry = false;
    });
    if (hideCountry) disableCountry();
  };

  const disableNextRowsAfter = ($row) => {
    let showCountry = false;
    $row.nextAll('tr').each(function () {
      $(this).hide().find('input').prop('disabled', true);
      if ($(this).find('.lived-abroad').find('[type="checkbox"]').prop('checked'))
        showCountry = true;
    });
    if (showCountry) enableCountry();
  };

  const enableLivedAbroad = () =>
    $addrForm.find('.lived-abroad').show().find('[type="checkbox"]').prop('disabled', false);
  const disableLivedAbroad = () =>
    $addrForm.find('.lived-abroad').hide().find('[type="checkbox"]').prop('disabled', true);

  function appendRow(record = {}, maxDate) {
    const $row = $template.clone();
    const { address1, address2, zip, city, state, since, enough, livedAbroad } = record;

    $row.find(TS.prevAddress1).val(address1);
    $row.find(TS.prevAddress2).val(address2);
    $row.find(TS.prevAddrZip).val(zip);
    $row.find(TS.prevAddrCity).val(city);
    $row
      .find(TS.prevAddrSince)
      .parent()
      .parent()
      .calendar('set date', since ? moment(since).format('ll') : null)
      .calendar({
        ...calSettings,
        maxDate,
        onChange(since) {
          if (since) {
            //! NEEDS TESTING
            since = moment(since);

            const $row = $(this).parent().parent().parent();
            const $nextRow = $row.next();
            const $livedAbroad = $(this)
              .parent()
              .parent()
              .next()
              .find('.lived-abroad')
              .find('[type="checkbox"]');

            if (since.isSameOrAfter(minDate)) {
              if (!$livedAbroad.prop('checked')) {
                if (!$nextRow.length) appendRow({}, since.clone().subtract(1, 'day').toDate());
                resetEvents();
                enableNextRowsAfter($row);
              } else enableCountry();
              enableLivedAbroad();
            } else {
              disableNextRowsAfter($row);
              disableCountry();
              disableLivedAbroad();
            }
          } else {
            disableNextRowsAfter($row);
          }
          validateForm();
        },
      });
    $row.find('.addr-state-dropdown').find('input').val(state);

    if (enough) {
      $row.find('.lived-abroad').hide().find('[type="checkbox"]').prop('disabled', true);
    } else if (livedAbroad) {
      $row.find('.lived-abroad').find('[type="checkbox"]').prop('checked', true);
    }

    $addrForm.append($row);

    if (since) return moment(since).clone().subtract(1, 'day').toDate();
  }

  function resetEvents() {
    $('.lived-abroad').find('[type="checkbox"]').off('change');

    addr1Event(TS.prevAddress1, {
      onChange(addr1, $addr1) {
        const $addr2 = $addr1.parent().parent().next().find(TS.prevAddress2);
        const addr2Patt = patterns.match.addr2;
        let addr2 = addr2Patt.test(addr1) ? addr2Patt.exec(addr1)[0].toUpperCase() : null;

        addr1 = addr1.replace(addr2Patt, '').trim();
        if (addr2) addr2 = patterns.replace(addr2, 'addr2');
        $addr1.val(addr1);
        $addr2.val(addr2);
        validateForm();
      },
    });

    addr2Event(TS.prevAddress2, {
      onChange() {
        validateForm();
      },
    });

    zipEvent(TS.prevAddrZip, {
      onChange(zip, $zip, city, state) {
        if (city && state) {
          const $city = $zip.parent().parent().next().find(TS.prevAddrCity);
          const $state = $zip.parent().parent().next().next().find('.addr-state-dropdown');

          $city.val(city);
          $state.dropdown('set selected', state);
        }
        validateForm();
      },
    });

    $('.addr-state-dropdown').dropdown({
      onSelect() {
        validateForm();
      },
    });

    $('.lived-abroad')
      .find('[type="checkbox"]')
      .on('change', function () {
        //! NEEDS TESTING
        const $row = $(this).parent().parent().parent().parent();

        if ($(this).prop('checked')) {
          disableNextRowsAfter($row);
          enableCountry();
        } else {
          const since = $(this)
            .parent()
            .parent()
            .parent()
            .prev()
            .find('.addr-date-calendar')
            .calendar('get date');

          enableNextRowsAfter($row);
          if (!$row.next().length && since)
            appendRow({}, moment(since).subtract(1, 'day').toDate());
        }

        validateForm();
      });
  }

  {
    const len = addresses.length;

    if (len)
      addresses.forEach((record, i) => {
        const { enough, livedAbroad } = record;
        addrMaxDate = appendRow(record, addrMaxDate);
      });
    else appendRow({}, addrMaxDate);

    resetEvents();

    if (country) enableCountry(country);
    else disableLivedAbroad();
    $country.dropdown({
      onChange() {
        validateForm();
      },
    });

    $('.table, .footer').fadeIn();
  }

  // $.ajax(`/api/resource/drivers/applications/${_id}/addresses`, {
  //     success(response) {
  //         const { data } = response
  //         const len = data.length

  //         if (len)
  //             data.forEach((record, i) => {
  //                 const { enough, livedAbroad } = record
  //                 addrMaxDate = appendRow(record, addrMaxDate)
  //             })
  //         else appendRow({}, addrMaxDate)

  //         resetEvents()

  //         if (country) enableCountry(country)
  //         else disableLivedAbroad()
  //         $country.dropdown({
  //             onChange() {
  //                 validateForm()
  //             },
  //         })

  //         $('.table, .footer').fadeIn()
  //     },
  // })

  function checkEnough() {
    let enough = false;
    const $rows = $addrForm.children();

    for (const tr of $rows) {
      if ($(tr).find(TS.prevAddrSince).find('[type="hidden"]').prop('disabled')) continue;

      const since = moment($(tr).find('.addr-date-calendar').calendar('get date'));
      if (!since.isValid()) continue;

      if (since.isBefore(minDate)) {
        enough = true;
        break;
      }
    }

    return enough;
  }

  function checkCountry() {
    const country = $country.dropdown('get value') || null;

    return !!country;
  }

  function validateForm() {
    const $submit = $('[type="submit"]');
    const $warning = $('.unsaved-changes');
    let disabled = false,
      action = 'show';
    // let disabled = true, action = 'hide'

    // if (checkEnough() || checkCountry()) {
    //     disabled = false
    //     action = 'show'
    // }

    $submit.prop('disabled', disabled);
    $warning[action]();
  }
})();
