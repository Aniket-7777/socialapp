const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth/register', (req, res) => {
  const { username, password, name, bio } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password and name are required." });
  }
  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: "Username already exists." });
  }
  const user = db.createUser(username, password, name, bio);
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const user = db.getUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.get('/api/users', (req, res) => {
  const currentUserId = req.query.currentUserId;
  const users = db.getUsers().map(u => {
    const { password, ...userWithoutPassword } = u;
    let isFollowing = false;
    if (currentUserId) {
      const following = db.getFollowing(currentUserId);
      isFollowing = following.includes(u.id);
    }
    return { ...userWithoutPassword, isFollowing };
  });
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const currentUserId = req.query.currentUserId;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  
  const followers = db.getFollowers(userId);
  const following = db.getFollowing(userId);
  const userPosts = db.getPosts().filter(p => p.userId === userId);
  const isFollowing = currentUserId ? followers.includes(currentUserId) : false;

  const { password, ...profile } = user;
  res.json({
    ...profile,
    followersCount: followers.length,
    followingCount: following.length,
    isFollowing,
    posts: userPosts
  });
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, bio } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required." });

  const updatedUser = db.updateUserProfile(userId, name, bio);
  if (!updatedUser) return res.status(404).json({ error: "User not found." });

  const { password, ...profile } = updatedUser;
  res.json(profile);
});

app.post('/api/users/:id/follow', (req, res) => {
  const followingId = req.params.id;
  const { followerId } = req.body;
  if (!followerId) return res.status(400).json({ error: "Follower ID is required." });

  const result = db.toggleFollow(followerId, followingId);
  if (!result.success) return res.status(400).json({ error: result.message });
  res.json(result);
});

app.get('/api/posts', (req, res) => {
  const currentUserId = req.query.currentUserId;
  const posts = db.getPosts().map(post => {
    const user = db.getUserById(post.userId);
    const comments = db.getCommentsForPost(post.id);
    return {
      ...post,
      userAvatar: user ? user.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.username}`,
      userName: user ? user.name : post.username,
      likesCount: post.likes.length,
      commentsCount: comments.length,
      likedByMe: currentUserId ? post.likes.includes(currentUserId) : false
    };
  });
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: "User ID and content are required." });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const newPost = db.createPost(userId, user.username, content);
  res.status(201).json({
    ...newPost,
    userAvatar: user.avatar,
    userName: user.name,
    likesCount: 0,
    commentsCount: 0,
    likedByMe: false
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required." });

  const post = db.toggleLikePost(postId, userId);
  if (!post) return res.status(404).json({ error: "Post not found." });

  res.json({
    postId: post.id,
    likesCount: post.likes.length,
    likedByMe: post.likes.includes(userId)
  });
});

app.get('/api/posts/:id/comments', (req, res) => {
  const postId = req.params.id;
  const comments = db.getCommentsForPost(postId).map(c => {
    const user = db.getUserById(c.userId);
    return {
      ...c,
      userAvatar: user ? user.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${c.username}`,
      userName: user ? user.name : c.username
    };
  });
  res.json(comments);
});

app.post('/api/posts/:id/comments', (req, res) => {
  const postId = req.params.id;
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: "User ID and comment content are required." });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const newComment = db.addComment(postId, userId, user.username, content);
  res.status(201).json({
    ...newComment,
    userAvatar: user.avatar,
    userName: user.name
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});