# 管理员用户管理系统 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Drama Studio 平台添加系统级管理员角色和用户管理后台，使管理员能查看、搜索、编辑、禁用、删除用户及重置密码。

**Architecture:** 延续既有三层架构（Model → Service → API handler）。users 表新增 `role` 和 `is_active` 字段，新增 AdminService 处理管理员业务逻辑，新增 `/api/admin/users` 系列 API，前端新增 `/admin` 管理页面。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Knex.js, PostgreSQL, Shadcn-vue (Dialog/Badge/Button/Input), TailwindCSS v4, Lucide icons, Zod v4, bcryptjs

**IMPORTANT - `useApi` unwraps responses:** `$api` 自动解包 `{ success: true, data: T }`，调用时直接得到 `T`。

**IMPORTANT - API Handler Pattern:** 所有 API handler 使用 `defineApiHandler`，内部可用 `ok()` / `paginated()` / `badRequest()` / `forbidden()` / `notFound()` 等自动导入的工具函数。

**IMPORTANT - Error Pattern:** core 层 service/model 使用 `app/core/errors.ts` 中的 `badRequestError()` / `notFoundError()` / `forbiddenError()`，它们抛出 `AppError`，由 `defineApiHandler` 统一捕获转换为 HTTP 错误。

**IMPORTANT - Zod Import:** 使用 `import { z } from 'zod/v4'`。

**Spec:** `docs/superpowers/specs/2026-03-19-admin-user-management-design.md`

---

## File Structure

```
migrations/
└── 20260319200000_add_user_role_active.ts        # 新建: users 表加 role + is_active

app/core/
├── types/user.ts                                  # 修改: User/UserPublic 增加 role, is_active
├── models/user.model.ts                           # 修改: 新增 countAll, findAll, delete, updatePassword
├── services/auth.service.ts                       # 修改: 第一个用户 auto-admin + is_active 检查
└── services/admin.service.ts                      # 新建: 管理员用户管理业务逻辑

server/
├── utils/admin.ts                                 # 新建: requireAdmin 工具函数
├── schemas/admin.ts                               # 新建: Zod 验证 schema
└── api/admin/users/
    ├── index.get.ts                               # 新建: 用户列表
    ├── [uid]/
    │   ├── index.get.ts                           # 新建: 用户详情
    │   ├── index.put.ts                           # 新建: 修改用户
    │   ├── index.delete.ts                        # 新建: 删除用户
    │   └── reset-password.put.ts                  # 新建: 重置密码

app/
├── components/layout/AppSidebar.vue               # 修改: 添加管理导航（仅 admin 可见）
├── middleware/auth.global.ts                      # 修改: 添加 admin 路由守卫
└── pages/admin/index.vue                          # 新建: 管理后台用户列表页

seeds/
└── 01_dev_seed.ts                                 # 修改: 添加 role/is_active 字段
```

---

## Chunk 1: 后端 — 数据模型 + 类型 + Auth 改造

### Task 1: 数据库 Migration

**Files:**
- Create: `migrations/20260319200000_add_user_role_active.ts`

- [ ] **Step 1: 创建 migration 文件**

```typescript
import type { Knex } from 'knex'

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

- [ ] **Step 2: 运行 migration**

Run: `pnpm db:migrate`
Expected: Migration 成功，users 表新增 role 和 is_active 列

- [ ] **Step 3: 提交**

```bash
git add migrations/20260319200000_add_user_role_active.ts
git commit -m "feat: add role and is_active columns to users table"
```

---

### Task 2: 更新 User 类型

**Files:**
- Modify: `app/core/types/user.ts`

- [ ] **Step 1: 更新 User interface 和 UserPublic**

将 `app/core/types/user.ts` 修改为：

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

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
```

- [ ] **Step 2: 提交**

```bash
git add app/core/types/user.ts
git commit -m "feat: add role and is_active to User type"
```

---

### Task 3: 扩展 UserModel

**Files:**
- Modify: `app/core/models/user.model.ts`

- [ ] **Step 1: 添加 countAll、findAll、delete、updatePassword 方法**

在现有 `UserModel` 对象中追加以下方法：

