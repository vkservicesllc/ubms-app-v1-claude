const sendError = require('../../../tools/utils/error');

/* Import: Tools */
import Driver, { Application, Employment } from '../../../tools/core/driver.mjs';

/* Import: Validators */
import validationCheck from '../../../tools/form/validator.mjs';
import { ApplicationForm, EmploymentForm } from '../../../tools/form/driver.mjs';

const dynamicValidator = {
  applications: (req, res, next) => {
    const { step } = req.params;
    let validators = [];

    switch (step) {
      case 'workflow':
        validators = ApplicationForm.validate('workflow');
        break;
      case 'profile':
        validators = ApplicationForm.validate('profile');
        break;
      case 'legal-status':
        validators = ApplicationForm.validate('legal');
        break;
      case 'position':
        validators = ApplicationForm.validate('position/vehicle');
        break;
      case 'residence':
        validators = ApplicationForm.validate('residence');
        break;
      case 'driver-license':
        validators = ApplicationForm.validate('license');
        break;
      case 'medical-card':
        validators = ApplicationForm.validate('medical');
        break;
      case 'legal-compliance':
        validators = ApplicationForm.validate('compliance');
        break;
      case 'safety':
        validators = ApplicationForm.validate('safety');
        break;
      case 'experience':
        validators = ApplicationForm.validate('experience');
        break;
      case 'prev-employment':
        validators = ApplicationForm.validate('employment');
        break;
        // case 'prev-employer':
        //     validators = EmploymentForm.validate()
        break;
      case 'preference':
        validators = ApplicationForm.validate('preference');
        break;
      case 'business':
        validators = ApplicationForm.validate('business/vehicle');
        break;
      case 'beneficiary':
        validators = ApplicationForm.validate('beneficiary');
        break;
      case 'misc':
        validators = ApplicationForm.validate('emergency');
        break;
    }

    Promise.all(validators.map((validator) => validator.run(req)))
      .then(() => next())
      .catch(next);
  },

  employments: (req, res, next) => {
    Promise.all(EmploymentForm.validate().map((validator) => validator.run(req)))
      .then(() => next())
      .catch(next);
  },

  relationships: (req, res, next) => {
    const { target } = req.params;
    let validators = [];

    switch (target) {
      case 'citations':
        validators = [];
        break;
      case 'accidents':
        validate = [];
        break;
    }

    Promise.all(validators.map((validator) => validator.run(req)))
      .then(() => next())
      .catch(next);
  },
};
