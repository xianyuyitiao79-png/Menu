const express = require("express");
const cors = require("cors");
const { initSchema, seedIfEmpty, getDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  await initSchema();
  await seedIfEmpty();
  dbReady = true;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", async (_req, res, next) => {
  try {
    const db = getDb();
    const result = await db.query("SELECT id, name FROM categories ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/dishes", async (req, res, next) => {
  try {
    const db = getDb();
    const { categoryId } = req.query;
    if (categoryId) {
      const result = await db.query(
        "SELECT id, category_id as \"categoryId\", name, tags, image, description FROM dishes WHERE category_id = $1 ORDER BY id",
        [Number(categoryId)]
      );
      return res.json(result.rows);
    }
    const result = await db.query(
      "SELECT id, category_id as \"categoryId\", name, tags, image, description FROM dishes ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  const { items, note } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items不能为空" });
  }

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const createdAt = new Date().toISOString();
    const orderRes = await client.query(
      "INSERT INTO orders (created_at, note, status) VALUES ($1, $2, $3) RETURNING id, created_at as \"createdAt\", note, status",
      [createdAt, note || "", "new"]
    );
    const order = orderRes.rows[0];

    const getDish = await client.query("SELECT id, name FROM dishes WHERE id = ANY($1)", [
      items.map((item) => Number(item.dishId))
    ]);
    const dishMap = new Map(getDish.rows.map((row) => [row.id, row.name]));

    const insertItem =
      "INSERT INTO order_items (order_id, dish_id, name, quantity) VALUES ($1, $2, $3, $4)";

    for (const item of items) {
      const dishId = Number(item.dishId);
      const dishName = dishMap.get(dishId);
      if (!dishName) continue;
      const quantity = Number(item.quantity) || 1;
      await client.query(insertItem, [order.id, dishId, dishName, quantity]);
    }

    const itemsRes = await client.query(
      "SELECT dish_id as \"dishId\", name, quantity FROM order_items WHERE order_id = $1",
      [order.id]
    );

    await client.query("COMMIT");
    res.status(201).json({ ...order, items: itemsRes.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.get("/api/orders", async (_req, res, next) => {
  try {
    const db = getDb();
    const ordersRes = await db.query(
      "SELECT id, created_at as \"createdAt\", note, status FROM orders ORDER BY id DESC"
    );
    const orders = ordersRes.rows;
    if (!orders.length) return res.json([]);

    const orderIds = orders.map((order) => order.id);
    const itemsRes = await db.query(
      "SELECT order_id as \"orderId\", dish_id as \"dishId\", name, quantity FROM order_items WHERE order_id = ANY($1)",
      [orderIds]
    );
    const itemsByOrder = new Map();
    itemsRes.rows.forEach((row) => {
      if (!itemsByOrder.has(row.orderId)) itemsByOrder.set(row.orderId, []);
      itemsByOrder.get(row.orderId).push({
        dishId: row.dishId,
        name: row.name,
        quantity: row.quantity
      });
    });

    res.json(
      orders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) || []
      }))
    );
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ["new", "seen", "cooking", "done"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "status不合法" });
    }
    const db = getDb();
    await db.query("UPDATE orders SET status = $1 WHERE id = $2", [status, Number(id)]);
    const orderRes = await db.query(
      "SELECT id, created_at as \"createdAt\", note, status FROM orders WHERE id = $1",
      [Number(id)]
    );
    res.json(orderRes.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/dishes", async (req, res, next) => {
  try {
    const { categoryId, name, tags, image, description } = req.body || {};
    if (!name || !categoryId) {
      return res.status(400).json({ message: "name 和 categoryId 必填" });
    }
    const db = getDb();
    const result = await db.query(
      "INSERT INTO dishes (category_id, name, tags, image, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, category_id as \"categoryId\", name, tags, image, description",
      [Number(categoryId), name, tags || "", image || "", description || ""]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/dishes/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tags, image, description, categoryId } = req.body || {};
    const db = getDb();
    const existing = await db.query(
      "SELECT id, category_id as \"categoryId\", name, tags, image, description FROM dishes WHERE id = $1",
      [Number(id)]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ message: "菜品不存在" });
    }
    const current = existing.rows[0];
    const next = {
      name: name ?? current.name,
      tags: tags ?? current.tags,
      image: image ?? current.image,
      description: description ?? current.description,
      categoryId: categoryId ?? current.categoryId
    };
    const result = await db.query(
      "UPDATE dishes SET category_id = $1, name = $2, tags = $3, image = $4, description = $5 WHERE id = $6 RETURNING id, category_id as \"categoryId\", name, tags, image, description",
      [Number(next.categoryId), next.name, next.tags, next.image, next.description, Number(id)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/dishes/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.query("DELETE FROM dishes WHERE id = $1", [Number(id)]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "服务器错误" });
});

if (process.env.VERCEL !== "1" && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
