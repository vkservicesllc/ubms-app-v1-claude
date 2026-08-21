// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env;

const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const sendError = require('../../tools/utils/error');

/* Tools */
import User from '../../tools/core/user.mjs';
import Company from '../../tools/core/company.mjs';
import { getFiles } from '../../tools/utils/fs.mjs';

// ==== ROUTES ==== //

router.post(
  '/delete/business/company/:_id/logo',
  User.mw.verify,
  User.mw.superAdminOnly,
  async (req, res) => {
    try {
      const { _id } = req.params;
      const company = await Company.fetch(res.session, { _id });
      if (!company) throw new Error('Company not found');

      const { filename } = req.body;
      const dest = `${dir}/uploads/business/company/${company.id}/logo/`;
      const file = path.join(dest, filename);

      await fs.promises.unlink(file);

      const files = await getFiles(dest, false);
      let lastLogo = null;
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
