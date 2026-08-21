// ==== IMPORT ==== //

const router = require('express').Router();
const axios = require('axios');
const sendError = require('../tools/utils/error');
const mysql = require('../tools/utils/mysql');

/* Settings */
import db from '../settings/mysql.mjs';
import config from '../../config.mjs';

/* Tools */
import Query from '../tools/utils/query.mjs';
import User from '../tools/core/user.mjs';
import Company from '../tools/core/company.mjs';
import Driver, { Application as DriverApplication } from '../tools/core/driver.mjs';
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs';

// ==== SETUP ==== //

// ==== ROUTES ==== //

router.get('/us-zips/:zip', async (req, res) => {
    try {
        const { zip } = req.params;
        const [rows] = await mysql.execute(
            new Query(db.public, 'us_zips').select('*', { match: { zip } }),
        );

        if (rows.length) rows[0].data.city = capitalizeEach(rows[0].data.city, true);

        res.send(rows[0] || {});
    } catch (err) {
        sendError.server(res, err, true);
    }
});

router.post('/enum/:source', (req, res) => {
    try {
        const { filter } = req.query;
        const { source } = req.params;
        let result;

        switch (source) {
            case 'company':
                result = {
                    categories: Company.list.category,
                    types: Company.list.type,
                };
                break;

            case 'driver':
                result = {
                    positions: Driver.list.position,
                };
                break;

            case 'driver-application':
                result = {
                    violations: DriverApplication.list.violation,
                    accidents: DriverApplication.list.collision,
                };
                break;
        }

        if (filter) result = result[filter];

        res.send(result);
    } catch (err) {
        sendError.server(res, err, true);
    }
});

router.post('/unique/user', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.fetch(res.session, { username }, { offline: true });

        res.json({ unique: !user });
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.post('/google/places/autocomplete', async (req, res) => {
    try {
        const { input, sessionToken } = req.body;

        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            {
                params: {
                    input,
                    key: config.apiKeys.google,
                    sessionToken,
                    types: 'address',
                    components: 'country:us',
                },
            },
        );

        res.json(response.data);
    } catch (err) {
        sendError.server(req, res, err);
    }
});

router.post('/google/places/details', async (req, res) => {
    try {
        const { placeId, sessionToken } = req.body;

        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            {
                params: {
                    place_id: placeId,
                    key: config.apiKeys.google,
                    sessionToken,
                },
            },
        );

        res.json(response.data.result);
    } catch (err) {
        sendError.server(req, res, err);
    }
});

// ==== EXPORT ==== //

export default router;
