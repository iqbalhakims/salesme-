const pool = require('../config/database');

exports.getStats = async (_req, res) => {
  try {
    const [[carStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'available') AS available,
        SUM(status = 'sold') AS sold,
        SUM(status = 'reserved') AS reserved
      FROM cars
    `);

    const [[leadStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'new') AS new_leads,
        SUM(status = 'contacted') AS contacted,
        SUM(status = 'closed') AS closed,
        SUM(DATE(next_follow_up_date) = CURDATE()) AS followup_today
      FROM leads
    `);

    const [[apptStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'scheduled') AS scheduled,
        SUM(status = 'completed') AS completed,
        SUM(status = 'cancelled') AS cancelled,
        SUM(DATE(appointment_date) = CURDATE()) AS today
      FROM appointments
    `);

    const [todayAppts] = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.notes,
             l.name AS lead_name, l.phone AS lead_phone,
             c.model AS car_model, c.ref_no AS car_ref
      FROM appointments a
      JOIN leads l ON a.lead_id = l.id
      LEFT JOIN cars c ON l.car_id = c.id
      WHERE DATE(a.appointment_date) = CURDATE()
      ORDER BY a.appointment_date ASC
    `);

    const [upcomingAppts] = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.notes,
             l.name AS lead_name, l.phone AS lead_phone,
             c.model AS car_model, c.ref_no AS car_ref
      FROM appointments a
      JOIN leads l ON a.lead_id = l.id
      LEFT JOIN cars c ON l.car_id = c.id
      WHERE a.appointment_date > NOW() AND a.status = 'scheduled'
      ORDER BY a.appointment_date ASC
      LIMIT 5
    `);

    const [recentLeads] = await pool.query(`
      SELECT l.id, l.name, l.phone, l.status, l.created_at,
             c.model AS car_model, c.ref_no AS car_ref
      FROM leads l
      LEFT JOIN cars c ON l.car_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);

    const [[userStats]] = await pool.query(`
      SELECT COUNT(*) AS total,
             SUM(role = 'admin') AS admins,
             SUM(role = 'staff') AS staff
      FROM users
    `);

    res.json({
      success: true,
      data: {
        cars: carStats,
        leads: leadStats,
        appointments: apptStats,
        todayAppts,
        upcomingAppts,
        recentLeads,
        users: userStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
