const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Import: Tools */
import User from '../../tools/core/user.mjs';
import Team from '../../tools/core/team.mjs';
import Carrier from '../../tools/core/carrier.mjs';
import Driver, { Application, Employment } from '../../tools/core/driver.mjs';
import permissions, { inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs';

/* Import: Validators */
import validationCheck from '../../tools/form/validator.mjs';
import { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs';

/* Middleware */
import { dtDriverList, dtApplicationList } from './mw/drivers.mjs';

//* POST QUERY (DataTable Server-Side) *//

router.post('/applications/query', User.mw.verify, Team.mw.verify, dtApplicationList);

router.post('/applicants/query', User.mw.verify, Team.mw.verify, dtDriverList);

//* GET *//

const hideRawId = true;

router.get(
    '/applications/prev-employments/:_id?/:target?',
    User.mw.verify,
    Team.mw.verify,
    async (req, res) => {
        try {
            const sessionUser = res.session.user;
            const { DS } = sessionUser;
            const permissions = (await sessionUser.permissions()) || {};
            if (!withPrivileges('d:drv/emp', 'view', permissions, DS))
                return sendError.auth(req, res);

            const { _id, target } = req.params;
            const { app: _appId } = req.query;

            if (_id) {
                const employment = await Employment.fetch(
                    res.session,
                    { _id, _appId },
                    { hideRawId, hideSensitive: false },
                );
                const inquiries = await employment.fetch('attempts', {}, { hideRawId });
                const phoneVerification = await employment.fetch(
                    'phoneVerification',
                    {},
                    { hideRawId },
                );
                const responseList = Employment.list.inquiryResponse;

                if (target !== 'inquiries')
                    return res.json({
                        data: employment,
                        supData: { inquiries, phoneVerification, responseList },
                    });

                return res.json({ data: inquiries, supData: { phoneVerification, responseList } });
            }

            const _teamId = res.session?.team?._id;
            const carrierId = [null];

            if (DS) {
                const carriers = await Carrier.fetch(res.session);
                carriers.map((carrier) => carrierId.push(carrier.id));
            } else {
                const companies = await sessionUser.fetch('jx.companies', { category: 'crr' });
                companies.map((company) => carrierId.push(company.externalId.carrierId));
            }

            //! Carriers

            res.json({
                data: await Employment.fetch(
                    res.session,
                    { condition: 'c', _teamId, carrierId, verify: true },
                    { hideRawId },
                ),
                actions: {
                    data: {
                        create: DS || permissions?.['d:drv/emp'].includes('2'),
                        modify: DS || permissions?.['d:drv/emp'].includes('3'),
                        update: DS || permissions?.['d:drv/emp'].includes('4'),
                    },
                },
            });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.get('/applications/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params;
        const { sensitive = 'false' } = req.query;
        const params = { hideRawId };
        if (sensitive === 'true') params.hideSensitive = false;

        const application = await Application.fetch(res.session, { _id }, params);
        if (!application) throw new Error('Application not found');

        const driver = await Driver.fetch(res.session, { _id: application._driverId });
        if (!driver) throw new Error('Driver not found');

        const { formId } = application;
        const identity = await application.identity();
        const addresses = await application.fetch('addresses');
        const log = await application.log();

        const applications = await Application.fetch(res.session, { driverId: driver.id });
        const count = applications.length;
        const { unmatchedIdx } = applications.filter(
            (application) => application.formId === formId,
        )[0];

        res.json({ data: { application, identity, addresses, count, unmatchedIdx, log } });
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.get(
    '/applications/:_id/:target/:_targetId?',
    User.mw.verify,
    Team.mw.verify,
    async (req, res) => {
        try {
            const { user } = res.session;
            const { DS } = user;
            const permissions = await user.permissions(res.session);
            if (!withPrivileges('d:drv/apl', 'view', permissions, DS))
                return sendError.auth(req, res);

            const { _id, target } = req.params;

            if (target === 'employments') {
                const employers = await Employment.fetch(res.session, {
                    _appId: _id,
                    unreported: false,
                });

                return res.json({ data: employers });
            }

            const application = await Application.fetch(res.session, { _id }, { hideRawId });
            if (!application) throw new Error('Application not found');

            const { _targetId } = req.params;
            const data = await application.fetch(target, { _id: _targetId });

            res.json({ data });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

//* POST/PUT/PATCH *//

const dynamicValidator = (req, res, next) => {
    const { target } = req.params;
    let validators = [];

    switch (target) {
        case 'employers':
            validators = EmploymentForm.validate();
            break;
        //! add more validators later if needed
    }

    Promise.all(validators.map((validator) => validator.run(req)))
        .then(() => next())
        .catch(next);
};

router.post(
    '/applications/prev-employments/:_id/:_appId/inquiries',
    User.mw.verify,
    Team.mw.verify,
    async (req, res) => {
        try {
            const { user } = res.session;
            const { DS } = user;
            const permissions = await user.permissions(res.session);
            if (!withPrivileges('d:drv/emp', 'update', permissions, DS))
                return sendError.auth(req, res);

            const { _id, _appId } = req.params;

            const employment = await Employment.fetch(res.session, { _id, _appId });
            const { added } = await employment.add('attempts', req.body);

            const { fax, email } = req.body;
            await employment.update({ fax, email });

            res.json({ added });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post('/applications/:_id/:target', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id, target } = req.params;
        const application = await Application.fetch(res.session, { _id });
        if (!application) throw new Error('Application not found');

        const { added } = await application.add(target, req.body);
        res.json({ added });
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.put(
    '/applications/:_id/:target/:_targetId',
    User.mw.verify,
    Team.mw.verify,
    async (req, res) => {
        try {
            const { _id, target, _targetId } = req.params;
            const application = await Application.fetch(res.session, { _id });
            if (!application) throw new Error('Application not found');

            const { updated } = await application.update(target, req.body, { _id: _targetId });
            res.json({ updated });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

//* DELETE *//

router.delete(
    '/applications/:_id/:target?/:_targetId?',
    User.mw.verify,
    Team.mw.verify,
    async (req, res) => {
        try {
            const { _id, target, _targetId } = req.params;
            const application = await Application.fetch(res.session, { _id });
            if (!application) throw new Error('Application not found');

            if (target && _targetId) {
                const { deleted } = await application.delete(target, { _id: _targetId });
                return res.json({ deleted });
            }

            const { deleted } = await application.delete();

            res.json({ deleted });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

/* Export */
export default router;
