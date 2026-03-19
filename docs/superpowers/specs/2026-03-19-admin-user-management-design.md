# 管理员用户管理系统 — 设计文档

> 日期: 2026-03-19
> 状态: 已批准

---

## 1. 概述

### 目标

为 Drama Studio 平台添加管理员级别的用户管理能力，使管理员能查看、搜索、编辑、禁用、删除用户及重置密码。

### 背景

现有系统已具备完整的用户认证（注册/登录/JWT）和团队管理（CRUD + 成员管理），但缺少系统级管理员概念和用户管理后台。团队内的 `owner/editor/viewer` 角色仅控制团队级权限，无法执行跨团队的用户管理操作。

### 范围

本期实现：
- 系统级 admin/user 角色
- 管理员用户管理 CRUD API
- 管理后台前端页面
- 第一个注册用户自动成为管理员
- 被禁用用户无法登录

本期不做（后续迭代）：
- 用户活动审计日志
- 细粒度权限（permissions 表）
- 邮件通知（密码重置通知等）
- 用户个人资料编辑页

---

## 2. 数据模型变更

### users 表新增字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `role` | `VARCHAR(20) NOT NULL` | `'user'` | 系统角色，取值 `'admin'` 或 `'user'` |
| `is_active` | `BOOLEAN NOT NULL` | `true` | 账户是否启用 |

### Migration

