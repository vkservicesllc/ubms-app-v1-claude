/* Assets */
import Carrier from '../../../tools/core/carrier.mjs'

const sendError = require('../../../tools/utils/error')

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
            if (!carrier) return sendError.server(res, errMsg)

            let error

            if (!carrier.mc) {
                ({ error } = await carrier.initialize(res.session, req.body))
            } else {
                ({ error } = await carrier.modify(res.session, req.body))
            }

            if (error) return sendError.server(res, error)

            res.redirect(url.company + _companyId)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static update = async (req, res) => {}


}