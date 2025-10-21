import escapeHTML from '/modules/tools/utils/html.mjs'
import selector from '/modules/registry/selectors/user.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { capitalizeFirst } from '/modules/tools/utils/string.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'

const emailId = selector.id.text.email
const phoneId = selector.id.text.phone
const firstNameId = selector.id.text.firstName
const lastNameId = selector.id.text.lastName
const aliasId = selector.id.text.alias
const conditionClass = selector.class.radio.condition
const genderClass = selector.class.radio.gender

const $id = $(selector.class.hidden)
const $status = $(selector.id.select.status)
const $location = $(selector.id.select.location)
const $email = $(selector.id.text.email)
const $hiddenUsername = $(selector.id.hidden.username)
const $phone = $(phoneId)
const $firstName = $(firstNameId)
const $lastName = $(lastNameId)
const $alias = $(aliasId)
const $gender = $(genderClass)
const $condition = $(conditionClass)
const $lockedCondition = $(selector.id.radio.condition.locked)

const $title = {
    all: $('.modal-card-title:not(#user-security-modal-title)'),
    user: $('#user-modal-title'),
    deleteUser: $('#user-delete-modal-title'),
    userCondition: $('#user-condition-modal-title'),
}
const $form = {
    user: $('#user-form'),
    deleteUser: $('#user-delete-form'),
}
const $field = {
    status: $status.parent().parent().parent().parent(),
}
const $submit = {
    user: $('#user-modal-submit'),
    deleteUser: $('#user-delete-modal-submit'),
}
const $trigger = {
    userLog: $('#user-update-log-trigger'),
}
const $help = {
    email: $('#user-email-help'),
    name: $('#user-fname-help, #user-alias-help'),
}
const $confirmation = {
    deleteUser: $('#confirm-delete-user'),
}
const message = {
    email: {
        success: '<i class="fa fa-check"></i> Email is available',
        failed: '<i class="fa fa-close"></i> Email is taken',
        invalid: '<i class="fa fa-triangle-exclamation"></i> Invalid email',
    },
    name: {
        failed: '<i class="fa fa-triangle-exclamation"></i> First Name and Alias must not be identical',
    },
    invite: '<p class="notification is-warning">The user will receive an invitation email with additional instructions</p>',
    buildInvite() {
        this.removeInvite()
        $form.user.append(this.invite)
    },
    removeInvite() {
        $form.user.find('> p').remove()
    },
}


$status.on('change', function() {
    const status = $(this).val()

    if (status == 'S') {
        const location = $location.val()

        if (location && location != 'US')
            $location.val('US')

        $location.find('option:not([value=US])').prop('disabled', true)
    } else
        $location.find('option').prop('disabled', false)
})

$location.on('change', function() {
    const location = $(this).val()
    let readonly = false

    if (location && location != 'US') {
        $phone.val(null)
        readonly = true
    }

    $phone.prop('readonly', readonly)
})

const removeNameErrMsg = () => {
    const emailTip = $help.email.html()

    $help.name.hide().html(null).removeClass('is-danger')
    if (!emailTip || emailTip.includes(message.email.success.split('</i> ')[1]))
        $submit.user.prop('disabled', false)
}

const checkNameMatch = (firstName, alias) => {
    if (firstName && firstName == alias) {
        $help.name
            .addClass('is-danger')
            .html(message.name.failed)
            .show()
        $submit.user.prop('disabled', true)
    }
}

nameEvent(firstNameId, {
    onInput: removeNameErrMsg,
    onChange(firstName) {
        const alias = $alias.val()

        checkNameMatch(firstName, alias)
    },
})

nameEvent(aliasId, {
    onInput: removeNameErrMsg,
    onChange(alias) {
        const firstName = $firstName.val()

        checkNameMatch(firstName, alias)
    },
})

nameEvent(lastNameId, { sfxId: true })

