const $card = $('#apl-card');

const duration = 750;
$card.fadeIn(duration);

$('a').click(function (evt) {
    evt.preventDefault();

    const href = $(this).attr('href');
    $card.fadeOut(duration);
    setTimeout(() => {
        location.href = href;
    }, duration);
});

$('#certify-form').submit(function (evt) {
    evt.preventDefault();

    $card.fadeOut(duration);
    setTimeout(() => {
        this.submit();
    }, duration);
});

$('.browse').on('click', function () {
    $(this).next().click();
});

$('[type="file"]').on('change', function () {
    const file = this.files[0];
    $(this).prev('.input-group').find('input[type="text"]').val(file.name);
    $(this).next().find('img').removeClass('d-none').attr('src', URL.createObjectURL(file));
});