```typescript
async countAll(): Promise<number> {
  const result = await getDb()(TABLE).count('id as count').first()
  return Number(result?.count || 0)
},

async findAll(filters: {
  q?: string
  role?: string
  is_active?: boolean
  page: number
  pageSize: number
}): Promise<{ users: any[]; total: number }> {
  const query = getDb()(TABLE).select(
    'id', 'email', 'name', 'avatar', 'role', 'is_active', 'created_at', 'updated_at'
  )

  if (filters.q) {
    query.where(function () {
      this.where('name', 'ilike', `%${filters.q}%`)
        .orWhere('email', 'ilike', `%${filters.q}%`)
    })
  }
  if (filters.role) {
    query.where('role', filters.role)
  }
  if (filters.is_active !== undefined) {
    query.where('is_active', filters.is_active)
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('id as count').first()
  const total = Number((await countQuery)?.count || 0)

  const users = await query
    .orderBy('created_at', 'desc')
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize)

  return { users, total }
},

async delete(id: string): Promise<boolean> {
  const count = await getDb()(TABLE).where({ id }).del()
  return count > 0
},

async updatePassword(id: string, passwordHash: string): Promise<void> {
  await getDb()(TABLE).where({ id }).update({
    password_hash: passwordHash,
    updated_at: new Date(),
  })
},
```

- [ ] **Step 2: 提交**

```bash
git add app/core/models/user.model.ts
git commit -m "feat: extend UserModel with admin query methods"
```

---

### Task 4: 修改 AuthService — 第一个用户自动 admin + is_active 检查

**Files:**
- Modify: `app/core/services/auth.service.ts`

- [ ] **Step 1: 修改 register 方法 — 第一个用户 auto-admin**

在 `register` 方法中，创建用户前检查是否为第一个用户：

将现有 `register` 方法中 `UserModel.create()` 调用改为：

```typescript
async register(input: CreateUserInput): Promise<UserPublic> {
  const existing = await UserModel.findByEmail(input.email)
  if (existing) {
    badRequestError('邮箱已被注册')
  }

  const password_hash = await hash(input.password, 12)
  const userCount = await UserModel.countAll()
  const role = userCount === 0 ? 'admin' : 'user'

  const user = await UserModel.create({
    email: input.email,
    name: input.name,
    password_hash,
    role,
  })
  return toPublic(user)
},
```

注意：`UserModel.create` 的参数需要同步更新以接受 `role`。修改 `app/core/models/user.model.ts` 的 `create` 方法：

```typescript
async create(input: Omit<CreateUserInput, 'password'> & { password_hash: string; role?: string }): Promise<User> {
  const [user] = await getDb()(TABLE)
    .insert({
      email: input.email,
      name: input.name,
      password_hash: input.password_hash,
      role: input.role || 'user',
    })
    .returning('*')
  return user
},
```

- [ ] **Step 2: 修改 login 方法 — 检查 is_active**

```typescript
async login(input: LoginInput): Promise<UserPublic> {
  const user = await UserModel.findByEmail(input.email)
  if (!user) {
    badRequestError('邮箱或密码错误')
  }

  if (!user.is_active) {
    badRequestError('账户已被禁用')
  }

  const valid = await compare(input.password, user.password_hash)
  if (!valid) {
    badRequestError('邮箱或密码错误')
  }

  return toPublic(user)
},
```

- [ ] **Step 3: 修改 getUser 方法 — 检查 is_active**

```typescript
async getUser(userId: string): Promise<UserPublic | null> {
  const user = await UserModel.findById(userId)
  if (user && !user.is_active) return null
  return user ? toPublic(user) : null
},
```

- [ ] **Step 4: 更新 toPublic 函数签名**

确保 `toPublic` 函数包含新字段：

```typescript
function toPublic(user: { id: string; email: string; name: string; avatar: string | null; role: string; is_active: boolean; created_at: Date; updated_at: Date }): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role as 'admin' | 'user',
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}
```

- [ ] **Step 5: 提交**

```bash
git add app/core/services/auth.service.ts app/core/models/user.model.ts
git commit -m "feat: auto-admin for first user + is_active login check"
```

---

### Task 5: 更新 Seed 数据

**Files:**
- Modify: `seeds/01_dev_seed.ts`

- [ ] **Step 1: 给演示用户添加 role 和 is_active**

修改 seed 中 users insert：

```typescript
const [user] = await knex('users')
  .insert({
    email: 'demo@drama.studio',
    name: '演示用户',
    password_hash: passwordHash,
    role: 'admin',
    is_active: true,
  })
  .returning('*')
```

- [ ] **Step 2: 提交**

```bash
git add seeds/01_dev_seed.ts
git commit -m "feat: add role/is_active to dev seed user"
```

---

## Chunk 2: 后端 — Admin API

### Task 6: requireAdmin 工具函数

**Files:**
- Create: `server/utils/admin.ts`

