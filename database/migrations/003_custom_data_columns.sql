-- 为老的租户模板库补充 custom_data/remark 列；可重复执行
USE lp_tenant_template;

DELIMITER //
CREATE PROCEDURE add_column_if_missing(
  IN target_table VARCHAR(64),
  IN target_column VARCHAR(64),
  IN alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = target_table
      AND COLUMN_NAME = target_column
  ) THEN
    SET @stmt = alter_sql;
    PREPARE add_column_stmt FROM @stmt;
    EXECUTE add_column_stmt;
    DEALLOCATE PREPARE add_column_stmt;
  END IF;
END//
DELIMITER ;

CALL add_column_if_missing('suppliers', 'custom_data', 'ALTER TABLE suppliers ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER remark');
CALL add_column_if_missing('customers', 'remark', 'ALTER TABLE customers ADD COLUMN remark VARCHAR(500) AFTER address');
CALL add_column_if_missing('customers', 'custom_data', 'ALTER TABLE customers ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER remark');
CALL add_column_if_missing('purchase_orders', 'custom_data', 'ALTER TABLE purchase_orders ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER ordered_at');
CALL add_column_if_missing('sales_orders', 'custom_data', 'ALTER TABLE sales_orders ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER ordered_at');
CALL add_column_if_missing('purchase_order_items', 'custom_data', 'ALTER TABLE purchase_order_items ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER amount');
CALL add_column_if_missing('sales_order_items', 'custom_data', 'ALTER TABLE sales_order_items ADD COLUMN custom_data JSON COMMENT ''自定义字段值'' AFTER amount');

DROP PROCEDURE add_column_if_missing;
