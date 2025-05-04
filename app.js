// app.js
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// PostgreSQL connection setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Hash password using SHA256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = hashPassword(password);

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, hashedPassword]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, message: 'Login successful', isAdmin: user.is_admin });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  const hashedPassword = hashPassword(password);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    res.json({ 
      success: true, 
      message: 'Registration successful' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for duplicate username
    if (error.code === '23505') { // PostgreSQL unique violation error code
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Get drivers endpoint
app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers ORDER BY points DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this endpoint to handle updating driver points
app.post('/api/update-driver-points', async (req, res) => {
  console.log('Update driver points endpoint hit');
  const { drivers } = req.body;
  const missingDrivers = [];

  try {
    for (const driver of drivers) {

      const driverNumber = driver['participant-data']?.['race-number'];
      const pointsAdjustment = driver['final-classification']?.points;

      if (pointsAdjustment === undefined) {
        console.warn(`Missing points for driver: ${driverNumber || 'unknown'}`);
        continue;
      }

      try {
        // Fetch current points from the database
        const result = await pool.query(
          'SELECT points FROM drivers WHERE driver_number = $1',
          [driverNumber]
        );

        if (result.rows.length === 0) {
          console.warn(`Driver not found in database: ${driverNumber}`);
          missingDrivers.push({
            driver_number: driverNumber,
            points: pointsAdjustment
          });
          continue;
        }

        const currentPoints = result.rows[0].points;
        const totalPoints = currentPoints + pointsAdjustment;

        // Update the points in the database
        await pool.query(
          'UPDATE drivers SET points = $1 WHERE driver_number = $2',
          [totalPoints, driverNumber]
        );

        console.log(`Updated driver ${driverNumber} with total points ${totalPoints}`);
      } catch (queryError) {
        console.error(`Error updating driver ${driverNumber}:`, queryError);
      }
    }

    // Write missing drivers to a file
    if (missingDrivers.length > 0) {
      const errorFilePath = 'src/error/missing_drivers.txt';
      const errorData = missingDrivers.map(driver => `Driver Number: ${driver.driver_number}, Points: ${driver.points}`).join('\n');
      require('fs').writeFileSync(errorFilePath, errorData);
      console.log('Missing drivers logged to file.');
    }

    res.json({ success: true, message: 'Driver points updated successfully.' });
  } catch (error) {
    console.error('Error updating driver points:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this endpoint to handle writing missing drivers to a file
app.post('/api/log-missing-drivers', async (req, res) => {
  console.log('Log missing drivers endpoint hit');
  const { missingDrivers } = req.body;

  try {
    const errorFilePath = 'src/error/missing_drivers.txt';
    const errorData = missingDrivers.map(driver => `Driver Number: ${driver.driver_number}, Points: ${driver.points}`).join('\n');
    
    // Use Node.js fs module to write to a file
    require('fs').writeFileSync(errorFilePath, errorData);

    res.json({ success: true, message: 'Missing drivers logged successfully.' });
  } catch (error) {
    console.error('Error logging missing drivers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch team configurations
app.get('/api/team-configs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM team_configs ORDER BY team_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team configs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update team configuration
app.post('/api/update-team-config', async (req, res) => {
  const { teamName, configValue } = req.body;

  try {
    await pool.query(
      'UPDATE team_configs SET config_value = $1 WHERE team_name = $2',
      [configValue, teamName]
    );
    res.json({ success: true, message: 'Configuration updated successfully.' });
  } catch (error) {
    console.error('Error updating team config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch race points configuration
app.get('/api/race-points-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM race_points_config ORDER BY position');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching race points config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update race points configuration
app.post('/api/update-race-points-config', async (req, res) => {
  const { position, points } = req.body;

  try {
    await pool.query(
      'UPDATE race_points_config SET points = $1 WHERE position = $2',
      [points, position]
    );
    res.json({ success: true, message: 'Race points configuration updated successfully.' });
  } catch (error) {
    console.error('Error updating race points config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Connect to the database
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to the database');
  release();
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});