- [ ] **Step 1: 创建 requireAdmin**

```typescript
import { UserModel } from '~/core/models/user.model'
import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event): Promise<void> {
  const userId = event.context.userId
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '未授权' })
  }
  const user = await UserModel.findById(userId)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '需要管理员权限' })
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add server/utils/admin.ts
git commit -m "feat: add requireAdmin utility function"
```

---

### Task 7: Admin Zod Schema

**Files:**
- Create: `server/schemas/admin.ts`

- [ ] **Step 1: 创建验证 schema**

```typescript
import { z } from 'zod/v4'

export const updateUserSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50).optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional(),
})

export const listUsersSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.string().transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})
```

- [ ] **Step 2: 提交**

```bash
git add server/schemas/admin.ts
git commit -m "feat: add Zod schemas for admin user management"
```

---

### Task 8: AdminService

**Files:**
- Create: `app/core/services/admin.service.ts`

- [ ] **Step 1: 创建 AdminService**

```typescript
import { hash } from 'bcryptjs'
import { UserModel } from '../models/user.model'
import { notFoundError, badRequestError } from '../errors'
import type { UserPublic } from '../types'
import { randomBytes } from 'crypto'

function toPublic(user: any): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

function generateTempPassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12)
}

export const AdminService = {
  async listUsers(filters: {
    q?: string
    role?: string
    is_active?: boolean
    page: number
    perPage: number
  }): Promise<{ users: UserPublic[]; total: number }> {
    const result = await UserModel.findAll({
      q: filters.q,
      role: filters.role,
      is_active: filters.is_active,
      page: filters.page,
      pageSize: filters.perPage,
    })
    return { users: result.users.map(toPublic), total: result.total }
  },

  async getUser(userId: string): Promise<UserPublic> {
    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')
    return toPublic(user)
  },

  async updateUser(
    userId: string,
    data: { name?: string; role?: string; is_active?: boolean },
    operatorId: string,
  ): Promise<UserPublic> {
    if (userId === operatorId) {
      if (data.role !== undefined) badRequestError('不能修改自己的角色')
      if (data.is_active !== undefined) badRequestError('不能修改自己的状态')
    }

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    const updateData: Record<string, any> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const updated = await UserModel.update(userId, updateData)
    if (!updated) notFoundError('用户不存在')
    return toPublic(updated)
  },

  async deleteUser(userId: string, operatorId: string): Promise<void> {
    if (userId === operatorId) badRequestError('不能删除自己的账户')

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    await UserModel.delete(userId)
  },

  async resetPassword(userId: string, operatorId: string): Promise<string> {
    if (userId === operatorId) badRequestError('不能重置自己的密码（请使用修改密码功能）')

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    const tempPassword = generateTempPassword()
    const passwordHash = await hash(tempPassword, 12)
    await UserModel.updatePassword(userId, passwordHash)

    return tempPassword
  },
}
```

注意：`UserModel.update` 目前签名是 `update(id, data: Partial<Pick<User, 'name' | 'avatar'>>)`，需要扩展为接受更多字段。修改 `app/core/models/user.model.ts` 的 `update` 方法签名：

```typescript
async update(id: string, data: Record<string, any>): Promise<User | undefined> {
  const [user] = await getDb()(TABLE)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning('*')
  return user
},
```

- [ ] **Step 2: 提交**

```bash
git add app/core/services/admin.service.ts app/core/models/user.model.ts
git commit -m "feat: add AdminService for user management"
```

---

### Task 9: Admin API — 用户列表

**Files:**
- Create: `server/api/admin/users/index.get.ts`

- [ ] **Step 1: 创建用户列表 API**

```typescript
import { AdminService } from '~/core/services/admin.service'
import { listUsersSchema } from '~/schemas/admin'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const parsed = listUsersSchema.safeParse(query)
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i: any) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    badRequest(messages)
  }
  const filters = parsed.data!

  const { users, total } = await AdminService.listUsers({
    q: filters.q,
    role: filters.role,
    is_active: filters.is_active,
    page: filters.page,
    perPage: filters.per_page,
  })

  return paginated(users, total, filters.page, filters.per_page)
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/admin/users/index.get.ts
git commit -m "feat: add admin users list API"
```

---

### Task 10: Admin API — 用户详情

**Files:**
- Create: `server/api/admin/users/[uid]/index.get.ts`

- [ ] **Step 1: 创建用户详情 API**

```typescript
import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const user = await AdminService.getUser(uid)
  return ok(user)
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/admin/users/\[uid\]/index.get.ts
git commit -m "feat: add admin user detail API"
```

