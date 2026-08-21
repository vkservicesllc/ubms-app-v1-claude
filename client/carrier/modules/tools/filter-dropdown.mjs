const filterDropdown = (id, placeholder, props = {}) => {
  let { fluid, multiple, clearable, element, short } = props;
  if (typeof fluid !== 'boolean') fluid = true;
  if (typeof multiple !== 'boolean') multiple = false;
  if (typeof clearable !== 'boolean') clearable = false;
  if (!['select', 'div'].includes(element)) element = 'select';

  const length = short === true ? 'short' : 'long';
  let attr = '',
    classes = '';

  if (fluid) classes += ' fluid';
  if (multiple)
    if (element === 'select') attr = ' multiple';
    else classes += ' multiple';
  if (clearable) classes += ' clearable';
  if (element === 'select') classes += ' labeled icon';
  else classes += ' selection';

  if (classes) classes += ' ';

  let dropdown = `<div class="ui labeled ${length} input"><div class="ui label"><i class="filter icon"></i></div>`;
  dropdown += `<${element} class="ui${classes}dropdown custom-dt-dropdown"`;

  if (element === 'select')
    dropdown += ` id="${id}"${attr}><option value="">${placeholder}</option>`;
  else {
    dropdown += `><input type="hidden" id="${id}" /><i class="dropdown icon"></i>`;
    dropdown += `<div class="default text">${placeholder}</div><div class="menu"></div>`;
  }

  dropdown += `</${element}></div>`;

  return $(dropdown);
};

export default filterDropdown;
