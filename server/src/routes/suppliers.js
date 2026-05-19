const createCrudRoutes = require('../services/crud-service')

module.exports = createCrudRoutes({
  table: 'suppliers',
  fields: ['code', 'name', 'contact', 'phone', 'address', 'remark'],
  searchFields: ['code', 'name', 'contact'],
  entityName: '供应商',
})
