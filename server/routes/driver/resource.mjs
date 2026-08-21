// ==== IMPORT ==== //

const router = require('express').Router();
const { body } = require('express-validator');
const sendError = require('../../tools/utils/error');

import moment from 'moment';

/* Tools */
import User from '../../tools/core/user.mjs';
import Team from '../../tools/core/team.mjs';
import { RefSource } from '../../tools/core/company.mjs';
import Carrier from '../../tools/core/carrier.mjs';
import Individual from '../../tools/core/individual.mjs';
import Driver, { Application } from '../../tools/core/driver.mjs';
import { utcTimeStamp } from '../../tools/utils/date.mjs';
import { maskEmail } from '../../tools/utils/string.mjs';

/* Validators */
import validationCheck from '../../tools/form/validator.mjs';
import DriverForm, { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs';

// ==== SETUP ==== //

const dynamicValidator = {
  applications: (req, res, next) => {
    const { step } = req.params;
    let validators = [];

    switch (step) {
      case 'profile':
        validators = ApplicationForm.validate('driver/profile');
        break;
      case 'residence':
        validators = ApplicationForm.validate('driver/residence');
        break;
      case 'driver-license':
        validators = ApplicationForm.validate('driver/license');
        break;
      case 'medical-card':
        validators = ApplicationForm.validate('driver/medical');
        break;
      case 'legal-compliance':
        validators = ApplicationForm.validate('driver/compliance');
        break;
      case 'safety':
        validators = ApplicationForm.validate('driver/safety');
        break;
      case 'experience':
        validators = ApplicationForm.validate('driver/experience');
        break;
      case 'prev-employment':
        validators = ApplicationForm.validate('driver/employment');
        break;
      case 'preference':
        validators = ApplicationForm.validate('driver/preference');
        break;
      case 'business':
        validators = ApplicationForm.validate('driver/business+vehicle');
        break;
      case 'beneficiary':
        validators = ApplicationForm.validate('driver/beneficiary');
        break;
      case 'misc':
        validators = ApplicationForm.validate('driver/misc');
        break;
    }

    Promise.all(validators.map((validator) => validator.run(req)))
      .then(() => next())
      .catch(next);
  },
};

// ==== ROUTES ==== //

router.post(
  '/application/start/:_teamId?/:_carrierId?',
  [
    ApplicationForm.position.validate(),
    ApplicationForm.ssn.validate(),
    ApplicationForm.dob.validate(),
    ApplicationForm.refSrc.validate(),
  ],
  validationCheck,
  async (req, res) => {
    let urlExt = '';
    const extendUrl = (_id) => `/registration?id=${_id}`;

    try {
      res.session.user = { id: 1 };
      const { _teamId, _carrierId } = req.params;
      let { cdl: cdlRole, vhl: vhlCode, rec: _userSimpleId, form: formId } = req.query;
      const { position, ssn, dob, _refSrcId } = req.body;

      const person = await Individual.fetch(res.session, { ssn });
      if (person && dob !== person.dob) {
        const error = new Error('DAPP_DOB_MISMATCH_ERROR');
        error.url = `/application?env=${_teamId}&cdl=${cdlRole}`;
        if (vhlCode) error.url += `&vhl=${vhlCode}`;
        if (_userSimpleId) error.url += `&rec=${_userSimpleId}`;

        throw error;
      }

      if (formId) {
        const application = await Application.fetch(
          res.session,
          { formId },
          { hideSensitive: false },
        );
        if (!application) {
          //* Pre-Application deleted
          const error = new Error('DAPP_NFOUND_ERROR');
          error.body = {
            cdlRole,
            _teamId,
            _carrierId,
            _refSrcId,
            _userSimpleId,
            ssn,
            dob,
            position,
          };

          throw error;
        }

        if (!application.driverId) {
          if (application?.lead?.ssn)
            urlExt = extendUrl(application._id); //* Driver never registered but started in the past
          else {
            let driverId, rehire;
            const driver = await Driver.fetch(res.session, { ssn });
            if (driver) {
              driverId = driver.id;
              rehire = true;
              req.session.application = application._id;
            } else urlExt = extendUrl(application._id);

            let refSrcId = null;
            if (_refSrcId) {
              const refSrc = await RefSource.fetch(res.session, { _id: _refSrcId });
              if (refSrc?.id) refSrcId = refSrc.id;
            }

            await application.update('lead', { ssn, dob });
            await application.update({ driverId, refSrcId, rehire, position }); //, createdAt: utcTimeStamp()
          }
        }
      } else {
        let application = await Application.fetch(res.session, { ssn });
        if (application) {
          const error = new Error('DAPP_LOCKED_SSN_ERROR');
          error.data = application;

          throw error;
        }

        application = (
          await Application.create(res.session, {
            cdlRole,
            vhlCode,
            _teamId,
            _carrierId,
            _refSrcId,
            _userSimpleId,
            ssn,
            dob,
            position,
          })
        ).data;
        if (!application) throw new Error('Failed to create application');

        formId = application.formId;
        urlExt = extendUrl(application._id);
      }

      res.redirect(`/application/${formId + urlExt}`);
    } catch (err) {
      switch (err.message) {
        case 'DAPP_DOB_MISMATCH_ERROR':
          {
            const key = 'application.mismatch';
            let { hbs } = res;
            hbs = hbs.set(key, { title: 'Driver Application' });
            hbs.bodyAttrs = ' data-bs-theme="dark"';

            hbs.appUrl = err.url;

            return res.render('application/mismatch', hbs);
          }
          break;
        case 'DAPP_NFOUND_ERROR':
          {
            try {
              const application = (await Application.create(res.session, err.body)).data;
              if (!application) throw new Error('Failed to create application');

              return res.redirect(
                `/application/${application.formId + extendUrl(application._id)}`,
              );
            } catch (err) {
              sendError.server(req, res, err);
            }
          }
          break;
        case 'DAPP_LOCKED_SSN_ERROR': {
          const key = 'application.busy';
          let { hbs } = res;
          hbs = hbs.set(key, { title: 'Driver Application' });
          hbs.bodyAttrs = ' data-bs-theme="dark"';

          const application = err.data;
          const { formId } = application;

          hbs.formId = formId;
          hbs.agency = application?.team?.name;
          hbs.carrier = application?.carrier?.name;
          hbs.applicantName = application.fullName;
          hbs.applicantPosition = application.expansion.position;
          hbs.startedAt = moment(application.appliedAt).format('MMM D, YYYY hh:mm A') + ' ET';
          hbs.maskedEmail = maskEmail(application.email);
          hbs.appUrl = `/application/${formId}`;

          delete req.session.application;

          return res.render('application/busy', hbs);
        }
        default:
          sendError.server(req, res, err);
      }
    }
  },
);

router.post(
  '/application/register/:_id',
  ApplicationForm.validate('driver/registration'),
  validationCheck,
  async (req, res) => {
    try {
      const { _id } = req.params;
      const application = await Application.fetch(res.session, { _id }, { hideSensitive: false });
      if (!application) throw new Error('Application not found');

      await application.register(req.body);
      req.session.application = application._id;

      res.redirect(`/application/${application.formId}`);
    } catch (err) {
      sendError.server(req, res, err);
    }
  },
);

router.post(
  '/application/progress/:formId/:step',
  dynamicValidator.applications,
  validationCheck,
  async (req, res) => {
    try {
      const { formId, step } = req.params;
      const application = await Application.fetch(
        res.session,
        { formId },
        { hideSensitive: false },
      );
      if (!application) throw new Error('Application not found');
      // return res.send({
      //     step,
      //     body: req.body,
      //     formId,
      //     id: application.id,
      // })
      await application.progress(step, req.body);

      res.redirect(`/application/${formId}`);
    } catch (err) {
      sendError.server(req, res, err);
    }
  },
);

router.post('/application/submit/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const application = await Application.fetch(res.session, { formId });
    if (!application) throw new Error('Application not found');

    await application.submit();

    res.redirect(`/application/${formId}`);
  } catch (err) {
    sendError.server(req, res, err);
  }
});

// ==== EXPORT ==== //

export default router;
