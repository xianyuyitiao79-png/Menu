const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "db.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      tags TEXT,
      image TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    );
  `);
}

function seedIfEmpty() {
  const categoryCount = db.prepare("SELECT COUNT(1) as count FROM categories").get().count;
  if (categoryCount > 0) return;

  const categories = [
    { name: "凉菜 🥗" },
    { name: "素菜 🥬" },
    { name: "荤菜 🍖" },
    { name: "海鲜 🐟" },
    { name: "汤 🍲" },
    { name: "主食 🍚" }
  ];

  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const categoryIds = categories.map((c) => insertCategory.run(c.name).lastInsertRowid);

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

  const insertDish = db.prepare(
    "INSERT INTO dishes (category_id, name, tags, image) VALUES (?, ?, ?, ?)"
  );

  dishes.forEach((d) => {
    insertDish.run(categoryIds[d.categoryIndex], d.name, d.tags, d.image);
  });
}

function getDb() {
  return db;
}

module.exports = { initSchema, seedIfEmpty, getDb };
