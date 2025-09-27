const express= require('express');
const pool = require('./db');
const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authorize = require('./middleware/authorize');
const cors=require('cors');

const app=express();
const PORT=3000;

app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send('Hello world ,  the server is running');
});

app.get('/db-test', async (req, res) => {
  try {
    // Get a client from the pool and execute a query
    const result = await pool.query('SELECT NOW()');
    // Send the query result back to the client as JSON
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send("Error connecting to the database");
  }
});

app.post('/api/register', async (req, res) => {
  try {
    // 1. Destructure the request body
    const { name, email, password } = req.body;

    // 2. Check if user already exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0) {
      return res.status(401).send("User already exists.");
    }

    // 3. Hash the password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    // 5. Send a success response
    res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/api/login', async (req, res) => {
  try {
    // 1. Destructure request body
    const { email, password } = req.body;

    // 2. Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(401).send("Invalid credentials.");
    }

    // 3. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentials.");
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].id }, // Payload: contains user's unique ID
      process.env.JWT_SECRET,   // The secret key from our .env file
      { expiresIn: '1h' }      // Options: token expires in 1 hour
    );

    // 5. Send token to the client
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/protected', authorize, (req, res) => {
  // Thanks to our middleware, we now have access to req.user
  res.json({ message: `Welcome user with ID: ${req.user}! You can see this because you are authenticated.` });
});

app.post('/api/bookmarks', authorize, async (req, res) => {
  try {
    const { title, url } = req.body;
    const newBookmark = await pool.query(
      "INSERT INTO bookmarks (title, url, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, url, req.user] // req.user comes from the authorize middleware
    );
    res.status(201).json(newBookmark.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. READ all bookmarks for a user
app.get('/api/bookmarks', authorize, async (req, res) => {
  try {
    const allBookmarks = await pool.query("SELECT * FROM bookmarks WHERE user_id = $1", [req.user]);
    res.json(allBookmarks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 3. UPDATE a bookmark
app.put('/api/bookmarks/:id', authorize, async (req, res) => {
  try {
    const { id } = req.params; // The bookmark ID from the URL
    const { title, url } = req.body; // The new data from the body
    
    const updateBookmark = await pool.query(
      "UPDATE bookmarks SET title = $1, url = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
      [title, url, id, req.user]
    );

    if (updateBookmark.rows.length === 0) {
      return res.status(404).json({ msg: "Bookmark not found or you don't have permission to edit it." });
    }

    res.json(updateBookmark.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 4. DELETE a bookmark
app.delete('/api/bookmarks/:id', authorize, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteBookmark = await pool.query(
      "DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user]
    );

    if (deleteBookmark.rows.length === 0) {
      return res.status(404).json({ msg: "Bookmark not found or you don't have permission to delete it." });
    }

    res.json({ msg: "Bookmark deleted successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});