const $tabLink = $('.tab-link')

$tabLink.click(function() {
    if ($(this).hasClass('is-active')) return

    const target = $(this).data('section')
    const timeout = 350

    $tabLink.removeClass('is-active')
    $(this).addClass('is-active')

    $('.tab-section').fadeOut(timeout)
    setTimeout(() => {
        $(`#${target}-section`).fadeIn(timeout)
    }, timeout + 50)
})