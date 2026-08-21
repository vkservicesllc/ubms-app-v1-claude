import application, { dropdownEvent } from './hub.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import settings from '/modules/settings/driver-application.mjs';

(() => {
    if (!application || !Object.keys(application).length) return;

    const { position, vehicle } = application;
    const $form = $('#position-form');
    const $vehicle = $('#vehicle-section');
    const { type, trailer } = vehicle;
    const $trailer = $(selector.id.checkbox.currentVhlTrailer);

    if (type) $vehicle.show();
    else $vehicle.find('input').prop('disabled', true);

    if (settings.vhlType_wTrailer.includes(type))
        $trailer.prop('checked', trailer).parent().parent().parent().show();

    const $dropdown = {
        position: [
            $('#position-dropdown'),
            position,
            (value) => {
                let disabled = true,
                    action = 'hide';
                // const type = $dropdown.vehicleType[0].dropdown('get value')

                if (value === 'OO') {
                    disabled = false;
                    action = 'show';

                    //! not sure if this line matters
                    // if (settings.vhlType_wTrailer.includes(type))
                    //     $trailer.parent().parent().parent().show()
                }

                $vehicle[action]().find('input').prop('disabled', disabled);
            },
        ],
        vehicleType: [
            $('#vehicle-type-dropdown'),
            type,
            (value) => {
                let action = 'hide';

                if (settings.vhlType_wTrailer.includes(value)) action = 'show';

                $trailer.parent().parent().parent()[action]();
            },
        ],
    };

    dropdownEvent($dropdown);

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false);
        $form.find('.unsaved-changes').show();
    });
})();
