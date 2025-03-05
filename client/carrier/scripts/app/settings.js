const $button = {
    reset: $('#reset-settings'),
}

const defaults = {
    lastUrl: 1,
    teamSelect: 0,
    teamCompanies: {
        e: false,
        i: false,
        c: false,
    },
}

const resetDefaults = () => {
    $button.reset.blur()

    for (const name in defaults) {
        const input = defaults[name]

        if (typeof input === 'object') {
            for (const value in input)
                $(`[name="${name}[]"][value="${value}"]`).prop('checked', input[value])
        } else {
            $(`[name="${name}"]`).prop('checked', false)
            $(`[name="${name}"][value="${defaults[name]}"]`).prop('checked', true)
        }
    }
}


$button.reset.click(resetDefaults)
resetDefaults()

$.ajax('/api/assets/user?filter=settings&self=true', {
    method: 'POST',
    success(response) {
        console.log(response)
    }
})