import Person from '../assets/person.mjs'
import { nameEvent, ssnEvent } from '../events/person.mjs'
import { inputEvent, selectEvent } from '../events/form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import { reformatDateString } from '../tools/date.mjs'


const { id, deleteOwnerId, ownerPhoneId, class: ownerClass, updateSinceId, firstNameId, middleNameId, lastNameId, suffixId, genderId, dobId, ssnId } = formSelectors.owner
const $modal = {
    all: $('.owner-modal'),
    form: $('#owner-modal'),
    phone: $('#owner-phone-modal'),
    delete: $('#owner-delete-modal'),
}
const $card = {
    all: $('.owner-modal-card, .owner-options-modal-card'),
    form: $('.owner-modal-card'),
    options: $('.owner-options-modal-card'),
}
const $title = {
    all: $('.owner-title'),
    form: $('#owner-title'),
    phone: $('#owner-phone-title'),
    delete: $('#owner-delete-title'),
}
const $trigger = {
    option: $('#owner-update-proceed'),
}
const $option = {
    label: $('.owner-update-option-label'),
    all: $('[name=owner-update-option]'),
    edit: $('#owner-update-option-edit'),
    update: $('#owner-update-option-update'),
}
const $form = {
    owner: $('#company-owner-form'),
    phone: $('#company-owner-phone-form'),
}
const action = {
    default: $form.owner.attr('action'),
}
action.update = action.default.replace('/company-owner', '/company-owner/update')
const $field = {
    update: $('.owner-update-field'),
    upsert: $('.owner-upsert-field'),
}
const $updateSince =  $(`#${updateSinceId}`)
const $submit = $('#owner-submit')


nameEvent(firstNameId)
nameEvent(middleNameId)
nameEvent(lastNameId, { sfxId: suffixId })
selectEvent(genderId, { fill: true })
ssnEvent(ssnId)

inputEvent(dobId, {
    datepicker: { maxDate: '-21y' },
})

$option.all.on('change', function() {
    const border = '1px solid gray'

    $option.label.css('border', 'none')
    if ($(this).is(':checked')) $trigger.option.prop('disabled', false)
    $(this).next().css({ borderBottom: border, borderTop: border })
})

$trigger.option.click(() => {
    const _id = $(`#${id}`).val()

    if (_id)
        $.ajax(`/api/company-owner/${_id}`, {
            method: 'POST',
            success(data) {
                const { dob } = data

                if ($option.edit.is(':checked')) {
                    const { firstName, middleName, lastName, suffix, ssn } = data
                    let { gender } = data
                    if (gender) [ gender ] = gender

                    $(`#${firstNameId}`).val(firstName)
                    $(`#${middleNameId}`).val(middleName)
                    $(`#${lastNameId}`).val(lastName)
                    $(`#${suffixId}`).val(suffix)
                    $(`#${genderId}`).val(gender)
                    $(`#${dobId}`).val(reformatDateString(dob, 'us'))
                    if (ssn) {
                        $(`#current-${ssnId}`).val(ssn[0])
                        $(`#${ssnId}`).val(ssn[1])
                    }

                    $submit.addClass('is-success').html('Correct')
                    $card.options.hide()
                    $card.form.show()
                }

                if ($option.update.is(':checked')) {
                    const minDate = moment(dob, 'YYYY-MM-DD').add(1, 'days').toDate()
                    inputEvent(updateSinceId, {
                        datepicker: { minDate, maxDate: 0 },
                    })
                    $updateSince.prop('disabled', false)
                    $field.update.show()
                    $field.upsert.hide().find('input, select').prop('disabled', true)
                    $submit.addClass('is-link').html('Update')
                    $form.owner.attr('action', action.update)
                    $card.options.hide()
                    $card.form.show()
                }   
            },
        })
})


export const closeModals = () => {
    $modal.all.removeClass('is-active')

    const $gender = $(`#${genderId}`)

    $(`.${ownerClass}`).val(null)
    $updateSince.removeAttr('min').prop('disabled', true).datepicker('destroy')
    $option.label.css('border', 'none')
    $option.all.prop('checked', false)
    $title.all.html(null)
    $card.all.hide()
    $field.update.hide()
    $field.upsert.show().find('input, select').prop('disabled', false)
    $trigger.option.prop('disabled', true).removeClass('is-link is-danger')
    $submit.removeClass('is-success is-link').html(null)
    $form.owner.attr('action', action.default)
    if (!$gender.find('option[value=""]').length)
        $gender.prepend('<option value="">--</option>')
}


export const openAddModal = () => {
    $title.form.html('New Company Owner')
    $card.form.show()
    $submit.addClass('is-link').html('Register')
    $modal.form.addClass('is-active')
}


export const openModifyModal = _id => {
    if (!_id) return

    $.ajax(`/api/company-owner/${_id}`, {
        method: 'POST',
        success(data) {
            $title.form
                .html(`<small class="has-text-grey is-size-6">Modify Owner</small> <strong>${new Person(data).fullName()}</strong>`)
            $(`#${id}`).val(_id)
            $updateSince.attr('min', data.dob)

            $card.options.show()
            $modal.form.addClass('is-active')
        },
    })
}


export const openModifyPhoneModal = _id => {
    if (!_id) return

    $.ajax(`/api/company-owner/${_id}`, {
        method: 'POST',
        success(data) {
            $title.phone
                .html(`<small class="has-text-grey is-size-6">Modify Phone for Owner</small> <strong>${new Person(data).fullName()}</strong>`)
            $(`#${ownerPhoneId}`).val(_id)
            $modal.phone.addClass('is-active')
        },
    })
}


export const openDeleteModal = _id => {
    if (!_id) return

    $.ajax(`/api/company-owner/${_id}`, {
        method: 'POST',
        success(data) {
            $title.delete
                .html(`<small class="has-text-danger is-size-6">Delete Owner</small> <strong>${new Person(data).fullName()}</strong>`)
            $(`#${deleteOwnerId}`).val(_id)
            $modal.delete.addClass('is-active')
        },
    })
}