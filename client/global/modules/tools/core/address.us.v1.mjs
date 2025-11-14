import escapeHTML from '../utils/html.mjs'



export default class Address {
    constructor(data) {
        this.address1 = data.address1
        this.address2 = data.address2
        this.city = data.city
        this.state = [ data.state, Address.stateList[data.state] ] // withdraw US States and add key
        if (!this.state[1]) this.state = data.state
        this.zip = data.zip
    }


    html(options = {}) {
        const { address1, address2, city, state, zip } = this
        if (!address1 || !city || !state || !zip) return

        let { inline, singleLine, stateIdx } = options
        if (inline === undefined || typeof inline !== 'boolean')
            inline = true
        if (singleLine === undefined || typeof singleLine !== 'boolean')
            singleLine = true
        if (stateIdx === undefined || ![0, 1].includes(stateIdx))
            stateIdx = 0

        const _ = ', '
        const divider = !inline ? '<br/>' : _

        let html = `<span class="us-address us-addr1">${escapeHTML(address1)}</span>`
        if (address2)
            html += `${singleLine ? _ : divider}<span class="us-address us-addr2">${escapeHTML(address2)}</span>`
        html += `${divider}<span class="us-address us-city">${escapeHTML(city)}</span>,`
        html += ` <span class="us-address us-state">${state[stateIdx]}</span>`
        html += ` <span class="us-address us-zip">${escapeHTML(zip)}</span>`

        return html
    }


    static stateList = {

        'DC': 'District of Columbia',  // Technically not a State

        'AL': 'Alabama',
        'AK': 'Alaska',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'FL': 'Florida',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming',

    }


}