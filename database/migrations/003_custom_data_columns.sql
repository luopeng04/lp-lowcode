-- 为各实体表添加 custom_data JSON 列，支持自定义字段值存储
-- 如果表已存在（模板库），用 ALTER；新注册商户的模板表已在 002 中同步修改

ALTER TABLE suppliers ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER remark;
ALTER TABLE customers ADD COLUMN remark VARCHAR(500) AFTER address;
ALTER TABLE customers ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER remark;
ALTER TABLE purchase_orders ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER ordered_at;
ALTER TABLE sales_orders ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER ordered_at;
ALTER TABLE purchase_order_items ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER amount;
ALTER TABLE sales_order_items ADD COLUMN custom_data JSON COMMENT '自定义字段值' AFTER amount;