---

### Task 11: Admin API — 修改用户

**Files:**
- Create: `server/api/admin/users/[uid]/index.put.ts`

- [ ] **Step 1: 创建修改用户 API**

```typescript
import { AdminService } from '~/core/services/admin.service'
import { updateUserSchema } from '~/schemas/admin'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const body = await validateBody(event, updateUserSchema)
  const user = await AdminService.updateUser(uid, body, event.context.userId)
  return ok(user)
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/admin/users/\[uid\]/index.put.ts
git commit -m "feat: add admin update user API"
```

---

### Task 12: Admin API — 删除用户

**Files:**
- Create: `server/api/admin/users/[uid]/index.delete.ts`

- [ ] **Step 1: 创建删除用户 API**

```typescript
import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  await AdminService.deleteUser(uid, event.context.userId)
  return ok({ deleted: true })
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/admin/users/\[uid\]/index.delete.ts
git commit -m "feat: add admin delete user API"
```

---

### Task 13: Admin API — 重置密码

**Files:**
- Create: `server/api/admin/users/[uid]/reset-password.put.ts`

- [ ] **Step 1: 创建重置密码 API**

```typescript
import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const temporaryPassword = await AdminService.resetPassword(uid, event.context.userId)
  return ok({ temporary_password: temporaryPassword })
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/admin/users/\[uid\]/reset-password.put.ts
git commit -m "feat: add admin reset password API"
```

---

## Chunk 3: 前端 — 管理后台页面

### Task 14: 侧边栏添加管理导航

**Files:**
- Modify: `app/components/layout/AppSidebar.vue`

- [ ] **Step 1: 添加 Shield 图标导入和管理导航项**

在 `<script setup>` 中：

1. 导入 `Shield` 图标：

```typescript
import { Home, Film, Users, Clapperboard, ChevronLeft, ChevronRight, Shield } from 'lucide-vue-next'
```

2. 获取当前用户：

```typescript
const { user } = useAuth()
```

3. 将 `navItems` 改为 computed，以便根据用户角色动态显示：

```typescript
const navItems = computed(() => {
  const items = [
    { label: '仪表盘', icon: Home, to: '/' },
    { label: '项目', icon: Clapperboard, to: '/projects' },
    { label: '团队', icon: Users, to: '/teams' },
  ]
  if (user.value?.role === 'admin') {
    items.push({ label: '管理', icon: Shield, to: '/admin' })
  }
  return items
})
```

- [ ] **Step 2: 提交**

```bash
git add app/components/layout/AppSidebar.vue
git commit -m "feat: add admin navigation to sidebar (admin only)"
```

---

### Task 15: 路由守卫 — admin 页面保护

**Files:**
- Modify: `app/middleware/auth.global.ts`

- [ ] **Step 1: 添加 admin 路由守卫**

在现有中间件末尾（`isLoggedIn && publicPages` 检查之后）添加：

```typescript
if (isLoggedIn.value && to.path.startsWith('/admin')) {
  const { user } = useAuth()
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
}
```

完整文件应为：

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, fetchUser, user } = useAuth()
  const publicPages = ['/login', '/register']

  if (!isLoggedIn.value) {
    await fetchUser()
  }

  if (!isLoggedIn.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (isLoggedIn.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }

  if (isLoggedIn.value && to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add app/middleware/auth.global.ts
git commit -m "feat: add admin route guard"
```

---

### Task 16: 管理后台用户列表页

**Files:**
- Create: `app/pages/admin/index.vue`

- [ ] **Step 1: 创建管理后台页面**

```vue
<script setup lang="ts">
import { Search, Shield, Pencil, Ban, Trash2, KeyRound, Copy, Check, UserCircle } from 'lucide-vue-next'
import type { UserPublic } from '~/core/types'

useHead({ title: '用户管理 - Drama Studio' })

const { $api } = useApi()
const { user: currentUser } = useAuth()

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const perPage = 20

const {
  data: usersData,
  status: usersStatus,
  error: usersError,
  refresh,
} = useAsyncData(
  'admin-users',
  () => {
    const params = new URLSearchParams()
    if (searchQuery.value) params.set('q', searchQuery.value)
    if (roleFilter.value) params.set('role', roleFilter.value)
    if (statusFilter.value) params.set('is_active', statusFilter.value)
    params.set('page', String(currentPage.value))
    params.set('per_page', String(perPage))
    return $fetch<{
      success: boolean
      data: UserPublic[]
      pagination: { total: number; page: number; pageSize: number; totalPages: number }
    }>(`/api/admin/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${useCookie('token').value}` },
    })
  },
  { watch: [searchQuery, roleFilter, statusFilter, currentPage] },
)

