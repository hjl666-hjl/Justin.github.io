/**
 * 博客系统 - 文章加载与渲染
 * 自动从 posts 文件夹读取文章并渲染到页面
 */

class BlogSystem {
  constructor() {
    this.posts = [];
    this.categories = [];
    this.currentFilter = 'all';
    this.postsPerPage = 10;
    this.currentPage = 1;
  }

  /**
   * 初始化博客系统
   */
  async init() {
    try {
      await this.loadPostsConfig();
      this.renderPostsList();
      this.renderCategories();
      this.renderTimeTags();
      this.bindEvents();
    } catch (error) {
      console.error('博客系统初始化失败:', error);
    }
  }

  /**
   * 加载文章配置
   */
  async loadPostsConfig() {
    try {
      const response = await fetch('./posts/posts.json');
      if (!response.ok) {
        throw new Error('加载文章配置失败');
      }
      const data = await response.json();
      this.posts = data.posts || [];
      this.categories = data.categories || [];
      // 按日期排序，置顶文章优先
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

  /**
   * 渲染文章列表
   */
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
    filteredPosts.forEach((post, index) => {
      html += this.createPostCard(post, index === 0);
    });

    container.innerHTML = html;
  }

  /**
   * 创建文章卡片HTML
   */
  createPostCard(post, isFirst) {
    const tagsHtml = post.tags.map(tag => `<span>${tag}</span>`).join('');
    const pinnedBadge = post.pinned ? '<span class="zd">置顶</span>' : '';
    
    // 第一篇文章显示为大卡片
    if (isFirst) {
      return `
        <div class="li2-box carbox post-card" data-id="${post.id}" data-file="${post.file}">
          <div class="address-wrap">
            <div class="address-left">
              ${pinnedBadge}
              ${tagsHtml}
            </div>
            <div class="address-right">
              <svg t="1663149212139" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="1979" width="20" height="20">
                <path
                  d="M192 512a320 320 0 1 1 640 0 320 320 0 0 1-640 0zM512 128a384 384 0 1 0 0 768 384 384 0 0 0 0-768z m21.333333 224a32 32 0 0 0-64 0V554.666667h202.666667a32 32 0 0 0 0-64H533.333333V352z"
                  fill="#222222" p-id="1980"></path>
              </svg>
              <span>${post.date}</span>
            </div>
          </div>
          <p class="post-title">${post.title}</p>
          ${post.cover ? `<div class="text-img"><img src="${post.cover}" alt="${post.title}"></div>` : ''}
          <p class="post-summary">${post.summary}</p>
          <div class="post-footer">
            <span class="read-more">阅读全文 →</span>
          </div>
        </div>
      `;
    }

    // 其他文章显示为列表项
    return `
      <div class="carbox li3-box post-card" data-id="${post.id}" data-file="${post.file}">
        <a class="post-title">${post.title}</a>
        <p>${post.summary}</p>
        <div class="address-wrap">
          <div class="address-left">
            ${pinnedBadge}
            ${tagsHtml}
          </div>
          <div class="address-right">
            <span>
              <svg t="1663167559418" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="8282" width="20" height="20">
                <path
                  d="M857.28 344.992h-264.832c12.576-44.256 18.944-83.584 18.944-118.208 0-78.56-71.808-153.792-140.544-143.808-60.608 8.8-89.536 59.904-89.536 125.536v59.296c0 76.064-58.208 140.928-132.224 148.064l-117.728-0.192A67.36 67.36 0 0 0 64 483.04V872c0 37.216 30.144 67.36 67.36 67.36h652.192a102.72 102.72 0 0 0 100.928-83.584l73.728-388.96a102.72 102.72 0 0 0-100.928-121.824zM128 872V483.04c0-1.856 1.504-3.36 3.36-3.36H208v395.68H131.36A3.36 3.36 0 0 1 128 872z m767.328-417.088l-73.728 388.96a38.72 38.72 0 0 1-38.048 31.488H272V476.864a213.312 213.312 0 0 0 173.312-209.088V208.512c0-37.568 12.064-58.912 34.72-62.176 27.04-3.936 67.36 38.336 67.36 80.48 0 37.312-9.504 84-28.864 139.712a32 32 0 0 0 30.24 42.496h308.512a38.72 38.72 0 0 1 38.048 45.888z"
                  p-id="8283"></path>
              </svg>
              ${post.likes || 0}
            </span>
            <svg t="1663149212139" class="icon" viewBox="0 0 1024 1024" version="1.1"
              xmlns="http://www.w3.org/2000/svg" p-id="1979" width="20" height="20">
              <path
                d="M192 512a320 320 0 1 1 640 0 320 320 0 0 1-640 0zM512 128a384 384 0 1 0 0 768 384 384 0 0 0 0-768z m21.333333 224a32 32 0 0 0-64 0V554.666667h202.666667a32 32 0 0 0 0-64H533.333333V352z"
                fill="#222222" p-id="1980"></path>
            </svg>
            <span>${post.date}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 获取过滤后的文章
   */
  getFilteredPosts() {
    if (this.currentFilter === 'all') {
      return this.posts;
    }
    return this.posts.filter(post => 
      post.category === this.currentFilter || 
      post.tags.includes(this.currentFilter)
    );
  }

  /**
   * 渲染分类标签
   */
  renderCategories() {
    const container = document.getElementById('category-tags');
    if (!container) return;

    let html = '<span class="category-tag active" data-category="all">全部</span>';
    this.categories.forEach(category => {
      const count = this.posts.filter(p => p.category === category).length;
      if (count > 0) {
        html += `<span class="category-tag" data-category="${category}">${category} <i>${count}</i></span>`;
      }
    });

    container.innerHTML = html;
  }

  /**
   * 渲染时间标签
   */
  renderTimeTags() {
    const container = document.getElementById('time-tags');
    if (!container) return;

    // 按月份统计文章
    const monthCounts = {};
    this.posts.forEach(post => {
      const date = new Date(post.date);
      const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    let html = '';
    Object.entries(monthCounts).forEach(([month, count]) => {
      html += `<span class="time-tag" data-month="${month}">${month} <i>${count}</i></span>`;
    });

    container.innerHTML = html;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 文章卡片点击事件
    document.addEventListener('click', (e) => {
      const postCard = e.target.closest('.post-card');
      if (postCard) {
        const file = postCard.dataset.file;
        if (file) {
          this.openPost(file);
        }
      }

      // 分类标签点击
      const categoryTag = e.target.closest('.category-tag');
      if (categoryTag) {
        document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
        categoryTag.classList.add('active');
        this.currentFilter = categoryTag.dataset.category;
        this.renderPostsList();
      }

      // 时间标签点击
      const timeTag = e.target.closest('.time-tag');
      if (timeTag) {
        const month = timeTag.dataset.month;
        this.filterByMonth(month);
      }
    });
  }

  /**
   * 打开文章详情
   */
  openPost(file) {
    window.location.href = `./post.html?file=${encodeURIComponent(file)}`;
  }

  /**
   * 按月份筛选
   */
  filterByMonth(month) {
    const year = parseInt(month);
    const monthNum = parseInt(month.match(/(\d+)月/)[1]);
    
    const filteredPosts = this.posts.filter(post => {
      const date = new Date(post.date);
      return date.getFullYear() === year && date.getMonth() + 1 === monthNum;
    });

    // 临时替换posts并渲染
    const originalPosts = this.posts;
    this.posts = filteredPosts;
    this.renderPostsList();
    this.posts = originalPosts;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  const blog = new BlogSystem();
  blog.init();
});
