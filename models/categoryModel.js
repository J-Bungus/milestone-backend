class CategoryModel {
  constructor() {
    this.table = '"Categories"';
  }

  async getCategoriesByLevel(parent_id = null) {
    let query;
    if (parent_id !== null) {
      query = await pool.query(`
        SELECT * FROM ${this.table}
        WHERE parent_id = $1
        ORDER BY order_index
      `, [parent_id]);
    } else {
      query = await pool.query(`
        SELECT * FROM ${this.table}
        WHERE parent_id IS NULL
        ORDER BY order_index
      `);
    }
      
    console.log(query.rows);
    return query.rows;
  }

  async addCategory(category, parent_id = null) {
    let query;
    if (parent_id !== null) {
      query = await pool.query(`
          INSERT INTO ${this.table}
          (name, is_leaf, parent_id)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [category.name, category.is_leaf, parent_id]);
    } else {
      query = await pool.query(`
          INSERT INTO ${this.table}
          (name, is_leaf)
          VALUES ($1, $2)
          RETURNING id
        `, [category.name, category.is_leaf]);
    }

    return query.rows[0];
  }

  async editCategory(category) {
    const query = await pool.query(`
      UPDATE ${this.table}
      SET name = $1, is_leaf = $2, parent_id = $3, order_index = $4
      WHERE id = $5
      RETURNING id
    `, [category.name, category.is_leaf, category.parent_id, category.order_index, category.id]);

    return query.rows[0];
  }

  async deleteCategory(category_id) {
    await pool.query(`
      DELETE FROM ${this.table}
      WHERE id = $1
    `, [category_id]);
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

  async getLeafCategoriesWithPath() {
    const query = `
      WITH RECURSIVE CategoryTree AS (
        SELECT id, name, parent_id, name::text AS path
        FROM "Categories"
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT c.id, c.name, c.parent_id, ct.path || ' > ' || c.name
        FROM "Categories" c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT id, name, path 
      FROM CategoryTree ct
      WHERE NOT EXISTS (
        SELECT 1 FROM "Categories" child WHERE child.parent_id = ct.id
      )
      ORDER BY path;
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error fetching leaf categories with path:", error);
      throw error;
    }
  }
}

module.exports = CategoryModel;