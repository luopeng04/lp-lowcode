const express = require('express')
const cors = require('cors')
const tenantMiddleware = require('./middleware/tenant')
const errorHandler = require('./middleware/error-handler')
const routes = require('./routes')
const authRoutes = require('./routes/auth')
const warehouseRoutes = require('./routes/warehouses')

const app = express()

app.use(cors())
app.use(express.json())

// Auth routes don't need tenant middleware
app.use(authRoutes)

app.use(tenantMiddleware)
app.use(warehouseRoutes)
app.use(routes)
app.use(errorHandler)

module.exports = app
