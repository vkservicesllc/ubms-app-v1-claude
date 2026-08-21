import initialize from './support.mjs';
import length from '../length.mjs';

const prefix = 'carrier';

const selector = {
  class: {
    text: {
      alpha: 'alpha',
      alphaNumber: 'alphanumeric',
      number: 'number',
      permit: 'permit',
    },
  },
  id: {
    hidden: {
      id: 'id',
    },
    text: {
      mc: 'mc',
      usdot: 'usdot',
      scac: 'scac',
      ifta: 'ifta',

      irp: 'irp',
      efs: 'efs',
      fleetOne: 'fleet-one',
      transflo: 'transflo',
    },
    select: {
      iftaJur: 'ifta-jurisdiction',
    },
  },
};

initialize(prefix, selector);

for (const key in length.carrier.permit.max)
  selector.id.text[`${key}Permit`] = `#${prefix}-${key}-permit-text-input`;

export default selector;
