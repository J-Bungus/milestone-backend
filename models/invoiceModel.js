class InvoiceModel {
  constructor () {
    this.table = "Invoices";
  }

  async generateInvoice (user_id, total, items) {
    const invoice = await pool.query(`
      INSERT INTO "${this.table}" (user_id, total_price)
      VALUES (${user_id}, ${total})
      RETURNING *
    `);

    items.forEach(async item => {
      const price = parseInt(item.amount) * 
        (item.package_type === "individual"
          ? parseFloat(item.product.unit_price)
          : item.package_type === "small"
            ? parseFloat(item.product.package_price)
            : parseFloat(item.product.big_package_price)
        );
      const insertedItem = await pool.query(`
        INSERT INTO "Items" (invoice_id, product_id, amount, price, package_type)
        VALUES (${invoice.rows[0].id}, ${item.product.id}, ${item.amount}, ${price}, '${item.package_type}')
        RETURNING *
      `);

      console.log(insertedItem);
    });

    return invoice.rows[0].id;
  }

  async fetchInvoice (user_id, invoice_id = undefined) {
    const invoice = invoice_id
      ? await pool.query(`
          SELECT inv.*, json_agg(json_build_object(
            'amount', it.amount,
            'price', it.price,
            'package_type', it.package_type,
            'product', ROW_TO_JSON(p.*)
          )) as items
          FROM "${this.table}" as inv
          JOIN "Items" as it ON inv.id = it.invoice_id
          JOIN "Products" as p ON p.id = it.product_id
          WHERE inv.id = ${invoice_id} 
          GROUP BY inv.id
          LIMIT 1;
        `)
      : await pool.query(`
          SELECT inv.*, json_agg(json_build_object(
            'amount', it.amount,
            'price', it.price,
            'package_type', it.package_type,
            'product', ROW_TO_JSON(p.*)
          )) as items
          FROM "${this.table}" as inv
          JOIN "Items" as it ON inv.id = it.invoice_id
          JOIN "Products" as p ON p.id = it.product_id
          WHERE inv.user_id = ${user_id} AND inv.sent = 'false'
          GROUP BY (inv.id)
          ORDER BY created_at DESC
          LIMIT 1
        `);
    
    return invoice.rows[0];
  }

  async updateSentStatus (invoice_id) {
    const invoice = await pool.query (`
      UPDATE "${this.table}"
      SET sent = 'true'
      WHERE id = ${invoice_id}
      RETURNING *
    `);

    return invoice.rows[0];
  }
}

module.exports = InvoiceModel;