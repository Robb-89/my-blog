// blog_backend/routes/posts.js
const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

// Middleware
function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// Create Post
router.post('/create', authMiddleware, async (req, res) => {
  const { title, content, public: isPublic, tags } = req.body;
  try {
    const post = new Post({
      title,
      content,
      public: isPublic,
      tags,
      author: req.session.user
    });
    await post.save();
    res.json({ message: 'Post created', post });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all public posts
router.get('/public', async (req, res) => {
  const posts = await Post.find({ public: true }).populate('author', 'username');
  res.json(posts);
});

// Get posts by current user
router.get('/mine', authMiddleware, async (req, res) => {
  const posts = await Post.find({ author: req.session.user });
  res.json(posts);
});

// Get posts by tag or author
router.get('/search', async (req, res) => {
  const { tag, author } = req.query;
  const query = {};

  if (tag) query.tags = tag;
  if (author) query.author = author;

  const posts = await Post.find(query).populate('author', 'username');
  res.json(posts);
});

module.exports = router;
