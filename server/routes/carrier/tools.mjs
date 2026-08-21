export const navBuilder = {
  simple: (items) => {
    let html = '';
    items.forEach(
      (item) =>
        (html += `\n\t\t<a class="${item[2] ? 'active ' : ''}item" href="${item[0]}">${item[1]}</a>`),
    );
    return html;
  },
};
