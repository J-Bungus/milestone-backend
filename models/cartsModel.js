class CartsModel {
  constructor() {
    this.table = "Carts";
  }

  async getCart(user_id) {
    const query = await pool.query(`
      SELECT 
        c.*, 
        json_agg(json_build_object(
          'amount', ci.amount,
          'package_type', ci.package_type,
          'product', ROW_TO_JSON(p.*)
        )) as items FROM "${this.table}" as c
      JOIN "CartItems" as ci ON ci.cart_id = c.id
      JOIN "Products" as p ON p.id = ci.product_id
      WHERE c.user_id = ${user_id}
      GROUP BY c.id;
    `);

    return query.rows[0];
  }

  async createOrUpdateCart(user_id, item) {
    console.log("item in model", item);
    const cart = await pool.query(`
      SELECT * FROM "${this.table}" WHERE user_id = ${user_id} ORDER BY "created_at" LIMIT 1;
    `);
    
    const createCartQuery = `
      INSERT INTO "${this.table}"
      (user_id)
      VALUES (${user_id})
      RETURNING *
    `;

    const updatedCart = cart.rows.length === 0
      ? (await pool.query(createCartQuery)).rows[0]
      : cart.rows[0];

    const existingItem = await pool.query(`
      SELECT * 
      FROM "CartItems"
      WHERE cart_id = ${updatedCart.id} AND product_id = ${item.product.id}
    `);
      console.log(existingItem);
    const updatedItem = existingItem.rows.length === 0
      ? await pool.query(`
          INSERT INTO "CartItems"
          (cart_id, product_id, amount, package_type)
          VALUES 
          (${updatedCart.id}, ${item.product.id}, ${item.amount}, '${item.package_type}')
          RETURNING *
        `)
      : await pool.query(`
          UPDATE "CartItems"
          SET amount = ${item.amount}, package_type = '${item.package_type}'
          WHERE cart_id = ${updatedCart.id} AND product_id = ${item.product.id}
          RETURNING *
        `);
    console.log("updated item", updatedItem);
    return updatedItem.rows[0];
  }

  async deleteCartItem(user_id, product_id) {
    const cart = await pool.query(`
      SELECT * FROM "${this.table}" WHERE user_id = ${user_id} LIMIT 1
    `);

    const deletedItem = await pool.query(`
      DELETE FROM "CartItems"
      WHERE cart_id = ${cart.rows[0].id} AND product_id = ${product_id}
    `);

    const itemCount = await pool.query(`
      SELECT count(id) 
      FROM "CartItems"
      WHERE cart_id = ${cart.rows[0].id}
    `);

    if (itemCount === 0) {
      await pool.query(`
        DELETE FROM "${this.table}"
        WHERE user_id = ${user_id}
      `);
    }

    return itemCount;
  }

  async deleteCart(user_id) {
    await pool.query(`
      DELETE FROM "${this.table}"
      WHERE user_id = ${user_id}
    `);
  }
}

module.exports = CartsModel;