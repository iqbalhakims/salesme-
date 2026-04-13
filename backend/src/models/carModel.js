const pool = require('../config/database');

async function migrate() {
  await pool.query("ALTER TABLE cars ADD COLUMN IF NOT EXISTS year INT AFTER `condition`");
  await pool.query("ALTER TABLE cars ADD COLUMN IF NOT EXISTS grade VARCHAR(50) AFTER year");
}
migrate().catch(err => console.error('Migration error:', err.message));

const CarModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM cars ORDER BY created_at DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ model, price, mileage, condition, year, grade }) {
    const [result] = await pool.query(
      'INSERT INTO cars (model, price, mileage, `condition`, year, grade) VALUES (?, ?, ?, ?, ?, ?)',
      [model, price, mileage, condition, year || null, grade || null]
    );
    return result.insertId;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE cars SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM cars WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = CarModel;
