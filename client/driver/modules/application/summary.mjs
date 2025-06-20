const $card = $('#apl-card')

const duration = 750
$card.fadeIn(duration)

const relocate = href => {
    $card.fadeOut(duration)
    setTimeout(() => {
        location.href = href
    }, duration)
}

$('a.btn').click(function(evt) {
    evt.preventDefault()

    const href = $(this).attr('href')
    relocate(href)
})

$('#edit-link').click(function() {
    const href = $(this).data('href')
    relocate(href)
})

$('#no-mistakes').click(function() {
    let action = 'hide', disabled = false

    if ($(this).prop('checked')) {
        action = 'show'
        disabled = true
    }

    $('#edit-link').prop('disabled', disabled)
    $('#certified-section')[action]()
})