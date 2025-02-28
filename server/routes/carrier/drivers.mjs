const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'


router.get('/', User.verify, Team.verify, (req, res) => {
    res.send('DRIVERS / <a href="' + res.session.logoutUrl + '">Log out</a>')
})


router.get('/pre-applications', User.verify, Team.verify, (req, res) => {
    res.send('PRE-APPLICATIONS')
})


router.get('/applications', User.verify, Team.verify, (req, res) => {
    res.send('APPLICATIONS')
})



export default router