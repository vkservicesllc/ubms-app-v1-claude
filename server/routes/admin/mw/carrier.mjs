/* Assets */
import Carrier from '../../../tools/core/carrier.mjs'

const throwErr = require('../../../tools/utils/error').data

const url = {
    company: '/business/company/',
    carrier: '',
}
const errMsg = 'Server Internal Error: Carrier not found'



export default class {


    static upsert = async (req, res) => {
        try {
            const { _companyId } = req.params
            const carrier = await Carrier.data(res.session, { _companyId })
            if (!carrier) return throwErr.server(res, errMsg)

            let error

            if (!carrier.mc) {
                ({ error } = await carrier.initialize(res.session, req.body))
            } else {
                ({ error } = await carrier.modify(res.session, req.body))
            }

            if (error) return throwErr.server(res, error)

            res.redirect(url.company + _companyId)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static update = async (req, res) => {}


}