const users = computed(() => usersData.value?.data || [])
const pagination = computed(() => usersData.value?.pagination)

const showEdit = ref(false)
const editingUser = ref<UserPublic | null>(null)
const editForm = reactive({ name: '', role: 'user' as string })
const editLoading = ref(false)
const editError = ref('')

function openEdit(u: UserPublic) {
  editingUser.value = u
  editForm.name = u.name
  editForm.role = u.role
  editError.value = ''
  showEdit.value = true
}

async function submitEdit() {
  if (!editingUser.value) return
  editLoading.value = true
  editError.value = ''
  try {
    await $api(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PUT',
      body: { name: editForm.name, role: editForm.role },
    })
    showEdit.value = false
    refresh()
  } catch (e: any) {
    editError.value = e.data?.statusMessage || '更新失败'
  } finally {
    editLoading.value = false
  }
}

const showConfirm = ref(false)
const confirmAction = ref<'toggle' | 'delete'>('toggle')
const confirmUser = ref<UserPublic | null>(null)
const confirmLoading = ref(false)

function openToggleActive(u: UserPublic) {
  confirmUser.value = u
  confirmAction.value = 'toggle'
  showConfirm.value = true
}

function openDelete(u: UserPublic) {
  confirmUser.value = u
  confirmAction.value = 'delete'
  showConfirm.value = true
}

async function executeConfirm() {
  if (!confirmUser.value) return
  confirmLoading.value = true
  try {
    if (confirmAction.value === 'toggle') {
      await $api(`/api/admin/users/${confirmUser.value.id}`, {
        method: 'PUT',
        body: { is_active: !confirmUser.value.is_active },
      })
    } else {
      await $api(`/api/admin/users/${confirmUser.value.id}`, { method: 'DELETE' })
    }
    showConfirm.value = false
    refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败')
  } finally {
    confirmLoading.value = false
  }
}

const showResetResult = ref(false)
const tempPassword = ref('')
const resetLoading = ref(false)
const copied = ref(false)

