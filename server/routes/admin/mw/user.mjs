import User from '../../../assets/user.mjs'

const throwErr = require('../../../tools/error').data

const url = '/online/users'
const errMsg = 'Server Internal Error: User not found'



export default class {


    static devLock = async (req, res, next) => {
        const { _id } = req.body

        if (_id) {
            const user = await User.data(res.session, { _id })

            if (user.status[0] == 'D') {
                req.body.status = 'D'
                req.body.location = 'US'
            }
        }

        next()
    }


    static upsert = async (req, res) => {
        const { session } = res
        const { user: sessionUser } = session
        const sessionStatus = sessionUser.status[0]
        const sessionLocation = sessionUser.location[0]
        const { body } = req
        let error
    
        switch (true) {
            case body.location != 'US' && body.phone:
                delete body.phone
                break
            case body.status == 'D' && sessionStatus != 'D':
            case body.status == 'S' && !sessionUser.DS:
                error = 'Invalid Data: Illegal Status'
                break
            case body.status == 'S' && body.location != 'US':
            case sessionLocation != 'US' && body.location != sessionLocation:
                error = 'Invalid Data: Illegal Location'
                break
            case body.firstName == body.alias:
                error = 'Invalid Data: Illegal Name'
                break
        }
    
        if (error) return throwErr.data.server(res, error)
    
        try {
            const { _id } = body
            delete body._id
    
            if (!_id) {
                const { error } = await User.create(session, body)
                if (error) return throwErr.server(res, error)
            } else {
                const user = await User.data(session, { _id })
                if (!user) return throwErr.server(res, errMsg)
    
                const { error } = await user.modify(session, body)
                if (error) return throwErr.server(res, error)
            }
    
            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static modifyCondition = async (req, res) => {
        try {
            const { _id, condition } = req.body
    
            const user = await User.data(res.session, { _id })
            if (!user) return throwErr.server(res, errMsg)
    
            const { error } = await user.modify(res.session, { condition })
            if (error) return throwErr.server(res, error)
    
            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.body
    
            const user = await User.data(res.session, { _id })
            if (!user) return throwErr.server(res, errMsg)
    
            const { error } = await user.delete(res.session)
            if (error) return throwErr.server(res, error)
    
            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateTeams = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, teams: _teamIds } = req.body
            const user = await User.data(res.session, { _id })

            const { error } = await user.teams(res.session, action, _teamIds)
            if (error) return throwErr.server(res, null, error)

            const { username } = user
            const identifier = username || _id

            res.redirect(`/online/user/${identifier}`)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


}