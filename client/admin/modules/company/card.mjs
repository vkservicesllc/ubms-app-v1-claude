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
        applied: $('#company-teams'),
    }

    $.ajax(`/api/company/${_id}/teams`, {
        method: 'POST',
        success(response) {
            const { data: teams } = response
            const $options = { available: '', applied: '' }
            const option = '<option value=""></option>'

            teams.available.forEach(team => $options.available += `<option value="${team._id}">${team.name}</option>`)
            teams.applied.forEach(team => $options.applied += `<option value="${team._id}">${team.name}</option>`)

            $teams.available.html($options.available || option)
            $teams.applied.html($options.applied || option)

            if (urlParams.has('teams')) {
                $('[data-section=teams]').addClass('is-active')
                $('#teams-card-content').show()
            }
        },
    })
}