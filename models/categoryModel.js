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
      SET name = '${category.name}', is_leaf = '${category.is_leaf}', parent_id = ${category.parent_id}, order_index = ${category.order_index}
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

  async getLeafCategoriesWithPath() {
    const query = `
      WITH RECURSIVE CategoryTree AS (
        -- Base case: Top-level categories
        SELECT id, name, parent_id, name::text AS path
        FROM "Categories"
        WHERE parent_id IS NULL
        
        UNION ALL
        
        -- Recursive step: Append child name to parent's path
        SELECT c.id, c.name, c.parent_id, ct.path || ' > ' || c.name
        FROM "Categories" c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      -- Select only the leaf nodes (categories that have no children)
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