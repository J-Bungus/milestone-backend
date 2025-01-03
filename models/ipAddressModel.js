class IPAddressModel {
  constructor () {
    this.table = "IPAddresses";
  }

  async getIPsByUserId (userId) {
    const ip = await pool.query(`
      SELECT * FROM "${this.table}"
      WHERE user_id = ${userId}
    `);

    return ip?.rows || undefined;
  };

  async createIP (ip, user, code = null) {
    const newIP = await pool.query(`
      INSERT INTO "${this.table}" (user_id, ip)
      VALUES (${user.id}, '${ip}')
      RETURNING *
    `);

    return newIP.rows[0];
  }

  async getVerificationCode(ip, userId) {
    const code = await pool.query(`
      SELECT code from "${this.table}"
      WHERE user_id = ${userId} AND ip = ${ip}
      LIMIT 1
    `);

    return code.rows[0];
  }
}

module.exports = IPAddressModel;