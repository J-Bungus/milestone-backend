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
      WHERE LOWER("${this.table}".msa_id) LIKE '%${searchTerm}%' OR LOWER("${this.table}".name) LIKE '%${searchTerm}%'
    `);

    return count.rows[0].count;
  }

  async getAllWithImages(page, itemsPerPage) {
    const query = await pool.query(`
      SELECT "${this.table}".*,     
        ARRAY_AGG(DISTINCT "Images".source) as images,
        ARRAY_AGG(DISTINCT "Categories".name) as categories
      FROM "${this.table}"
      LEFT JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT ${itemsPerPage} OFFSET ${page * itemsPerPage}
    `);

    return query.rows;
  }

  async getBySearchTerm(page, itemsPerPage, searchTerm) {
    const query = await pool.query(`
      SELECT "${this.table}".*,        
        ARRAY_AGG(DISTINCT "Images".source) as images,
        ARRAY_AGG(DISTINCT "Categories".name) as categories
      FROM "${this.table}"
      JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE LOWER("${this.table}".msa_id) LIKE '%${searchTerm}%' OR LOWER("${this.table}".name) LIKE '%${searchTerm}%'
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT ${itemsPerPage} OFFSET ${page * itemsPerPage}
    `);

    return query.rows;
  }

  async createProduct(product) {
    const query = await pool.query(`
      INSERT INTO "${this.table}"
      (
        msa_id, 
        name, 
        description, 
        unit_price, 
        unit_type, 
        has_package, 
        has_big_package, 
        package_price, 
        big_package_price, 
        package_size, 
        big_package_size
      )
      VALUES (
        '${product.msa_id}', 
        '${product.name}', 
        '${product.description}', 
        ${product.unit_price}, 
        '${product.unit_type}', 
        '${product.has_package}', 
        '${product.has_big_package}',
        ${product.package_price},
        ${product.big_package_price},
        ${product.package_size},
        ${product.big_package_size}
      )
      RETURNING *;
    `);

    return query.rows[0];
  }

  async getProductByMSAID(msa_id) {
    const query = await pool.query(`
      SELECT "${this.table}".*, 
        ARRAY_AGG(DISTINCT "Images".source) as images,
        ARRAY_AGG(DISTINCT "Categories".name) as categories
      FROM "${this.table}"
      JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE msa_id = '${msa_id}'
      GROUP BY "${this.table}".id
    `);

    return query.rows[0];
  }

  async uploadImage(imageUrl, product_id) {
    const query = await pool.query(`
      INSERT INTO "Images"
      (product_id, source)
      VALUES (${product_id}, '${imageUrl}')
      RETURNING source
    `);

    return query.rows[0];
  }

  async getProductByCategory(category_id, page, itemsPerPage) {
    const query = await pool.query(`
      SELECT "${this.table}".*, 
        ARRAY_AGG(DISTINCT "Images".source) as images,
        ARRAY_AGG(DISTINCT "Categories".name) as categories
      FROM "${this.table}"
      JOIN "Images" ON "${this.table}".id = "Images".product_id
      LEFT JOIN "ProductCategory" ON "${this.table}".id = "ProductCategory".product_id
      LEFT JOIN "Categories" ON "ProductCategory".category_id = "Categories".id
      WHERE "${this.table}".id IN (
        SELECT product_id
        FROM "ProductCategory"
        WHERE category_id = ${category_id} 
      )
      GROUP BY "${this.table}".id
      ORDER BY "${this.table}".id
      LIMIT ${itemsPerPage} OFFSET ${page * itemsPerPage}
    `);

    return query.rows;
  }

  async countProductByCategory(category_id) {
    const count = await pool.query(`
      SELECT count("${this.table}".id)
      FROM "${this.table}"
      JOIN "ProductCategory" as pc ON pc.product_id = "${this.table}".id
      WHERE pc.category_id = ${category_id}
    `);

    return count.rows[0].count;
  }

  async getAllProductsOnlyMSAIDByCategory(category_id) {
    const query = await pool.query(`
      SELECT p.id, msa_id 
      FROM "${this.table}" as p
      JOIN "ProductCategory" as pc ON pc.product_id = p.id
      WHERE pc.category_id = ${category_id}
    `);
    console.log(query);
    return query.rows;
  }

  async getAllOnlyMSAID() {
    const query = await pool.query(`
      SELECT id, msa_id FROM "${this.table}"
    `);
    return query.rows;
  }

  // --- 1. Fetching the filtered products (Replaces your current function) ---
  async getProductsByCategoryAndDescendants(categoryId, page = 0, itemsPerPage = 40, searchTerm = "") {
    const offset = page * itemsPerPage;
    const values = [categoryId]; // $1
    
    let query = `
      WITH RECURSIVE CategoryTree AS (
        -- Base case: Get the initial parent category
        SELECT id FROM "Categories" 
        WHERE id = $1
        
        UNION ALL
        
        -- Recursive step: Get all children
        SELECT c.id FROM "Categories" c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT 
        p.*,
        -- Aggregate the images into a JSON array using your specific schema
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

    // If the user typed a search term, add the SQL ILIKE filter
    if (searchTerm) {
      // Searching by product name OR msa_id. (Adjust column names if needed!)
      query += ` AND (p.name ILIKE $2 OR p.msa_id ILIKE $2)`;
      values.push(`%${searchTerm}%`); // $2
    }

    // Add grouping, limits, and offsets for pagination
    query += ` GROUP BY p.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(itemsPerPage, offset);

    try {
      // Execute with the parameters array to prevent SQL injection
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error fetching filtered category products:", error);
      throw error;
    }
  }

  // --- 2. Getting the total count so the Pagination UI knows how many pages there are ---
  async countProductsByCategoryAndDescendants(categoryId, searchTerm = "") {
    const values = [categoryId]; // $1
    
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

    // Make sure the count query uses the exact same filter!
    if (searchTerm) {
      query += ` AND (p.name ILIKE $2 OR p.msa_id ILIKE $2)`;
      values.push(`%${searchTerm}%`); // $2
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Error counting category products:", error);
      throw error;
    }
  }
}

module.exports = ProductModel;