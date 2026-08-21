// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env;

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import moment from 'moment';
import User from '../../tools/core/user.mjs';
import Company from '../../tools/core/company.mjs';
import uploader from '../../tools/utils/multer.mjs';
import { getFiles } from '../../tools/utils/fs.mjs';

// ==== SETUP ==== //

const upload = {
  company: {
    logo: uploader('/business/company/{id}/logo'),
  },
};

// ==== ROUTES ==== //

router.post(
  '/business/company/:_id/logo',
  User.mw.verify,
  User.mw.superAdminOnly,
  async (req, res, next) => {
    const { _id } = req.params;
    const company = await Company.fetch(res.session, { _id });
    if (!company) throw new Error('Company not found');

    const { since } = req.query;

    const { id } = company;
    let filename = company.since;

    if (since) filename = since;

    req.upload = { id, filename };
    req.data = { company, filename };

    next();
  },
  upload.company.logo.single('companyLogo'),
  async (req, res) => {
    try {
      //* Runs when upload is successfull
      const { company } = req.data;
      let lastLogo = null;
      const files = await getFiles(`${dir}/uploads/business/company/${company.id}/logo/`, false);
      if (files.length) lastLogo = files[0].split('.')[0];

      await company.update({ lastLogo });

      res.send({ status: 'success' });
    } catch (err) {
      sendError.server(req, res, err);
    }
  },
);

// ==== EXPORT ==== //

export default router;
