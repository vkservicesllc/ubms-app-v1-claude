import escapeHTML from '/modules/assets/html.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { roleNameEvent, roleLocationEvent } from '/modules/events/user.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'

const { carrierRoleId, carrierRoleNameId, carrierRoleLocationId } = formSelectors.user


const $section = $('#carrier-roles-form-section')
const $list = $('#carrier-panel-list')
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
    $('.carrier-role-checkbox, .carrier-role-checkbox-all').prop('checked', false)
    $button.delete.hide()
    hideWarning()
})

const ajaxData = {
    catId: 'crr',
    $id,
    $name,
    $location,
}

const onAjax = response => {
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
    success(response) {
        const { error } = response

        if (error) alert(error)
        else {
            let list = ''
            let { data } = response
            data = sortArrayByObjectKey(data, 'name')

            data.forEach(role => {
                const { _id, name } = role
                let { location } = role
                if (location) location = location[1]

                list += `<a class="panel-block carrier-role" data-id="${_id}">`
                list += name
                if (location) list += `&nbsp; <span class="tag">${location} only</span>`
                list += '</a>'
            })

            $list.html(list)
        }
    },
})


$('.carrier-role-checkbox-all').on('change', function() {
    const row = $(this).attr('id')
    const checked = $(this).is(':checked')

    $(`.${row}`).prop('checked', checked)
})

$('.carrier-role-checkbox').on('change', function() {
    const row = $(this).attr('class').split(' ')[1]
    const value = $(this).attr('value')
    const checked = $(this).is(':checked')
    const allChecked = $(`.${row}`).length == $(`.${row}:checked`).length

    $(`#${row}`).prop('checked', allChecked)
    if (checked && value != '0') {
        $(`.${row}[value="0"]`).prop('checked', true)
    }
})

$('.carrier-role-checkbox[value="0"]').on('change', function() {
    const row = $(this).attr('class').split(' ')[1]
    const checked = $(this).is(':checked')

    if (!checked) {
        $(`.${row}`).prop('checked', false)
        $(`#${row}`).prop('checked', false)
    }
})