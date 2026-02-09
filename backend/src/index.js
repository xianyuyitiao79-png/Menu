const express = require("express");
const cors = require("cors");
const { initSchema, seedIfEmpty, getDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

initSchema();
seedIfEmpty();
const db = getDb();

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", (req, res) => {
  const categories = db.prepare("SELECT id, name FROM categories ORDER BY id").all();
  res.json(categories);
});

app.get("/api/dishes", (req, res) => {
  const { categoryId } = req.query;
  if (categoryId) {
    const dishes = db
      .prepare(
        "SELECT id, category_id as categoryId, name, tags, image FROM dishes WHERE category_id = ? ORDER BY id"
      )
      .all(Number(categoryId));
    return res.json(dishes);
  }
  const dishes = db
    .prepare("SELECT id, category_id as categoryId, name, tags, image FROM dishes ORDER BY id")
    .all();
  res.json(dishes);
});

app.post("/api/orders", (req, res) => {
  const { items, note } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items不能为空" });
  }

  const createdAt = new Date().toISOString();
  const insertOrder = db.prepare(
    "INSERT INTO orders (created_at, note, status) VALUES (?, ?, ?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, dish_id, name, quantity) VALUES (?, ?, ?, ?)"
  );

  const orderId = insertOrder.run(createdAt, note || "", "new").lastInsertRowid;

  const getDish = db.prepare("SELECT id, name FROM dishes WHERE id = ?");

  items.forEach((item) => {
    const dish = getDish.get(Number(item.dishId));
    if (!dish) return;
    const quantity = Number(item.quantity) || 1;
    insertItem.run(orderId, dish.id, dish.name, quantity);
  });

  const order = db.prepare("SELECT id, created_at as createdAt, note, status FROM orders WHERE id = ?").get(orderId);
  const orderItems = db
    .prepare("SELECT dish_id as dishId, name, quantity FROM order_items WHERE order_id = ?")
    .all(orderId);

  res.status(201).json({ ...order, items: orderItems });
});

app.get("/api/orders", (req, res) => {
  const orders = db
    .prepare("SELECT id, created_at as createdAt, note, status FROM orders ORDER BY id DESC")
    .all();

  const getItems = db.prepare(
    "SELECT dish_id as dishId, name, quantity FROM order_items WHERE order_id = ?"
  );

  const withItems = orders.map((order) => ({
    ...order,
    items: getItems.all(order.id)
  }));

  res.json(withItems);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ["new", "seen", "cooking", "done"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "status不合法" });
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, Number(id));
  const order = db
    .prepare("SELECT id, created_at as createdAt, note, status FROM orders WHERE id = ?")
    .get(Number(id));
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
