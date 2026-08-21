// ==== IMPORT ==== //

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import User from '../../tools/core/user.mjs';
import Team from '../../tools/core/team.mjs';
import Company from '../../tools/core/company.mjs';
import Carrier from '../../tools/core/carrier.mjs';
import Driver, { Application, Employment } from '../../tools/core/driver.mjs';
import { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs';
import { inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs';

/* Validators */
import validationCheck from '../../tools/form/validator.mjs';

// ==== SETUP ==== //

const url = {
    drivers: {
        applications: '/drivers/applications',
    },
};

const validateApplicantEmployers = [];
const applicantEmployerFields = [
    'employer',
    'phone',
    'address1',
    'address2',
    'addrZip',
    'addrCity',
    'addrState',
    'startDate',
    'position',
    'earnings',
    'FMCSR',
    'dotDat',
    'RFL',
    'endDate',
];
applicantEmployerFields.forEach((prop) =>
    validateApplicantEmployers.push(EmploymentForm[prop].validate()),
);

const dynamicValidator = {
    driverApplications: (req, res, next) => {
        const { step } = req.params;
        let validators = [];

        switch (step) {
            case 'workflow':
                validators = ApplicationForm.validate('carrier/workflow');
                break;
            case 'profile':
                validators = ApplicationForm.validate('carrier/profile');
                break;
            case 'profile-lock1':
                validators = ApplicationForm.validate('carrier/profile-dl-lock');
                break;
            case 'profile-lock2':
                validators = ApplicationForm.validate('carrier/profile-ssn-lock');
                break;
            case 'profile-lock':
                validators = ApplicationForm.validate('carrier/profile-full-lock');
                break;
            case 'address':
                validators = ApplicationForm.validate('carrier/residence');
                break;
            case 'legal-status':
                validators = ApplicationForm.validate('carrier/legal');
                break;
            case 'position':
                validators = ApplicationForm.validate('carrier/position+vehicle');
                break;
            case 'driver-license':
                validators = ApplicationForm.validate('carrier/license');
                break;
            case 'driver-license-lock':
                validators = ApplicationForm.validate('carrier/license-lock');
                break;
            case 'medical-card':
                validators = ApplicationForm.validate('carrier/medical');
                break;
            case 'medical-card-lock':
                validators = ApplicationForm.validate('carrier/medical-lock');
                break;
            case 'legal-compliance':
                validators = ApplicationForm.validate('carrier/compliance');
                break;
            case 'experience':
                validators = ApplicationForm.validate('carrier/experience');
                break;
            case 'preference':
                validators = ApplicationForm.validate('carrier/preference');
                break;
            case 'business':
                validators = ApplicationForm.validate('carrier/business');
                break;
            case 'beneficiary':
                validators = ApplicationForm.validate('carrier/beneficiary');
                break;
            case 'misc':
                validators = ApplicationForm.validate('carrier/misc');
                break;
        }

        Promise.all(validators.map((validator) => validator.run(req)))
            .then(() => next())
            .catch(next);
    },
};

// ==== SETTINGS ROUTES ==== //

router.post('/user/:_id/app/settings', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params;
        if (_id != res.session.user._id) throw new Error('Invalid User');

        const user = await User.fetch(res.session, { _id });
        await user.settings('update', req.body);

        res.redirect('/settings');
    } catch (err) {
        sendError.server(req, res, err);
    }
});

// ==== DRIVERS ROUTES ==== //

const validateApplicantInvitation = [],
    validateApplicant = [],
    validateLead = [];
const applicantInvitationFields = ['carrier', 'team', 'email'];
const applicantFields = [
    ...applicantInvitationFields,
    'firstName',
    'middleName',
    'lastName',
    'suffix',
    'gender',
    'phone',
    'position_',
];
const leadFields = [
    'leadFirstName',
    'leadMiddleName',
    'leadLastName',
    'leadSuffix',
    'leadGender',
    'leadPhone',
    'leadPosition',
];
applicantInvitationFields.forEach((prop) =>
    validateApplicantInvitation.push(ApplicationForm[prop].validate()),
);
applicantFields.forEach((prop) => validateApplicant.push(ApplicationForm[prop].validate()));
leadFields.forEach((prop) => validateLead.push(ApplicationForm[prop].validate()));

