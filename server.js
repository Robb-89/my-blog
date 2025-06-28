
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// Simple auth middleware
function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  req.user = { id: req.session.user }; // Attach user info
  next();
}

const USERS_FILE = './users.json';
const POSTS_FILE = './posts.json';

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8') || '[]');
const loadPosts = () => JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8') || '[]');
const saveUsers = (data) => fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
const savePosts = (data) => fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2));

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  saveUsers(users);
  res.json({ message: 'Signup successful' });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = username;
  res.json({ message: 'Login successful' });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// Get public posts
app.get('/posts/public', (req, res) => {
  const posts = loadPosts();
  res.json(posts.filter(p => p.public));
});

// Get user's posts
app.get('/posts/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const posts = loadPosts();
  res.json(posts.filter(p => p.author === req.session.user));
});

// Create a new post
app.post('/posts/create', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { title, content, isPublic } = req.body;
  const posts = loadPosts();
  posts.push({
    title,
    content,
    author: req.session.user,
    public: isPublic === 'true',
    createdAt: new Date().toISOString()
  });
  savePosts(posts);
  res.json({ message: 'Post created' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Other routes
app.post('/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ message: 'Password updated' });
});

app.get('/posts/mine', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const posts = loadPosts().filter(p => p.authorId === userId);
  res.json(posts);
});
app.put('/posts/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const posts = loadPosts();
  const post = posts.find(p => p.id === id);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  post.title = title;
  post.content = content;
  post.tags = tags || [];
  savePosts(posts);
  res.json({ message: 'Post updated' });
});
