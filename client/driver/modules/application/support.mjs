import selector from '/modules/registry/selectors/driver-application.mjs';
import emplSelector from '/modules/registry/selectors/driver-application-employment.mjs';
import { capitalizeEach } from '/modules/tools/utils/string.mjs';

const TS = selector.class.text,
  SS = selector.class.select;

export default function (offset = 1) {
  const { href } = window.location;
  const x = href.split('/');

  return x[x.length - offset].split('?')[0];
}

export const check = ($form) => $form.find('input[required]').filter('.is-invalid').length === 0;

export const onInput = (value, $el) => $el.removeClass('is-valid is-invalid');

export const onAccept = (mask, $el) => onInput(mask.value, $el);

export const onChange = (value, $el) => {
  if (!$el) return;
  if (['MM/DD/YYYY', '(###) ###-####', '###-##-####'].includes(value)) value = null;

  const required = $el.prop('required');

  if (value && required) $el.addClass('is-valid');
};

export const onComplete = (mask, $el) => onChange(mask.value, $el);

export const onBlur = (value, $el) => onChange(value, $el);

export const onSubmit = ($form, $help, $submit, $card, cb) => {
  $form.submit(function (evt) {
    evt.preventDefault();
    let dismiss = false;

    if ($help?.form) {
      const valid = check($(this));
      if (!valid)
        return $help.form
          .html(
            '<i class="fas fa-triangle-exclamation"></i> Some of the provided information is invalid',
          )
          .show();

      $help.form.hide().html(null);
    }

    if (cb && typeof cb === 'object' && cb.dismiss) dismiss = cb.dismiss();

    if (!dismiss) {
      const duration = 750;

      $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Submitting...');
      $card.fadeOut(duration);

      if (cb && typeof cb !== 'object') cb();
      setTimeout(() => $form.unbind().submit(), duration);
    }
  });
};

export const onYesNoRadioChange = (id, explSelector, depth = 1) => {
  const $radio = $(`${id.yes}, ${id.no}`);
  const $expl = $(explSelector);

  $radio.on('change', function () {
    const value = $(this).val();
    const action = value === 'Y' ? 'show' : 'hide';
    const disabled = action === 'hide';
    let $parent = $expl.parent();
    if (depth === 2) $parent = $parent.parent();

    $expl.prop('disabled', disabled);
    $parent[action]();
  });
};

const sessionToken = generateSessionToken();

export const addressPredictions = ($addr1, input, success) => {
  $('.address-selected').off('click');

  const $row1 = $addr1.parent().parent();
  const $row2 = $row1.next();
  const $datalist = $row1.find('.address-predictions');

  const $addr2 = $row1.find(
    '[name="address[address2]"], ' + TS.prevAddress2 + ', ' + emplSelector.id.text.address2,
  );
  const $zip = $row1.find(
    '[name="address[zip]"], ' + TS.prevAddrZip + ', ' + emplSelector.id.text.addrZip,
  );
  const $city = $row2.find(
    '[name="address[city]"], ' + TS.prevAddrCity + ', ' + emplSelector.id.text.addrCity,
  );
  const $state = $row2.find(
    '[name="address[state]"], ' + SS.prevAddrState + ', ' + emplSelector.id.select.addrState,
  );

  $datalist.html(null);

  $.ajax('/api/public/google/places/autocomplete', {
    data: { input, sessionToken },
    method: 'POST',
    success(responseData) {
      const { predictions } = responseData;

      let options = [];
      predictions.forEach((prediction) => {
        const { place_id, description } = prediction;
        options.push(`<li class="address-selected" place-id="${place_id}">${description}</li>`);
      });

      $datalist.html(options.join(''));

      $('.address-selected').on('click', function () {
        $datalist.html(null);
        const placeId = $(this).attr('place-id');
        const description = $(this).text();

        $.ajax('/api/public/google/places/details', {
          data: { placeId },
          method: 'POST',
          success(responseData) {
            const { address_components } = responseData;
            let address1 = null,
              address2 = null,
              zip = null,
              city = null,
              state = null;

            address_components.map((component) => {
              switch (component.types[0]) {
                case 'street_number':
                  address1 = component.short_name || null;
                  break;
                case 'route':
                  if (!address1) address1 = description.match(/^\d+/)?.[0] || '';
                  if (component.short_name) address1 += ` ${component.short_name}`;
                  address1 = address1.trim();
                  break;
                case 'subpremise':
                  address2 = component.short_name || null;
                  if (address2) address2 = capitalizeEach(address2);
                  break;
                case 'locality':
                case 'sublocality_level_1':
                case 'sublocality':
                case 'neighborhood':
                case 'administrative_area_level_3':
                  city = component.short_name || null;
                  break;
                case 'administrative_area_level_1':
                  state = component.short_name || null;
                  break;
                case 'postal_code':
                  zip = component.short_name || null;
                  break;
              }
            });

            $addr1.val(address1).trigger('change');
            if (address2) $addr2.val(address2).trigger('change');
            $zip.val(zip).addClass('is-valid'); //* If trigger change, extra us-zip API will be called and data can be overwritten
            $city.val(city).trigger('change');
            $state.val(state).trigger('change');

            if (typeof success === 'function') success();
          },
        });
      });
    },
  });
};

function generateSessionToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}
