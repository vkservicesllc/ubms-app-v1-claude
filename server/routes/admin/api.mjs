// ==== IMPORT ==== //

import User, { Role } from '../../tools/core/user.mjs';
import Team from '../../tools/core/team.mjs';
import Individual from '../../tools/core/individual.mjs';
import Company, { Owner, RefSource } from '../../tools/core/company.mjs';

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

// ---- MISC ROUTES ---- //

router.post(
    '/update/:src/:_id/:action/:target/:_relId',
    User.mw.verify,
    User.mw.superAdminOnly,
    async (req, res) => {
        try {
            const { src, _id, action, target, _relId } = req.params;
            const Src = { team: Team, role: Role, refsource: RefSource }[src];

            const inst = await Src.fetch(res.session, { _id });
            if (!inst) throw new Error(`${Src.name} not found`);

            const { added, deleted } = await inst[action](`jx.${target}`, [_relId]);

            res.json({ done: action === 'add' ? added : deleted });
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

router.post('/invite/user/:_id', User.mw.verify, User.mw.invite);

router.get('/log/:env/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { env, _id } = req.params;
        let report;

        switch (env) {
            case 'user':
                const user = await User.fetch(res.session, { _id });
                report = await user.report(res.session);
                break;
        }

        res.send(report);
    } catch (err) {
        sendError.server(req, res, err);
    }
});

// ==== EXPORT ==== //

export default router;
