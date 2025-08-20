let cropper
const id = $('#company-logo-id').val()
const $modal = $('#company-logo-modal')
const $area = $('#company-log-droparea')
const $container = $('#company-logo-cropper')
const $logo = $('#company-logo')
const $input = $('#company-logo-file-input')
const $form = $('#company-logo-form')

$('#add-company-logo').on('click', () => $modal.addClass('is-active'))

$('#close-company-logo-modal').on('click', () => {
    $modal.removeClass('is-active')
    if (cropper) cropper.destroy()
    $logo.attr('src', '')
    $container.hide()
    $area.show()
})

$area
    .on('click', function() { $input[0].click() })
    .on('dragover', function(evt) {
        evt.preventDefault()
        $(this).css('border-color', '#3273dc')
    })
    .on('dragleave', function(evt) {
        evt.preventDefault()
        $(this).css('border-color', '#ccc')
    })
    .on('drop', function(evt) {
        evt.preventDefault()
        $(this).css('border-color', '#ccc')
        handleFile(evt.originalEvent.dataTransfer.files[0])
    })

$input.on('change', function(evt) {
    handleFile(evt.target.files[0])
})


$form.on('submit', function(evt) {
    evt.preventDefault()
    if (!cropper) return

    cropper.getCroppedCanvas().toBlob(function (blob) {
        const formData = new FormData()
        formData.append('companyLogo', blob, 'cropped-company-logo.png')
console.log(formData)
        $.ajax({
            url: `/upload/business/company/logo/${id}`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success(response) {
                console.log(response)
                $('#close-company-logo-modal').click()
            },
            error(err) {
                console.error(err)
            },
        }, 'image/png')
    })
})


function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()

    reader.onload = function (evt) {
        $logo.attr('src', evt.target.result)
        $container.show()

        if (cropper) cropper.destroy()
        cropper = new Cropper($logo[0], {
            viewMode: 1,
        })
    }

    reader.readAsDataURL(file)
    $area.hide()
}