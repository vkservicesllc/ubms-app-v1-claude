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