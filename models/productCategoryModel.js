class ProductCategoryModel {
  constructor(){
    this.table = '"ProductCategory"';
  }

  async getProductCategories(product_id, category_id) {
    const query = await pool.query(`
      SELECT * FROM ${this.table}
      WHERE product_id = $1 AND category_id = $2
    `, [product_id, category_id]);

    return query.rows[0]
  }

  async assignCategory(product_id, category_id) {
    await pool.query(`
      INSERT INTO ${this.table}
      (product_id, category_id)
      VALUES ($1, $2)
    `, [product_id, category_id]);
  }

  async removeCategory(product_id, category_id) {
    await pool.query(`
      DELETE FROM ${this.table}
      WHERE product_id = $1 AND category_id = $2
    `, [product_id, category_id]);
  }

  async deleteCategoriesByProductId(product_id) {
    await pool.query(`
      DELETE FROM ${this.table}
      WHERE product_id = $1
    `, [product_id]);
  }

  async deleteCategoriesByCategoryId(category_id) {
    await pool.query(`
      DELETE FROM ${this.table}
      WHERE category_id = $1
    `, [category_id]);
  }
}

module.exports = ProductCategoryModel;