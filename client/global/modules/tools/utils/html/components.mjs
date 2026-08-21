import initializeAttr, { initializeClass } from './support.mjs';

export const button = (props = {}) => {
    const { id, type, disabled, content } = props;
    const classes = initializeClass(props);

    const typeAttr = initializeAttr('type', type) || ' type="button"';
    const classAttr = initializeAttr('class', classes);
    const idAttr = initializeAttr('id', id);
    const disabledAttr = initializeAttr('disabled', disabled);

    return `<button${typeAttr + classAttr + idAttr + disabledAttr}>${content}</button>`;
};
