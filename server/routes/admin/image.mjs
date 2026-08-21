// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env;

const router = require('express').Router();
const sendError = require('../../tools/utils/error');

/* Tools */
import fs from 'fs';
import User from '../../tools/core/user.mjs';
import Company from '../../tools/core/company.mjs';

// ==== SETUP ==== //

// ==== ROUTES ==== //

router.get('/business/company/logo/:_id/:filename', User.mw.verify, async (req, res) => {
  const { _id, filename } = req.params;
  const company = await Company.fetch(res.session, { _id });
  const path = `${dir}/uploads/business/company/${company.id}/logo/${filename}`;

  fs.access(path, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).send('Image not found');

    res.sendFile(path);
  });
});

// ==== EXPORT ==== //

export default router;
