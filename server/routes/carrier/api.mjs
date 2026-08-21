// ==== IMPORT ==== //

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import User from '../../tools/core/user.mjs';
import Team from '../../tools/core/team.mjs';
import Driver, { Application, Employment } from '../../tools/core/driver.mjs';

/* Middleware */
import { dtDriverList, dtApplicationList } from './mw/drivers.mjs';

// ==== SETUP ==== //

// ==== ROUTES ==== //

router.post('/session/team/:_id/switch', User.mw.verify, async (req, res) => {
    try {
        let switched = false;
        const { _id } = req.params;
        const team = await Team.fetch(res.session, { _id });

        if (team) {
            req.session.team = _id;
            switched = true;
        }

        res.send(switched);
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.post('/login/validation', async (req, res) => {
    try {
        let validated = false;
        const { username } = req.body;

        const user = await User.fetch(res.session, { username }, { offline: true });
        if (!user) throw new Error('User not found');

        if (user.unscoped || user.DS) validated = true;
        else {
            const teams = await user.fetch('jx.teams');
            validated = teams.length > 0;
        }

        res.send({ validated });
    } catch (err) {
        sendError.server(req, res, err);
    }
});

// ==== ROUTES ==== //

router.post('/lists', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { filter, priv } = req.query;
        let response = { users: [], teams: [], carriers: [] };

        if (filter)
            switch (filter) {
                case 'driver-applications':
                    response = await Application.assigned(res.session);
                    break;
            }

        //* filter === "driver-applications"
        // users: filter application by their conditions and where user not null and make unique list of users
        // carriers: filter applications by their conditions and where carriers not null and exclude carriers not in self jx relationship

        // users: all users
        // user in team: filter by specific team
        // user by priv: filter by specific permissions

        //* sessionUser.DS === true
        // carriers: all carrier by category 'crr'
        //* sessionUser.DS !== true
        // carriers in sessionUser jx relationships

        res.json(response);
    } catch (err) {
        sendError.server(req, res, err);
    }
});

// ==== DRIVERS ROUTES ==== //

// router.post('/data/drivers/application/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
//     try {
//         const { _id } = req.params
//         const { sensitive = 'false' } = req.query
//         const params = {}
//         if (sensitive === 'true') params.hideSensitive = false

//         const application = await Application.fetch(res.session, { _id }, params)
//         if (!application) throw new Error('Application not found')

//         const driver = await Driver.fetch(res.session, { _id: application._driverId })
//         if (!driver) throw new Error('Driver not found')

//         const { formId } = application
//         const identity = await application.identity()
//         const log = await application.log()

//         const applications = await driver.fetch('application.history')
//         const count = applications.length
//         const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

//         res.json({ data: { application, identity, count, unmatchedIdx, log } })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })

// router.delete('/data/drivers/application/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
//     try {
//         const { _id } = req.params
//         const application = await Application.fetch(res.session, { _id })
//         if (!application) throw new Error('Application not found')

//         const { deleted } = await application.delete()

//         res.json({ deleted })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })

// router.post('/list/drivers/application/:_id/:target', User.mw.verify, Team.mw.verify, async (req, res) => {
//     try {
//         let { _id, target } = req.params

//         const application = await Application.fetch(res.session, { _id })
//         if (!application) throw new Error('Application not found')

//         const filter = {}
//         switch (target) {
//             case 'addresses':
//                 target = 'address'
//                 filter.since = { not: application.address.since }
//                 break
//             case 'citations':
//                 target = 'citation'
//                 break
//             case 'accidents':
//                 target = 'accident'
//                 break
//             // case 'employments':
//             //     target = 'employer'
//             //     break
//         }

//         res.json({ data: await application.fetch(`${target}.history`, { filter }) })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })

// ==== EXPORT ==== //

export default router;
