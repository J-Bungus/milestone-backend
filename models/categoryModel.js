class CategoryModel {
  constructor() {
    this.table = '"Categories"';
  }

  async getCategoriesByLevel(parent_id = null) {
    const query = parent_id !== null
      ? await pool.query(`
        SELECT * FROM ${this.table}
        WHERE parent_id = ${parent_id}
        ORDER BY order_index
      `)
      : await pool.query(`
        SELECT * FROM ${this.table}
        WHERE parent_id IS NULL
        ORDER BY order_index
        `);
      
      console.log(query.rows);
    return query.rows;
  }

  async addCategory(category, parent_id = null) {
    const query = parent_id !== null
      ? await pool.query(`
          INSERT INTO ${this.table}
          (name, is_leaf, parent_id)
          VALUES ('${category.name}', '${category.is_leaf}', ${parent_id})
          RETURNING id
        `)
      : await pool.query(`
          INSERT INTO ${this.table}
          (name, is_leaf)
          VALUES ('${category.name}', '${category.is_leaf}')
          RETURNING id
        `);

    return query.rows[0];
  }

  async editCategory(category) {
    const query = await pool.query(`
      UPDATE ${this.table}
      SET name = '${category.name}', is_leaf = '${category.is_leaf}', parent_id = ${category.parent_id}
      WHERE id = ${category.id}
      RETURNING id
    `);

    return query.rows[0];
  }

  async deleteCategory(category_id) {
    const query = await pool.query(`
      DELETE FROM ${this.table}
      WHERE id = ${category_id}
    `);
  }

  async getAllCategories() {
    const query = await pool.query(`
      SELECT * FROM ${this.table}
      ORDER BY parent_id, order_index, id
    `);
    return query.rows;
  }

  async getLeaves() {
    const query = await pool.query(`
      SELECT * FROM ${this.table}
      WHERE is_leaf = 'true'
      ORDER BY id
    `);

    return query.rows;
  }
}

module.exports = CategoryModel;