import initialize from './support.mjs';

const prefix = 'driver';

const selector = {
    class: {},
    id: {
        hidden: {
            id: 'id',
        },
        text: {
            vin: 'vin',
            make: 'make',
            model: 'model',
            year: 'year',
        },
        select: {
            category: 'category',
        },
    },
};

initialize(prefix, selector);

export default selector;
