import User from "./server/tools/core/user.v2.mjs"

const data = {
    id: 2,
    _id: '12345abcdef',
    _simpleId: '123abc',
    username: 'john-doe',
    email: 'john-d@bogus.xyz',
    phone: '0123456789',
    status: 'A',
    condition: 'A',
    location: 'UA',
    firstName: 'Eric',
    lastName: 'Doe',
    alias: 'John',
    sex: 1,
    decliner: 0,
}

const user = new User(data)

console.log(user)