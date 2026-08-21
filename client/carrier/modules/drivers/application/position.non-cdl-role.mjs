import { makeEvent, modelEvent } from '/modules/events/vehicle.mjs';
import application, { dropdownEvent } from './hub.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import settings from '/modules/settings/driver-application.mjs';

(() => {
    if (!application || !Object.keys(application).length) return;

    const TS = selector.id.text,
        TH = selector.id.hidden;

    const { position } = application;
    const vehicle = application.vehicle || {};
    const { mmt, length, trailer } = vehicle;
    let { year, type, make, model } = vehicle;
    const $form = $('#position-form');
    const $vehicle = $('#vehicle-section');
    const $make = $(TS.currentVhlMake),
        $model = $(TS.currentVhlModel);
    const $trailer = $(selector.id.checkbox.currentVhlTrailer);

    if (year) year = `:${year}`;
    if (mmt && mmt !== 'other') [type, make, model] = mmt.split(':');

    if (settings.vhlType_wTrailer.includes(type))
        $trailer.prop('checked', trailer).parent().parent().parent().show();

    const $dropdown = {
        position: [
            $('#position-dropdown'),
            position,
            (value) => {
                if (value !== 'OO') $vehicle.hide().find('input').prop('disabled', true);
                else {
                    const type = $dropdown.vehicleType[0].dropdown('get value');

                    $dropdown.vehicleMMT[0].find('input').prop('disabled', false);
                    $dropdown.vehicleType[0].find('input').prop('disabled', false);
                    $make.prop('disabled', false);
                    $model.prop('disabled', false);
                    $dropdown.vehicleYear[0].find('input').prop('disabled', false);

                    if (type === 'straightBox')
                        $dropdown.vehicleLength[0].find('input').prop('disabled', false);

                    //! not sure if this line matters
                    // if (settings.vhlType_wTrailer.includes(type))
                    //     $trailer.parent().parent().parent().show()

                    $vehicle.show();
                }
            },
        ],
        vehicleMMT: [
            $('#vehicle-mmt-dropdown'),
            mmt,
            (value) => {
                let type = null,
                    make,
                    model;
                let onOff = 'on',
                    action = 'removeClass',
                    trlAction = 'hide';

                if (value !== 'other') {
                    [type, make, model] = value.split(':');
                    onOff = 'off';
                    action = 'addClass';
                }

                if (settings.vhlType_wTrailer.includes(type)) trlAction = 'show';
                $trailer.parent().parent().parent()[trlAction]();

                toggleDropdown('vehicleType', onOff, type);
                $make.val(make).parent()[action]('disabled');
                $model.val(model).parent()[action]('disabled');
            },
        ],
        vehicleYear: [$('#vehicle-year-dropdown'), year],
        vehicleType: [
            $('#vehicle-type-dropdown'),
            type,
            (value) => {
                let onOff = 'off',
                    action = 'hide',
                    trlAction = 'hide';
                if (value === 'straightBox') {
                    onOff = 'on';
                    action = 'show';
                }
                if (settings.vhlType_wTrailer.includes(value)) trlAction = 'show';

                $trailer.parent().parent().parent()[trlAction]();
                toggleDropdown('vehicleLength', onOff).parent()[action]();
            },
        ],
        vehicleLength: [$('#vehicle-length-dropdown'), length],
    };

    if (mmt) {
        if (mmt !== 'other') {
            toggleDropdown('vehicleType', 'off');
            $make.parent().addClass('disabled');
            $model.parent().addClass('disabled');
        }
        if (type !== 'straightBox') toggleDropdown('vehicleLength', 'off').parent().hide();

        $vehicle.show();
    } else $vehicle.find('input').prop('disabled', true);

    dropdownEvent($dropdown);

    makeEvent(TS.currentVhlMake, { value: make });
    modelEvent(TS.currentVhlModel, { value: model });

    function toggleDropdown(prop, onOff = 'on', value) {
        const action = onOff === 'off' ? 'add' : 'remove';
        const disabled = onOff === 'off';

        $dropdown[prop][0]
            .parent()
            [`${action}Class`]('disabled')
            .find('input')
            .prop('disabled', disabled);
        if (value === null) $dropdown[prop][0].dropdown('clear');
        else if (value) $dropdown[prop][0].dropdown('set selected', value);

        return $dropdown[prop][0];
    }

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false);
        $form.find('.unsaved-changes').show();
    });
})();