文件: `migrations/20260319200000_add_user_role_active.ts`

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.string('role', 20).notNullable().defaultTo('user')
    t.boolean('is_active').notNullable().defaultTo(true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('role')
    t.dropColumn('is_active')
  })
}
```

### 类型更新

`app/core/types/user.ts`:

```typescript
export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  password_hash: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type UserPublic = Omit<User, 'password_hash'>
```

---

## 3. 业务规则

### 第一个用户自动成为管理员

在 `AuthService.register()` 中：
1. 查询 users 表总行数
2. 如果是第一个用户，设 `role = 'admin'`
3. 否则设 `role = 'user'`

### 登录时检查 is_active

在 `AuthService.login()` 和 `AuthService.getUser()` 中：
- 如果 `is_active === false`，拒绝登录/返回 401，提示"账户已被禁用"

### 管理员操作安全规则

| 操作 | 限制 |
|------|------|
| 禁用自己 | 禁止，返回 400 |
| 删除自己 | 禁止，返回 400 |
| 修改自己的角色 | 禁止，返回 400 |
| 删除用户 | 允许（外键已设 `ON DELETE SET NULL`，用户创建的项目/团队保留） |
| 重置密码 | 生成随机临时密码，返回给管理员 |

---

## 4. API 设计

### 权限保护

所有 `/api/admin/*` 端点需要：
1. 有效的 JWT token（已有 auth middleware）
2. 当前用户 `role === 'admin'`（新增 `requireAdmin` 检查）

### 工具函数

文件: `server/utils/admin.ts`

```typescript
export async function requireAdmin(event: H3Event): Promise<void> {
  const userId = event.context.userId
  const user = await UserModel.findById(userId)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '需要管理员权限' })
  }
}
```

### API 端点

#### GET `/api/admin/users`

用户列表，支持搜索和分页。

**Query 参数:**
| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `q` | string | - | 按名称或邮箱模糊搜索 |
| `role` | string | - | 按角色筛选（`admin` / `user`） |
| `is_active` | string | - | 按状态筛选（`true` / `false`） |
| `page` | number | 1 | 页码 |
| `per_page` | number | 20 | 每页数量 |

**响应:** `{ success: true, data: UserPublic[], meta: { total, page, per_page, total_pages } }`

#### GET `/api/admin/users/:uid`

单个用户详情。

**响应:** `{ success: true, data: UserPublic }`

#### PUT `/api/admin/users/:uid`

修改用户信息。

**Body:**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 用户名称 |
| `role` | string | 否 | `'admin'` 或 `'user'` |
| `is_active` | boolean | 否 | 启用/禁用 |

**安全检查:** 管理员可以修改自己的 `name`，但不允许修改自己的 `role` 或 `is_active`。如果请求中包含对自己的 role 或 is_active 修改，返回 400。

**响应:** `{ success: true, data: UserPublic }`

#### DELETE `/api/admin/users/:uid`

删除用户。

**安全检查:** 不允许删除自己。

**响应:** `{ success: true, data: { deleted: true } }`

#### PUT `/api/admin/users/:uid/reset-password`

重置用户密码。

**响应:** `{ success: true, data: { temporary_password: string } }`

临时密码为 12 位随机字母数字字符串，经 bcrypt 哈希后存入数据库。

---

## 5. 服务层设计

### AdminService

文件: `app/core/services/admin.service.ts`

负责管理员用户管理的业务逻辑。

```typescript
export const AdminService = {
  async listUsers(filters): Promise<{ users: UserPublic[], total: number }>
  async getUser(userId: string): Promise<UserPublic>
  async updateUser(userId: string, data, operatorId: string): Promise<UserPublic>
  async deleteUser(userId: string, operatorId: string): Promise<void>
  async resetPassword(userId: string, operatorId: string): Promise<string>
}
```

每个方法的安全检查（不能操作自己）在 service 层执行，而非 API handler 层，确保业务逻辑集中。

### UserModel 扩展

文件: `app/core/models/user.model.ts`

新增方法：
- `countAll()`: 返回用户总数（用于第一个用户检测）
- `findAll(filters)`: 带筛选和分页的用户列表
- `delete(id)`: 删除用户
- `updatePassword(id, hash)`: 更新密码哈希

---

## 6. 前端设计

### 侧边栏更新

文件: `app/components/layout/AppSidebar.vue`

- 新增"管理"导航项，图标使用 `Shield`（来自 lucide-vue-next）
- 仅当 `user.role === 'admin'` 时显示
- 路由: `/admin`

### 路由守卫

在 `app/middleware/auth.global.ts` 中添加：
- 如果路径以 `/admin` 开头且用户 `role !== 'admin'`，重定向到首页

### 管理后台页面

文件: `app/pages/admin/index.vue`

**布局:** 复用 `AppLayout`

**功能区域:**
1. **顶部:** 标题"用户管理" + 搜索框 + 角色筛选 + 状态筛选
2. **表格:** 用户列表
   - 列: 头像+名称、邮箱、角色（Badge）、状态（Badge）、注册时间、操作
   - 操作按钮: 编辑、禁用/启用、重置密码、删除
3. **分页:** 底部分页控件

**弹窗:**
- 编辑用户 Dialog: 修改名称和角色
- 禁用/启用确认 ConfirmDialog
- 删除确认 ConfirmDialog（危险操作红色主题）
- 重置密码结果 Dialog: 显示临时密码 + 复制按钮

### Zod 验证

文件: `server/schemas/admin.ts`

```typescript
export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional(),
})

export const listUsersSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})
```

---

## 7. Seed 数据更新

文件: `seeds/01_dev_seed.ts`

更新现有 seed 脚本：
- 第一个用户（开发/测试用）设 `role: 'admin', is_active: true`
- 其余用户设 `role: 'user', is_active: true`

---

## 8. 测试策略

### 后端测试

- AdminService 单元测试
  - 列出用户（带搜索/筛选/分页）
  - 修改用户角色
  - 禁用/启用用户
  - 删除用户
  - 重置密码
  - 不能操作自己的安全规则
- AuthService 修改测试
  - 第一个用户自动成为 admin
  - 被禁用用户无法登录

### 前端测试（手动）

- 管理员可以看到侧边栏"管理"入口
- 普通用户看不到"管理"入口
- 用户列表、搜索、筛选
- 编辑/禁用/删除/重置密码操作
- 安全规则（不能操作自己）

---

## 9. 影响的现有文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `app/core/types/user.ts` | 修改 | 添加 role, is_active 字段 |
| `app/core/models/user.model.ts` | 修改 | 新增查询方法 |
| `app/core/services/auth.service.ts` | 修改 | 第一个用户逻辑 + is_active 检查 |
| `app/composables/useAuth.ts` | 无需修改 | UserPublic 类型更新自动生效 |
| `app/components/layout/AppSidebar.vue` | 修改 | 添加管理导航 |
| `app/middleware/auth.global.ts` | 修改 | 添加 admin 路由守卫 |
| `seeds/01_dev_seed.ts` | 修改 | 添加 role/is_active 字段 |

---

## 10. 新增文件清单

| 文件 | 说明 |
|------|------|
| `migrations/20260319200000_add_user_role_active.ts` | 数据库迁移 |
| `server/utils/admin.ts` | requireAdmin 工具函数 |
| `server/schemas/admin.ts` | Zod 验证 schema |
| `server/api/admin/users/index.get.ts` | 用户列表 API |
| `server/api/admin/users/[uid]/index.get.ts` | 用户详情 API |
| `server/api/admin/users/[uid]/index.put.ts` | 修改用户 API |
| `server/api/admin/users/[uid]/index.delete.ts` | 删除用户 API |
| `server/api/admin/users/[uid]/reset-password.put.ts` | 重置密码 API |
| `app/core/services/admin.service.ts` | 管理员业务逻辑 |
| `app/pages/admin/index.vue` | 管理后台页面 |
