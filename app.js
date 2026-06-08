let currentUser = null;
let activeView = 'home';
let viewedUserId = null;
const API_URL = '';

const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');

const headerUserBadge = document.getElementById('header-user-badge');
const headerUserAvatar = document.getElementById('header-user-avatar');
const headerUserName = document.getElementById('header-user-name');

const navHome = document.getElementById('nav-home');
const navExplore = document.getElementById('nav-explore');
const navProfile = document.getElementById('nav-profile');
const navLogout = document.getElementById('nav-logout');

const viewHome = document.getElementById('view-home');
const viewExplore = document.getElementById('view-explore');
const viewProfile = document.getElementById('view-profile');

const feedCreateAvatar = document.getElementById('feed-create-avatar');
const postInput = document.getElementById('post-input');
const submitPostBtn = document.getElementById('submit-post-btn');
const postsContainer = document.getElementById('posts-container');
const exploreContainer = document.getElementById('explore-container');

const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profileUsername = document.getElementById('profile-username');
const profileBio = document.getElementById('profile-bio');
const profileStatPosts = document.getElementById('profile-stat-posts');
const profileStatFollowers = document.getElementById('profile-stat-followers');
const profileStatFollowing = document.getElementById('profile-stat-following');
const profileActionBtn = document.getElementById('profile-action-btn');
const profilePostsContainer = document.getElementById('profile-posts-container');

const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editNameInput = document.getElementById('edit-name');
const editBioInput = document.getElementById('edit-bio');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const toastContainer = document.getElementById('toast-container');

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast glass-panel ${isError ? 'error' : ''}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffMs = new Date() - date;
  const diffMin = Math.round(diffMs / 60000);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function initApp() {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showAppScreen();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  authScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
}

function showAppScreen() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  headerUserAvatar.src = currentUser.avatar;
  headerUserName.textContent = currentUser.name;
  feedCreateAvatar.src = currentUser.avatar;
  navigateTo('home');
}

function navigateTo(view, params = null) {
  activeView = view;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  viewHome.classList.add('hidden');
  viewExplore.classList.add('hidden');
  viewProfile.classList.add('hidden');
  
  if (view === 'home') {
    navHome.classList.add('active');
    viewHome.classList.remove('hidden');
    loadFeed();
  } else if (view === 'explore') {
    navExplore.classList.add('active');
    viewExplore.classList.remove('hidden');
    loadExploreUsers();
  } else if (view === 'profile') {
    viewProfile.classList.remove('hidden');
    if (params && params.userId && params.userId !== currentUser.id) {
      viewedUserId = params.userId;
    } else {
      viewedUserId = null;
      navProfile.classList.add('active');
    }
    loadProfile();
  }
}

goToRegister.addEventListener('click', () => {
  loginCard.classList.add('hidden');
  registerCard.classList.remove('hidden');
});

goToLogin.addEventListener('click', () => {
  registerCard.classList.add('hidden');
  loginCard.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginForm.reset();
      showToast(`Welcome, ${currentUser.name}!`);
      showAppScreen();
    } else {
      showToast(data.error || "Login failed", true);
    }
  } catch (error) {
    showToast("Network error", true);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const bio = document.getElementById('register-bio').value.trim();

  try {
    const response = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, bio })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      registerForm.reset();
      showToast("Account created!");
      showAppScreen();
    } else {
      showToast(data.error || "Registration failed", true);
    }
  } catch (error) {
    showToast("Network error", true);
  }
});

navLogout.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showToast("Logged out");
  showAuthScreen();
});

headerUserBadge.addEventListener('click', () => navigateTo('profile'));

