import table from './prev-employers.mjs'
import Person from '/modules/tools/core/person.mjs'
import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import patterns from '/modules/registry/patterns.mjs'


const $modal = {
    manage: $('#empl-manage-card-modal'),
}


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.manage-empl').off('click')

    if (actions.data.modify === true || actions.data.update === true) {
        $('.manage-empl').on('click', function(evt) {
            evt.preventDefault()
            const _id = $(this).data('id')

            $modal.manage.modal({
                autofocus: false,
                closable: false,
            }).modal('show')
        })
    }
})