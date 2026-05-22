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

                application.dob = moment(dob).format('MM/DD/YYYY')
                application.ssn = formatSsn(ssn)
                application.phone = formatTel(phone)
                application.address = new Address(address).html({ inline: false })
                application.dlNum = dl.number
                application.dlState = `${application.expansion.dlState} (${dl.state})`

                const cp = ' <sup><a href="" class="copy-apl-info-cred"><i class="dark green copy outline icon"></i></a></sup>'
                const na = '<span class="ui red text"><small><i>N/A</i></small></span>'

                const items = [
                    'firstName', '^middleName', 'lastName', '^suffix', 'dob', 'ssn',
                    'phone', 'email', '!address', 'dlNum', '!dlState',
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

                $fullName.html(`${fullName} &nbsp;<small style="font-weight: normal;">(${formId}) / ${application.expansion.addrState}</small>`)

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