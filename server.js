require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const app = express();

// Connect to PostgreSQL database using environment variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// JWT Secret
const JWT_SECRET = 'your_jwt_secret'; // In a real application, use an environment variable

// Registration Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists
        const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into database
        const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);

        // Check if user was successfully inserted
        if (result.rows.length === 1) {
            res.json({ message: 'User registered successfully' });
        } else {
            res.status(500).json({ message: 'User registration failed' });
        }
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'User registration failed' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Compare password with the hashed password in the database
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.rows[0].id, username: user.rows[0].username }, JWT_SECRET, { expiresIn: '1h' });

        // Login successful
        res.json({ message: 'User logged in successfully', token });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'User login failed' });
    }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }

        // If everything is good, save the decoded token to request for use in other routes
        req.userId = decoded.userId;
        next();
    });
};

// Protected Route
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', userId: req.userId });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
