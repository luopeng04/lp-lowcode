const createCrudRoutes = require('../services/crud-service')

module.exports = createCrudRoutes({
  table: 'suppliers',
  fields: ['code', 'name', 'contact', 'phone', 'address', 'remark', 'custom_data'],
  searchFields: ['code', 'name', 'contact'],
  entityName: '供应商',
  jsonFields: ['custom_data'],
})
