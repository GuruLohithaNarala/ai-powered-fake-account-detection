-- Create one admin user for testing (run after schema.sql)
-- Password: Admin@123 (change in production!)
-- Use bcrypt hash for 'Admin@123' (cost 12):
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@example.com',
  '$2a$12$B6OtUsmYCxI.qWWEGSmeN.O8x9YR6zfugJN8YOMJ6dbruV9SkJ/iu',
  'System Admin',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- To generate a new bcrypt hash (e.g. in Node):
-- const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword', 12).then(console.log);
