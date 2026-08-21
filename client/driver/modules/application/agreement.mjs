const $card = $('#apl-card');

const duration = 750;
$card.fadeIn(duration);

$('#agreement').on('scroll', function () {
  const $el = $(this);
  const scrollTop = $el.scrollTop();
  const scrollHeight = $el.prop('scrollHeight');
  const clientHeight = $el.innerHeight();
  const distance = scrollHeight - scrollTop - clientHeight;

  if (Math.abs(distance) < 1) {
    $('#agree').prop('disabled', false);
  }
});

$('#agree').click(function () {
  const checked = $(this).prop('checked');

  $('#apl-submit').prop('disabled', !checked);
});

$('#apl-submit-form').submit(function (evt) {
  evt.preventDefault();

  $card.fadeOut(duration);
  setTimeout(() => {
    this.submit();
  }, duration);
});
