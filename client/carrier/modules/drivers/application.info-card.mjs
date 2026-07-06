import table from './applications.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs'

const $modal = $('#apl-info-card-modal')
const $fullName = $('#apl-info-card-fullname')


$modal.modal({
    onHidden() {
        $('.apl-data').html(null)
        $('.copy-apl-info-cred').off('click')
        $fullName.html(null)
    },
})

table.on('draw', function() {
    $('.apl-info-card').off('click')

    $('.apl-info-card').on('click', function(evt) {
        evt.preventDefault()

        const _id = $(this).data('id')

        $.ajax(`/api/resource/drivers/applications/${_id}?sensitive=true`, {
            success(response) {
                const { application } = response.data
                const { fullName, formId, dob, ssn, phone, address, dl } = application

                const cp = ' <sup><a href="" class="copy-apl-info-cred"><i class="dark green copy outline icon"></i></a></sup>'
                const na = '<span class="ui red text"><small><i>N/A</i></small></span>'

                application.gender = application.expansion.gender
                application.dob = moment(dob).format('MM/DD/YYYY')
                application.ssn = formatSsn(ssn)
                application.phone = formatTel(phone)
                application.address = new Address(address).html({ inline: false })
                application.dlNum = dl.number
                // application.dlClass = dl.class
                application.dlState = `${application.expansion.dlState} (${dl.state})`
                // application.dlExp = moment(dl.expiresOn).format('MM/DD/YYYY')
                application.dlDuration = `<strong style="font-size: 1.05em;">${moment(dl.issuedOn).format('MM/DD/YYYY')}</strong>${cp}`
                application.dlDuration += ` — <strong style="font-size: 1.05em;">${moment(dl.expiresOn).format('MM/DD/YYYY')}</strong>${cp}`

                const items = [
                    'firstName', '^middleName', 'lastName', '^suffix',
                    '!gender', 'dob', 'ssn',
                    'phone', 'email', '!address',
                    '!dlState', 'dlNum',
                    // '^!dlClass',
                    // 'dlExp',
                    '!dlDuration',
                    '^!dlAddress',
                ]
                items.forEach(prop => {
                    let optional = false, ncp = false
                    if (prop[0] === '^') {
                        prop = prop.replace('^', '')
                        optional = true
                    }
                    if (prop[0] === '!') {
                        prop = prop.replace('!', '')
                        ncp = true
                    }
                    let item = application[prop]
                    if (optional && !item) item = na
                    else item = `<strong style="font-size: 1.05em;">${item}</strong>${!ncp ? cp : ''}`
                    $(`#apl-info-card\\:${prop}`).html(item)
                })
                if (dl.class) $('#apl-info-card\\:dlNum').append(`&nbsp; <strong>/&nbsp; ${dl.class}</strong>`)
                if (!dl.commercial) $('#apl-info-card\\:dlNum').append('<small> &nbsp;—&nbsp; CDL</small>')
                // if (dl.commercial) $('#apl-info-card\\:dlClass').append('<small> &nbsp;—&nbsp; CDL</small>')

                $fullName.html(`${fullName} &nbsp;<small style="font-weight: normal;">(${formId}) — ${application.expansion.addrState}</small>`)

                $modal.modal('show')

                $('.copy-apl-info-cred').on('click', function(evt) {
                    evt.preventDefault()

                    const text = $(this).parent().prev().text()
                    navigator.clipboard.writeText(text)
                        .then(() => {
                            $.toast({
                                title: 'Success!',
                                message: 'Copied to clipboard',
                                class: 'success',
                            })
                        })
                })
            },
        })
    })
})