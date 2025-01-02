class ProductCategoryModel {
  constructor(){
    this.table = '"ProductCategory"';
  }

  async getProductCategories(product_id, category_id) {
    const query = await pool.query(`
      SELECT * FROM ${this.table}
      WHERE product_id = ${product_id} AND category_id = ${category_id}
    `);

    return query.rows[0]
  }

  async assignCategory(product_id, category_id) {
    const query = await pool.query(`
      INSERT INTO ${this.table}
      (product_id, category_id)
      VALUES (${product_id}, ${category_id})
    `);
  }

  async removeCategory(product_id, category_id) {
    const query = await pool.query(`
      DELETE FROM ${this.table}
      WHERE product_id = ${product_id} AND category_id = ${category_id}
    `);
  }
}

module.exports = ProductCategoryModel;