import escapeHTML from '/modules/assets/html.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { roleNameEvent, roleLocationEvent } from '/modules/events/user.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'

const { carrierRoleId, carrierRoleNameId, carrierRoleLocationId } = formSelectors.user


const $section = $('#carrier-roles-from-section')
const $panel = $('#carrier-role-panel')
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
    $('.carrier-checkbox').prop('checked', false)
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


$.ajax('/api/roles/carrier', {
    method: 'POST',
    success(response) { console.log(response) //!temp
        const { error } = response

        if (error) alert(error)
        else {
            let { data } = response
            let list = ''
            data = sortArrayByObjectKey(data, 'name')

            data.forEach(role => {
                const { _id, name } = role
                let { location } = role
                if (location) location = location[1]

                list += `<a class="panel-block">`
                list += name
                if (location) list += `&nbsp; <span class="tag">${location} only</span>`
                list += '</a>'
            })

            $('#carrier-panel-list').html(list)
        }
    },
})