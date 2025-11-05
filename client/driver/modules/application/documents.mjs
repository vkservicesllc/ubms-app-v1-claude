const $card = $('#apl-card')

const duration = 750
$card.fadeIn(duration)

$('a').click(function(evt) {
    evt.preventDefault()

    const href = $(this).attr('href')
    $card.fadeOut(duration)
    setTimeout(() => {
        location.href = href
    }, duration)
})

$('#certify-form').submit(function(evt) {
    evt.preventDefault()

    $card.fadeOut(duration)
    setTimeout(() => {
        this.submit()
    }, duration)
})

function previewImage(input, previewId) {
    const file = input.files[0]
    const preview = document.getElementById(previewId)

    if (file) {
        preview.src = URL.createObjectURL(file)
        preview.classList.remove('d-none')
    } else {
        preview.classList.add('d-none')
        preview.src = ''
    }
}

document.getElementById('dl-front').addEventListener('change', e => {
    previewImage(e.target, 'dl-front-preview')
})

document.getElementById('dl-back').addEventListener('change', e => {
    previewImage(e.target, 'dl-back-preview')
})