class UserModel {
  constructor() {
    this.table = "Users";
  }

  async getOneById(user_id) {
    const query = await pool.query(`
      SELECT * FROM "${this.table}"
      WHERE id = ${user_id}
    `);

    return query.rows[0];
  }

  async getOneByUsername(username) {
    const query = await pool.query(`
      SELECT * FROM "${this.table}"
      WHERE username = '${username}'
    `);

    return query.rows[0];
  }

  async createOrUpdateUser(user) {
    const existingUser = await pool.query(`
      SELECT * FROM "${this.table}"
      WHERE id = ${user.id || -1}
    `);

    const id = user.id;
    delete user.id;

    const updatedUser = existingUser.rows.length === 0
      ? await pool.query(`
          INSERT INTO "${this.table}"
          (${Object.keys(user).join(",")})
          VALUES (${Object.values(user).map(val => `'${val}'`).join(",")})
          RETURNING *
        `)
      : await pool.query(`
          UPDATE "${this.table}"
          SET ${Object.keys(user).map(key => `${key}='${user[key]}'`)}
          WHERE id = ${id}
          RETURNING *
        `)
    
    return updatedUser.rows[0];
  }

  async updatePassword(user, password) {
    const updatedUser = await pool.query(`
      UPDATE "${this.table}"
      SET password = '${password}'
      WHERE id = ${user.id}
      RETURNING *
    `);

    return updatedUser.rows[0];
  }
}

module.exports = UserModel;