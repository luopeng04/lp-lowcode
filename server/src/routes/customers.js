const createCrudRoutes = require('../services/crud-service')

module.exports = createCrudRoutes({
  table: 'customers',
  fields: ['code', 'name', 'contact', 'phone', 'address', 'remark'],
  searchFields: ['code', 'name', 'contact'],
  entityName: '客户',
})
