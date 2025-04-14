import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import hbs from 'hbs'

import config, { apps, userApps, addrBook } from './config.mjs'

/* Assets */
import Site from './server/assets/site.mjs'
import User from './server/assets/user.mjs'
import { DriverUser } from './server/assets/driver.mjs'
import { StudentUser } from './server/assets/student.mjs'

/* Tools */
import hbsConditions from './server/tools/utils/hbs.mjs'
import { respond404 } from './server/tools/utils/response.mjs'

/* Validators */
import validationCheck from './server/validators/default.mjs'
import { validateLocalAuth, validateSession } from './server/validators/user.mjs'

/* Routes */
import apiRoute from './server/routes/api.mjs'
import publicApiRoute from './server/routes/api.public.mjs'


const MySQLStore = require('express-mysql-session')(session)
const { storeOptions, loginUrl, sessionUrl, logoutUrl, secret } = config.session
const store = new MySQLStore(storeOptions)

hbs.registerPartials('./server/views/partials')
hbs.registerHelper('author', config.author)
hbs.registerHelper('siteName', config.site.name)
hbs.registerHelper('loginUrl', loginUrl)
hbs.registerHelper('logoutUrl', logoutUrl)
hbs.registerHelper(hbsConditions)
hbs.registerHelper('idx', (arr, idx) => arr[idx])



export default branch => {
    const app = apps[branch]
    if (!app.active) return

    const server = express()
    const { type, name, port, route, routes } = app
    const { maxAge } = app.session
    let UserSrc = User

    if (branch == 'driver') UserSrc = DriverUser
    if (branch == 'student') UserSrc = StudentUser

    server.set('trust proxy', '127.0.0.1')
    server.set('view engine', 'hbs')
    server.set('views', `./server/views/${branch}`)
    server.engine('hbs', hbs.__express, {
        layoutsDir: false,
    })

    server.use(express.static(`./client/${branch}`))
    server.use(express.static('./client/global/'))

    server.use(express.urlencoded({ extended: true }))
    server.use(cookieParser(config.cookie.secret, { httpOnly: true }))
    server.use(session({
        secret: `${secret}-${branch}`,
        name: `connect.sid.${branch}`,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge,
        },
        store,
    }))
    /*
        * Session Notes:
        The main idea is to keep a separate session id and session name for each subdomain.
        The site id can not be accessed from outside a middleware so the idea was abandoned.
        Since a site will have its own domain, that shouldn't be an issue.
        ? Time will show...
    */

    server.use(async (req, res, next) => {
        const { defUrl, excUrl } = app.session
        const { protocol, originalUrl } = req
        const host = req.get('host')
        const parsedUrl = new URL(`${protocol}://${host + originalUrl}`)
        const domain = parsedUrl.hostname
        const match = domain.match(/\./g) || []
        let subdomain = '', coreDomain = domain

        if (match.length > 1) {
            if (match.length === 2) {
                const x = domain.split('.')
                subdomain = x[0]
                coreDomain = `${x[1]}.${x[2]}`
            }
        }

        const site = await new Site(branch, coreDomain)
        if (!site.active)
            return res.send(`Access Denied: the site domain <u>${domain}</> is deactivated`)

        const xForwardedFor = req.header('x-forwarded-for')

        req.session.clientIp = xForwardedFor
            ? xForwardedFor.split(',')[0].trim()
            : req.socket?.remoteAddress || '::1'

        res.site = { ...site, type }
        res.session = { branch, siteId: site.id, type, maxAge, defUrl, excUrl, logoutUrl }
        res.hbs = {
            appName: name,
            title: name,
            userApps,
            addrBook,
            copyright: config.copyright.html(),
        }

        next()
    })

    server.use('/api', apiRoute)
    server.use('/api/public', publicApiRoute)

    server.post(loginUrl, validateLocalAuth, validationCheck, UserSrc.login)
    server.post(sessionUrl, validateSession, validationCheck, UserSrc.session)
    server.get(logoutUrl, UserSrc.logout)

    if (route) server.use(route)
    if (routes && routes.length)
        routes.forEach(route => server.use(route.url, route.router))

    server.use((req, res) => {
        respond404(res)
    })

    server.listen(port, console.log(`App [${name}]: Server is running on Port ${port}...`))
}