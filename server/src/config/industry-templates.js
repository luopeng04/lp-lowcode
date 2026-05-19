module.exports = {
  catering: {
    name: '餐饮',
    categories: ['食材', '酒水', '调料', '餐具'],
    customFields: [
      { entity: 'product', field_name: 'expiry_date', field_label: '保质期', field_type: 'date' },
      { entity: 'product', field_name: 'storage', field_label: '储存条件', field_type: 'select', options: ['常温', '冷藏', '冷冻'] },
    ],
    hideMenus: [],
  },
  retail: {
    name: '零售',
    categories: ['食品', '日用品', '饮料', '烟酒'],
    customFields: [
      { entity: 'product', field_name: 'barcode', field_label: '条码', field_type: 'text' },
    ],
    hideMenus: [],
  },
  clothing: {
    name: '服装',
    categories: ['男装', '女装', '童装', '配饰'],
    customFields: [
      { entity: 'product', field_name: 'color', field_label: '颜色', field_type: 'text' },
      { entity: 'product', field_name: 'size', field_label: '尺码', field_type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] },
      { entity: 'product', field_name: 'season', field_label: '季节', field_type: 'select', options: ['春', '夏', '秋', '冬'] },
    ],
    hideMenus: [],
  },
  wholesale: {
    name: '批发',
    categories: [],
    customFields: [
      { entity: 'customer', field_name: 'credit_limit', field_label: '信用额度', field_type: 'number' },
    ],
    hideMenus: [],
  },
  general: {
    name: '通用',
    categories: [],
    customFields: [],
    hideMenus: [],
  },
}
