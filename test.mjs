import User, { Role } from "./server/tools/core/user.mjs"
import Team from "./server/tools/core/team.mjs"
import Individual from "./server/tools/core/individual.mjs"
import Company, { Owner } from "./server/tools/core/company.mjs"
import Carrier from "./server/tools/core/carrier.mjs"


const user = await User.fetch(res.session, { _id })

user.add('jx.roles', ids)
user.add('jx.teams', ids)
user.add('jx.companies', ids)

user.fetch('jx.roles')
user.fetch('jx.teams')
user.fetch('jx.companies')

user.update(req.body)

user.delete('jx.roles', ids)
user.delete('jx.teams', ids)
user.delete('jx.companies', ids)


const role = await Role.fetch(res.session, { _id })

role.add('jx.users', ids)

role.fetch('jx.users')

role.delete()
role.delete('jx.users', ids)


const team = await Team.fetch(res.session, { id })

team.add('profile', req.body)
team.add('jx.users', ids)

team.fetch('jx.users')

team.update(req.body)
team.update('profile', req.body)

team.delete()
team.delete('profile')
team.delete('jx.users', ids)