submitPostBtn.addEventListener('click', async () => {
  const content = postInput.value.trim();
  if (!content) return;
  try {
    const response = await fetch(`/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, content })
    });
    if (response.ok) {
      postInput.value = '';
      showToast("Post shared!");
      loadFeed();
    }
  } catch (error) {
    showToast("Error publishing post", true);
  }
});

async function loadFeed() {
  postsContainer.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading feed...</div>';
  try {
    const response = await fetch(`/api/posts?currentUserId=${currentUser.id}`);
    const posts = await response.json();
    if (response.ok) {
      renderPosts(posts, postsContainer);
    }
  } catch (error) {
    postsContainer.innerHTML = 'Error loading feed';
  }
}

function renderPosts(posts, container) {
  if (posts.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No posts available.</div>';
    return;
  }
  container.innerHTML = '';
  posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post-card glass-panel';
    postEl.setAttribute('data-id', post.id);
    const likedClass = post.likedByMe ? 'liked' : '';
    postEl.innerHTML = `
      <div class="post-header">
        <div class="post-user-info" onclick="navigateToProfile('${post.userId}')">
          <img src="${post.userAvatar}" alt="${post.userName}">
          <div class="post-user-meta">
            <span class="post-user-name">${post.userName}</span>
            <span class="post-user-username">@${post.username}</span>
          </div>
        </div>
        <span class="post-time">${formatRelativeTime(post.timestamp)}</span>
      </div>
      <div class="post-body">${escapeHTML(post.content)}</div>
      <div class="post-actions">
        <button class="post-action-btn like-btn ${likedClass}" onclick="toggleLike('${post.id}')">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span class="like-count">${post.likesCount}</span>
        </button>
        <button class="post-action-btn" onclick="toggleCommentsSection('${post.id}')">
          <svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
          <span class="comment-count">${post.commentsCount}</span>
        </button>
      </div>
      <div id="comments-sec-${post.id}" class="post-comments-section hidden">
        <div id="comments-list-${post.id}" class="comment-list"></div>
        <div class="comment-form">
          <img src="${currentUser.avatar}" alt="My Avatar">
          <div class="comment-input-wrapper">
            <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." onkeydown="handleCommentSubmit(event, '${post.id}')">
            <button class="comment-send-btn" onclick="submitComment('${post.id}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });
}

window.navigateToProfile = function(userId) {
  navigateTo('profile', { userId });
};

window.toggleLike = async function(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await response.json();
    if (response.ok) {
      const postEl = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (postEl) {
        const likeBtn = postEl.querySelector('.like-btn');
        const likeCountSpan = postEl.querySelector('.like-count');
        likeCountSpan.textContent = data.likesCount;
        if (data.likedByMe) {
          likeBtn.classList.add('liked');
        } else {
          likeBtn.classList.remove('liked');
        }
      }
    }
  } catch (error) {
    showToast("Error liking post", true);
  }
};

window.toggleCommentsSection = function(postId) {
  const commentSec = document.getElementById(`comments-sec-${postId}`);
  if (commentSec.classList.contains('hidden')) {
    commentSec.classList.remove('hidden');
    loadComments(postId);
  } else {
    commentSec.classList.add('hidden');
  }
};

async function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  commentsList.innerHTML = '<div style="font-size:0.8rem; text-align:center; padding:0.5rem 0;">Loading...</div>';
  try {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const comments = await response.json();
    if (response.ok) {
      renderComments(postId, comments);
    }
  } catch (error) {
    commentsList.innerHTML = 'Error loading comments';
  }
}

function renderComments(postId, comments) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  if (comments.length === 0) {
    commentsList.innerHTML = '<div style="font-size:0.8rem; text-align:center; padding:0.5rem 0; color:var(--text-muted);">No comments yet.</div>';
    return;
  }
  commentsList.innerHTML = '';
  comments.forEach(comment => {
    const commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    commentEl.innerHTML = `
      <img src="${comment.userAvatar}" alt="" onclick="navigateToProfile('${comment.userId}')" style="cursor:pointer;">
      <div class="comment-content-wrapper">
        <div class="comment-meta">
          <span class="comment-author-name" onclick="navigateToProfile('${comment.userId}')" style="cursor:pointer;">${comment.userName}</span>
          <span class="comment-time">${formatRelativeTime(comment.timestamp)}</span>
        </div>
        <div class="comment-text">${escapeHTML(comment.content)}</div>
      </div>
    `;
    commentsList.appendChild(commentEl);
  });
}

window.handleCommentSubmit = function(event, postId) {
  if (event.key === 'Enter') submitComment(postId);
};

window.submitComment = async function(postId) {
  const inputEl = document.getElementById(`comment-input-${postId}`);
  const content = inputEl.value.trim();
  if (!content) return;
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, content })
    });
    if (response.ok) {
      inputEl.value = '';
      loadComments(postId);
      const postEl = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (postEl) {
        const span = postEl.querySelector('.comment-count');
        span.textContent = parseInt(span.textContent, 10) + 1;
      }
    }
  } catch (error) {
    showToast("Error adding comment", true);
  }
};

async function loadExploreUsers() {
  exploreContainer.innerHTML = 'Loading creators...';
  try {
    const response = await fetch(`/api/users?currentUserId=${currentUser.id}`);
    const users = await response.json();
    if (response.ok) {
      renderExploreUsers(users);
    }
  } catch (error) {
    exploreContainer.innerHTML = 'Error loading users';
  }
}

