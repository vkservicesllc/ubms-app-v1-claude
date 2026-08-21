import createForm, { constructForm } from './builder.mjs';
import {
    emptyOpt,
    createIdForm,
    createDateForm,
    createUsStateForm,
    createYesNoForm,
    createCheckForm,
} from './reusable.mjs';

import selector from '../../../client/global/modules/registry/selectors/vehicle.mjs';
import Vehicle, { Truck, Trailer, Van } from '../core/vehicle.mjs';
import length from '../../../client/global/modules/registry/length.mjs';
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs';
import { validate } from './validator.mjs';

const required = true,
    disabled = true;

const categoryData = {};
for (const key in Vehicle.list.category) categoryData[key] = Vehicle.list.category[key][0];

class VehicleForm {
    constructor(options = {}) {
        getStaticProps(DriverForm).forEach(
            (target) => (this[target] = constructForm(VehicleForm, target, options)),
        );
    }

    static id = createIdForm({ selector });

    static vin = createForm({
        selector,
        target: 'vin',
        name: 'vin',
        maxLength: length.vehicle.vin.max,
        required,
        label: 'VIN',
    });

    static category = createForm({
        selector,
        target: 'category',
        type: 'select',
        name: 'category',
        data: categoryData,
        required,
        label: 'Category',
    });

    // static make = createForm({
    //     selector,
    //     target: 'make',
    //     name: 'make',
    //     maxLength: length.vehicle.make.max,
    //     required,
    //     label: 'Make',
    // });

    // static model = createForm({
    //     selector,
    //     target: 'model',
    //     name: 'model',
    //     maxLength: length.vehicle.model.max,
    //     required,
    //     label: 'Model',
    // });

    // static year = createForm({
    //     selector,
    //     target: 'year',
    //     name: 'year',
    //     maxLength: 4,
    //     required,
    //     label: 'Year',
    // });
}

export default VehicleForm;
