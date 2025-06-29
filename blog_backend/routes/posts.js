// routes/posts.js
const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

// Middleware
function isAuthenticated(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Get public posts
router.get('/public', async (req, res) => {
  const posts = await Post.find({ public: true }).sort({ createdAt: -1 });
  res.json(posts);
});

// Get posts by current user
router.get('/mine', isAuthenticated, async (req, res) => {
  const posts = await Post.find({ author: req.session.user });
  res.json(posts);
});

// Create a new post
router.post('/create', isAuthenticated, async (req, res) => {
  const { title, content, public: isPublic } = req.body;
  const post = new Post({
    title,
    content,
    public: isPublic,
    author: req.session.user
  });
  await post.save();
  res.json({ message: 'Post created' });
});

module.exports = router;
