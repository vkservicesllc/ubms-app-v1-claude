$(() => {
  $('.step-link').click(function () {
    if ($(this).hasClass('is-link-live') && !$(this).hasClass('is-link-active')) {
      const timeout = 500;

      $('.step-link')
        .removeClass('is-link-active')
        .map((i, el) => {
          if (!$(el).parent().hasClass('is-active'))
            $(el).find('.steps-marker').removeClass('is-hollow');
        });
      $(this).addClass('is-link-active').find('.steps-marker').addClass('is-hollow');
      $('.form-container, #company-card').fadeOut(timeout);

      let $section = $('#' + $(this).attr('id').replace('-step', '-form'));
      if (!$section.length) $section = $('#company-card');

      setTimeout(() => {
        $section.fadeIn(timeout);
      }, timeout + 50);
    }
  });
});
