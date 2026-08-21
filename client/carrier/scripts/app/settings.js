const $button = {
    reset: $('#reset-settings'),
    submit: $('#save-settings'),
};
$form = $('#settings-form');

const defaults = {
    lastUrl: 1,
    teamSelect: 0,
    teamCompanies: {
        e: false,
        i: false,
        c: false,
    },
};

const resetDefaults = () => {
    $button.reset.blur();

    for (const name in defaults) {
        const input = defaults[name];

        if (typeof input === 'object') {
            for (const value in input)
                $(`[name="${name}[]"][value="${value}"]`).prop('checked', input[value]);
        } else {
            $(`[name="${name}"]`).prop('checked', false);
            $(`[name="${name}"][value="${defaults[name]}"]`).prop('checked', true);
        }
    }
};

$button.reset.click(resetDefaults);
$button.submit.click(() => {
    $form.submit();
});

$.ajax('/api/enum/user?filter=settings&self=true&call=true', {
    success(response) {
        console.log(response); //! TEMP
        resetDefaults();

        if (response?.carrier) {
            for (const name in response.carrier) {
                const settings = response.carrier;
                const input = settings[name];

                if (typeof input === 'object') {
                    for (const value of input)
                        $(`[name="${name}[]"][value="${value}"]`).prop('checked', true);
                } else {
                    $(`[name="${name}"]`).prop('checked', false);
                    $(`[name="${name}"][value="${settings[name]}"]`).prop('checked', true);
                }
            }
        }

        $form.removeClass('loading');
    },
});
