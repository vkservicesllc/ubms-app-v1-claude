import table from './applications.mjs'

const $loader = $('#img-loader')
const $modal = $('#apl-upl-card-modal')
const $fullName = $('#apl-upl-card-fullname')
const $content = $('#apl-upl-content')

const filenames = [
    [ 'DriversLicense_front', "Driver's License <small>(Front)</small>" ],
    [ 'DriversLicense_back', "Driver's License <small>(Back)</small>" ],
    [ 'MedicalCard', 'Medical Card' ],
    [ 'SSCard', 'SSN Card' ],
    [ 'LegalDocument', 'Legal Document' ],
    [ 'Registration', 'Registration' ],
]

$modal.modal({
    onHidden() {
        $fullName.html(null)
        $content.html(null)
        $('.special.cards .image').dimmer('destroy')
    },
})

table.on('draw', function() {
    $('.apl-uploads').off('click')

    $('.apl-uploads').on('click', function(evt) {
        evt.preventDefault()
        $loader.addClass('active')

        const _id = $(this).data('id')

        $.ajax(`/api/resource/drivers/applications/${_id}`, {
            success(response) {
                const { fullName } = response.data.application

                $fullName.html(fullName)

                let html = '<div class="ui special cards">'
                filenames.forEach(([ filename, name ]) => {
                    const path = `/image/driver/application/${_id}/uploads/${filename}`
                    html += `
                        <div class="card">
                            <div class="blurring dimmable image">
                                <div class="ui dimmer">
                                <div class="content">
                                    <div class="center">
                                    <button class="ui inverted button">Download</button>
                                    </div>
                                </div>
                                </div>
                                <img src="${path}" onerror="this.closest('.card').remove()" />
                            </div>
                            <div class="content">
                                <span class="header">${name}</span>
                            </div>
                        </div>
                    `
                })
                html += '</div>'
                $content.html(html)

                setTimeout(() => {
                    $modal.modal('show')
                    $('.special.cards .image').dimmer({ on: 'ontouchstart' in document.documentElement ? 'click' : 'hover' })
                    $loader.removeClass('active')
                }, 1000)
            },
        })
    })
})