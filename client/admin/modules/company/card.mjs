import { formSelectors } from '/modules/registry/selectors.mjs'

const $tabs = $('.company-card-tabs')
const $sections = $('.company-card-content')

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


if ($('#teams-card-content').length) {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('teams')) {
        $tabs.removeClass('is-active')
        $sections.hide()
        history.replaceState(null, '', window.location.href.split('?')[0])
    }

    const { id } = formSelectors.company
    const _id = $(`#${id}`).val()
    const $teams = {
        available: $('#available-teams'),
        current: $('#company-teams'),
    }

    $.ajax(`/api/teams/company/${_id}`, {
        method: 'POST',
        success(response) {
            const { data: teams } = response
            const $options = { available: '', current: '' }
            const option = '<option value=""></option>'

            teams.available.forEach(team => $options.available += `<option value="${team._id}">${team.name}</option>`)
            teams.current.forEach(team => $options.current += `<option value="${team._id}">${team.name}</option>`)

            $teams.available.html($options.available || option)
            $teams.current.html($options.current || option)

            if (urlParams.has('teams')) {
                $('[data-section=teams]').addClass('is-active')
                $('#teams-card-content').show()
            }
        },
    })
}