import { calculateYearAge } from '../utils/date.mjs'
import { formSelect } from '../utils/html/form.mjs'



class Person {
    constructor(data) {
        if (!data?.firstName || !data?.lastName) throw new Error('Invalid Person Data')

        this.prefix = data.prefix || data.pfx || null
        this.firstName = data.firstName || data.fname
        this.middleName = data.middleName || data.mname || null
        this.lastName = data.lastName || data.lname
        this.suffix = data.suffix || data.sfx || null
        this.alias = data.alias || null
        this.dob = data.dob || null
        this.age = this.dob ? calculateYearAge(this.dob) : null
        this.gender = data.gender || 'X'
        this.expansion = {
            gender: data.gender ? { 'M': 'Male', 'F': 'Female' }[data.gender] : null,
        }
    }


    fullName(placeholder = 'FmLs') {
        if (!this.firstName || !this.lastName) return null

        const chars = [ ...placeholder ]
        let pfx = ''
        let fname = ''
        let nick = ''
        let mname = ''
        let lname = ''
        let sfx = ''

        if (placeholder[0] === 'p' && this.prefix)
            pfx = `${this.prefix}.`

        if (placeholder.includes('F')) fname = this.firstName
        else if (placeholder.includes('f')) fname = `${this.firstName[0]}.`

        if (placeholder.includes('A')) {
            if (!placeholder.includes('F') && !placeholder.includes('f'))
                nick = this.alias || this.firstName
            else nick = this.alias ? `"${this.alias}"` : ''
        }
        else if (placeholder.includes('a'))
            nick = `${this.alias ? this.alias[0] : this.firstName[0]}.`

        if (this.middleName) {
            if (placeholder.includes('M')) mname = this.middleName
            else if (placeholder.includes('m')) mname = `${this.middleName[0]}.`
        }

        if (placeholder.includes('L')) lname = this.lastName
        else if (placeholder.includes('l')) lname = `${this.lastName[0]}.`

        if (placeholder[placeholder.length - 1] === 's' && this.suffix)
            sfx = `, ${this.suffix}`

        const chunks = chars.map(char => {
            return char.replace(char, {
                'p': pfx,
                'F': fname,
                'f': fname,
                'A': nick,
                'a': nick,
                'M': mname,
                'm': mname,
                'L': lname,
                'l': lname,
                's': sfx,
            }[char])
        })

        return chunks.join('  ').replace(/\s+/g, ' ').replace(' ,', ',').trim()
    }


    fullFirstName(middleAbbr = true) {
        if (!this.firstName) return null

        let { firstName, middleName }= this
        if (middleName) {
            if (middleAbbr) middleName = middleName[0] + '.'
            firstName += ` ${middleName}`
        }

        return firstName
    }


    fullLastName() {
        if (!this.lastName) return null

        let { lastName, suffix } = this
        if (suffix) lastName += `, ${suffix}`

        return lastName
    }


}



export default Person
export class Relationship {}