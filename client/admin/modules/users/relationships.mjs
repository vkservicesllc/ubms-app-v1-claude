const $modal = $('#role-relationship-modal')
const $title = $('#role-relationship-title')
const $section = $('#role-relationship')
const $button = {
    done: $('#role-relationship-close-button'),
}

console.log($('.role-relationship'))
$('.role-relationship').click(function() {
    const _id = $(this).data('role-id')

    $.ajax(`/api/data/role/${_id}/users`, {
        method: 'POST',
        success(response) {
            const { data, source: role } = response
            const { _id, name, location } = role
console.log(data)
        },
    })
})