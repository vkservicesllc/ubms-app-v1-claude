import escapeHTML from '/modules/assets/html.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { roleNameEvent } from '/modules/events/user.mjs'

const { carrierRoleId, carrierRoleNameId, carrierRoleLocationId } = formSelectors.user


const $section = $('#carrier-roles-from-section')
const $button = {
    add: $('#carrier-role-add'),
    close: $('#carrier-role-close'),
    delete: $('#carrier-role-delete-button'),
    submit: $('#carrier-role-submit'),
}
const $warning = $('#name-unavailable-warning')

const $id = $(`#${carrierRoleId}`)
const $name = $(`#${carrierRoleNameId}`)
const $location = $(`#${carrierRoleLocationId}`)

$button.add.click(() => {
    setTimeout(() => $('.tables').scrollTop(0), 0)
    $section.show()
})

$button.close.click(() => {
    $section.hide()

    $id.val(null)
    $name.val(null)
    $location.val(null)
    $button.delete.hide()
    $warning.hide()
    $button.submit.prop('disabled', false)
})


roleNameEvent(carrierRoleNameId, {
    _id: $id.val(),
    catId: 'crr',
    location: $location.val(),
}, {
    onInput(name) {
        $warning.hide()
        $button.submit.prop('disabled', false)
    },
    onAjax(response) {
        // const { unique, original } = response
        const unique = false, original = false
//* make it a function to show and hide
//* add danger style to name input
        if (!unique && !original) {
            $warning.show()
            $button.submit.prop('disabled', true)
        }
    },
})