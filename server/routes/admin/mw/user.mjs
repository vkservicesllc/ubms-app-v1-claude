import User, { Role } from '../../../tools/core/user.mjs'
import Company from '../../../tools/core/company.mjs'

const sendError = require('../../../tools/utils/error')

const url = '/online/users'
const errMsg = {
    user: 'Server Internal Error: User not found',
    role: 'Server Internal Error: User Role not found',
}



export default class {


    static resetValidation = async (req, res, next) => {
        const { _id, location } = req.body

        if (_id) {
            const user = await User.data(res.session, { _id })

            if (user.status[0] == 'D') {
                req.body.status = 'D'
                req.body.location = 'US'
            } else if (!location)
                req.body.location = user.location[0]
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
    
        if (error) return sendError.server(res, error)
    
        try {
            const { _id } = body
            delete body._id
    
            if (!_id) {
                const { error } = await User.create(session, body)
                if (error) return sendError.server(res, error)
            } else {
                const user = await User.data(session, { _id })
                if (!user) return sendError.server(res, errMsg.user)
    
                const { error } = await user.modify(session, body)
                if (error) return sendError.server(res, error)
            }
    
            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static modifyCondition = async (req, res) => {
        try {
            const { _id, condition } = req.body
    
            const user = await User.data(res.session, { _id })
            if (!user) return sendError.server(res, errMsg.user)
    
            const { error } = await user.modify(res.session, { condition })
            if (error) return sendError.server(res, error)
    
            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.body
    
            const user = await User.data(res.session, { _id })
            if (!user) return sendError.server(res, errMsg.user)
    
            const { error } = await user.delete(res.session)
            if (error) return sendError.server(res, error)
    
            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static reset = async (req, res) => {
        try {
            const { _id } = req.body
    
            const user = await User.data(res.session, { _id })
            if (!user) return sendError.server(res, errMsg.user)
    
            const { error } = await user.reset(res.session)
            if (error) return sendError.server(res, error)
    
            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static upsertRole = async (req, res) => {
        try {
            const { category } = req.params
            const { _id } = req.body
            delete req.body._id

            const catList = Company.categoryList
            let catId, error

            if (!category) catId = 'def'
            else
                for (const key in catList) {
                    if (category != catList[key].path[1]) continue

                    catId = key
                    break
                }
            if (!catId) return sendError.server(res, 'Server Internal Error: Category not found')

            const data = { ...req.body, catId }

            if (_id) {
                const role = await Role.data(res.session, { _id })
                if (!role) return sendError.server(res, errMsg.role)
                else {
                    ({ error } = await role.modify(res.session, data))
                }
            } else {
                ({ error } = await Role.create(res.session, data))
            }

            if (error) return sendError.server(res, error)

            res.redirect(`${url}?role=${catId}`)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static deleteRole = async (req, res) => {
        try {
            const { _id } = req.body
            const role = await Role.data(res.session, { _id })

            const { error } = await role.delete(res.session)

            if (error) return sendError.server(res, error)

            res.redirect(`${url}?role=${role.catId}`)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static updateRoles = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, roles: _roleIds } = req.body
            const user = await User.data(res.session, { _id })

            const { error } = await user.roles(res.session, action, _roleIds)
            if (error) return sendError.server(res, error)

            const { username } = user
            const identifier = username || _id

            res.redirect(`/online/user/${identifier}`)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static updateTeams = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, teams: _teamIds } = req.body
            const user = await User.data(res.session, { _id })

            const { error } = await user.relationship(res.session, 'teams', action, _teamIds)
            if (error) return sendError.server(res, error)

            const { username } = user
            const identifier = username || _id

            res.redirect(`/online/user/${identifier}`)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static updateCompanies = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, companies: _companyIds } = req.body
            const user = await User.data(res.session, { _id })

            const { error } = await user.relationship(res.session, 'companies', action, _companyIds)
            if (error) return sendError.server(res, error)

            const { username } = user
            const identifier = username || _id

            res.redirect(`/online/user/${identifier}`)
        } catch (err) {
            sendError.server(res, err)
        }
    }


}