function renderExploreUsers(users) {
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  if (otherUsers.length === 0) {
    exploreContainer.innerHTML = 'No other users.';
    return;
  }
  exploreContainer.innerHTML = '';
  otherUsers.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card glass-panel';
    const btnText = user.isFollowing ? 'Following' : 'Follow';
    const btnClass = user.isFollowing ? 'btn-secondary' : 'btn-primary';
    card.innerHTML = `
      <img src="${user.avatar}" alt="" onclick="navigateToProfile('${user.id}')" style="cursor:pointer;">
      <h3 class="user-card-name" onclick="navigateToProfile('${user.id}')" style="cursor:pointer;">${user.name}</h3>
      <p class="user-card-username">@${user.username}</p>
      <p class="user-card-bio">${escapeHTML(user.bio) || 'No bio.'}</p>
      <button class="btn ${btnClass} btn-sm" onclick="toggleFollowUser('${user.id}', this)">${btnText}</button>
    `;
    exploreContainer.appendChild(card);
  });
}

window.toggleFollowUser = async function(followingId, btnElement) {
  btnElement.disabled = true;
  try {
    const response = await fetch(`/api/users/${followingId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUser.id })
    });
    const data = await response.json();
    if (response.ok) {
      if (data.isFollowing) {
        btnElement.textContent = 'Following';
        btnElement.className = 'btn btn-secondary btn-sm';
      } else {
        btnElement.textContent = 'Follow';
        btnElement.className = 'btn btn-primary btn-sm';
      }
    }
  } catch (error) {
    showToast("Error processing follow action", true);
  } finally {
    btnElement.disabled = false;
  }
};

async function loadProfile() {
  const targetId = viewedUserId || currentUser.id;
  profilePostsContainer.innerHTML = 'Loading posts...';
  try {
    const response = await fetch(`/api/users/${targetId}?currentUserId=${currentUser.id}`);
    const data = await response.json();
    if (response.ok) {
      profileAvatar.src = data.avatar;
      profileName.textContent = data.name;
      profileUsername.textContent = `@${data.username}`;
      profileBio.textContent = data.bio || "No biography provided yet.";
      profileStatPosts.textContent = data.posts.length;
      profileStatFollowers.textContent = data.followersCount;
      profileStatFollowing.textContent = data.followingCount;

      if (targetId === currentUser.id) {
        profileActionBtn.textContent = 'Edit Profile';
        profileActionBtn.className = 'btn btn-secondary btn-sm';
        profileActionBtn.onclick = openEditProfileModal;
      } else {
        profileActionBtn.textContent = data.isFollowing ? 'Following' : 'Follow';
        profileActionBtn.className = data.isFollowing ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
        profileActionBtn.onclick = () => handleProfileFollowToggle(data.id);
      }

      const postsFeedResponse = await fetch(`/api/posts?currentUserId=${currentUser.id}`);
      const allPosts = await postsFeedResponse.json();
      const userSpecificPosts = allPosts.filter(p => p.userId === targetId);
      renderPosts(userSpecificPosts, profilePostsContainer);
    }
  } catch (error) {
    showToast("Error loading profile", true);
  }
}

async function handleProfileFollowToggle(userId) {
  profileActionBtn.disabled = true;
  try {
    const response = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUser.id })
    });
    if (response.ok) loadProfile();
  } catch (error) {
    showToast("Error", true);
  } finally {
    profileActionBtn.disabled = false;
  }
}

function openEditProfileModal() {
  editNameInput.value = currentUser.name;
  editBioInput.value = currentUser.bio || '';
  editProfileModal.classList.remove('hidden');
}

function closeEditProfileModal() {
  editProfileModal.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', closeEditProfileModal);
closeModalBtn.addEventListener('click', closeEditProfileModal);

editProfileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = editNameInput.value.trim();
  const bio = editBioInput.value.trim();
  if (!name) return;
  try {
    const response = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      headerUserName.textContent = currentUser.name;
      showToast("Profile updated!");
      closeEditProfileModal();
      loadProfile();
    }
  } catch (error) {
    showToast("Error updating profile", true);
  }
});

navHome.addEventListener('click', () => navigateTo('home'));
navExplore.addEventListener('click', () => navigateTo('explore'));
navProfile.addEventListener('click', () => navigateTo('profile'));

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

initApp();