class ProductModel {
  constructor() {
    this.table = "Products";
  }

  async countAllProducts() {
    const count = await pool.query(`
      SELECT count(id)
      FROM "${this.table}"
    `);

    return count.rows[0].count;
  }

  async countBySearchTerm(searchTerm) {
    const count = await pool.query(`
      SELECT count(id)
      FROM "${this.table}"
      WHERE LOWER("${this.table}".msa_id) LIKE LOWER($1) 
         OR LOWER("${this.table}".name) LIKE LOWER($1)
    `, [`%${searchTerm}%`]);

    return count.rows[0].count;
  }

  async getAllWithImages(page, itemsPerPage) {
    const query = await pool.query(`
      SELECT "${this.table}".*,     
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Images".source), NULL), '{}') as images,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Categories".name), NULL), '{}') as categories
      FROM "${this.table}"
      LEFT JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT $1 OFFSET $2
    `, [itemsPerPage, page * itemsPerPage]);

    return query.rows;
  }

  async getBySearchTerm(page, itemsPerPage, searchTerm) {
    const query = await pool.query(`
      SELECT "${this.table}".*,        
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Images".source), NULL), '{}') as images,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Categories".name), NULL), '{}') as categories
      FROM "${this.table}"
      LEFT JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE LOWER("${this.table}".msa_id) LIKE LOWER($1) 
         OR LOWER("${this.table}".name) LIKE LOWER($1)
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT $2 OFFSET $3
    `, [`%${searchTerm}%`, itemsPerPage, page * itemsPerPage]);

    return query.rows;
  }

  async createProduct(product) {
    const query = await pool.query(`
      INSERT INTO "${this.table}"
      (
        msa_id, name, description, unit_price, unit_type, big_unit_type,
        has_package, has_big_package, package_price, 
        big_package_price, package_size, big_package_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      product.msa_id, product.name, product.description, product.unit_price, 
      product.unit_type, product.big_unit_type, product.has_package, product.has_big_package, 
      product.package_price, product.big_package_price, product.package_size, 
      product.big_package_size
    ]);

    return query.rows[0];
  }

  async updateProduct(product) {
    const query = await pool.query(`
      UPDATE "${this.table}"
      SET 
        name = $1,
        description = $2, 
        unit_price = $3, 
        unit_type = $4, 
        big_unit_type = $5,
        has_package = $6, 
        has_big_package = $7, 
        package_price = $8, 
        big_package_price = $9, 
        package_size = $10, 
        big_package_size = $11
      WHERE msa_id = $12
      RETURNING *;
    `, [
      product.name, product.description, product.unit_price, product.unit_type, 
      product.big_unit_type, product.has_package, product.has_big_package, product.package_price, 
      product.big_package_price, product.package_size, product.big_package_size, 
      product.msa_id
    ]);

    return query.rows[0];
  }
  async getProductByMSAID(msa_id) {
    console.log(msa_id);
    const query = await pool.query(`
      SELECT "${this.table}".*, 
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Images".source), NULL), '{}') as images,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Categories".name), NULL), '{}') as categories,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Categories".id), NULL), '{}') as category_ids
      FROM "${this.table}"
      LEFT JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE msa_id = $1
      GROUP BY "${this.table}".id
    `, [msa_id]);

    return query.rows[0];
  }

  async uploadImage(imageUrl, product_id) {
    const query = await pool.query(`
      INSERT INTO "Images" (product_id, source)
      VALUES ($1, $2)
      RETURNING source
    `, [product_id, imageUrl]);

    return query.rows[0];
  }

  async getProductByCategory(category_id, page, itemsPerPage) {
    const query = await pool.query(`
      SELECT "${this.table}".*, 
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Images".source), NULL), '{}') as images,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT "Categories".name), NULL), '{}') as categories
      FROM "${this.table}"
      LEFT JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE "${this.table}".id IN (
        SELECT product_id
        FROM "ProductCategory"
        WHERE category_id = $1 
      )
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT $2 OFFSET $3
    `, [category_id, itemsPerPage, page * itemsPerPage]);

    return query.rows;
  }

  async countProductByCategory(category_id) {
    const count = await pool.query(`
      SELECT count("${this.table}".id)
      FROM "${this.table}"
      JOIN "ProductCategory" as pc ON pc.product_id = "${this.table}".id
      WHERE pc.category_id = $1
    `, [category_id]);

    return count.rows[0].count;
  }

  async getAllProductsOnlyMSAIDByCategory(category_id) {
    const query = await pool.query(`
      SELECT p.id, msa_id 
      FROM "${this.table}" as p
      JOIN "ProductCategory" as pc ON pc.product_id = p.id
      WHERE pc.category_id = $1
    `, [category_id]);
    console.log(query);
    return query.rows;
  }

  async getAllOnlyMSAID() {
    const query = await pool.query(`
      SELECT id, msa_id FROM "${this.table}"
    `);
    return query.rows;
  }

  async getProductsByCategoryAndDescendants(categoryId, page = 0, itemsPerPage = 40, searchTerm = "") {
    const offset = page * itemsPerPage;
    const values = [categoryId]; 
    
    let query = `
      WITH RECURSIVE CategoryTree AS (
        SELECT id FROM "Categories" 
        WHERE id = $1
        
        UNION ALL
        
        SELECT c.id FROM "Categories" c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            pi.source
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'
        ) AS images
      FROM "Products" p
      JOIN "ProductCategory" pc ON p.id = pc.product_id
      LEFT JOIN "Images" pi ON p.id = pi.product_id
      WHERE pc.category_id IN (SELECT id FROM CategoryTree)
    `;

    if (searchTerm) {
      query += ` AND (p.name ILIKE $2 OR p.msa_id ILIKE $2)`;
      values.push(`%${searchTerm}%`); 
    }

    query += ` GROUP BY p.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(itemsPerPage, offset);

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error fetching filtered category products:", error);
      throw error;
    }
  }

  async countProductsByCategoryAndDescendants(categoryId, searchTerm = "") {
    const values = [categoryId]; 
    
    let query = `
      WITH RECURSIVE CategoryTree AS (
        SELECT id FROM "Categories" WHERE id = $1
        UNION ALL
        SELECT c.id FROM "Categories" c INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT COUNT(DISTINCT p.id) 
      FROM "Products" p
      JOIN "ProductCategory" pc ON p.id = pc.product_id
      WHERE pc.category_id IN (SELECT id FROM CategoryTree)
    `;

    if (searchTerm) {
      query += ` AND (p.name ILIKE $2 OR p.msa_id ILIKE $2)`;
      values.push(`%${searchTerm}%`); 
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Error counting category products:", error);
      throw error;
    }
  }

  async deleteImageByName(filename) {
    const query = await pool.query(`
      DELETE FROM "Images"
      WHERE source = $1
    `, [filename]);
    return query.rows;
  }

  async deleteProduct(product_id) {
    const query = await pool.query(`
      DELETE FROM "${this.table}"
      WHERE id = $1
    `, [product_id]);
    return query.rows;
  }
}

module.exports = ProductModel;