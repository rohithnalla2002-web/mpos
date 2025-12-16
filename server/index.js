import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS to allow requests from any origin (for public QR menu access)
app.use(cors({
  origin: '*', // Allow all origins for public QR menu endpoint
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create Admin table with restaurant registration fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        -- Restaurant Registration Fields
        restaurant_name VARCHAR(255),
        owner_name VARCHAR(255),
        phone VARCHAR(50),
        cuisine_type VARCHAR(100),
        street_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'United States',
        business_type VARCHAR(50),
        tax_id VARCHAR(100),
        number_of_tables INTEGER,
        operating_hours TEXT,
        description TEXT,
        business_license_file VARCHAR(500),
        tax_document_file VARCHAR(500),
        health_permit_file VARCHAR(500),
        owner_id_proof_file VARCHAR(500),
        restaurant_photo_file VARCHAR(500),
        registration_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to existing admin table if they don't exist (for migration)
    const alterQueries = [
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS restaurant_name VARCHAR(255)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS street_address TEXT`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS state VARCHAR(100)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States'`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS business_type VARCHAR(50)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS number_of_tables INTEGER`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS operating_hours TEXT`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS business_license_file VARCHAR(500)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS tax_document_file VARCHAR(500)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS health_permit_file VARCHAR(500)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS owner_id_proof_file VARCHAR(500)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS restaurant_photo_file VARCHAR(500)`,
      `ALTER TABLE admin ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'pending'`,
    ];

    for (const query of alterQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        // Ignore errors for columns that already exist
        if (!error.message.includes('already exists')) {
          console.warn('Migration warning:', error.message);
        }
      }
    }

    // Create Staff table with admin_id to link to restaurant
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, admin_id)
      )
    `);

    // Create Kitchen table with admin_id to link to restaurant
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kitchen (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, admin_id)
      )
    `);

    // Add admin_id column to existing tables if they don't exist (for migration)
    const staffKitchenAlterQueries = [
      `ALTER TABLE staff ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE`,
      `ALTER TABLE kitchen ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE`,
    ];

    for (const query of staffKitchenAlterQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Migration warning:', error.message);
        }
      }
    }

    // Create indexes for faster lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_staff_admin_id ON staff(admin_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_kitchen_admin_id ON kitchen(admin_id)`);

    // Create Customer table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Menu Items table (linked to restaurant/admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image TEXT,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_spicy BOOLEAN DEFAULT FALSE,
        is_out_of_stock BOOLEAN DEFAULT FALSE,
        admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add admin_id column to menu_items if it doesn't exist (for migration)
    try {
      await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE`);
      await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0`);
      await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0`);
      
      // Check for menu items with NULL admin_id and warn
      const nullCheck = await pool.query(`SELECT COUNT(*) as count FROM menu_items WHERE admin_id IS NULL`);
      if (parseInt(nullCheck.rows[0].count) > 0) {
        console.warn(`⚠️ WARNING: Found ${nullCheck.rows[0].count} menu items with NULL admin_id. These items will not appear in restaurant menus.`);
        console.warn(`⚠️ Consider updating these items with the correct admin_id.`);
      }
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('Menu items migration warning:', error.message);
      }
    }

    // Create index for faster lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_admin_id ON menu_items(admin_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category)`);

    // Create Orders table (linked to restaurant/admin) - MUST be created before ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        table_id VARCHAR(50) NOT NULL,
        admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES customer(id) ON DELETE SET NULL,
        items JSONB NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
        payment_id VARCHAR(255),
        customer_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns to orders if they don't exist (for migration)
    try {
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES customer(id) ON DELETE SET NULL`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('Orders migration warning:', error.message);
      }
    }

    // Create index for faster lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_admin_id ON orders(admin_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)`);

    // Create Ratings table (MUST be created AFTER orders table since it references orders)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES customer(id) ON DELETE SET NULL,
        admin_id INTEGER REFERENCES admin(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add updated_at column if it doesn't exist (for migration)
    try {
      await pool.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('Ratings table migration warning:', error.message);
      }
    }

    // Create indexes for ratings
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_menu_item_id ON ratings(menu_item_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_admin_id ON ratings(admin_id)`);

    console.log('✅ Database tables created/verified');

    // Seed admin user if not exists
    const adminCheck = await pool.query('SELECT * FROM admin WHERE email = $1', ['admin@pos.com']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admin (email, password, name) VALUES ($1, $2, $3)',
        ['admin@pos.com', hashedPassword, 'Admin User']
      );
      console.log('✅ Admin user seeded: admin@pos.com / admin123');
    }

    // Seed demo users for quick access
    const demoUsers = [
      { table: 'staff', email: 'staff@pos.com', password: 'staff123', name: 'Staff User' },
      { table: 'kitchen', email: 'kitchen@pos.com', password: 'kitchen123', name: 'Kitchen User' },
      { table: 'customer', email: 'customer@pos.com', password: 'customer123', name: 'Customer User' },
    ];

    for (const user of demoUsers) {
      const check = await pool.query(`SELECT * FROM ${user.table} WHERE email = $1`, [user.email]);
      if (check.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          `INSERT INTO ${user.table} (email, password, name) VALUES ($1, $2, $3)`,
          [user.email, hashedPassword, user.name]
        );
        console.log(`✅ ${user.table} user seeded: ${user.email} / ${user.password}`);
      }
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Helper function to find user by email and role
async function findUserByEmail(email, role) {
  let tableName;
  switch (role) {
    case 'ADMIN':
      tableName = 'admin';
      break;
    case 'STAFF':
      tableName = 'staff';
      break;
    case 'KITCHEN':
      tableName = 'kitchen';
      break;
    case 'CUSTOMER':
      tableName = 'customer';
      break;
    default:
      return null;
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE email = $1`,
      [email]
    );
    return result.rows[0] ? { ...result.rows[0], role, table: tableName } : null;
  } catch (error) {
    console.error(`Error finding user in ${tableName}:`, error);
    return null;
  }
}

