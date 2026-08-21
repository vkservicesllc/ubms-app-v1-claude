export default (prefix, selector) => {
    for (const i in selector.class) {
        const item = selector.class[i];

        for (const j in item)
            item[j] = `.${prefix}-${item[j] + (i !== 'combo' ? `-${i}` : '')}-input`;
    }
    selector.class.global = `.${prefix}-input`;
    selector.class.hidden = `.${prefix}-hidden-input`;

    for (const i in selector.id) {
        const item = selector.id[i];

        for (const j in item) {
            if (typeof item[j] === 'object')
                for (const k in item[j]) item[j][k] = `#${prefix}-${item[j][k]}-${i}-input`;
            else item[j] = `#${prefix}-${item[j]}-${i}-input`;
        }
    }
};
