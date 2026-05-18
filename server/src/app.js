const express = require('express')
const cors = require('cors')
const tenantMiddleware = require('./middleware/tenant')
const { operatorMiddleware } = require('./middleware/operator')
const errorHandler = require('./middleware/error-handler')
const routes = require('./routes')
const authRoutes = require('./routes/auth')
const warehouseRoutes = require('./routes/warehouses')
const supplierRoutes = require('./routes/suppliers')
const customerRoutes = require('./routes/customers')
const productRoutes = require('./routes/products')
const operatorRoutes = require('./routes/operators')

const app = express()

app.use(cors())
app.use(express.json())

// Auth routes don't need tenant middleware
app.use(authRoutes)

app.use(tenantMiddleware)
app.use(operatorMiddleware)
app.use(warehouseRoutes)
app.use(supplierRoutes)
app.use(customerRoutes)
app.use(productRoutes)
app.use(operatorRoutes)
app.use(routes)
app.use(errorHandler)

module.exports = app
