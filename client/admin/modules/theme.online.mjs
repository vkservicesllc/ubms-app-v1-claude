import applyTheme, { createThemeSelectEvent } from './theme.mjs';

$(document).ready(function () {
  const $title = $('.title');
  const $selectedNavItem = $('.menu .is-active');
  const $navigation = $('.navbar, .page .menu');

  const onLight = () => {
    $title.addClass('has-text-primary-20').removeClass('has-text-info');
    $selectedNavItem.removeClass('has-background-primary-10').addClass('has-background-primary-20');
    $navigation.css('border-color', '#F0F0F0');
  };

  const onDark = () => {
    $title.addClass('has-text-info').removeClass('has-text-primary-20');
    $selectedNavItem.removeClass('has-background-primary-20').addClass('has-background-primary-10');
    $navigation.css('border-color', '#303030');
  };

  applyTheme(onLight, onDark);
  createThemeSelectEvent(onLight, onDark);
  $('.navbar, .page').show();
});
