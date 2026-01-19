import Person from '/modules/tools/core/person.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import selector from '/modules/registry/selectors/company.mjs'

const $tabs = $('.company-card-tabs')
const $sections = $('.company-card-content')
const $content = {
    logo: $('#logo-card-content'),
    users: $('#users-card-content'),
}
const urlParams = new URLSearchParams(window.location.search)
const timeout = 250

$tabs.click(function() {
    $tabs.removeClass('is-active')
    $sections.fadeOut(timeout)
    $(this).addClass('is-active')

    setTimeout(() => {
        const section = $(this).data('section')

        $(`#${section}-card-content`).fadeIn(timeout)
    }, timeout)
})


if ($content.logo.length) {
    if (urlParams.has('logo')) {
        $tabs.removeClass('is-active')
        $sections.hide()
        history.replaceState(null, '', window.location.href.split('?')[0])
        $('[data-section=logo]').addClass('is-active')
        $content.logo.fadeIn(timeout)
    }
}


if ($content.users.length) {
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

    $.ajax(`/api/resource/companies/${_id}/users`, {
        success(response) {
            const { data: users } = response
            const options = { available: '', applied: '' }
            const option = '<option value=""></option>'

            for (const prop of ['available', 'applied']) {
                users[prop].map(user => user.option = `${new Person(user).fullName('AL')} (${user.location} ${user.expansion.status})` )
                users[prop] = sortArrayByObjectKey(users[prop], 'option')
                users[prop].forEach(user => options[prop] += `<option value="${user._id}">${user.option}</option>`)
            }

            $users.available.html(options.available || option)
            $users.applied.html(options.applied || option)

            if (urlParams.has('users')) {
                $('[data-section=users]').addClass('is-active')
                $content.users.fadeIn(timeout)
            }
        },
    })
}