async function resetPassword(u: UserPublic) {
  resetLoading.value = true
  try {
    const res = await $api<{ temporary_password: string }>(
      `/api/admin/users/${u.id}/reset-password`,
      { method: 'PUT' },
    )
    tempPassword.value = res.temporary_password
    showResetResult.value = true
  } catch (e: any) {
    alert(e.data?.statusMessage || '重置失败')
  } finally {
    resetLoading.value = false
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(tempPassword.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function isSelf(u: UserPublic) {
  return u.id === currentUser.value?.id
}

const roleMap: Record<string, string> = { admin: '管理员', user: '普通用户' }

let searchTimer: ReturnType<typeof setTimeout>
function onSearch(val: string) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 300)
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>用户管理</template>

    <CommonPageLoading v-if="usersStatus === 'pending' && !usersData" />
    <CommonPageError v-else-if="usersError" :error="usersError" :retry-fn="refresh" />
    <div v-else class="max-w-5xl">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="relative flex-1 min-w-[200px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            :model-value="searchQuery"
            @update:model-value="onSearch"
            placeholder="搜索用户名称或邮箱..."
            class="pl-9 h-10"
          />
        </div>
        <select
          v-model="roleFilter"
          class="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[120px]"
          @change="currentPage = 1"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select
          v-model="statusFilter"
          class="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[120px]"
          @change="currentPage = 1"
        >
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-zinc-100 bg-zinc-50/50">
                <th class="text-left px-4 py-3 font-medium text-zinc-500">用户</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">邮箱</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">角色</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">状态</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">注册时间</th>
                <th class="text-right px-4 py-3 font-medium text-zinc-500">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                      {{ u.name?.charAt(0) || '?' }}
                    </div>
                    <span class="font-medium text-zinc-800">{{ u.name }}</span>
                    <Badge v-if="isSelf(u)" variant="outline" class="text-[10px]">我</Badge>
                  </div>
                </td>
                <td class="px-4 py-3 text-zinc-500">{{ u.email }}</td>
                <td class="px-4 py-3">
                  <Badge :variant="u.role === 'admin' ? 'default' : 'secondary'" class="text-[10px]">
                    <Shield v-if="u.role === 'admin'" class="h-3 w-3 mr-0.5" />
                    {{ roleMap[u.role] || u.role }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <Badge :class="u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'" variant="outline" class="text-[10px]">
                    {{ u.is_active ? '启用' : '禁用' }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-zinc-400 text-xs">{{ new Date(u.created_at).toLocaleDateString('zh-CN') }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="openEdit(u)">
                      <Pencil class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="openToggleActive(u)"
                    >
                      <Ban class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="resetPassword(u)"
                      :disabled="resetLoading"
                    >
                      <KeyRound class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                      @click="openDelete(u)"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="6" class="px-4 py-12 text-center text-zinc-400">
                  <UserCircle class="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                  暂无用户数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
          <p class="text-xs text-zinc-400">
            共 {{ pagination.total }} 个用户，第 {{ pagination.page }}/{{ pagination.totalPages }} 页
          </p>
          <div class="flex gap-1">
            <Button variant="outline" size="sm" class="h-7 text-xs" :disabled="currentPage <= 1" @click="currentPage--">
              上一页
            </Button>
            <Button variant="outline" size="sm" class="h-7 text-xs" :disabled="currentPage >= pagination.totalPages" @click="currentPage++">
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog :open="showEdit" @update:open="(v: boolean) => { if (!v) showEdit = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitEdit" class="space-y-4 mt-2">
          <div class="space-y-2">
            <Label>名称</Label>
            <Input v-model="editForm.name" required placeholder="用户名称" />
          </div>
          <div v-if="editingUser && !isSelf(editingUser)" class="space-y-2">
            <Label>角色</Label>
            <select v-model="editForm.role" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div v-if="editError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ editError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEdit = false">取消</Button>
            <Button type="submit" :disabled="editLoading">{{ editLoading ? '保存中...' : '保存' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Confirm Dialog -->
    <Dialog :open="showConfirm" @update:open="(v: boolean) => { if (!v) showConfirm = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ confirmAction === 'delete' ? '确认删除' : (confirmUser?.is_active ? '确认禁用' : '确认启用') }}</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-zinc-600 mt-2">
          <template v-if="confirmAction === 'delete'">
            确定要删除用户 <strong>{{ confirmUser?.name }}</strong>（{{ confirmUser?.email }}）吗？此操作不可撤销。
          </template>
          <template v-else>
            确定要{{ confirmUser?.is_active ? '禁用' : '启用' }}用户 <strong>{{ confirmUser?.name }}</strong>（{{ confirmUser?.email }}）吗？
            <span v-if="confirmUser?.is_active" class="block mt-1 text-red-500">禁用后该用户将无法登录。</span>
          </template>
        </p>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showConfirm = false">取消</Button>
          <Button
            :class="confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''"
            :disabled="confirmLoading"
            @click="executeConfirm"
          >
            {{ confirmLoading ? '处理中...' : '确认' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Reset Password Result Dialog -->
    <Dialog :open="showResetResult" @update:open="(v: boolean) => { if (!v) showResetResult = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>密码已重置</DialogTitle>
        </DialogHeader>
        <div class="mt-3 space-y-3">
          <p class="text-sm text-zinc-600">新的临时密码：</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-zinc-100 px-4 py-2.5 rounded-lg text-sm font-mono tracking-wider">{{ tempPassword }}</code>
            <Button variant="outline" size="sm" @click="copyPassword" class="shrink-0">
              <Copy v-if="!copied" class="h-4 w-4" />
              <Check v-else class="h-4 w-4 text-emerald-600" />
            </Button>
          </div>
          <p class="text-xs text-zinc-400">请将此密码告知用户，建议用户登录后修改密码。</p>
        </div>
        <DialogFooter class="mt-4">
          <Button @click="showResetResult = false">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add app/pages/admin/index.vue
git commit -m "feat: add admin user management page"
```

---

### Task 17: 最终验证

- [ ] **Step 1: 运行类型检查**

Run: `npx nuxi typecheck`
Expected: 无类型错误（或仅预存错误）

- [ ] **Step 2: 运行现有测试**

Run: `pnpm test`
Expected: 所有已有测试通过

- [ ] **Step 3: 启动开发服务器验证**

Run: `pnpm dev`
验证：
1. 注册第一个用户 → 应为 admin
2. 侧边栏出现"管理"入口
3. 点击进入 `/admin`，看到用户列表
4. 再注册第二个用户 → 应为普通用户
5. 第二个用户看不到"管理"入口
6. 管理员编辑/禁用/重置密码/删除操作正常
7. 被禁用用户无法登录

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete admin user management system"
```
