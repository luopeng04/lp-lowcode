const express = require('express')
const cors = require('cors')
const tenantMiddleware = require('./middleware/tenant')
const errorHandler = require('./middleware/error-handler')
const routes = require('./routes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(tenantMiddleware)
app.use(routes)
app.use(errorHandler)

module.exports = app
