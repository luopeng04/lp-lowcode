# lp 低代码开发平台

面向小商家的 SaaS 进销存系统。手机号注册即用，多租户独立数据库。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Vue Router |
| 后端 | Node.js + Express 5 |
| 数据库 | MySQL，每商户独立数据库 |
| 认证 | bcrypt 密码哈希，角色权限 |

## 快速启动

```bash
# 1. 初始化数据库
mysql -u root -p < database/migrations/001_platform.sql
mysql -u root -p < database/migrations/002_tenant_template.sql

# 2. 配置数据库连接
cp server/.env.example server/.env
# 编辑 server/.env 填写数据库密码

# 3. 启动后端
cd server
npm install
npm run dev          # → http://localhost:3000

# 4. 启动前端
cd client
npm install
npm run dev          # → http://localhost:5173
```

## 项目结构

```
├── client/                  # Vue 3 前端
│   └── src/
│       ├── assets/          # 共享 CSS
│       ├── components/      # 通用组件
│       ├── layouts/         # 布局组件
│       ├── router/          # 路由配置
│       └── views/           # 页面组件
├── server/                  # Node.js 后端
│   └── src/
│       ├── config/          # 数据库连接池
│       ├── middleware/      # 租户、操作员、限流
│       ├── routes/          # API 路由
│       └── services/        # 业务服务
└── database/
    └── migrations/          # SQL 建表脚本
```

## 功能

### 账号与权限
- 手机号注册，自动创建独立数据库
- 三角色权限：管理员 / 操作员 / 只读
- 菜单级权限控制，API 写保护

### 基础数据
- 仓库管理（多仓库，默认仓库）
- 供应商管理、客户管理
- 商品管理（含自定义字段）

### 进销存核心
- **采购单**：开单 → 审核 → 入库 → 库存自动更新（移动加权平均）
- **销售单**：开单 → 审核 → 出库 → 库存自动扣减（库存不足阻止）
- **库存查询**：按仓库/分类筛选，安全库存预警
- **库存流水**：出入库明细追溯
- **库存盘点**：录入实盘数量，自动计算差异并记录流水

### 报表与导出
- 销售统计（按日/周/月）、利润分析、采购汇总、库存周转率
- 柱状图可视化
- 库存汇总 / 库存流水导出 CSV（Excel 兼容）
- 采购单 / 销售单 A4 浏览器打印

## API 概览

| 模块 | 端点 |
|---|---|
| 认证 | `POST /api/auth/register` `POST /api/auth/login` |
| 仓库 | `GET/POST /api/warehouses` `PUT/DELETE /api/warehouses/:id` |
| 供应商 | `GET/POST /api/suppliers` `PUT/DELETE /api/suppliers/:id` |
| 客户 | `GET/POST /api/customers` `PUT/DELETE /api/customers/:id` |
| 商品 | `GET/POST /api/products` `PUT/DELETE /api/products/:id` |
| 采购单 | `GET/POST /api/purchase-orders` `PUT confirm/receive` |
| 销售单 | `GET/POST /api/sales-orders` `PUT confirm/deliver` |
| 库存 | `GET /api/inventory` `GET /api/inventory-ledgers` `POST /api/inventory-check` |
| 报表 | `GET /api/reports/sales-summary` `profit` `purchase-summary` `turnover` |
| 导出 | `GET /api/export/inventory` `GET /api/export/inventory-ledger` |

所有业务 API 需传 `X-Tenant-Id` 请求头，写操作还需 `X-Operator-Id`。

## 多租户

- 平台库 `lp_platform` 存租户元数据
- 模板库 `lp_tenant_template` 定义表结构
- 注册时复制模板库 → `lp_tenant_{phone}`
- 中间件解析 `X-Tenant-Id` 动态切换连接池
