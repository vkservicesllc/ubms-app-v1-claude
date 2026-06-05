import { privileges } from './permissions.mjs'




export default {
    'd:crr': {
        title: 'Carriers',
        groups: {
            'pub': {
                name: [ 'Public Information',
                    'Logo, MC, USDOT'
                ],
                privileges: [ 0 ],
            },
            'own': {
                name: 'Ownerships',
                privileges: [ 0 ],
            },
            'pri': {
                name: [ 'Sensitive Information',
                    'EIN'
                ],
                privileges: [ 0 ],
            },
        },
    },
    'd:drv': {
        title: 'Drivers',
        groups: {
            'apl': {
                name: 'Applications',
                privileges: [ 0, 1, 2, 3, 5 ],
            },
            'emp': {
                name: 'Previous Employments',
                privileges: [ 0, 2, 3, 4 ],
            },
            'agr': {
                name: 'Pay Agreements',
                privileges: [ 0, 2, 3, 4, 5 ],
            },
            'drv': {
                name: 'Hired Contractors',
                privileges: [ 0, 1, 2, 3, 4 ],
            },
            'lvn': {
                name: 'Leaving Process',
                privileges: '*',
            },
            'lft': {
                name: 'Former Employees',
                privileges: [ 0, 4 ],
            },
        },
    },
    'f:drv': {
        title: 'Driver Files',
        groups: {
            'apl': {
                name: 'Application & Authorizations/Consents',
                format: '.pdf (automatic)',
                privileges: [ 0 ],
            },
            'sup': {
                name: [ 'Application Supporting Documents',
                    "Driver's License, Medical Certificate, Social Security Card, Legal Documents, Vehicle Documents, Additional Authorization/Consent Forms"
                ],
                format: '.pdf, .jpeg, .png',
                privileges: '*',
            },
            'bkg': {
                name: [ 'Background Check',
                    'Clearinghouse, Motor Vehicle Report (MVR), Pre-Employment Screening Program (PSP), etc.'
                ],
                format: '.pdf',
                privileges: '*',
            },
            'hir': {
                name: [ 'Hiring Process',
                    'Drug Test Result, Lease Agreement (LA), Safety Technology Agreement (STA), etc.'
                ],
                format: '.pdf',
                privileges: '*',
            },
            'emp': {
                name: [ 'Previous Employment',
                    'Previous Employment Verification Documents'
                ],
                format: '.pdf',
                privileges: '*',
            },
            'agr': {
                name: 'Pay Agreement',
                format: '.pdf (automatic)',
                privileges: [ 0 ],
            },
        },
    },
    // 'd:vhl': {
    //     title: 'Vehicles/Equipment',
    // },
}











// export default {

//     groups: {
//         'usr': 'Users',
//         'drv': 'Drivers',
//         'vhl': 'Vehicles/Equipment',
//         'reg': 'Vehicle Registration',
//         'ins': 'Insurance',
//     },

//     codes: {

//         // 'v:usr/usr': 'View Users',

//         // 'v:': '', // human resources

//         'v:drv/usr': 'View Drivers',
//         'e:drv/usr': 'Edit Drivers (Correct Errors)',
//         'u:drv/usr': 'Update Drivers',
//         'v:drv/apl': 'View Driver Applications',
//         'c:drv/apl': 'Create Driver Applications',
//         'e:drv/apl': 'Edit Driver Applications',
//         'd:drv/apl': 'Delete Unfinished Applications',

//         'v:vhl/trk': 'View Trucks',
//         'c:vhl/trk': 'Add Trucks',
//         'e:vhl/trk': 'Edit Trucks (Correct Errors)',
//         'd:vhl/trk': 'Delete Unused Trucks',

//         'v:vhl/trl': 'View Trailers',
//         'c:vhl/trl': 'Add Trailers',
//         'e:vhl/trl': 'Edit Trailers (Correct Errors)',
//         'd:vhl/trl': 'Delete Unused Trailers',

//         'v:vhl/van': 'View Vans',
//         'c:vhl/van': 'Add Vans',
//         'e:vhl/van': 'Edit Vans (Correct Errors)',
//         'd:vhl/van': 'Delete Unused Vans',

//         'v:reg/trk': 'View Truck Registrations',
//         'c:reg/trk': 'Create Truck Registrations',
//         'e:reg/trk': 'Edit Truck Registrations (Correct Errors)',
//         'u:reg/trk': 'Update Existing Truck Registrations',
//         'd:reg/trk': 'Delete Redundant Truck Registrations',

//         'v:reg/trl': 'View Trailer Registrations',
//         'c:reg/trl': 'Create Trailer Registrations',
//         'e:reg/trl': 'Edit Trailer Registrations (Correct Errors)',
//         'u:reg/trl': 'Update Existing Trailer Registrations',
//         'd:reg/trl': 'Delete Redundant Trailer Registrations',

//         'v:ins/ins': 'View Insurance Companies',
//         'c:ins/ins': 'Add Insurance Companies',
//         'e:ins/ins': 'Edit Insurance Companies (Correct Errors)',
//         'u:ins/ins': 'Update Insurance Companies',
//         'd:ins/ins': 'Delete Redundant Insurance Companies',

//         'v:ins/plc': 'View Insurance Policies',
//         'c:ins/plc': 'Add Insurance Policies',
//         'e:ins/plc': 'Edit Insurance Policies',
//         'u:ins/plc': 'Update Insurance Policies',
//         'd:ins/plc': 'Delete Insurance Policies',

//         'v:ins/trk': 'View Insured Trucks',
//         'c:ins/trk': 'Add Trucks to Insurance Policies',
//         'e:ins/trk': 'Edit Truck Insurance Policies (Correct Errors)',
//         'u:ins/trk': 'Update Truck Insurance Policies',
//         'd:ins/trk': 'Delete Redundant Truck Insurance Policies',

//         'v:ins/trl': 'View Insured Trailers',
//         'c:ins/trl': 'Add Trailers to Insurance Policies',
//         'e:ins/trl': 'Edit Trailer Insurance Policies (Correct Errors)',
//         'u:ins/trl': 'Update Trailer Insurance Policies',
//         'd:ins/trl': 'Delete Redundant Trailer Insurance Policies',

//         'v:ins/van': 'View Insured Vans',
//         'c:ins/van': 'Add Vans to Insurance Policies',
//         'e:ins/van': 'Edit Vans Insurance Policies (Correct Errors)',
//         'u:ins/van': 'Update Van Insurance Policies',
//         'd:ins/van': 'Delete Redundant Van Insurance Policies',

//     },

// }