const createCrudRoutes = require('../services/crud-service')

module.exports = createCrudRoutes({
  table: 'customers',
  fields: ['code', 'name', 'contact', 'phone', 'address', 'remark', 'custom_data'],
  searchFields: ['code', 'name', 'contact'],
  entityName: '客户',
  jsonFields: ['custom_data'],
})
