let cropper
const $modal = $('#company-logo-modal')
const $area = $('#company-log-droparea')
const $container = $('#company-logo-cropper')
const $logo = $('#company-logo')
const $input = $('#company-logo-input')

$('#add-company-logo').on('click', () => $modal.addClass('is-active'))

$('#close-company-logo-modal').on('click', () => {
    $modal.removeClass('is-active')
    if (cropper) cropper.destroy()
    $logo.attr('src', '')
    $container.hide()
})

$area
    .on('click', $input.click())
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


function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()

    reader.onload = function (evt) {
        $image.attr('src', evt.target.result)
        $container.show()

        if (cropper) cropper.destroy()
        cropper = new Cropper($logo[0], {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1
        })
    }

    reader.readAsDataURL(file)
}