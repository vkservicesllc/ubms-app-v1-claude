import { calculateYearAge } from '../utils/date.mjs'
import { formSelect } from '../utils/html/form.mjs'



class Person {
    constructor(data = {}) {
        if (data?.firstName && data?.lastName) {

            this.sex = data.sex !== undefined ? data.sex : data.gender
            if (typeof this.sex === 'string') {
                this.sex = this.sex.toLowerCase()
                if (!['male', 'female', 'm', 'f', '1', '0'].includes(this.sex))
                    this.sex = null
            }
            switch (this.sex) {
                case 'male':
                case 'm':
                case '1':
                case 1:
                case true:
                    this.sex = 1
                    this.gender = [ 'M', 'Male' ]
                    break
                case 'female':
                case 'f':
                case '0':
                case 0:
                case false:
                    this.sex = 0
                    this.gender = [ 'F', 'Female' ]
                    break
                default:
                    this.sex = null
                    this.gender = null
            }

            this.prefix = data.prefix || data.pfx || null
            this.firstName = data.firstName || data.fname
            this.middleName = data.middleName || data.mname || null
            this.lastName = data.lastName || data.lname
            this.suffix = data.suffix || data.sfx || null
            this.alias = data.alias || null

            this.dob = data.dob || null
            this.age = this.dob ? calculateYearAge(this.dob) : null
        }
    }

    static prefixList = {
        'Mr': 'Mister',
        'Mrs': 'Mistress',
        'Ms': 'Miss',
    }

    static suffixList = {
        'Sr': 'Senior (I)',
        'Jr': 'Junior (II)',
        'II': 'II',
        'III': 'III',
        'IV': 'IV',
        'V': 'V',
    }

    static genderList = {
        'M': 'Male',
        'F': 'Female',
    }

    static maritalList = {
        's': 'Single',
        'm': 'Married',
        'd': 'Divorced',
        'p': 'Separated',
        'w': 'Widowed',
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


    static formSelect(target, props) {
        if (target !== 'prefix' && target !== 'suffix' && target !== 'gender') return

        let data = Person[`${target}List`]
        const options = props.options ? { ...props.options } : {}

        if (!options.emptyOpt) options.emptyOpt = ''
        if (!options.valOpt) options.valOpt = true
        if (target === 'gender') options.valOpt = false

        return formSelect(props, data, options)
    }


}


class Relationship {

    static list = {
        'Spouse': [['Husband', 'M'], ['Wife', 'F']],
        'Parent': [['Father', 'M'], ['Mother', 'F'], ['Stepfather', 'M'], ['Stepmother', 'F']],
        'Child': [['Son', 'M'], ['Daughter', 'F'], ['Stepson', 'M'], ['Stepdaughter', 'F']],
        'Sibling': [['Brother', 'M'],  ['Sister', 'F'], ['Stepbrother', 'M'], ['Stepsister', 'F']],
        'Grandparent': [['Grandfather', 'M'], ['Grandmother', 'F']],
        'Grandchild': [['Grandson', 'M'], ['Granddaughter', 'F']],
        'Immediate In-Law': [['Father-in-law', 'M'], ['Mother-in-law', 'F'], ['Son-in-law', 'M'], ['Daughter-in-law', 'F'], ['Brother-in-law', 'M'], ['Sister-in-law', 'F']],
        'Other': [['Uncle', 'M'], ['Aunt', 'F'], ['Nephew', 'M'], ['Niece', 'F'], 'Cousin', 'Fiancé(e)', 'Friend', 'Domestic Partner', 'Other'],
    }

    static data = () => {
        const list = Relationship.list
        const data = {}

        for (const group in list) {
            data[group] = {}

            for (let relation of list[group]) {
                if (Array.isArray(relation)) relation = relation[0]
                data[group][relation] = relation
            }
        }

        return data
    }

    static gender = member => {
        let gender = null
        const list = Relationship.list

        groupLoop:
        for (const group in list) {
            for (let relation of list[group]) {
                if (!Array.isArray(relation)) continue
                if (relation[0] === member) {
                    gender = relation[1]
                    break groupLoop
                }
            }
        }

        return gender
    }

}



export default Person
export { Relationship }