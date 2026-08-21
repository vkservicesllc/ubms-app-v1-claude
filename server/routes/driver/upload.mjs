// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env;

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import { Application } from '../../tools/core/driver.mjs';
import uploader from '../../tools/utils/multer.mjs';
import { getFiles } from '../../tools/utils/fs.mjs';

/* Registry */
import appFilenames from '../../../client/global/modules/registry/filenames/driver-application-uploads.mjs';

// ==== SETUP ==== //

const upload = {
    application: {
        documents: uploader('/driver/{id}/application/{id2}/uploads'),
    },
};

// ==== ROUTES ==== //

router.post(
    '/application/:formId/documents',
    async (req, res, next) => {
        const { formId } = req.params;
        const application = await Application.fetch(res.session, { formId });
        if (!application) throw new Error('Application not found');

        const { id, driverId } = application;

        req.upload = {
            id: driverId,
            id2: id,
            files: appFilenames,
            // files: {
            //     dlF: { filename: 'DriversLicense_front' },
            //     dlB: { filename: 'DriversLicense_back' },
            //     mec: { filename: 'MedicalCard' },
            //     ssc: { filename: 'SSCard' },
            //     leg: { filename: 'LegalDocument' },
            //     reg: { filename: 'Registration' },
            // },
        };
        req.data = { application };

        next();
    },
    upload.application.documents.fields([
        { name: 'dlF', maxCount: 1 },
        { name: 'dlB', maxCount: 1 },
        { name: 'mec', maxCount: 1 },
        { name: 'ssc', maxCount: 1 },
        { name: 'leg', maxCount: 1 },
        { name: 'reg', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            //* Runs when upload is successfull
            const { application } = req.data;

            const uploaded = {};
            const fields = Object.keys(req.files || {});
            for (const key of fields) uploaded[key] = true;

            if (fields.length) await application.add('uploads', uploaded);
            await application.progress('certify');

            res.redirect(`/application/${application.formId}`);
        } catch (err) {
            sendError.server(req, res, err);
        }
    },
);

// ==== EXPORT ==== //

export default router;
