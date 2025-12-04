/**
 * 炫酷交互效果 JavaScript - Justin's Portfolio
 * 包含：鼠标跟随、3D卡片、磁性按钮、滚动动画、粒子效果等
 */

(function() {
  'use strict';

  // ========================================
  // 1. 鼠标跟随光标效果 (已禁用)
  // ========================================
  // 根据用户反馈，鼠标跟随效果与配色不协调，已移除

  // ========================================
  // 2. 3D卡片悬浮效果
  // ========================================
  class Card3DEffect {
    constructor() {
      this.cards = document.querySelectorAll('.carbox, .li1-box, .li5box-car');
      this.init();
    }

    init() {
      this.cards.forEach(card => {
        card.classList.add('card-3d-hover');
        
        card.addEventListener('mousemove', (e) => this.onMouseMove(e, card));
        card.addEventListener('mouseleave', () => this.onMouseLeave(card));
      });
    }

    onMouseMove(e, card) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.setProperty('--rotateX', `${-rotateX}deg`);
      card.style.setProperty('--rotateY', `${rotateY}deg`);
    }

    onMouseLeave(card) {
      card.style.setProperty('--rotateX', '0deg');
      card.style.setProperty('--rotateY', '0deg');
    }
  }

  // ========================================
  // 3. 磁性按钮效果
  // ========================================
  class MagneticButton {
    constructor() {
      this.buttons = document.querySelectorAll('.buttom, .button, .buttonsty');
      this.init();
    }

    init() {
      this.buttons.forEach(btn => {
        btn.classList.add('magnetic-btn');
        
        btn.addEventListener('mousemove', (e) => this.onMouseMove(e, btn));
        btn.addEventListener('mouseleave', () => this.onMouseLeave(btn));
      });
    }

    onMouseMove(e, btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      btn.style.setProperty('--tx', `${x * 0.3}px`);
      btn.style.setProperty('--ty', `${y * 0.3}px`);
    }

    onMouseLeave(btn) {
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    }
  }

  // ========================================
  // 4. 波纹点击效果
  // ========================================
  class RippleEffect {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('.buttom, .button, .buttonsty, .carbox').forEach(el => {
        el.classList.add('ripple-effect');
        el.addEventListener('click', (e) => this.createRipple(e, el));
      });
    }

    createRipple(e, el) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      
      el.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    }
  }

  // ========================================
  // 5. 滚动显示动画
  // ========================================
  class ScrollReveal {
    constructor() {
      this.elements = [];
      this.init();
    }

    init() {
      // 为各个内容块添加滚动动画类
      document.querySelectorAll('.content-li, .li1-box, .carbox').forEach((el, index) => {
        el.classList.add('scroll-reveal');
        
        // 交替添加不同方向的动画
        if (index % 3 === 0) el.classList.add('from-left');
        else if (index % 3 === 1) el.classList.add('scale-up');
        else el.classList.add('from-right');
        
        this.elements.push(el);
      });

      // 使用 Intersection Observer
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      this.elements.forEach(el => observer.observe(el));
    }
  }

  // ========================================
  // 6. 数字计数动画
  // ========================================
  class CountUp {
    constructor() {
      this.init();
    }

    init() {
      const countElements = document.querySelectorAll('.li1-box > span:first-child');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            this.animateCount(entry.target);
            entry.target.dataset.counted = 'true';
          }
        });
      }, { threshold: 0.5 });

      countElements.forEach(el => observer.observe(el));
    }

    animateCount(el) {
      const target = parseInt(el.textContent) || 0;
      const duration = 2000;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * easeOut);
        
        el.textContent = current;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = target;
        }
      };
      
      requestAnimationFrame(animate);
    }
  }

  // ========================================
  // 7. 粒子背景效果
  // ========================================
  class ParticleBackground {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.particleCount = 80;
      this.mouse = { x: null, y: null, radius: 150 };
      this.init();
    }

    init() {
      // 创建 canvas
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particles-bg';
      document.body.insertBefore(this.canvas, document.body.firstChild);
      
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      
      // 创建粒子
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push(this.createParticle());
      }
      
      // 事件监听
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
      
      this.animate();
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    createParticle() {
      return {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: `hsla(${Math.random() * 60 + 180}, 100%, 70%, ${Math.random() * 0.5 + 0.2})`
      };
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles.forEach((p, index) => {
        // 更新位置
        p.x += p.speedX;
        p.y += p.speedY;
        
        // 边界检测
        if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;
        
        // 鼠标交互
        if (this.mouse.x && this.mouse.y) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            p.x += dx * force * 0.02;
            p.y += dy * force * 0.02;
          }
        }
        
        // 绘制粒子
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        
        // 连接附近粒子
        for (let j = index + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${0.2 * (1 - dist / 120)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      });
      
      requestAnimationFrame(() => this.animate());
    }
  }

  // ========================================
  // 8. 滚动进度条
  // ========================================
  class ScrollProgress {
    constructor() {
      this.progressBar = null;
      this.init();
    }

    init() {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'scroll-progress';
      document.body.appendChild(this.progressBar);
      
      window.addEventListener('scroll', () => this.updateProgress());
    }

    updateProgress() {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      this.progressBar.style.width = progress + '%';
    }
  }

  // ========================================
  // 9. 社交图标增强
  // ========================================
  class SocialIconEnhance {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('.lianxi-list a').forEach(icon => {
        icon.classList.add('social-icon-hover');
      });
    }
  }

  // ========================================
  // 10. 打字机效果增强
  // ========================================
  class TypewriterEnhanced {
    constructor() {
      this.init();
    }

    init() {
      const texts = [
        "其实，我的愿望是挣个小目标然后环游欧洲",
        "代码改变世界，创意点亮生活",
        "永远保持学习的热情",
        "探索未知，创造可能"
      ];
      
      const element = document.querySelector('.me-hover span');
      if (!element) return;
      
      let textIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      
      const type = () => {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
          element.textContent = currentText.substring(0, charIndex - 1);
          charIndex--;
        } else {
          element.textContent = currentText.substring(0, charIndex + 1);
          charIndex++;
        }
        
        let delay = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
          delay = 2000;
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
          delay = 500;
        }
        
        setTimeout(type, delay);
      };
      
      // 延迟启动，等待页面加载完成
      setTimeout(type, 2000);
    }
  }

  // ========================================
  // 11. 霓虹边框效果
  // ========================================
  class NeonBorderEffect {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('.me-card, .li7boxitem.active').forEach(el => {
        el.classList.add('neon-border');
      });
    }
  }

  // ========================================
  // 12. 平滑滚动增强
  // ========================================
  class SmoothScroll {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    }
  }

  // ========================================
  // 13. 图片懒加载
  // ========================================
  class LazyLoad {
    constructor() {
      this.init();
    }

    init() {
      const images = document.querySelectorAll('img[data-src]');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => observer.observe(img));
    }
  }

  // ========================================
  // 14. 键盘快捷键
  // ========================================
  class KeyboardShortcuts {
    constructor() {
      this.init();
    }

    init() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: 切换主题
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          document.getElementById('myRadio')?.click();
        }
        
        // Escape: 关闭弹窗
        if (e.key === 'Escape') {
          const overlay = document.getElementById('zhezhao');
          if (overlay?.classList.contains('active')) {
            overlay.classList.remove('active');
          }
        }
      });
    }
  }

  // ========================================
  // 初始化所有效果
  // ========================================
  function initAllEffects() {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 桌面端效果
    if (!isMobile) {
      // CursorEffect 已禁用 - 与配色不协调
      new Card3DEffect();
      new MagneticButton();
    }
    
    // 通用效果
    new RippleEffect();
    new ScrollReveal();
    new CountUp();
    new ParticleBackground();
    new ScrollProgress();
    new SocialIconEnhance();
    new TypewriterEnhanced();
    new NeonBorderEffect();
    new SmoothScroll();
    new LazyLoad();
    new KeyboardShortcuts();
    
    console.log('✨ All effects initialized!');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllEffects);
  } else {
    initAllEffects();
  }

})();
