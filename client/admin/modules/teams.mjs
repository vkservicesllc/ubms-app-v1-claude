import Tip from './tools/tip.mjs'
import { teamNameEvent, teamDescEvent } from '/modules/events/team.mjs'
import { catIdEvent, busNameEvent, coTypeEvent } from '/modules/events/company.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { urlEvent } from '/modules/events/web.mjs'
import { addr1Event, addr2Event, cityEvent, zipEvent } from '/modules/events/address.mjs'
import inputLength from '/modules/registry/length.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import { capitalizeFirst } from '/modules/tools/utils/string.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import selector from '/modules/registry/selectors/team.mjs'

const categories = $.ajax('/api/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON
const driverPositions = $.ajax('/api/source/driver?filter=positions', { async: false, method: 'POST' }).responseJSON

const interval = 30000

const ids = {
    catIdIcon: 'team-category-select-icon',
}
const defaults = {
    catIdIcon: $(`#${ids.catIdIcon}`).html(),
}
const $modal = {
    all: $('.modal'),
    upsert: $('#team-upsert-modal'),
    relationship: $('#team-relationship-modal'),
    profile: $('#team-profile-modal'),
    settings: $('#team-settings-modal'),
}
const $title = {
    upsert: $('#team-upsert-title'),
    relationship: $('#team-relationship-title'),
    profile: $('#team-profile-title'),
    settings: $('#team-settings-title'),
}
const $tip = {
    name: $('#team-name-tip'),
    email: $('#team-email-tip'),
    website: $('#team-website-tip'),
}
const tipDefs = {
    name: null,
}
const message = {
    success: {
        name: 'Name is unqiue',
    },
    failed: {
        name: 'Name is taken',
    },
}
const $button = {
    add: $('#team-add-button'),
    upsert: $('#team-upsert-button'),
    delete: $('#team-delete-button'),
    closeRel: $('#team-relationship-close-button'),
}
const $relationship = $('#team-relationship')
const $settings = $('#team-settings')

const setTip = new Tip($tip, tipDefs, message)

const countDescChars = desc => {
    const { max } = inputLength.team.desc
    let used = 0, left = max

    if (desc) {
        const { length } = desc

        used = length
        left = max - length
    }

    $('#desc-char-used').text(used)
    $('#desc-char-left').text(left)
}


teamNameEvent({
    onInput() {
        setTip.default('name')
        $button.upsert.prop('disabled', false)
    },
    onChange(name, $name) {
        const currentName = '' //! $(`#current-${nameId}`).val() -- need to change logic here
        let action = name ? 'passed' : 'default'

        if (name)
            $.ajax('/api/unique/team', {
                method: 'POST',
                data: { name },
                success(response) {
                    const { unique, error } = response
                    if (error) alert(error)

                    let disabled = false
                    if (name && (!currentName || name != currentName) && !unique) {
                        action = 'failed'
                        disabled = true
                    }

                    setTip[action]('name')
                    $button.upsert.prop('disabled', disabled)
                },
            })
    },
})