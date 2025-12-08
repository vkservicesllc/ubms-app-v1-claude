import Person from '/modules/tools/core/person.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
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

    $.ajax(`/api/data/company/${_id}/users`, {
        method: 'POST',
        success(response) {
            const { data: users } = response
            const options = { available: '', applied: '' }
            const option = '<option value=""></option>'

            for (const prop of ['available', 'applied']) {
                users[prop].map(user => {
                    const name = new Person(user).fullName('AL')
                    const option = `${name} (${user.location} ${user.expansion.status})`

                    user.option = `${name} (${user.location} ${user.expansion.status})`
                })

                users[prop] = sortArrayByObjectKey(users[prop], 'option')
                users[prop].forEach(user => options[prop] += `<option value="${user._id}">${user.option}</option>`)
            }

            $users.available.html(options.available || option)
            $users.applied.html(options.applied || option)

            if (urlParams.has('users')) {
                $('[data-section=users]').addClass('is-active')
                $content.users.show()
            }
        },
    })
}