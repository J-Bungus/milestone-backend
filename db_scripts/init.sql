CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  business VARCHAR(100) NOT NULL,
  name VARCHAR(60) NOT NULL,
  address VARCHAR(150),
  email VARCHAR(50) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  username VARCHAR(25),
  password TEXT,
  password_reset_token TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "IPAddresses" (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  ip INET NOT NULL,
  code TEXT,
  FOREIGN KEY (user_id) 
    REFERENCES "Users"(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Invoices" (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sent BOOLEAN DEFAULT 'false',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id)
    REFERENCES "Users"(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Products" (
  id SERIAL PRIMARY KEY,
  msa_id VARCHAR(10) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit_type VARCHAR(10) NOT NULL,
  has_package BOOLEAN,
  has_big_package BOOLEAN,
  package_price DECIMAL(10, 2),
  big_package_price DECIMAL (10, 2),
  package_size INT,
  big_package_size INT
);

CREATE TABLE IF NOT EXISTS "Items" (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  amount INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  package_type VARCHAR(20),
  FOREIGN KEY(invoice_id)
    REFERENCES "Invoices"(id)
    ON DELETE CASCADE,
  FOREIGN KEY(product_id)
    REFERENCES "Products"(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Images" (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  source TEXT,
  FOREIGN KEY(product_id)
    REFERENCES "Products"(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Carts" (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	user_id INT NOT NULL,
	FOREIGN KEY (user_id)
		REFERENCES "Users"(id)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CartItems" (
	id SERIAL PRIMARY KEY,
	cart_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	product_id INT NOT NULL,
	amount INT NOT NULL,
    package_type VARCHAR(20),
	FOREIGN KEY(cart_id)
		REFERENCES "Carts"(id)
		ON DELETE CASCADE,
	FOREIGN KEY(product_id)
		REFERENCES "Products"(id)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Categories" (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	parent_id INTEGER REFERENCES "Categories"(id) ON DELETE CASCADE,
    is_leaf VARCHAR(10) DEFAULT 'false',
	order_index DECIMAL(8,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ProductCategory" (
	id SERIAL PRIMARY KEY,
	category_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	FOREIGN KEY (category_id)
		REFERENCES "Categories"(id)
		ON DELETE CASCADE,
	FOREIGN KEY (product_id)
		REFERENCES "Products"(id)
		ON DELETE CASCADE
);

INSERT INTO "Users" (business, name, email, phone, username, password, is_admin)
VALUES ('Admin', 'Justin Wang', 'justin.wang1ab@gmail.com', '4166182704', 'admin0', 'temp', TRUE);