emailEvent(emailId, {
    onChange(email, valid) {
        const $tip = $help.email
        const $button = $submit.user
        const _id = $(selector.id.hidden.id).val()
        const username = $hiddenUsername.val()

        $tip.hide().removeClass('is-danger is-success').html(null)
        if (!$help.name.html()) $button.prop('disabled', false)

        if (_id) message.removeInvite()

        if (email) {
            if (!valid) {
                $tip
                    .addClass('is-danger')
                    .html(message.email.invalid)
                    .show()
                $button.prop('disabled', true)
            } else
                $.ajax('/api/unique/user', {
                    method: 'POST',
                    data: { email, exclude: { _id } },
                    success(response) {
                        const { unique } = response

                        if (unique) {
                            $tip
                                .addClass('is-success')
                                .html(message.email.success)
                                .show()

                            if (_id && !username)
                                message.buildInvite()
                        } else {
                            $tip
                                .addClass('is-danger')
                                .html(message.email.failed)
                                .show()
                            $button.prop('disabled', true)
                        }
                    },
                })
        }
    },
})

telEvent(phoneId)


const statusReq = $.ajax('/api/session/status?key=0', { method: 'POST' })
const locationReq = $.ajax('/api/session/location?key=0', { method: 'POST' })

$.when(statusReq, locationReq).done((statusRes, locationRes) => {
    const [ adminStatus ] = statusRes
    const [ adminLocation ] = locationRes
    const interval = 30000
    let refreshed = false

    const table = new DataTable('#users-table', {

        ajax: {
            url: '/api/users',
            dataSrc(response) {
                return response.data
            },
        },

        columns: [

            {
                data: 'condition',
                searchable: false,
                orderable: false,
                width: '30px',
                render(data, type, row) {
                    data = data[0]
                    if (row.status[0] == 'D' || (adminStatus == 'A' && row.username && row.DS)) return '<i class="fas fa-lock has-text-grey"></i>'
                    if (row.decliner) return '<i class="fas fa-user-lock has-text-grey"></i>'
                    if (!row.username) return '<i class="fas fa-user-clock has-text-grey"></i>'

                    const condition = { fa: 'user-check', style: 'success' }

                    switch (data) {
                        case 'L':
                            condition.fa = 'user-lock'
                            condition.style = 'danger'
                            break
                        case 'I':
                            condition.fa = 'user-xmark'
                            condition.style = 'danger'
                            break
                    }

                    return `<a class="has-text-${condition.style} modify-user-condition" data-id="${row._id}" title="Modify Condition"><i class="fa fa-${condition.fa}"></i></a>`
                },
            },

            {
                data: null,
                searchable: false,
                orderable: false,
                width: '35px',
                render(data, type, row) {
                    return `<img src="${row.avaSrc}" />`
                },
                createdCell(cell) {
                    $(cell).css('padding', '5px 5px 0 0')
                },
            },

            {
                data: 'status',
                searchable: false,
                orderable: false,
                render(data, type, row) {
                    if (row.decliner) return '<strong>DECLINED</strong>'

                    data = data[1]
                    if (adminLocation == 'US') data += ` <small class="has-text-grey">(${row.location[1]})</small>`
                    if (row.unscoped) data += ` <sup><i class="far fa-star has-text-success" style="font-size: .75em;"></i></sup>`

                    return data
                },
            },

            {
                data: 'name',
                title: 'Name',
                render(data) {
                    return `<span class="has-text-weight-semibold">${escapeHTML(data)}</span>`
                },
            },

            {
                data: 'username',
                title: 'Username',
                defaultContent: '<small class="has-text-danger">...pending</small>',
                render(data, type, row) {
                    if (row.decliner) return '<small class="has-text-danger">N/A</small>'

                    return escapeHTML(data)
                },
            },

            {
                data: 'email',
                title: 'Email',
                orderable: false,
            },

            {
                data: 'phone',
                title: 'US Cell Phone',
                orderable: false,
                defaultContent: '<small class="has-text-danger">N/A</small>',
                render(data) {
                    return formatTel(data)
                },
            },

            {
                data: 'lastLogin',
                title: 'Last Login <small style="font-weight: normal;">(Eastern Time)</small>',
                searchable: false,
                orderable: false,
                className: 'has-text-left',
                render(data, type, row) {
                    if (!data) return ''

                    const { lastBranch } = row
                    return type == 'display'
                        ? momentUTC2ET(data, 'llll')
                            + ` <small class="has-text-grey">(${capitalizeFirst(lastBranch)})</small>`
                        : data
                },
            },

            {
                data: null,
                searchable: false,
                orderable: false,
                title: '<div class="dt-action"><a class="has-text-link-70" id="invite-user" title="Invite"><i class="fas fa-user-plus"></i></a></div>',
                render(data, type, row) {
                    const { username, _id } = row
                    let cell = '<div class="dt-action">'

                    if (['D', 'S'].includes(adminStatus) || (adminStatus == 'A' && !row.DS)) {
                        if (row.status[0] != 'D') {
                            cell += `<a class="has-text-danger delete-user" data-id="${row._id}" title="Delete"><i class="fas fa-user-minus"></i></a>`
                            cell += `<a class="has-text-info-55 reset-user-security" data-id="${row._id}" title="Reset Security"><i class="fas fa-user-shield"></i></a>`
                            if (!row.decliner)
                                cell += `<a class="has-text-primary-35 modify-user" title="Modify" href="/online/user/${username || _id}"><i class="fas fa-user-gear"></i></a>`
                        }
                        if (row.status[0] != 'D' || adminStatus == 'D')
                            if (!row.decliner)
                                cell += `<a class="has-text-success-45 edit-user" data-id="${row._id}" title="Edit"><i class="fas fa-user-pen"></i></a>`
                    }

                    cell += '</div>'

                    return cell
                },
            },

        ],

        createdRow(tr, data) {
            const [ condition ] = data.condition

            if (condition != 'A') $(tr).addClass('is-warning')
        },

        lengthMenu,

        order: [ [ 3, 'asc' ] ],

    })

    setInterval(() => {
        dtFnFilterData(table)
        refreshed = true
    }, interval)

    onDraw(table, () => {
        if (!refreshed) {
            const closeModals = () => {
                $('.modal').removeClass('is-active')

                $title.all.html(null)
                message.removeInvite()
                $(`input:not(${genderClass}):not(${conditionClass}):not([type=search]), select:not('.dt-input')`).val(null)
                $status.prop('disabled', false).val(null)
                $status.find('[value=S]').prop('disabled', false)
                $gender.prop('checked', false)
                $condition.prop('checked', false)
                $lockedCondition.prop('disabled', true)
                $confirmation.deleteUser.prop('checked', false)
                $submit.user.text(null).removeClass('is-link is-success')
                $submit.deleteUser.prop('disabled', true)
                $trigger.userLog.hide()
                $field.status.show()
                $location.prop('disabled', false).val(adminLocation != 'US' ? adminLocation : null)
                $location.find('option').prop('disabled', false)
                $phone.prop('readonly', false)
                for (const key in $help)
                    $help[key].hide().removeClass('is-danger is-success').html(null)

                $('#user-update-log-modal-list').html(null)
                $('#user-security-modal-body').html(null)
            }

            $('.modal-cancel, .modal-close, .delete:not(.close-role-section)').click(closeModals)

            $('#invite-user').click(() => {
                $title.user.html('<small>New User</small>')
                $submit.user.addClass('is-link').text('Invite')
                message.buildInvite()

                $('#user-modal').addClass('is-active')
            })

            $confirmation.deleteUser.click(function() {
                const checked = $(this).is(':checked')
                let disabled = true

                if (checked) disabled = false

                $submit.deleteUser.prop('disabled', disabled)
            })

            if (adminStatus != 'A')
                $trigger.userLog.click(function() {
                    const _id = $id.val()
                    closeModals()

                    $.ajax(`/api/log/user/${_id}`, {
                        method: 'POST',
                        success(data) {
                            const { user, labels, log } = data
                            const { name } = user
                            const { createdBy, createdAt, deletedBy, deletedAt, updateLog } = log
                            const portals = { admin: 'Admin Portal', user: 'User Profile/Account' }
                            const formatTimeStamp = stamp => {
                                const date = momentUTC2ET(stamp, 'ddd, MMM D, YYYY')
                                const time = momentUTC2ET(stamp, 'h:mm:ss A')

                                return `on ${date} at ${time}`
                            }

                            let pre = '<pre class="has-text-grey" style="background: inherit;">'
                            if (deletedBy) {
                                pre += `Deleted by <span class="has-text-primary">${deletedBy}</span><br/>`
                                pre += `${formatTimeStamp(deletedAt)} Eastern Time`
                            }

                            if (updateLog)
                                updateLog.forEach(log => {
                                    const { data, oldData, modifiedBy, modifiedIn, modifiedAt } = log
                                    const updates = []

                                    for (const key in data) {
                                        let value = data[key]
                                        let oldValue = oldData[key]

                                        if (key == 'phone') {
                                            if (value) value = formatTel(value)
                                            if (oldValue) oldValue = formatTel(oldValue)
                                        }

                                        if (typeof value == 'string') value = `"${value}"`
                                        if (typeof oldValue == 'string') oldValue = `"${oldValue}"`

                                        let update = `<span class="has-text-info">${labels[key]}:</span> `
                                        update += `<span class="has-text-danger">${oldValue}</span>`
                                        update += ` &#8594; <span class="has-text-success">${value}</span>`

                                        updates.push(update)
                                    }

                                    pre += `Updated by <span class="has-text-primary">${modifiedBy}</span> in ${portals[modifiedIn.branch]}<br/>`
                                    pre += `${formatTimeStamp(modifiedAt)} Eastern Time<br/>`
                                    pre += `${updates.join('<br/>')}<br/><br/>`
                                })

                            pre += `Created by <span class="has-text-primary">${createdBy}</span><br/>`
                            pre += `${formatTimeStamp(createdAt)} Eastern Time</pre>`

                            $('#user-update-log-modal-subtitle').text(name)
                            $('#user-update-log-modal-list').html(pre)
                            $('#user-update-log-modal').addClass('is-active')
                        },
                    })
                })
        }

        $('.modify-user-condition').click(function() {
            const _id = $(this).data('id')

            $.ajax(`/api/user/${_id}`, {
                method: 'POST',
                success(data) {
                    const { _id, name, condition } = data

                    $id.val(_id)
                    if (condition[0] == 'L') $lockedCondition.prop('disabled', false)
                    $condition.filter(function() {
                        return $(this).val() == condition[0]
                    }).prop('checked', true)

                    $title.userCondition.html(`<small class="has-text-grey is-size-6">Edit User</small> <strong>${escapeHTML(name)}</strong>`)
                    $('#user-condition-modal').addClass('is-active')
                },
            })
        })

        $('.reset-user-security').click(function() {
            const _id = $(this).data('id')

            $.ajax(`/api/user/${_id}`, {
                method: 'POST',
                success(data) {
                    const { name, email } = data

                    $id.val(_id)
                    $('#user-security-modal-body').html(`
                        This action will send a password reset link to
                        <b>${name}</b> at <i>${email}</i><br/><br/>
                        <span class="has-text-danger-65">
                            <i class="fas fa-triangle-exclamation"></i>
                            The current password will no longer be valid!
                        </span>
                    `)
                    $('#user-security-modal').addClass('is-active')
                },
            })
        })

        $('.edit-user, .delete-user').click(function() {
            const src = $(this).hasClass('edit-user') ? 'edit' : 'delete'
            const _id = $(this).data('id')

            $.ajax(`/api/user/${_id}?count=roles&countFilter=location`, {
                method: 'POST',
                success(data) {
                    const { _id, name } = data
                    $id.val(_id)

                    if (src === 'delete') {
                        $title.deleteUser.html(`<small class="has-text-danger is-size-6">Delete User</small> <strong>${escapeHTML(name)}</strong>`)

                        return $('#user-delete-modal').addClass('is-active')
                    }

                    const { username, email, phone, firstName, lastName, alias, sex, count } = data

                    let { status, location } = data
                    status = status[0]
                    location = location[0]

                    const $sex = [
                        $(selector.id.radio.gender.female),
                        $(selector.id.radio.gender.male),
                    ]
                    let disabled = false

                    $title.user.html(`<small class="has-text-grey is-size-6">Edit User</small> <strong>${escapeHTML(name)}</strong>`)
                    $hiddenUsername.val(username)
                    // $emailHidden.val(email)
                    if (status === 'D') {
                        disabled = true
                        $status.prop('disabled', disabled)
                        $field.status.hide()
                    } else {
                        $status.val(status)
                        if (count.roles) disabled = true
                        if (status === 'S')
                            $location.find('option:not([value=US])').prop('disabled', true)
                    }
                    $location.val(location).prop('disabled', disabled)
                    $email.val(email)
                    $phone.val(formatTel(phone))
                    $firstName.val(firstName)
                    $lastName.val(lastName)
                    $alias.val(alias)
                    if (sex !== null) $sex[sex].prop('checked', true)
                    $submit.user.addClass('is-success').text('Update')
                    $trigger.userLog.show()

                    if (location !== 'US') {
                        $status.find('[value=S]').prop('disabled', true)
                        $phone.prop('readonly', true)
                    }

                    $('#user-modal').addClass('is-active')
                },
            })
        })
    })
})