// Helper function to find user in any table
async function findUserInAnyTable(email) {
  const tables = ['admin', 'staff', 'kitchen', 'customer'];
  const roles = ['ADMIN', 'STAFF', 'KITCHEN', 'CUSTOMER'];

  for (let i = 0; i < tables.length; i++) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${tables[i]} WHERE email = $1`,
        [email]
      );
      if (result.rows.length > 0) {
        return { ...result.rows[0], role: roles[i], table: tables[i] };
      }
    } catch (error) {
      console.error(`Error checking ${tables[i]}:`, error);
    }
  }
  return null;
}

// API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserInAnyTable(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (without password)
    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Include restaurant_name for admin users (even if null, so frontend knows to check)
    if (user.role === 'ADMIN') {
      userData.restaurantName = user.restaurant_name || null;
      userData.adminId = user.id.toString(); // Admin's own ID
      console.log('Admin login - restaurant_name from DB:', user.restaurant_name);
      console.log('Admin login - userData being sent:', userData);
    } else if (user.role === 'STAFF' || user.role === 'KITCHEN') {
      // For staff/kitchen, include admin_id to link to their restaurant
      userData.adminId = user.admin_id ? user.admin_id.toString() : null;
    }

    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Default to CUSTOMER if role is not provided
    const userRole = role || 'CUSTOMER';

    // Validate role
    const validRoles = ['ADMIN', 'STAFF', 'KITCHEN', 'CUSTOMER'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists in any table
    const existingUser = await findUserInAnyTable(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine table name
    let tableName;
    switch (userRole) {
      case 'ADMIN':
        tableName = 'admin';
        break;
      case 'STAFF':
        tableName = 'staff';
        break;
      case 'KITCHEN':
        tableName = 'kitchen';
        break;
      case 'CUSTOMER':
        tableName = 'customer';
        break;
    }

    // Insert user
    const result = await pool.query(
      `INSERT INTO ${tableName} (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name`,
      [email, hashedPassword, name]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      id: newUser.id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: userRole,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restaurant Registration endpoint
app.post('/api/restaurant/register', upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 },
  { name: 'healthPermit', maxCount: 1 },
  { name: 'ownerIdProof', maxCount: 1 },
  { name: 'restaurantPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      cuisineType,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      businessType,
      taxId,
      numberOfTables,
      operatingHours,
      description
    } = req.body;

    // Validate required fields
    if (!restaurantName || !ownerName || !email || !phone || !cuisineType) {
      return res.status(400).json({ error: 'Restaurant name, owner name, email, phone, and cuisine type are required' });
    }

    if (!streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ error: 'Complete address is required' });
    }

    if (!businessType || !taxId || !numberOfTables) {
      return res.status(400).json({ error: 'Business type, tax ID, and number of tables are required' });
    }

    // Check if email already exists in admin table
    const existingAdmin = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
    const isUpdate = existingAdmin.rows.length > 0;
    
    if (isUpdate) {
      console.log('Updating existing admin with restaurant info for email:', email);
    } else {
      console.log('Creating new admin with restaurant info for email:', email);
    }

    // Get uploaded file names
    const files = req.files || {};
    const businessLicenseFile = files.businessLicense?.[0]?.filename || null;
    const taxDocumentFile = files.taxDocument?.[0]?.filename || null;
    const healthPermitFile = files.healthPermit?.[0]?.filename || null;
    const ownerIdProofFile = files.ownerIdProof?.[0]?.filename || null;
    const restaurantPhotoFile = files.restaurantPhoto?.[0]?.filename || null;

    // Validate required documents
    if (!businessLicenseFile || !taxDocumentFile || !healthPermitFile || !ownerIdProofFile) {
      return res.status(400).json({ error: 'All required documents must be uploaded' });
    }

    // Get password from request or generate default
    const password = req.body.password || ('Restaurant@' + Date.now().toString().slice(-6));
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    let result;
    
    if (isUpdate) {
      // Update existing admin with restaurant info
      // Only update password if provided, otherwise keep existing
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        result = await pool.query(`
          UPDATE admin SET
            name = $1,
            password = $2,
            restaurant_name = $3,
            owner_name = $4,
            phone = $5,
            cuisine_type = $6,
            street_address = $7,
            city = $8,
            state = $9,
            zip_code = $10,
            country = $11,
            business_type = $12,
            tax_id = $13,
            number_of_tables = $14,
            operating_hours = $15,
            description = $16,
            business_license_file = $17,
            tax_document_file = $18,
            health_permit_file = $19,
            owner_id_proof_file = $20,
            restaurant_photo_file = $21,
            registration_status = $22,
            updated_at = CURRENT_TIMESTAMP
          WHERE email = $23
          RETURNING id, email, name, restaurant_name, registration_status
        `, [
          ownerName,
          hashedPassword,
          restaurantName,
          ownerName,
          phone,
          cuisineType,
          streetAddress,
          city,
          state,
          zipCode,
          country || 'United States',
          businessType,
          taxId,
          parseInt(numberOfTables) || 0,
          operatingHours || '',
          description || '',
          businessLicenseFile,
          taxDocumentFile,
          healthPermitFile,
          ownerIdProofFile,
          restaurantPhotoFile,
          'pending',
          email
        ]);
      } else {
        // Update without changing password
        result = await pool.query(`
          UPDATE admin SET
            name = $1,
            restaurant_name = $2,
            owner_name = $3,
            phone = $4,
            cuisine_type = $5,
            street_address = $6,
            city = $7,
            state = $8,
            zip_code = $9,
            country = $10,
            business_type = $11,
            tax_id = $12,
            number_of_tables = $13,
            operating_hours = $14,
            description = $15,
            business_license_file = $16,
            tax_document_file = $17,
            health_permit_file = $18,
            owner_id_proof_file = $19,
            restaurant_photo_file = $20,
            registration_status = $21,
            updated_at = CURRENT_TIMESTAMP
          WHERE email = $22
          RETURNING id, email, name, restaurant_name, registration_status
        `, [
          ownerName,
          restaurantName,
          ownerName,
          phone,
          cuisineType,
          streetAddress,
          city,
          state,
          zipCode,
          country || 'United States',
          businessType,
          taxId,
          parseInt(numberOfTables) || 0,
          operatingHours || '',
          description || '',
          businessLicenseFile,
          taxDocumentFile,
          healthPermitFile,
          ownerIdProofFile,
          restaurantPhotoFile,
          'pending',
          email
        ]);
      }
    } else {
      // Insert new admin with restaurant info
      const hashedPassword = await bcrypt.hash(password, 10);
      result = await pool.query(`
        INSERT INTO admin (
          email, password, name,
          restaurant_name, owner_name, phone, cuisine_type,
          street_address, city, state, zip_code, country,
          business_type, tax_id, number_of_tables, operating_hours, description,
          business_license_file, tax_document_file, health_permit_file, 
          owner_id_proof_file, restaurant_photo_file, registration_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id, email, name, restaurant_name, registration_status
      `, [
        email,
        hashedPassword,
        ownerName,
        restaurantName,
        ownerName,
        phone,
        cuisineType,
        streetAddress,
        city,
        state,
        zipCode,
        country || 'United States',
        businessType,
        taxId,
        parseInt(numberOfTables) || 0,
        operatingHours || '',
        description || '',
        businessLicenseFile,
        taxDocumentFile,
        healthPermitFile,
        ownerIdProofFile,
        restaurantPhotoFile,
        'pending'
      ]);
    }

    const restaurant = result.rows[0];

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate 
        ? 'Restaurant information updated successfully.'
        : 'Restaurant registration submitted successfully. Your account is pending approval.',
      restaurant: {
        id: restaurant.id.toString(),
        email: restaurant.email,
        name: restaurant.name,
        restaurantName: restaurant.restaurant_name,
        status: restaurant.registration_status
      }
    });
  } catch (error) {
    console.error('Restaurant registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Restaurant with this email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin details endpoint (for fetching restaurant info)
app.get('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching admin details for ID:', id);
    
    const result = await pool.query(
      'SELECT id, email, name, restaurant_name FROM admin WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log('Admin not found for ID:', id);
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const admin = result.rows[0];
    console.log('Admin found - restaurant_name:', admin.restaurant_name);
    const response = {
      id: admin.id.toString(),
      email: admin.email,
      name: admin.name,
      restaurantName: admin.restaurant_name || null,
    };
    console.log('Sending admin details response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching admin details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add staff/kitchen member endpoint (linked to admin/restaurant)
// NOTE: This route must come before /api/staff/:adminId to avoid route conflicts
app.post('/api/staff/add', async (req, res) => {
  try {
    console.log('POST /api/staff/add - Request received');
    const { name, email, password, role, adminId } = req.body;
    console.log('Request body:', { name, email, role, adminId: adminId ? 'provided' : 'missing' });

    if (!name || !email || !password || !role || !adminId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role (only STAFF and KITCHEN can be added by admin)
    if (role !== 'STAFF' && role !== 'KITCHEN') {
      return res.status(400).json({ error: 'Invalid role. Only STAFF and KITCHEN can be added.' });
    }

    // Verify admin exists
    const adminCheck = await pool.query('SELECT id FROM admin WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if user already exists for this admin
    const tableName = role === 'STAFF' ? 'staff' : 'kitchen';
    const existingCheck = await pool.query(
      `SELECT * FROM ${tableName} WHERE email = $1 AND admin_id = $2`,
      [email, adminId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Staff member with this email already exists for your restaurant' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert staff/kitchen member
    const result = await pool.query(
      `INSERT INTO ${tableName} (email, password, name, admin_id) VALUES ($1, $2, $3, $4) RETURNING id, email, name`,
      [email, hashedPassword, name, adminId]
    );

    const newMember = result.rows[0];

    res.status(201).json({
      id: newMember.id.toString(),
      email: newMember.email,
      name: newMember.name,
      role: role,
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Staff member with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff/kitchen members for a specific admin
app.get('/api/staff/:adminId', async (req, res) => {
  try {
    console.log('GET /api/staff/:adminId - Request received for adminId:', req.params.adminId);
    const { adminId } = req.params;

    // Verify admin exists
    const adminCheck = await pool.query('SELECT id FROM admin WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Get staff members
    const staffResult = await pool.query(
      'SELECT id, email, name, created_at FROM staff WHERE admin_id = $1 ORDER BY created_at DESC',
      [adminId]
    );

    // Get kitchen members
    const kitchenResult = await pool.query(
      'SELECT id, email, name, created_at FROM kitchen WHERE admin_id = $1 ORDER BY created_at DESC',
      [adminId]
    );

    // Combine and format results
    const staff = staffResult.rows.map(row => ({
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      role: 'STAFF',
      createdAt: row.created_at
    }));

    const kitchen = kitchenResult.rows.map(row => ({
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      role: 'KITCHEN',
      createdAt: row.created_at
    }));

    res.json([...staff, ...kitchen]);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Menu Items API Endpoints

// Get menu items for a specific admin/restaurant
app.get('/api/menu/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const result = await pool.query(
      `SELECT id, name, description, price, category, image, is_vegetarian, is_spicy, is_out_of_stock, created_at, updated_at 
       FROM menu_items 
       WHERE admin_id = $1 
       ORDER BY category, name`,
      [adminId]
    );

    const items = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      image: row.image || `https://loremflickr.com/400/300/food,dish?random=${row.id}`,
      isVegetarian: row.is_vegetarian || false,
      isSpicy: row.is_spicy || false,
      isOutOfStock: row.is_out_of_stock || false,
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add menu item
app.post('/api/menu/add', async (req, res) => {
  try {
    const { name, description, price, category, image, isVegetarian, isSpicy, adminId } = req.body;

    if (!name || !description || !price || !category || !adminId) {
      return res.status(400).json({ error: 'Name, description, price, category, and adminId are required' });
    }

    // Validate and parse adminId as integer
    const adminIdNum = parseInt(adminId);
    if (isNaN(adminIdNum)) {
      return res.status(400).json({ error: 'Invalid adminId format' });
    }

    // Verify admin exists
    const adminCheck = await pool.query('SELECT id FROM admin WHERE id = $1', [adminIdNum]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const imgUrl = image || `https://loremflickr.com/400/300/food,dish?random=${Date.now()}`;

    console.log(`🔵 Adding menu item for admin_id: ${adminIdNum}`);

    const result = await pool.query(
      `INSERT INTO menu_items (name, description, price, category, image, is_vegetarian, is_spicy, admin_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::integer) 
       RETURNING id, name, description, price, category, image, is_vegetarian, is_spicy, is_out_of_stock, admin_id`,
      [name, description, parseFloat(price), category, imgUrl, isVegetarian || false, isSpicy || false, adminIdNum]
    );

    console.log(`✅ Menu item added with admin_id: ${result.rows[0].admin_id}`);

    const item = result.rows[0];
    res.status(201).json({
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      image: item.image,
      isVegetarian: item.is_vegetarian || false,
      isSpicy: item.is_spicy || false,
      isOutOfStock: item.is_out_of_stock || false,
    });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update menu item
app.put('/api/menu/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, category, image, isVegetarian, isSpicy, isOutOfStock, adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify item belongs to this admin
    const itemCheck = await pool.query(
      'SELECT admin_id FROM menu_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (itemCheck.rows[0].admin_id.toString() !== adminId) {
      return res.status(403).json({ error: 'You do not have permission to update this item' });
    }

    const result = await pool.query(
      `UPDATE menu_items 
       SET name = $1, description = $2, price = $3, category = $4, image = $5, 
           is_vegetarian = $6, is_spicy = $7, is_out_of_stock = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, name, description, price, category, image, is_vegetarian, is_spicy, is_out_of_stock`,
      [name, description, parseFloat(price), category, image, isVegetarian || false, isSpicy || false, isOutOfStock || false, itemId]
    );

    const item = result.rows[0];
    res.json({
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      image: item.image,
      isVegetarian: item.is_vegetarian || false,
      isSpicy: item.is_spicy || false,
      isOutOfStock: item.is_out_of_stock || false,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle out of stock status
app.patch('/api/menu/:itemId/stock', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isOutOfStock, adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify item belongs to this admin
    const itemCheck = await pool.query(
      'SELECT admin_id FROM menu_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (itemCheck.rows[0].admin_id.toString() !== adminId) {
      return res.status(403).json({ error: 'You do not have permission to update this item' });
    }

    const result = await pool.query(
      `UPDATE menu_items 
       SET is_out_of_stock = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, is_out_of_stock`,
      [isOutOfStock || false, itemId]
    );

    res.json({ id: result.rows[0].id.toString(), isOutOfStock: result.rows[0].is_out_of_stock });
  } catch (error) {
    console.error('Error updating stock status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete menu item
app.delete('/api/menu/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify item belongs to this admin
    const itemCheck = await pool.query(
      'SELECT admin_id FROM menu_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (itemCheck.rows[0].admin_id.toString() !== adminId) {
      return res.status(403).json({ error: 'You do not have permission to delete this item' });
    }

    await pool.query('DELETE FROM menu_items WHERE id = $1', [itemId]);

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// QR Code Generation endpoint
app.get('/api/qr/generate', async (req, res) => {
  try {
    const { adminId, tableId } = req.query;

    console.log('🔵 QR Generation Request:', { adminId, tableId });

    // Validate input parameters
    if (!adminId || !tableId) {
      console.error('❌ Missing required parameters:', { adminId, tableId });
      return res.status(400).json({ error: 'Admin ID and Table ID are required' });
    }

    // Validate adminId is a number
    const adminIdNum = parseInt(adminId);
    if (isNaN(adminIdNum)) {
      console.error('❌ Invalid adminId format:', adminId);
      return res.status(400).json({ error: 'Invalid Admin ID format' });
    }

    // Get admin/restaurant details
    let adminResult;
    try {
      adminResult = await pool.query(
        'SELECT id, restaurant_name, number_of_tables FROM admin WHERE id = $1',
        [adminIdNum]
      );
    } catch (dbError) {
      console.error('❌ Database error fetching admin:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        message: dbError.message 
      });
    }

    if (adminResult.rows.length === 0) {
      console.error('❌ Admin not found:', adminId);
      return res.status(404).json({ error: 'Admin not found' });
    }

    const admin = adminResult.rows[0];
    
    // Validate admin data
    if (!admin.id) {
      console.error('❌ Admin ID is missing from database result');
      return res.status(500).json({ error: 'Invalid admin data' });
    }

    const numTables = admin.number_of_tables || 20;

    // Validate table number
    const tableNum = parseInt(tableId);
    if (isNaN(tableNum) || tableNum < 1 || tableNum > numTables) {
      console.error('❌ Invalid table number:', { tableId, numTables });
      return res.status(400).json({ error: `Invalid table number. Must be between 1 and ${numTables}` });
    }

    // Get menu items (optional - not needed for QR code, but good for validation)
    let menuResult;
    try {
      menuResult = await pool.query(
        `SELECT id, name, description, price, category, image, is_vegetarian, is_spicy, is_out_of_stock 
         FROM menu_items 
         WHERE admin_id = $1 AND is_out_of_stock = FALSE
         ORDER BY category, name
         LIMIT 1`,
        [adminIdNum]
      );
      console.log('🔵 Menu items found:', menuResult.rows.length);
    } catch (dbError) {
      console.warn('⚠️ Warning: Could not fetch menu items:', dbError.message);
      // Continue anyway - menu is not required for QR generation
    }

    // Create QR data - only encode the URL, not the entire menu
    // The menu will be fetched from the server when the QR code is scanned
    // Use FRONTEND_URL from environment, or default to hosted frontend URL
    const baseUrl = process.env.FRONTEND_URL || `https://mpostest.netlify.app`;
    
    // Ensure URL has protocol
    const frontendUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') 
      ? baseUrl 
      : `https://${baseUrl}`;
    
    const qrUrl = `${frontendUrl}/menu?restaurant=${admin.id}&table=${tableId}`;

    console.log('🔵 Generating QR code for:', qrUrl);
    console.log('🔵 QRCode library available:', typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function');

    // Validate QRCode library is available
    if (!QRCode || typeof QRCode.toDataURL !== 'function') {
      console.error('❌ QRCode library not available or toDataURL method missing');
      return res.status(500).json({ 
        error: 'QR code library not available',
        message: 'QRCode.toDataURL is not a function'
      });
    }

    // Generate QR code as data URL - only encode the URL, not the entire menu
    // This prevents the QR code from being too large
    // Use simpler options to avoid potential issues with canvas dependencies
    let qrCodeDataUrl;
    try {
      // Try with minimal options first
      qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 1
      });
      
      if (!qrCodeDataUrl || typeof qrCodeDataUrl !== 'string') {
        throw new Error('QR code generation returned invalid data');
      }
      
      // Validate it's a data URL
      if (!qrCodeDataUrl.startsWith('data:image')) {
        throw new Error('QR code generation returned invalid format');
      }
      
      console.log('✅ QR code generated successfully, length:', qrCodeDataUrl.length);
    } catch (qrError) {
      console.error('❌ QRCode.toDataURL error:', qrError);
      console.error('❌ Error details:', {
        message: qrError.message,
        stack: qrError.stack,
        name: qrError.name,
        url: qrUrl,
        urlLength: qrUrl.length,
        qrCodeType: typeof QRCode,
        toDataURLType: typeof QRCode?.toDataURL
      });
      return res.status(500).json({ 
        error: 'Failed to generate QR code',
        message: qrError.message || 'Unknown QR generation error',
        details: process.env.NODE_ENV === 'development' ? qrError.stack : undefined
      });
    }

    res.json({
      qrCode: qrCodeDataUrl,
      restaurantName: admin.restaurant_name || 'Restaurant',
      tableId: tableId,
      url: qrUrl
    });
  } catch (error) {
    console.error('❌ Unexpected error generating QR code:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// Get analytics data for admin dashboard
app.get('/api/analytics/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { range = 'Week' } = req.query;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify admin exists
    const adminCheck = await pool.query('SELECT id FROM admin WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Calculate date range based on time range
    const now = new Date();
    let startDate = new Date();
    let labels = [];
    let groupBy;

    switch (range) {
      case 'Today':
        startDate.setHours(0, 0, 0, 0);
        groupBy = 'hour';
        labels = Array.from({ length: 8 }, (_, i) => {
          const hour = 10 + i;
          return hour <= 12 ? `${hour}am` : `${hour - 12}pm`;
        });
        break;
      case 'Week':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'Month':
        startDate.setMonth(now.getMonth() - 1);
        groupBy = 'week';
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        break;
      case 'Year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    // Calculate previous period start date for comparison
    let previousStartDate = new Date(startDate);
    const periodDiff = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodDiff);

    // Get total revenue (sum of all paid/completed orders) for current period
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
       FROM orders 
       WHERE admin_id = $1 
       AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
       AND created_at >= $2`,
      [adminId, startDate]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue || 0);

    // Get total revenue for previous period (for comparison)
    const prevRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
       FROM orders 
       WHERE admin_id = $1 
       AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
       AND created_at >= $2 AND created_at < $3`,
      [adminId, previousStartDate, startDate]
    );
    const prevTotalRevenue = parseFloat(prevRevenueResult.rows[0].total_revenue || 0);
    const revenueChange = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

    // Get total orders count for current period
    const ordersResult = await pool.query(
      `SELECT COUNT(*) as total_orders
       FROM orders 
       WHERE admin_id = $1 
       AND created_at >= $2`,
      [adminId, startDate]
    );
    const totalOrders = parseInt(ordersResult.rows[0].total_orders || 0);

    // Get total orders for previous period (for comparison)
    const prevOrdersResult = await pool.query(
      `SELECT COUNT(*) as total_orders
       FROM orders 
       WHERE admin_id = $1 
       AND created_at >= $2 AND created_at < $3`,
      [adminId, previousStartDate, startDate]
    );
    const prevTotalOrders = parseInt(prevOrdersResult.rows[0].total_orders || 0);
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;

    // Get average rating from ratings table for the current period
    const ratingResult = await pool.query(
      `SELECT COALESCE(AVG(r.rating), 0) as avg_rating
       FROM ratings r
       INNER JOIN orders o ON r.order_id = o.id
       WHERE r.admin_id = $1 
       AND o.created_at >= $2`,
      [adminId, startDate]
    );
    const averageRating = parseFloat(ratingResult.rows[0].avg_rating || 0);

    // Get revenue trend data grouped by time period
    let revenueTrendQuery;
    if (range === 'Today') {
      revenueTrendQuery = `
        SELECT 
          EXTRACT(HOUR FROM created_at) as period,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE admin_id = $1 
        AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
        AND created_at >= $2
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY period
      `;
    } else if (range === 'Week') {
      revenueTrendQuery = `
        SELECT 
          EXTRACT(DOW FROM created_at) as period,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE admin_id = $1 
        AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
        AND created_at >= $2
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY period
      `;
    } else if (range === 'Month') {
      revenueTrendQuery = `
        SELECT 
          EXTRACT(WEEK FROM created_at) - EXTRACT(WEEK FROM $2::date) + 1 as period,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE admin_id = $1 
        AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
        AND created_at >= $2
        GROUP BY EXTRACT(WEEK FROM created_at)
        ORDER BY period
      `;
    } else { // Year
      revenueTrendQuery = `
        SELECT 
          EXTRACT(MONTH FROM created_at) as period,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE admin_id = $1 
        AND status IN ('PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED')
        AND created_at >= $2
        GROUP BY EXTRACT(MONTH FROM created_at)
        ORDER BY period
      `;
    }

    const trendResult = await pool.query(revenueTrendQuery, [adminId, startDate]);
    
    // Map database results to labels
    const revenueTrend = labels.map((label, index) => {
      let periodValue;
      if (range === 'Today') {
        periodValue = 10 + index; // 10am to 5pm
      } else if (range === 'Week') {
        // PostgreSQL DOW: 0=Sunday, 1=Monday, 2=Tuesday, etc.
        // Our labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        // So index 0 (Mon) = DOW 1, index 6 (Sun) = DOW 0
        periodValue = index === 6 ? 0 : index + 1;
      } else if (range === 'Month') {
        periodValue = index + 1; // Week 1-4
      } else {
        periodValue = index + 1; // Month 1-12
      }

      const trendData = trendResult.rows.find(row => {
        const dbPeriod = parseFloat(row.period);
        return Math.abs(dbPeriod - periodValue) < 0.5; // Handle floating point comparison
      });

      return {
        label,
        value: trendData ? parseFloat(trendData.revenue || 0) : 0
      };
    });

    res.json({
      totalRevenue,
      totalOrders,
      averageRating: averageRating || 0,
      revenueTrend,
      revenueChange: revenueChange || 0,
      ordersChange: ordersChange || 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle CORS preflight requests for QR menu endpoint
app.options('/api/qr/menu', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Handle CORS preflight requests for QR menu endpoint
app.options('/api/qr/menu', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Get restaurant menu for QR code access (public endpoint)
app.get('/api/qr/menu', async (req, res) => {
  try {
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    const { restaurant, table } = req.query;

    console.log('🔵 QR Menu Request:', { 
      restaurant, 
      table, 
      query: req.query,
      headers: req.headers,
      origin: req.headers.origin 
    });

    if (!restaurant || !table) {
      console.error('❌ Missing required parameters:', { restaurant, table });
      return res.status(400).json({ error: 'Restaurant ID and Table ID are required' });
    }

    // Validate and parse restaurant ID
    const restaurantId = parseInt(restaurant);
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: 'Invalid Restaurant ID format' });
    }

    console.log(`🔵 Fetching menu for restaurant ${restaurantId}, table ${table}`);

    // Get restaurant details
    const adminResult = await pool.query(
      'SELECT id, restaurant_name FROM admin WHERE id = $1',
      [restaurantId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // First, verify restaurant exists and get its ID
    const restaurantIdFromDb = adminResult.rows[0].id;
    console.log(`🔵 Restaurant ID from DB: ${restaurantIdFromDb} (type: ${typeof restaurantIdFromDb})`);
    console.log(`🔵 Restaurant ID from query: ${restaurantId} (type: ${typeof restaurantId})`);
    
    // Ensure IDs match
    if (parseInt(restaurantIdFromDb) !== restaurantId) {
      console.error(`❌ Restaurant ID mismatch! DB: ${restaurantIdFromDb}, Query: ${restaurantId}`);
      return res.status(400).json({ error: 'Restaurant ID mismatch' });
    }

    // First, check if there are any menu items with NULL admin_id (data integrity check)
    const nullAdminIdCheck = await pool.query(
      `SELECT COUNT(*) as count FROM menu_items WHERE admin_id IS NULL`
    );
    if (parseInt(nullAdminIdCheck.rows[0].count) > 0) {
      console.warn(`⚠️ WARNING: Found ${nullAdminIdCheck.rows[0].count} menu items with NULL admin_id!`);
    }

    // Get menu items - ensure we only get items for this specific restaurant
    // Use explicit integer comparison and exclude NULL values
    // REMOVED is_out_of_stock filter to show ALL items for debugging
    const menuResult = await pool.query(
      `SELECT id, name, description, price, category, image, is_vegetarian, is_spicy, is_out_of_stock, admin_id 
       FROM menu_items 
       WHERE admin_id IS NOT NULL 
         AND admin_id = $1::integer
       ORDER BY 
         CASE category
           WHEN 'Starters' THEN 1
           WHEN 'Mains' THEN 2
           WHEN 'Desserts' THEN 3
           WHEN 'Drinks' THEN 4
           ELSE 5
         END,
         name`,
      [restaurantId]
    );
    
    console.log(`🔵 RAW QUERY RESULT: Found ${menuResult.rows.length} rows from database`);
    if (menuResult.rows.length > 0) {
      console.log(`🔵 First 3 raw rows:`, menuResult.rows.slice(0, 3).map(r => ({
        id: r.id,
        name: r.name,
        admin_id: r.admin_id,
        is_out_of_stock: r.is_out_of_stock,
        category: r.category
      })));
    }
    
    // Additional verification query to check all menu items for this restaurant (including out of stock)
    const allItemsCheck = await pool.query(
      `SELECT id, name, admin_id, is_out_of_stock FROM menu_items 
       WHERE admin_id IS NOT NULL AND admin_id = $1::integer`,
      [restaurantId]
    );
    console.log(`🔵 Total menu items (all, including out of stock) for restaurant ${restaurantId}: ${allItemsCheck.rows.length}`);
    if (allItemsCheck.rows.length > 0) {
      const inStock = allItemsCheck.rows.filter(r => !r.is_out_of_stock).length;
      const outOfStock = allItemsCheck.rows.filter(r => r.is_out_of_stock).length;
      console.log(`🔵   - In stock: ${inStock}`);
      console.log(`🔵   - Out of stock: ${outOfStock}`);
      console.log(`🔵 Sample items:`, allItemsCheck.rows.slice(0, 3).map(r => ({ 
        id: r.id, 
        name: r.name, 
        admin_id: r.admin_id,
        is_out_of_stock: r.is_out_of_stock 
      })));
    } else {
      // Check if there are menu items for OTHER restaurants
      const otherRestaurantsCheck = await pool.query(
        `SELECT DISTINCT admin_id, COUNT(*) as count 
         FROM menu_items 
         WHERE admin_id IS NOT NULL 
         GROUP BY admin_id 
         ORDER BY admin_id`
      );
      console.log(`🔵 Menu items exist for other restaurants:`, otherRestaurantsCheck.rows.map(r => ({
        admin_id: r.admin_id,
        count: r.count
      })));
    }

    console.log(`🔵 Query executed for restaurant ID: ${restaurantId} (type: ${typeof restaurantId})`);
    console.log(`🔵 Found ${menuResult.rows.length} menu items in database`);
    
    // CRITICAL: Verify each menu item's admin_id before processing
    if (menuResult.rows.length > 0) {
      console.log(`🔵 Verifying admin_id for each menu item...`);
      menuResult.rows.forEach((row, index) => {
        const rowAdminId = parseInt(row.admin_id);
        if (rowAdminId !== restaurantId) {
          console.error(`❌ MISMATCH at index ${index}: Item "${row.name}" (ID: ${row.id}) has admin_id=${rowAdminId}, expected ${restaurantId}`);
        } else {
          console.log(`✅ Item "${row.name}" (ID: ${row.id}) has correct admin_id=${rowAdminId}`);
        }
      });
      
      const adminIds = [...new Set(menuResult.rows.map(row => row.admin_id))];
      console.log(`🔵 Unique admin IDs found in query results:`, adminIds);
      console.log(`🔵 Expected admin ID: ${restaurantId}`);
      
      // Check if any items have wrong admin_id
      const wrongAdminIdItems = menuResult.rows.filter(row => parseInt(row.admin_id) !== restaurantId);
      if (wrongAdminIdItems.length > 0) {
        console.error(`❌ ERROR: Found ${wrongAdminIdItems.length} items with wrong admin_id!`);
        console.error(`❌ These items should NOT be returned for restaurant ${restaurantId}`);
        wrongAdminIdItems.forEach(item => {
          console.error(`❌ Item ID: ${item.id}, Name: ${item.name}, admin_id: ${item.admin_id}, Expected: ${restaurantId}`);
        });
      }
    } else {
      // If no items found, check what menu items exist in the database
      const allMenuItemsCheck = await pool.query(
        `SELECT id, name, admin_id FROM menu_items LIMIT 10`
      );
      console.log(`🔵 Sample of ALL menu items in database (first 10):`, 
        allMenuItemsCheck.rows.map(r => ({ id: r.id, name: r.name, admin_id: r.admin_id }))
      );
    }
    
    // Map all menu items - only filter by admin_id match (already done in SQL query)
    // Don't filter by category or any other criteria - show ALL items for this restaurant
    const menuItems = menuResult.rows
      .map((row, index) => {
        const rowAdminId = parseInt(row.admin_id);
        
        // Final safety check - log if there's a mismatch (shouldn't happen due to SQL WHERE clause)
        if (rowAdminId !== restaurantId) {
          console.error(`❌ CRITICAL: Item ${row.id} (${row.name}) has wrong admin_id: ${rowAdminId} !== ${restaurantId}`);
          return null; // Will be filtered out
        }
        
        const category = row.category?.trim() || 'Mains';
        const menuItem = {
          id: row.id.toString(),
          name: row.name || 'Unnamed Item',
          description: row.description || '',
          price: parseFloat(row.price) || 0,
          category: category, // Use whatever category is in database
          image: row.image || `https://loremflickr.com/400/300/food,dish?random=${row.id}`,
          isVegetarian: row.is_vegetarian || false,
          isSpicy: row.is_spicy || false,
          isOutOfStock: row.is_out_of_stock || false,
        };
        
        console.log(`✅ Item ${index + 1}: ${menuItem.name} (Category: ${menuItem.category}, Price: ₹${menuItem.price})`);
        return menuItem;
      })
      .filter(item => item !== null); // Remove any null items from admin_id mismatch
    
    console.log(`🔵 After filtering: ${menuItems.length} items will be returned`);
    if (menuItems.length > 0) {
      console.log(`🔵 Menu items to return:`, menuItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price
      })));
    }

    console.log(`🔵 Final menu items count: ${menuItems.length}`);
    console.log(`🔵 Restaurant name: ${adminResult.rows[0].restaurant_name}`);
    
    // Log first few items for debugging
    if (menuItems.length > 0) {
      console.log(`✅ Returning ${menuItems.length} menu items for restaurant "${adminResult.rows[0].restaurant_name}" (ID: ${restaurantId})`);
      console.log(`🔵 Sample menu items:`, menuItems.slice(0, 3).map(item => ({ id: item.id, name: item.name, category: item.category })));
      console.log(`🔵 All menu item names:`, menuItems.map(item => item.name).join(', '));
    } else {
      console.warn(`⚠️ No menu items found for restaurant ${restaurantId}`);
      // Check if there are ANY menu items in the database for this restaurant
      const allItemsCheck = await pool.query(
        `SELECT COUNT(*) as count FROM menu_items WHERE admin_id = $1`,
        [restaurantId]
      );
      console.log(`🔵 Total menu items (including out of stock) for restaurant ${restaurantId}: ${allItemsCheck.rows[0].count}`);
    }

    // Final verification before sending response
    if (menuItems.length === 0) {
      console.warn(`⚠️ WARNING: No menu items to return for restaurant ${restaurantId}`);
      console.warn(`⚠️ Restaurant name: ${adminResult.rows[0].restaurant_name}`);
      // Return empty menu instead of error - let frontend handle it
    }

    // Final check before sending
    if (menuItems.length === 0 && menuResult.rows.length > 0) {
      console.error(`❌ CRITICAL ERROR: Query returned ${menuResult.rows.length} items but after processing we have ${menuItems.length} items!`);
      console.error(`❌ This means items are being filtered out incorrectly!`);
    }

    const responseData = {
      restaurant: {
        id: adminResult.rows[0].id.toString(),
        name: adminResult.rows[0].restaurant_name || 'Restaurant',
      },
      tableId: table,
      menu: menuItems
    };

    console.log(`✅ FINAL RESPONSE: Sending ${menuItems.length} menu items for restaurant "${adminResult.rows[0].restaurant_name}"`);
    console.log(`✅ Menu items in response:`, menuItems.map(item => item.name).join(', '));

    // Set response headers for CORS
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send response
    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error fetching QR menu:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Set error response headers for CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Diagnostic endpoint to check menu items for a restaurant (for debugging)
app.get('/api/qr/menu/debug/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurantIdNum = parseInt(restaurantId);
    
    if (isNaN(restaurantIdNum)) {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }

    // Get all menu items for this restaurant (including out of stock and NULL admin_id)
    const allItems = await pool.query(
      `SELECT id, name, admin_id, is_out_of_stock, category, price, description
       FROM menu_items 
       WHERE admin_id = $1::integer
       ORDER BY id`,
      [restaurantIdNum]
    );

    // Get ALL menu items in database (for comparison)
    const allItemsInDb = await pool.query(
      `SELECT id, name, admin_id, is_out_of_stock, category 
       FROM menu_items 
       ORDER BY admin_id, id
       LIMIT 50`
    );

    // Get restaurant info
    const adminResult = await pool.query(
      'SELECT id, restaurant_name FROM admin WHERE id = $1',
      [restaurantIdNum]
    );

    // Get menu items grouped by admin_id
    const itemsByAdmin = await pool.query(
      `SELECT admin_id, COUNT(*) as count 
       FROM menu_items 
       WHERE admin_id IS NOT NULL
       GROUP BY admin_id 
       ORDER BY admin_id`
    );

    res.json({
      restaurant: adminResult.rows[0] || null,
      restaurantId: restaurantIdNum,
      totalMenuItems: allItems.rows.length,
      items: allItems.rows.map(row => ({
        id: row.id,
        name: row.name,
        admin_id: row.admin_id,
        is_out_of_stock: row.is_out_of_stock,
        category: row.category,
        price: row.price,
        description: row.description
      })),
      // Debug info
      debug: {
        itemsByAdmin: itemsByAdmin.rows,
        sampleOfAllItems: allItemsInDb.rows.slice(0, 10).map(r => ({
          id: r.id,
          name: r.name,
          admin_id: r.admin_id
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order from QR menu
app.post('/api/orders/create', async (req, res) => {
  try {
    const { tableId, adminId, userId, items, customerName } = req.body;

    if (!tableId || !adminId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Table ID, Admin ID, and items are required' });
    }

    // Verify admin exists
    const adminCheck = await pool.query('SELECT id FROM admin WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Verify user exists if userId is provided
    if (userId) {
      const userCheck = await pool.query('SELECT id FROM customer WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        console.warn(`User ID ${userId} not found, creating order without user_id`);
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Create order with user_id
    const result = await pool.query(
      `INSERT INTO orders (table_id, admin_id, user_id, items, total_amount, status, customer_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, table_id, admin_id, user_id, items, total_amount, status, customer_name, created_at`,
      [tableId, adminId, userId || null, JSON.stringify(items), totalAmount, 'PENDING_PAYMENT', customerName || null]
    );

    const order = result.rows[0];
    console.log('Order created:', {
      id: order.id,
      tableId: order.table_id,
      adminId: order.admin_id,
      userId: order.user_id,
      totalAmount: order.total_amount,
      status: order.status
    });

    res.status(201).json({
      id: order.id.toString(),
      tableId: order.table_id,
      items: order.items,
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      customerName: order.customer_name,
      createdAt: order.created_at
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit rating for menu items in an order
app.post('/api/ratings/submit', async (req, res) => {
  try {
    const { orderId, ratings, userId, adminId } = req.body;

    if (!orderId || !ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ error: 'Order ID and ratings are required' });
    }

    // Verify order exists and belongs to the user
    const orderCheck = await pool.query(
      'SELECT id, user_id, admin_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];
    if (userId && order.user_id && parseInt(order.user_id) !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Insert ratings for each item
    const ratingPromises = ratings.map(async (rating) => {
      const { menuItemId, rating: ratingValue, review } = rating;
      
      if (!menuItemId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
        throw new Error('Invalid rating data');
      }

      // Check if rating already exists for this order and item
      const existingRating = await pool.query(
        'SELECT id FROM ratings WHERE order_id = $1 AND menu_item_id = $2',
        [orderId, menuItemId]
      );

      if (existingRating.rows.length > 0) {
        // Update existing rating
        await pool.query(
          `UPDATE ratings SET rating = $1, review = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE order_id = $3 AND menu_item_id = $4`,
          [ratingValue, review || null, orderId, menuItemId]
        );
      } else {
        // Insert new rating
        await pool.query(
          `INSERT INTO ratings (menu_item_id, order_id, user_id, admin_id, rating, review)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [menuItemId, orderId, userId || null, adminId || order.admin_id, ratingValue, review || null]
        );
      }

      // Update menu item average rating
      const avgRatingResult = await pool.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
         FROM ratings WHERE menu_item_id = $1`,
        [menuItemId]
      );

      const avgRating = parseFloat(avgRatingResult.rows[0].avg_rating) || 0;
      const reviewCount = parseInt(avgRatingResult.rows[0].review_count) || 0;

      await pool.query(
        `UPDATE menu_items SET rating = $1, review_count = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [avgRating, reviewCount, menuItemId]
      );
    });

    await Promise.all(ratingPromises);

    res.json({ success: true, message: 'Ratings submitted successfully' });
  } catch (error) {
    console.error('Error submitting ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if order has been rated
app.get('/api/ratings/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT menu_item_id, rating, review FROM ratings WHERE order_id = $1`,
      [orderId]
    );

    const ratings = {};
    result.rows.forEach(row => {
      ratings[row.menu_item_id.toString()] = {
        rating: row.rating,
        review: row.review || undefined
      };
    });

    res.json({ ratings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders for a specific user/customer (MUST come before /api/orders/:adminId to avoid route conflicts)
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM orders WHERE user_id = $1';
    const params = [userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id.toString(),
      tableId: row.table_id,
      adminId: row.admin_id?.toString(),
      userId: row.user_id?.toString(),
      items: row.items,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentId: row.payment_id,
      customerName: row.customer_name,
      createdAt: row.created_at.getTime(),
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders for a restaurant
app.get('/api/orders/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM orders WHERE admin_id = $1';
    const params = [adminId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id.toString(),
      tableId: row.table_id,
      adminId: row.admin_id?.toString(),
      userId: row.user_id?.toString(),
      items: row.items,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentId: row.payment_id,
      customerName: row.customer_name,
      createdAt: row.created_at.getTime(),
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminId } = req.body;

    if (!status || !adminId) {
      return res.status(400).json({ error: 'Status and Admin ID are required' });
    }

    // Verify order belongs to this admin
    const orderCheck = await pool.query(
      'SELECT admin_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderCheck.rows[0].admin_id.toString() !== adminId) {
      return res.status(403).json({ error: 'You do not have permission to update this order' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, status`,
      [status, orderId]
    );

    res.json({
      id: result.rows[0].id.toString(),
      status: result.rows[0].status
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

