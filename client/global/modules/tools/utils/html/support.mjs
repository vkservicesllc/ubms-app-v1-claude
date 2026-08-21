const combineClass = (classEnt) => {
    if (!classEnt) classEnt = '';
    else if (Array.isArray(classEnt)) classEnt = classEnt.join(' ');

    return classEnt.replace(/\s+/g, ' ');
};

export const initializeClass = (props) => {
    let { class: addedClass, defaultClass } = props;

    addedClass = combineClass(addedClass);
    defaultClass = combineClass(defaultClass);

    return `${addedClass} ${defaultClass}`.trim();
};

export default (attr, value) => {
    if (!attr) return '';

    if (attr === 'id' && typeof value === 'string') value = value.replace(/#/g, '');
    if (attr === 'class' && typeof value === 'string') value = value.replace(/\./g, '');
    if (attr === 'hidden') return value === true ? ' style="display: block;"' : '';
    if (attr === 'contextmenu') return value === true ? ' oncontextmenu="return true;"' : '';
    if (
        attr === 'required' ||
        attr === 'checked' ||
        attr === 'selected' ||
        attr === 'disabled' ||
        attr === 'readonly' ||
        attr === 'multiple'
    )
        return value === true ? ` ${attr}` : '';
    return value ? ` ${attr}="${value}"` : '';
};
