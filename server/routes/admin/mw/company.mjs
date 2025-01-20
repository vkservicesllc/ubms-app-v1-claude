import Company, { Owner } from '../../../assets/company.mjs'

const throwErr = require('../../../tools/error').data

const url = {
    companies: '/business/companies',
    owners: '/business/company-owners',
}
const errMsg = {
    company: 'Server Internal Error: Company not found',
    owner: 'Server Internal Error: Company Owner not found',
}



export default class {


    static add = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static modify = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static update = async (req, res) => { // name
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.body

            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const { error } = await company.delete(res.session)
            if (error) return throwErr.server(res, error)

            res.redirect(url.companies)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertOwnership = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateOwnership = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertAddress = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateAddress = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertContacts = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateContact = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertOwner = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateOwner = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static deleteOwner = async (req, res) => {
        try {
            const { _id } = req.body

            const owner = await Owner.data(res.session, { _id })
            if (!owner) return throwErr.server(res, errMsg.owner)

            const { error } = await owner.delete(res.session)
            if (error) return throwErr.server(res, error)

            res.redirect(url.owners)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


}