import selector from '/modules/registry/selectors/company.mjs'

const $tabs = $('.company-card-tabs')
const $sections = $('.company-card-content')
const $content = {
    users: $('#users-card-content'),
}

$tabs.click(function() {
    const timeout = 250

    $tabs.removeClass('is-active')
    $sections.fadeOut(timeout)
    $(this).addClass('is-active')

    setTimeout(() => {
        const section = $(this).data('section')

        $(`#${section}-card-content`).fadeIn(timeout)
    }, timeout)
})


if ($content.users.length) {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('users')) {
        $tabs.removeClass('is-active')
        $sections.hide()
        history.replaceState(null, '', window.location.href.split('?')[0])
    }

    const _id = $(selector.id.hidden.id).val()
    const $users = {
        available: $('#available-users'),
        applied: $('#current-users'),
    }

    $.ajax(`/api/company/${_id}/users`, {
        method: 'POST',
        success(response) {
            const { data: users } = response
            const options = { available: '', applied: '' }
            const option = '<option value=""></option>'

            const optionItem = (user, prop) => {
                const { name, username } = user
                let option = name
                if (username) option += ` (${username})`
                else option += ' (pending...)'

                options[prop] += `<option value="${user._id}">${option}</option>`
            }

            users.available.forEach(user => optionItem(user, 'available'))
            users.applied.forEach(user => optionItem(user, 'applied'))

            $users.available.html(options.available || option)
            $users.applied.html(options.applied || option)

            if (urlParams.has('users')) {
                $('[data-section=users]').addClass('is-active')
                $content.users.show()
            }
        },
    })
}