router.post(
    '/drivers/invite/applicant',
    User.mw.verify,
    Team.mw.verify,
    validateApplicantInvitation,
    validationCheck,
    async (req, res) => {
        try {
            await Application.invite(res.session, req.body);
            res.redirect('/drivers/applications');
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post('/drivers/reinvite/applicant', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.query;
        if (!_id) throw new Error('Application parameters not supplied');

        const applicant = await Application.fetch(res.session, { _id });
        if (!applicant) throw new Error('Applicant not found');

        const { userId } = applicant;

        if (userId) {
            const user = await User.fetch(res.session, { id: userId });
            if (!user) throw new Error('Assigned user not found');

            applicant._userSimpleId = user._simpleId;
        }

        await Application.invite(res.session, applicant, applicant.formId);
        res.redirect('/drivers/applications');
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.post(
    '/drivers/insert/applicant',
    User.mw.verify,
    Team.mw.verify,
    validateApplicant,
    validationCheck,
    async (req, res) => {
        try {
            await Application.create(res.session, req.body);
            res.redirect('/drivers/applications');
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post(
    '/drivers/update/applicant',
    User.mw.verify,
    Team.mw.verify,
    validateLead,
    validationCheck,
    async (req, res) => {
        try {
            const { _id } = req.body;
            delete req.body._id;

            const applicant = await Application.fetch(res.session, { _id });
            if (!applicant) throw new Error('Applicant not found');

            await applicant.update('lead', req.body);
            res.redirect('/drivers/applications');
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post('/drivers/delete/application', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user } = res.session;
        const permissions = await user.permissions(res.session);
        if (!withPrivileges('d:drv/apl', 'delete', permissions, user.DS))
            return sendError.auth(req, res);

        const { _id } = req.body;
        const application = await Application.fetch(res.session, { _id });
        if (!application) throw new Error('Application not found');

        await application.delete();

        res.redirect('/drivers/applications');
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.post(
    '/drivers/prev-employments/modify',
    User.mw.verify,
    Team.mw.verify,
    EmploymentForm.validate('employer', true),
    validationCheck,
    async (req, res) => {
        try {
            const { user } = res.session;
            const permissions = await user.permissions(res.session);
            if (!withPrivileges('d:drv/empl', 'modify', permissions, user.DS))
                return sendError.auth(req, res);

            const { _id, _appId } = req.body;
            delete req.body.id;
            // delete req.body.cdlRole

            // if (cdlRole === '0') req.body.fmcsr = null
            // if (!req.body.fmcsr) {
            //     if (cdlRole === '1') req.body.fmcsr = false
            // }
            if (!req.body.fmcsr) req.body.fmcsr = false;
            if (!req.body.dotDat) req.body.dotDat = false;

            const employment = await Employment.fetch(res.session, { _id, _appId });
            if (!employment) throw new Error('Employment not found');

            await employment.update(req.body);

            res.redirect('/drivers/previous-employments');
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post(
    '/driver/application/:formId/edit/:step',
    User.mw.verify,
    Team.mw.verify,
    dynamicValidator.driverApplications,
    validationCheck,
    async (req, res) => {
        // return res.send(req.body) //! TEMP
        try {
            const { user } = res.session;
            const { DS } = user;
            const permissions = await user.permissions(res.session);
            // if (!withPrivileges('d:drv/apl', ['modify', 'update'], permissions, DS))
            //! NOT sure about update permission
            if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
                return sendError.auth(req, res);

            const { formId, step } = req.params;
            const application = await Application.fetch(res.session, { formId });
            if (!application) throw new Error('Application not found');

            await application.progress(step, req.body);

            res.redirect(`/drivers/application/${formId}/e-form?${step.replace(/\-lock\d?/, '')}`);
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post(
    '/driver/application/:formId/prior-residence',
    User.mw.verify,
    Team.mw.verify,
    ApplicationForm.validate('carrier/prior-residence'),
    validationCheck,
    async (req, res) => {
        return res.send(req.body);
        try {
            const { user } = res.session;
            const { DS } = user;
            const permissions = await user.permissions(res.session);
            if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
                return sendError.auth(req, res);

            const { formId } = req.params;
            const application = await Application.fetch(res.session, { formId });
            if (!application) throw new Error('Application not found');

            await application.progress('prior-addresses', req.body);

            res.redirect(`/drivers/application/${formId}/e-form/prior-residence`);
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

// ==== EXPORT ==== //

export default router;
