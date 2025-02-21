import escapeHTML from '/modules/assets/html.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { roleNameEvent, roleLocationEvent } from '/modules/events/user.mjs'

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

const showWarning = () => {
    $warning.show()
    $button.submit.prop('disabled', true)
}

const hideWarning = () => {
    $warning.hide()
    $button.submit.prop('disabled', false)
}

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
    hideWarning()
})

const ajaxData = {
    catId: 'crr',
    $id,
    $name,
    $location,
}

const onAjax = response => { console.log(response) //!temp
    const { unique, original } = response
    if (!unique && !original) showWarning()
}

const onChange = () => hideWarning()


roleNameEvent(carrierRoleNameId, ajaxData, {
    onInput() {
        hideWarning()
    },
    onAjax,
})


roleLocationEvent(carrierRoleLocationId, ajaxData, { onChange, onAjax })