import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs';
import calSettings from '/modules/settings/calendar.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import application, { dropdownEvent } from './hub.mjs';

(() => {
    if (!application || !Object.keys(application).length) return;

    const { address } = application;
    const TS = selector.id.text,
        CS = selector.id.checkbox;

    const $form = $('#address-form');
    const $dropdown = {
        state: [$('#addr-state-dropdown'), address.state],
        country: [$('#addr-country-dropdown'), address.country],
    };
    const $calendar = {
        since: $('#addr-since-calendar'),
    };
    const $livedAbroad = $(CS.livedAbroad1);
    const $priorAddr = $('#prior-addresses');
    const $enough = $(selector.id.hidden.addrEnough);
    const $currentSince = $(selector.id.hidden.addrSince);
    const addrLen = +$('#prior-addr-count').val();
    let addrMinDate = $('#addr-min-date').val() || null;
    if (addrMinDate) addrMinDate = moment(addrMinDate).toDate();

    $enough.val(+address.enough);
    $currentSince.val(address.since);

    addr1Event(TS.address1, { addr2Id: TS.address2, value: address.address1 });
    addr2Event(TS.address2, { value: address.address2 });
    zipEvent(TS.addrZip, {
        value: address.zip,
        cityId: TS.addrCity,
        onChange(zip, $zip, city, state) {
            if (state) $dropdown.state[0].dropdown('set selected', state);
        },
    });
    cityEvent(TS.addrCity, { value: address.city });

    dropdownEvent($dropdown);

    $calendar.since
        .calendar({
            ...calSettings,
            maxDate: moment(application.finishedAt).toDate(),
            minDate: addrMinDate,
            onSelect(since) {
                const $warning = $('#prior-addresses-warning');
                const finishedOn = moment(application.finishedOn);
                const limit = finishedOn.clone().subtract(3, 'years');
                since = moment(since);
                $priorAddr.removeClass('disabled');

                if (since.isBefore(limit)) {
                    $enough.val('1');
                    $dropdown.country[0]
                        .addClass('disabled')
                        .parent()
                        .hide()
                        .find('input:hidden')
                        .prop('disabled', true);
                    $livedAbroad.prop('disabled', true).parent().parent().hide();
                    $priorAddr.hide();
                    if (addrLen) $warning.show();
                } else {
                    $enough.val('0');
                    $livedAbroad.prop('disabled', false).parent().parent().show();
                    if ($livedAbroad.prop('checked'))
                        $dropdown.country[0]
                            .removeClass('disabled')
                            .parent()
                            .show()
                            .find('input:hidden')
                            .prop('disabled', false);
                    if (!addrLen) $priorAddr.addClass('disabled');
                    $priorAddr.show();
                    $warning.hide();
                }
            },
        })
        .calendar('set date', new Date(moment(address.since).toDate()));

    if (!address.enough) {
        const { livedAbroad } = address;

        $livedAbroad.prop('checked', livedAbroad).parent().parent().show();
        if (livedAbroad)
            $dropdown.country[0]
                .removeClass('disabled')
                .parent()
                .show()
                .find('input:hidden')
                .prop('disabled', false);
        else $priorAddr.show();

        if (!addrLen && !livedAbroad)
            $('.item[data-tab="address"]').append(
                '<i class="ui dark red exclamation triangle icon"></i>',
            );
    }

    $livedAbroad.on('change', function () {
        $priorAddr.removeClass('disabled');

        if ($(this).prop('checked')) {
            $priorAddr.hide();
            $dropdown.country[0]
                .removeClass('disabled')
                .parent()
                .show()
                .find('input:hidden')
                .prop('disabled', false);
        } else {
            $dropdown.country[0]
                .addClass('disabled')
                .parent()
                .hide()
                .find('input:hidden')
                .prop('disabled', true);
            if (!addrLen) $priorAddr.addClass('disabled');
            $priorAddr.show();
        }
    });

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false);
        $form.find('.unsaved-changes').show();
    });

    $form.submit(function (evt) {
        evt.preventDefault();

        if ($livedAbroad.prop('checked') && !$dropdown.country[0].dropdown('get value'))
            return alert('Must select Country');

        $form.unbind().submit();
    });
})();
