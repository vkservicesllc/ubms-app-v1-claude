export default () => {
    $('.dt-search').find('label').remove();

    const $search = $('.dt-search input[type="search"]');
    const $preserved = $search.detach();
    const $structure = $(
        '<div class="ui labeled input"><div class="ui label"><i class="search icon"></i></div></div>',
    );

    $preserved.addClass('ui input').removeClass('dt-search').appendTo($structure);

    $('.dt-search').replaceWith($structure);
};

export const tag = '<sup><i class="small grey text search icon"></i></sup>';
