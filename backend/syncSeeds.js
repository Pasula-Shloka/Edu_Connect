require('dotenv').config({ path: '.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

async function syncSeeds() {
  try {
    const sPass = await bcrypt.hash('student123', 10);
    const fPass = await bcrypt.hash('faculty123', 10);
    const aPass = await bcrypt.hash('admin123', 10);

    // 1. Single Admin: admin@klh.edu.in
    const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'admin' ORDER BY user_id LIMIT 1");
    if (adminCheck.rows.length > 0) {
      await pool.query(
        "UPDATE users SET email = 'admin@klh.edu.in', password_hash = $1, full_name = 'System Administrator', status = 'active' WHERE user_id = $2",
        [aPass, adminCheck.rows[0].user_id]
      );
      // Remove any other rogue admins
      await pool.query("DELETE FROM users WHERE role = 'admin' AND user_id != $1", [adminCheck.rows[0].user_id]);
    } else {
      await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, status) VALUES ('System Administrator', 'admin@klh.edu.in', $1, 'admin', 'active')",
        [aPass]
      );
    }

    // 2. Student: 2200030001@klh.edu.in (Shloka Reddy)
    const studentCheck = await pool.query(
      "SELECT * FROM users WHERE email = '2200030001@klh.edu.in' OR email = 'shloka@klh.edu.in' OR user_id = 2"
    );
    if (studentCheck.rows.length > 0) {
      await pool.query(
        "UPDATE users SET full_name = 'Shloka Reddy', email = '2200030001@klh.edu.in', roll_number = '2200030001', password_hash = $1, role = 'student', status = 'active', department = 'Computer Science & Engineering', year = '3rd Year', section = 'Section A' WHERE user_id = $2",
        [sPass, studentCheck.rows[0].user_id]
      );
    } else {
      await pool.query(
        "INSERT INTO users (full_name, email, roll_number, password_hash, role, status, department, year, section) VALUES ('Shloka Reddy', '2200030001@klh.edu.in', '2200030001', $1, 'student', 'active', 'Computer Science & Engineering', '3rd Year', 'Section A')",
        [sPass]
      );
    }

    // 3. Faculty: fac10342@klh.edu.in (Dr. K. Srinivas Rao)
    const facCheck = await pool.query(
      "SELECT * FROM users WHERE email = 'fac10342@klh.edu.in' OR email = 'faculty@faculty.edu.in' OR user_id = 4"
    );
    if (facCheck.rows.length > 0) {
      await pool.query(
        "UPDATE users SET full_name = 'Dr. K. Srinivas Rao', email = 'fac10342@klh.edu.in', password_hash = $1, role = 'faculty', status = 'active', department = 'Computer Science & Engineering' WHERE user_id = $2",
        [fPass, facCheck.rows[0].user_id]
      );
    } else {
      await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, status, department) VALUES ('Dr. K. Srinivas Rao', 'fac10342@klh.edu.in', $1, 'faculty', 'active', 'Computer Science & Engineering')",
        [fPass]
      );
    }

    // 4. Update any existing users with generic passwords to know their password hash
    // Give all other students password 'student123' if they don't have valid hash
    await pool.query("UPDATE users SET password_hash = $1 WHERE role = 'student' AND (password_hash IS NULL OR password_hash = '123' OR password_hash = 'student123')", [sPass]);
    await pool.query("UPDATE users SET password_hash = $1 WHERE role = 'faculty' AND (password_hash IS NULL OR password_hash = '123' OR password_hash = 'faculty123')", [fPass]);

    console.log('✅ PostgreSQL seed users synced with passwords:');
    console.log(' - Student: 2200030001@klh.edu.in (pass: student123)');
    console.log(' - Faculty: fac10342@klh.edu.in (pass: faculty123)');
    console.log(' - Admin:   admin@klh.edu.in (pass: admin123)');

    const res = await pool.query("SELECT user_id, full_name, email, role, roll_number FROM users ORDER BY user_id;");
    console.log(res.rows);
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await pool.end();
  }
}

syncSeeds();
