const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false }
});

async function initSchema() {
  await pool.query(`
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
  `);
}

async function seedIfEmpty() {
  const { rows } = await pool.query("SELECT COUNT(1)::int as count FROM categories");
  if (rows[0]?.count > 0) return;

  const categories = [
    { name: "凉菜 🥗" },
    { name: "素菜 🥬" },
    { name: "荤菜 🍖" },
    { name: "海鲜 🐟" },
    { name: "汤 🍲" },
    { name: "主食 🍚" }
  ];

  const insertCategory = "INSERT INTO categories (name) VALUES ($1) RETURNING id";
  const categoryIds = [];
  for (const cat of categories) {
    const result = await pool.query(insertCategory, [cat.name]);
    categoryIds.push(result.rows[0].id);
  }

  const dishes = [
    { categoryIndex: 0, name: "柠檬手撕鸡", tags: "招牌", image: "" },
    { categoryIndex: 0, name: "蒜香拍黄瓜", tags: "她最爱", image: "" },
    { categoryIndex: 1, name: "西兰花炒口蘑", tags: "清爽", image: "" },
    { categoryIndex: 1, name: "蒜蓉空心菜", tags: "快手", image: "" },
    { categoryIndex: 2, name: "蜜汁烤鸡腿", tags: "招牌", image: "" },
    { categoryIndex: 2, name: "黑椒牛肉粒", tags: "满足", image: "" },
    { categoryIndex: 3, name: "黄油煎三文鱼", tags: "她最爱", image: "" },
    { categoryIndex: 3, name: "蒜蓉扇贝", tags: "鲜美", image: "" },
    { categoryIndex: 4, name: "奶油南瓜浓汤", tags: "治愈", image: "" },
    { categoryIndex: 4, name: "海带豆腐汤", tags: "清淡", image: "" },
    { categoryIndex: 5, name: "香葱蛋炒饭", tags: "主角", image: "" },
    { categoryIndex: 5, name: "芝士焗红薯", tags: "甜甜", image: "" }
  ];

  const insertDish =
    "INSERT INTO dishes (category_id, name, tags, image) VALUES ($1, $2, $3, $4)";
  for (const dish of dishes) {
    const categoryId = categoryIds[dish.categoryIndex];
    await pool.query(insertDish, [categoryId, dish.name, dish.tags, dish.image]);
  }
}

function getDb() {
  return pool;
}

module.exports = { initSchema, seedIfEmpty, getDb };
