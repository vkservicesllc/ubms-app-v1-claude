import { apps } from './config.mjs'
import runServer from './server.mjs'


for (const branch in apps) runServer(branch)