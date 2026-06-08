const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        users: [
          {
            id: "1",
            username: "johndoe",
            password: "password123",
            name: "John Doe",
            bio: "Building cool things with web technology 🚀",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=johndoe"
          },
          {
            id: "2",
            username: "janedoe",
            password: "password123",
            name: "Jane Doe",
            bio: "Designer, coder, and cat lover 🐱✨",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=janedoe"
          },
          {
            id: "3",
            username: "alice",
            password: "password123",
            name: "Alice Smith",
            bio: "Exploring the intersections of art & code.",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alice"
          }
        ],
        posts: [
          {
            id: "p1",
            userId: "1",
            username: "johndoe",
            content: "Hello world! Just launched my new social media app prototype. It uses glassmorphism design. Let me know what you think!",
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            likes: ["2", "3"]
          },
          {
            id: "p2",
            userId: "2",
            username: "janedoe",
            content: "Wow, John! The design looks absolutely stunning. The micro-animations are super smooth. 💖",
            timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            likes: ["1"]
          }
        ],
        comments: [
          {
            id: "c1",
            postId: "p1",
            userId: "2",
            username: "janedoe",
            content: "This looks super cool! Love the typography choice.",
            timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString()
          },
          {
            id: "c2",
            postId: "p1",
            userId: "3",
            username: "alice",
            content: "Agreed! The card glow effect is amazing.",
            timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
          }
        ],
        follows: [
          { followerId: "1", followingId: "2" },
          { followerId: "2", followingId: "1" },
          { followerId: "3", followingId: "1" }
        ]
      };
      this.write(initialData);
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading database:", error);
      return { users: [], posts: [], comments: [], follows: [] };
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing to database:", error);
    }
  }

  getUsers() {
    return this.read().users;
  }

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByUsername(username) {
    return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(username, password, name, bio) {
    const data = this.read();
    const id = Date.now().toString();
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;
    const newUser = { id, username, password, name, bio: bio || "", avatar };
    data.users.push(newUser);
    this.write(data);
    return newUser;
  }

  updateUserProfile(userId, name, bio) {
    const data = this.read();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      data.users[userIndex].name = name;
      data.users[userIndex].bio = bio;
      this.write(data);
      return data.users[userIndex];
    }
    return null;
  }

  getPosts() {
    return this.read().posts;
  }

  createPost(userId, username, content) {
    const data = this.read();
    const newPost = {
      id: "p_" + Date.now(),
      userId,
      username,
      content,
      timestamp: new Date().toISOString(),
      likes: []
    };
    data.posts.unshift(newPost);
    this.write(data);
    return newPost;
  }

  toggleLikePost(postId, userId) {
    const data = this.read();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }
    this.write(data);
    return post;
  }

  getCommentsForPost(postId) {
    return this.read().comments.filter(c => c.postId === postId);
  }

  addComment(postId, userId, username, content) {
    const data = this.read();
    const newComment = {
      id: "c_" + Date.now(),
      postId,
      userId,
      username,
      content,
      timestamp: new Date().toISOString()
    };
    data.comments.push(newComment);
    this.write(data);
    return newComment;
  }

  getFollowers(userId) {
    const data = this.read();
    return data.follows.filter(f => f.followingId === userId).map(f => f.followerId);
  }

  getFollowing(userId) {
    const data = this.read();
    return data.follows.filter(f => f.followerId === userId).map(f => f.followingId);
  }

  toggleFollow(followerId, followingId) {
    if (followerId === followingId) return { success: false, message: "Cannot follow yourself" };
    
    const data = this.read();
    const followIndex = data.follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
    
    let isFollowing = false;
    if (followIndex === -1) {
      data.follows.push({ followerId, followingId });
      isFollowing = true;
    } else {
      data.follows.splice(followIndex, 1);
    }
    
    this.write(data);
    return { success: true, isFollowing };
  }
}

module.exports = new Database();