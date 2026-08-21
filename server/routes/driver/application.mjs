// ==== IMPORT ==== //

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import { Application } from '../../tools/core/driver.mjs';

/* Validators */
import validationCheck from '../../tools/form/validator.mjs';
import { ApplicationForm } from '../../tools/form/driver.mjs';

/* Middleware */
import {
  applicationStart,
  applicationRegistration,
  applicationLogin,
  applicationProgress,
  applicationRehireProgress,
  applicationSummary,
  applicationDocuments,
  applicationAgreement,
} from './mw/application.mjs';

const validateApplicantLogin = [];
const applicantLoginFields = ['phone', 'dob', 'pin'];
applicantLoginFields.forEach((prop) =>
  validateApplicantLogin.push(ApplicationForm[prop].validate()),
);

// ==== ROUTES ==== //

router.get(
  '/:param?',
  applicationStart,
  applicationLogin,
  applicationProgress,
  applicationRehireProgress,
);

router.get('/:formId/registration', applicationRegistration);

router.post('/auth/login/:formId', validateApplicantLogin, validationCheck, async (req, res) => {
  try {
    const { formId } = req.params;
    const application = await Application.fetch(res.session, { formId }, { hideSensitive: false });
    if (!application) throw new Error('Application not found');

    const { phone, dob, pin } = req.body;

    if (phone == application.phone && dob == application.dob && pin == application.ssn.slice(-4)) {
      const referer = req.headers.referer || req.headers.referrer;
      req.session.application = application._id;

      return res.redirect(referer);
    }

    sendError.auth(req, res, 'Auth Error: Incorrect credentials used');
  } catch (err) {
    sendError.server(req, res, err);
  }
});

router.get('/:formId/summary', applicationSummary);

router.get('/:formId/documents', applicationDocuments);

router.get('/:formId/agreement', applicationAgreement);

// ==== EXPORT ==== //

export default router;
export { validateApplicantLogin };
