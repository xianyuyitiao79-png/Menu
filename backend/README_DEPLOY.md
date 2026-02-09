# Vercel + Supabase (Postgres) 部署指南

## 1. 创建 Supabase 项目
- 新建项目后在 Settings → Database → Connection string 复制 **URI**
- 形如：
  `postgresql://USER:PASSWORD@HOST:PORT/postgres`

## 2. 初始化数据库结构
在 Supabase SQL Editor 执行：

```sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  tags TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL
);
```

> 服务端会自动 seed 初始菜单（第一次启动时自动写入）。

## 3. Vercel 部署后端
- Import GitHub repo
- Root Directory: `backend`
- Environment Variables:
  - `DATABASE_URL` = Supabase connection string

## 4. Vercel 部署前端
- Import GitHub repo
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL` = 后端 Vercel 域名

## 5. 验证
- 访问 `https://<backend-domain>/api/health` 应该返回 `{ ok: true }`
- 前端页面能正常拉取菜单
