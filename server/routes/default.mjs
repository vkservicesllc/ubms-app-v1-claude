// ==== IMPORT ==== //

const router = require('express').Router();
const sendError = require('../tools/utils/error');

/* Tools */
import User from '../tools/core/user.mjs';
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs';

import { apps, userApps } from '../../config.mjs';

// ==== SETUP ==== //

router.use((req, res, next) => {
  res.hbs.set = function (key, params = {}) {
    let { inclKey, navKey, titlePfx, title } = params;

    const includer = require('../includes/src');
    const includes = require('../includes/default');

    const hbs = { ...this };

    if (!inclKey) inclKey = key;
    if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\-/g, ' '));

    hbs.title = title || `${titlePfx} - ${hbs.title}`;
    hbs.includes = includer.render(includes[inclKey]);

    return hbs;
  };

  next();
});

// ==== ROUTES ==== //

router.get('/', (req, res) => {
  //! Not a login page yet

  try {
    const key = 'login';
    let { hbs } = res;
    const { title } = hbs;
    hbs = hbs.set(key, { title });

    hbs.bodyAttrs = ' class="grey lighten-4"';

    hbs.apps = {
      carrier: {
        name: apps.carrier.name,
        address: apps.carrier.address,
      },
      driver: {
        name: apps.driver.name,
        address: apps.driver.address,
      },
    };

    // hbs.refreshToUrl = apps.carrier.address

    res.render(key, hbs);
  } catch (err) {
    sendError.server(req, res, err);
  }
});

router.get('/welcome', async (req, res) => {
  try {
    const { user: _id, reset } = req.query;
    if (!_id) return res.redirect('/');

    const key = 'welcome';
    let { hbs } = res;
    const { title } = hbs;
    hbs = hbs.set(key, {
      title: title + (reset === 'success' ? ' - Password Reset' : ' - Welcome aboard!'),
    });

    const user = await User.fetch(res.session, { _id }, { offline: true });
    if (!user) return res.redirect('/');

    let branchList = '';
    const t = `\t`.repeat(5);

    for (const branch in userApps) {
      if (branch === 'admin' && !user.DSA) continue;

      const { address, name } = userApps[branch];

      branchList += `\n${t}<li><a class="waves-effect waves-light blue darken-3 btn" href="${address}" target="_blank">`;
      branchList += `${name}</a></li>`;
    }

    hbs.reset = reset;
    hbs.user = user;
    hbs.user.name = user.fullName('AL');
    hbs.branchList = branchList;

    res.render(key, hbs);
  } catch (err) {
    sendError.server(req, res, err);
  }
});

// ==== EXPORT ==== //

export default router;
