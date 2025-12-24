// ==== IMPORT ==== //

const router = require('express').Router()

/* Middleware */
import {
    applicationStart, applicationLogin, applicationProgress,
    applicationSummary, applicationDocuments, applicationAgreement,
} from './mw/application.mjs'



// ==== ROUTES ==== //


router.get('/:param?', applicationStart, applicationLogin, applicationProgress)

router.get('/:formId/summary', applicationSummary)

router.get('/:formId/documents', applicationDocuments)

router.get('/:formId/agreement', applicationAgreement)



// ==== EXPORT ==== //

export default router