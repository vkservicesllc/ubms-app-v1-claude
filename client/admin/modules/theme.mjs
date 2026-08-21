const applyTheme = (onLight, onDark) => {
  let theme = $.cookie('document.theme');

  $('#theme-icon').html(
    `<i class="fa fa-${{ light: 'sun', dark: 'moon' }[theme] || 'circle-half-stroke'}"></i>`,
  );

  if (!theme) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      theme = 'dark';
    else theme = 'light';
  }

  if (theme == 'light') onLight();
  if (theme == 'dark') onDark();
};

const createThemeSelectEvent = (onLight, onDark) => {
  $('.theme-selector').click(function () {
    const $html = $('html');
    let theme = $(this).data('theme-selector');
    if (theme == 'auto') theme = '';

    $html.removeAttr('data-theme');
    if (theme) $html.attr('data-theme', theme);
    $.cookie('document.theme', theme, { expires: 365, path: '/' });
    applyTheme(onLight, onDark);
  });
};

export default applyTheme;
export { createThemeSelectEvent };
