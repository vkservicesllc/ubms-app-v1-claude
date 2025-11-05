require('dotenv').config()
const { env } = process


const domain = env.SERVER__DOMAIN || null
const name = env.SITE__APP_NAME
const alias = env.SITE__APP_ALIAS || env.SITE__APP_NAME
const description = env.SITE__APP_DESC || null
const author = env.SITE__APP_AUTHOR


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
    description,
    storage: {
        path: env.DIR_PATH,
    },
    notification: {
        email: {
            authToken: !!domain,
        },
    },
}

const addrBook = {}, userApps = {}

import User from './server/tools/core/user.mjs'
import { DriverUser } from './server/tools/core/driver.mjs'
import { StudentUser } from './server/tools/core/student.mjs'


import defaultRoute from './server/routes/default.mjs'

import adminRoute from './server/routes/admin.mjs'
import adminBusinessRoute from './server/routes/admin/business.mjs'
import adminOnlineRoute from './server/routes/admin/online.mjs'
import adminDevToolsRoute from './server/routes/admin/dev-tools.mjs'
import adminApiRoute from './server/routes/admin/api.mjs'
import adminImageRoute from './server/routes/admin/image.mjs'
import adminResourceRoute from './server/routes/admin/resource.mjs'
import adminUploadRoute from './server/routes/admin/upload.mjs'

import userRoute from './server/routes/user.mjs'
import userApiRoute from './server/routes/user/api.mjs'

import carrierRoute from './server/routes/carrier.mjs'
import carrierDriversRoute from './server/routes/carrier/drivers.mjs'
import carrierVehiclesRoute from './server/routes/carrier/vehicles.mjs'
import carrierApiRoute from './server/routes/carrier/api.mjs'
import carrierResourceRoute from './server/routes/carrier/resource.mjs'

import driverRoute from './server/routes/driver.mjs'
import driverApiRoute from './server/routes/driver/api.mjs'
import driverResourceRoute from './server/routes/driver/resource.mjs'
import driverUploadRoute from './server/routes/driver/upload.mjs'

import schoolRoute from './server/routes/school.mjs'

import studentRoute from './server/routes/student.mjs'


const apps = {

    'default': {
        type: 'primary',
        name,
        active: true,
        route: defaultRoute,
        session: {
            userApp: 'def',
            maxAge: 10,  /* in minutes */
            src: User,
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
            { url: '/api', router: adminApiRoute },
            { url: '/image', router: adminImageRoute },
            { url: '/resource', router: adminResourceRoute },
            { url: '/upload', router: adminUploadRoute },
        ],
        session: {
            userApp: 'adm',
            maxAge: 5,  /* in minutes */
            src: User,
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
            userApp: 'usr',
            maxAge: 5,  /* in minutes */
            src: User,
        },
    },

    'carrier': {
        catId: 'crr',
        type: 'primary',
        name: `${alias} Carrier App`,
        active: true,
        route: carrierRoute,
        routes: [
            { url: '/drivers', router: carrierDriversRoute },
            { url: '/vehicles', router: carrierVehiclesRoute },
            { url: '/api', router: carrierApiRoute },
            { url: '/resource', router: carrierResourceRoute },
        ],
        session: {
            userApp: 'crr',
            maxAge: 10,  /* in minutes */
            src: User,
            teams: true,
            companies: true,
            defUrl: '/dashboard',
            excUrl: '/',
        },
    },

    'driver': {
        catId: 'crr',
        type: 'secondary',
        name: `${alias} Driver Portal`,
        active: true,
        route: driverRoute,
        routes: [
            { url: '/api', router: driverApiRoute },
            { url: '/resource', router: driverResourceRoute },
            { url: '/upload', router: driverUploadRoute },
        ],
        session: {
            maxAge: 10,  /* in minutes */
            src: DriverUser,
        },
    },

    'school': {
        catId: 'scl',
        type: 'primary',
        name: `${alias} CDL School App`,
        active: false,
        route: schoolRoute,
        session: {
            userApp: 'scl',
            maxAge: 10,  /* in minutes */
            src: User,
            companies: true,
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
            src: StudentUser,
        },
    },

}


for (const branch in apps) {
    if (!apps[branch].active) continue

    const port = env[`SERVER__PORT_${branch.toUpperCase()}`]
    const { maxAge, defUrl, excUrl } = apps[branch].session
    let subdomain
    if (branch != 'default') subdomain = branch

    apps[branch].port = port
    apps[branch].address = setAddress(port, subdomain)
    apps[branch].session.maxAge = 1000 * 60 * maxAge
    if (!defUrl) apps[branch].session.defUrl = '/'
    if (typeof excUrl == 'string') apps[branch].session.excUrl = [ excUrl ]
    else if (!excUrl || !Array.isArray(excUrl)) apps[branch].session.excUrl = []
    addrBook[branch] = apps[branch].address
    if (apps[branch].session.userApp) userApps[branch] = {
        env: apps[branch].session.userApp,
        name: apps[branch].name,
        address: apps[branch].address,
    }
}


export default config
export { apps, userApps, addrBook }



function setAddress(port, subdomain = '') {
    if (domain) {
        if (subdomain) subdomain += '.'
        return `https://${subdomain + domain}`
    } else
        return `http://localhost:${port}`
}