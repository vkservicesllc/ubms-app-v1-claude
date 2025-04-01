const $card = $('#apl-card')

const duration = 750
$card.fadeIn(duration)

$('.accordion-button').click(function() { $(this).blur() })
$('.form-control[required], .form-select[required]').filter(function () {
    return $(this).val().trim() !== ''
}).addClass('is-valid')