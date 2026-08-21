import createForm, { constructForm } from './builder.mjs';
import { createIdForm, createUsStateForm } from './reusable.mjs';

import selector from '../../../client/global/modules/registry/selectors/carrier.mjs';
import length from '../../../client/global/modules/registry/length.mjs';
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs';
import { validate } from './validator.mjs';

import Carrier from '../core/carrier.mjs';

const permits = Carrier.list.permit;
const required = true;

const createNumberForm = (target, props = {}, rule = 'numeric') =>
  createForm({
    selector,
    target,
    group: { numeric: 'number', alpha: 'alpha', alphanumeric: 'alphaNumber' }[rule],
    name: target,
    maxLength: length.carrier[target].max,
    ...props,
    validator: { rule },
  });

class CarrierForm {
  constructor(options = {}) {
    getStaticProps(CarrierForm).forEach(
      (target) => (this[target] = constructForm(CarrierForm, target, options)),
    );
  }

  static id = createIdForm({ selector });

  static mc = createNumberForm('mc', {
    required,
    label: {
      content: 'MC',
      title: 'Motor Carrier ID',
    },
  });

  static usdot = createNumberForm('usdot', {
    required,
    label: {
      content: 'US-DOT',
      title: 'US Department of Transportation Number',
    },
  });

  static scac = createNumberForm(
    'scac',
    {
      label: {
        content: 'SCAC',
        title: 'Standard Carrier Alpha Code',
      },
    },
    'alpha',
  );

  static irp = createNumberForm('irp', {
    label: {
      content: 'IRP',
      title: 'International Registration Plan ID',
    },
  });

  static ifta = createNumberForm('ifta', {
    name: 'ifta[number]',
    label: {
      content: 'IFTA',
      title: 'International Fuel Tax Agreement ID',
    },
  });

  static iftaJur = createUsStateForm({
    selector,
    target: 'iftaJur',
    name: 'ifta[jurisdiction]',
    emptyOpt: null,
    label: 'IFTA Jurisdiction',
  });

  static efs = createNumberForm('efs', { label: 'EFS Carrier ID' });

  static fleetOne = createNumberForm('fleetOne', { label: 'FleetOne Carrier ID' });

  static transflo = createNumberForm('transflo', { label: 'Transflo ID' }, 'alphanumeric');
}

for (const key in permits) {
  const { content, title } = permits[key];
  const target = `${key}Permit`;

  CarrierForm[target] = createForm({
    selector,
    target,
    group: 'permit',
    name: `stateTax[${key}]`,
    maxLength: length.carrier.permit.max[key],
    label: { content, title },
    validator: {
      rule: 'numeric',
    },
  });
}

CarrierForm.validate = () =>
  validate(CarrierForm, () => {
    const fields = ['mc', 'usdot', 'ifta', 'scac', 'irp', 'efs', 'fleetOne', 'transflo'];
    Object.keys(Carrier.list.permit).forEach((prop) => fields.push(`${prop}Permit`));

    return fields;
  });

export default CarrierForm;
export { createNumberForm };
