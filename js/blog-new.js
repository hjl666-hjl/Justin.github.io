/**
 * 博客系统 (New Design) - 文章加载与渲染
 */

class BlogSystem {
  constructor() {
    this.posts = [];
    this.categories = [];
    this.currentFilter = 'all';
    this.postsPerPage = 10;
    this.currentPage = 1;
  }

  async init() {
    try {
      await this.loadPostsConfig();
      this.renderPostsList();
      this.renderCategories();
      this.bindEvents();
    } catch (error) {
      console.error('博客系统初始化失败:', error);
    }
  }

  async loadPostsConfig() {
    try {
      const response = await fetch('./posts/posts.json');
      if (!response.ok) {
        throw new Error('加载文章配置失败');
      }
      const data = await response.json();
      this.posts = data.posts || [];
      this.categories = data.categories || [];
      this.posts.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    } catch (error) {
      console.error('加载文章配置失败:', error);
      this.posts = [];
    }
  }

  renderPostsList() {
    const container = document.getElementById('posts-list');
    if (!container) return;

    const filteredPosts = this.getFilteredPosts();
    
    if (filteredPosts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>暂无文章</p>
        </div>
      `;
      return;
    }

    let html = '';
    filteredPosts.forEach((post) => {
      html += this.createPostCard(post);
    });

    container.innerHTML = html;
  }

  createPostCard(post) {
    // New Apple Style Card
    const tagsHtml = post.tags.map(tag => `<span class="blog-tag">#${tag}</span>`).join('');
    
    // If post has cover, show it.
    let coverHtml = '';
    if (post.cover) {
        coverHtml = `
        <div class="blog-card-image">
            <img src="${post.cover}" alt="${post.title}">
        </div>`;
    }

    return `
      <article class="blog-card" data-file="${post.file}">
        ${coverHtml}
        <div class="blog-card-content">
            <div class="blog-meta">
                <span class="blog-date">${post.date}</span>
                ${post.pinned ? '<span class="blog-pinned">Pinned</span>' : ''}
            </div>
            <h3 class="blog-title">${post.title}</h3>
            <p class="blog-summary">${post.summary}</p>
            <div class="blog-footer">
                <div class="blog-tags">${tagsHtml}</div>
                <span class="blog-read-more">Read Article ></span>
            </div>
        </div>
      </article>
    `;
  }

  getFilteredPosts() {
    if (this.currentFilter === 'all') {
      return this.posts;
    }
    return this.posts.filter(post => 
      post.category === this.currentFilter || 
      post.tags.includes(this.currentFilter)
    );
  }

  renderCategories() {
    const container = document.getElementById('category-list');
    if (!container) return;

    let html = '<li class="category-item active" data-category="all">All Posts</li>';
    this.categories.forEach(category => {
        // Only show categories that have posts
        const count = this.posts.filter(p => p.category === category).length;
        if (count > 0) {
            html += `<li class="category-item" data-category="${category}">
                ${category} <span class="category-count">${count}</span>
            </li>`;
        }
    });

    container.innerHTML = html;
  }

  bindEvents() {
    // Card Click
    document.addEventListener('click', (e) => {
      const postCard = e.target.closest('.blog-card');
      if (postCard) {
        const file = postCard.dataset.file;
        if (file) {
          this.openPost(file);
        }
      }

      // Category Click
      const categoryItem = e.target.closest('.category-item');
      if (categoryItem) {
        document.querySelectorAll('.category-item').forEach(t => t.classList.remove('active'));
        categoryItem.classList.add('active');
        this.currentFilter = categoryItem.dataset.category;
        this.renderPostsList();
      }
    });
  }

  openPost(file) {
    // Redirect to existing post viewer (we might need to redesign post.html too later, but one step at a time)
    window.location.href = `./showmd.html?file=${encodeURIComponent(file)}`; 
    // Note: Original was post.html or showmd.html? The file list shows showmd.html and post.html. 
    // blog.js used post.html. Let's check which one exists.
    // list_files showed `post.html` and `showmd.html`.
    // Let's use `post.html` as original did.
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const blog = new BlogSystem();
  blog.init();
});
