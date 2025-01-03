require('dotenv').config()
const { env } = process


const author = 'VK Services, LLC'
const domain = env.SERVER__DOMAIN || null
const name = env.SITE__APP_NAME
const alias = env.SITE__APP_ALIAS || env.SITE__APP_NAME


const config = {
    author,
    copyright: {
        owner: env.SITE__COPYRIGHT_OWNER || author,
        year: parseInt(env.SITE__COPYRIGHT_YEAR),
        html() {
            const { owner, year } = this
            let period = year
            const currentYear = new Date().getUTCFullYear()
            if (currentYear > year) period += `–${currentYear}`
            return `<span id="copyright">Copyright © ${period} ${owner}</span>`
        },
    },
    cookie: {
        secret: env.SERVER__COOKIE_SECRET,
    },
    session: {
        secret: env.SERVER__SESSION_SECRET,
        loginAttempts: 5,
        loginUrl: '/auth/login',
        sessionUrl: '/auth/session',
        logoutUrl: '/session/logout',
        tokenAge: 5,  /* in minutes */
        storeOptions: {
            host: env.DB__MYSQL_HOST,
            user: env.DB__MYSQL_USER,
            password: env.DB__MYSQL_PASS,
            database: 'app_store',
        },
    },
    site: {
        id: null,
        active: true,
        domain,
        name,
        alias,
    },
    storage: {
        path: env.DIR_PATH,
    },
    notification: {
        email: {
            authToken: !(!domain),
        },
    },
}

const addrBook = {}


import defaultRoute from './server/routes/default.mjs'

import adminRoute from './server/routes/admin.mjs'
import adminBusinessRoute from './server/routes/admin/business.mjs'
import adminOnlineRoute from './server/routes/admin/online.mjs'
import adminDevToolsRoute from './server/routes/admin/dev-tools.mjs'
import adminResourceRoute from './server/routes/admin/resource.mjs'

import userRoute from './server/routes/user.mjs'
import userApiRoute from './server/routes/user/api.mjs'

import carrierRoute from './server/routes/carrier.mjs'

import driverRoute from './server/routes/driver.mjs'

import schoolRoute from './server/routes/school.mjs'

import studentRoute from './server/routes/student.mjs'


const apps = {

    'default': {
        type: 'primary',
        name,
        active: true,
        route: defaultRoute,
        session: {
            maxAge: 10,  /* in minutes */
        },
    },

    'admin': {
        type: 'secondary',
        name: `${alias} Admin Portal`,
        active: true,
        route: adminRoute,
        routes: [
            { url: '/business', router: adminBusinessRoute },
            { url: '/online', router: adminOnlineRoute },
            { url: '/dev-tools', router: adminDevToolsRoute },
            { url: '/resource', router: adminResourceRoute },
        ],
        session: {
            maxAge: 5,  /* in minutes */
        },
    },

    'user': {
        type: 'secondary',
        name: `${alias} User Portal`,
        active: true,
        route: userRoute,
        routes: [
            { url: '/api', router: userApiRoute },
        ],
        session: {
            maxAge: 5,  /* in minutes */
        },
    },

    'carrier': {
        catId: 'crr',
        type: 'primary',
        name: `${alias} Carriers`,
        active: false,
        route: carrierRoute,
        session: {
            maxAge: 10,  /* in minutes */
        },
    },

    'driver': {
        catId: 'crr',
        type: 'secondary',
        name: `${alias} Driver Portal`,
        active: false,
        route: driverRoute,
        session: {
            maxAge: 10,  /* in minutes */
        },
    },

    'school': {
        catId: 'scl',
        type: 'primary',
        name: `${alias} CDL Schools`,
        active: false,
        route: schoolRoute,
        session: {
            maxAge: 10,  /* in minutes */
        },
    },

    'student': {
        catId: 'scl',
        type: 'secondary',
        name: `${alias} Student Portal`,
        active: false,
        route: studentRoute,
        session: {
            maxAge: 10,  /* in minutes */
        },
    },

}


for (const branch in apps) {
    if (!apps[branch].active) continue

    const port = env[`SERVER__PORT_${branch.toUpperCase()}`]
    const { maxAge } = apps[branch].session
    let subdomain
    if (branch != 'default') subdomain = branch

    apps[branch].port = port
    apps[branch].address = setAddress(port, subdomain)
    apps[branch].session.maxAge = 1000 * 60 * maxAge
    addrBook[branch] = apps[branch].address
}


export default config
export { apps, addrBook }



function setAddress(port, subdomain = '') {
    if (domain) {
        if (subdomain) subdomain += '.'
        return `https://${subdomain + domain}`
    } else
        return `http://localhost:${port}`
}