/**
 * 奇异博士魔法符文粒子系统
 * 特性：
 * - 鼠标 + 摄像头双控制
 * - 画圈召唤魔法符文
 * - 跑马灯效果
 * - 古老图腾和符号
 */

// ========================================
// 全局变量
// ========================================
let scene, camera, renderer, composer;
let particleSystem, runeSystem, trailSystem;
let uniforms, runeUniforms;

// 控制状态
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let cameraDistance = 200;

// 画圈检测
let circlePoints = [];
let circleProgress = 0;
let isDrawingCircle = false;
let lastCircleTime = 0;

// 符文系统
const RUNE_PATTERNS = [
  'mandala',      // 曼陀罗
  'pentagram',    // 五芒星
  'hexagram',     // 六芒星
  'celtic',       // 凯尔特结
  'sanskrit',     // 梵文符号
  'alchemy',      // 炼金术符号
  'zodiac',       // 星座符号
  'runic'         // 北欧符文
];
let currentRuneIndex = 0;
let activeRunes = [];

// 跑马灯效果
let marqueeEnabled = false;
let marqueePhase = 0;

// 摄像头控制
let cameraEnabled = false;
let hands = null;
let handLandmarks = null;
let lastHandPosition = null;
let handCirclePoints = [];

// 颜色主题
let primaryColor = new THREE.Color(0xff8c00);
let secondaryColor = new THREE.Color(0xff4500);
let accentColor = new THREE.Color(0xffd700);

// ========================================
// 初始化 Three.js
// ========================================
function initThree() {
  const container = document.getElementById('canvas-container');
  
  // 场景
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.001);
  
  // 相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = cameraDistance;
  
  // 渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // 创建各个系统
  createStarField();
  createParticleSystem();
  createRuneSystem();
  createTrailSystem();
  
  // 事件监听
  initEventListeners();
  
  // 开始动画
  animate();
  
  // 隐藏加载动画
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
    updateStatus('就绪 - 移动鼠标或画圈召唤魔法');
  }, 1500);
}

// ========================================
// 创建星空背景
// ========================================
function createStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 20000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    // 球形分布
    const radius = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // 星星颜色
    const colorChoice = Math.random();
    if (colorChoice < 0.3) {
      colors[i * 3] = 1; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.5;
    } else if (colorChoice < 0.6) {
      colors[i * 3] = 0.5; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    }
    
    sizes[i] = Math.random() * 2 + 0.5;
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        float twinkle = sin(uTime * 3.0 + position.x * 0.01 + position.y * 0.01) * 0.4 + 0.6;
        gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
        vAlpha = twinkle;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        float glow = 1.0 - r * 2.0;
        glow = pow(glow, 2.0);
        
        gl_FragColor = vec4(vColor, vAlpha * glow * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });
  
  const starField = new THREE.Points(starGeometry, starMaterial);
  starField.name = 'starField';
  scene.add(starField);
}

// ========================================
// 创建主粒子系统
// ========================================
function createParticleSystem() {
  const particleCount = 50000;
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // 初始位置 - 球形分布
    const radius = 50 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // 颜色 - 橙色到金色渐变
    const t = Math.random();
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.5 + t * 0.5;
    colors[i * 3 + 2] = t * 0.3;
    
    sizes[i] = Math.random() * 3 + 1;
    phases[i] = Math.random() * Math.PI * 2;
    
    // 速度
    velocities[i * 3] = (Math.random() - 0.5) * 0.5;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  
  uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMouseStrength: { value: 0 },
    uMarquee: { value: 0 },
    uMarqueePhase: { value: 0 },
    uPrimaryColor: { value: primaryColor },
    uSecondaryColor: { value: secondaryColor }
  };
  
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      attribute float phase;
      attribute vec3 velocity;
      
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uMouseStrength;
      uniform float uMarquee;
      uniform float uMarqueePhase;
      
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        
        // 基础动画
        float wave = sin(uTime * 2.0 + phase) * 2.0;
        pos += velocity * wave;
        
        // 鼠标影响
        vec2 toMouse = uMouse - pos.xy * 0.01;
        float mouseDist = length(toMouse);
        if (mouseDist < 0.5) {
          float force = (0.5 - mouseDist) * uMouseStrength * 50.0;
          pos.xy += normalize(toMouse) * force;
        }
        
        // 跑马灯效果
        if (uMarquee > 0.0) {
          float angle = atan(pos.y, pos.x);
          float radius = length(pos.xy);
          angle += uMarqueePhase * 0.5;
          pos.x = cos(angle) * radius;
          pos.y = sin(angle) * radius;
          
          // 颜色跑马灯
          float colorPhase = mod(angle + uMarqueePhase, 6.28318) / 6.28318;
          vColor = mix(color, vec3(1.0, colorPhase, 0.0), uMarquee * 0.5);
        } else {
          vColor = color;
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 大小变化
        float pulse = sin(uTime * 3.0 + phase) * 0.3 + 1.0;
        gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
        
        vAlpha = 0.8;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        // 多层光晕
        float glow1 = 1.0 - r * 2.0;
        glow1 = pow(glow1, 2.0);
        
        float glow2 = 1.0 - r * 1.5;
        glow2 = pow(glow2, 4.0);
        
        float finalGlow = mix(glow1, glow2, 0.5);
        
        // 添加白色核心
        float core = 1.0 - smoothstep(0.0, 0.15, r);
        vec3 finalColor = mix(vColor, vec3(1.0), core * 0.6);
        
        gl_FragColor = vec4(finalColor, vAlpha * finalGlow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });
  
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

// ========================================
// 创建符文系统
// ========================================
function createRuneSystem() {
  // 符文将动态添加
}

// 生成符文图案点
function generateRunePattern(type, radius = 80, pointCount = 500) {
  const points = [];
  
  switch(type) {
    case 'mandala':
      // 曼陀罗图案
      for (let i = 0; i < pointCount; i++) {
        const layer = Math.floor(i / (pointCount / 5));
        const r = radius * (0.2 + layer * 0.2);
        const segments = 12 + layer * 6;
        const angle = (i % segments) / segments * Math.PI * 2;
        const wobble = Math.sin(angle * (layer + 3)) * 5;
        points.push({
          x: Math.cos(angle) * (r + wobble),
          y: Math.sin(angle) * (r + wobble),
          z: Math.sin(angle * 3) * 5
        });
      }
      break;
      
    case 'pentagram':
      // 五芒星
      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount;
        const starAngle = t * Math.PI * 4; // 绕两圈形成五芒星
        const r = radius * (0.4 + Math.abs(Math.sin(starAngle * 2.5)) * 0.6);
        points.push({
          x: Math.cos(starAngle) * r,
          y: Math.sin(starAngle) * r,
          z: Math.sin(t * Math.PI * 10) * 3
        });
      }
      // 添加外圈
      for (let i = 0; i < pointCount / 2; i++) {
        const angle = (i / (pointCount / 2)) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0
        });
      }
      break;
      
    case 'hexagram':
      // 六芒星（大卫之星）
      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount;
        // 两个交叉的三角形
        const triangle = Math.floor(t * 2);
        const localT = (t * 2) % 1;
        const baseAngle = triangle * Math.PI / 6;
        const angle = baseAngle + localT * Math.PI * 2 / 3 * 3;
        const r = radius * 0.8;
        points.push({
          x: Math.cos(angle + triangle * Math.PI) * r,
          y: Math.sin(angle + triangle * Math.PI) * r,
          z: Math.sin(localT * Math.PI * 6) * 3
        });
      }
      break;
      
    case 'celtic':
      // 凯尔特结
      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount * Math.PI * 4;
        const r = radius * 0.6 * (1 + 0.3 * Math.sin(t * 3));
        const x = Math.cos(t) * r + Math.cos(t * 3) * radius * 0.2;
        const y = Math.sin(t) * r + Math.sin(t * 3) * radius * 0.2;
        points.push({ x, y, z: Math.sin(t * 2) * 10 });
      }
      break;
      
    case 'sanskrit':
      // 梵文 Om 符号的简化版
      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount;
        const segment = Math.floor(t * 4);
        const localT = (t * 4) % 1;
        let x, y, z = 0;
        
        switch(segment) {
          case 0: // 主圆
            const angle0 = localT * Math.PI * 1.5;
            x = Math.cos(angle0) * radius * 0.5 - radius * 0.3;
            y = Math.sin(angle0) * radius * 0.5;
            break;
          case 1: // 上部弧线
            x = -radius * 0.3 + localT * radius * 0.8;
            y = radius * 0.5 + Math.sin(localT * Math.PI) * radius * 0.3;
            break;
          case 2: // 右侧曲线
            const angle2 = localT * Math.PI;
            x = radius * 0.3 + Math.cos(angle2) * radius * 0.3;
            y = Math.sin(angle2) * radius * 0.4;
            break;
          case 3: // 顶部点
            x = radius * 0.2 + Math.sin(localT * Math.PI * 2) * radius * 0.1;
            y = radius * 0.7 + localT * radius * 0.2;
            z = Math.sin(localT * Math.PI) * 5;
            break;
        }
        points.push({ x, y, z });
      }
      break;
      
    case 'alchemy':
      // 炼金术符号 - 四元素
      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount;
        const element = Math.floor(t * 4);
        const localT = (t * 4) % 1;
        let x, y;
        const offset = element * Math.PI / 2;
        const dist = radius * 0.6;
        const cx = Math.cos(offset) * dist * 0.5;
        const cy = Math.sin(offset) * dist * 0.5;
        
        // 每个元素是一个三角形
        const triAngle = localT * Math.PI * 2 / 3 * 3 + offset;
        const triRadius = radius * 0.25;
        x = cx + Math.cos(triAngle) * triRadius;
        y = cy + Math.sin(triAngle) * triRadius;
        points.push({ x, y, z: Math.sin(localT * Math.PI * 3) * 3 });
      }
      // 中心圆
      for (let i = 0; i < pointCount / 4; i++) {
        const angle = (i / (pointCount / 4)) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * radius * 0.15,
          y: Math.sin(angle) * radius * 0.15,
          z: 0
        });
      }
      break;
      
    case 'zodiac':
      // 星座轮
      for (let i = 0; i < 12; i++) {
        const baseAngle = (i / 12) * Math.PI * 2;
        // 每个星座位置
        for (let j = 0; j < pointCount / 12; j++) {
          const localAngle = (j / (pointCount / 12)) * Math.PI * 2;
          const starR = radius * 0.1;
          const x = Math.cos(baseAngle) * radius * 0.7 + Math.cos(localAngle) * starR;
          const y = Math.sin(baseAngle) * radius * 0.7 + Math.sin(localAngle) * starR;
          points.push({ x, y, z: Math.sin(localAngle * 2) * 2 });
        }
      }
      // 外圈
      for (let i = 0; i < pointCount / 3; i++) {
        const angle = (i / (pointCount / 3)) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0
        });
      }
      break;
      
    case 'runic':
      // 北欧符文阵
      const runeCount = 8;
      for (let r = 0; r < runeCount; r++) {
        const runeAngle = (r / runeCount) * Math.PI * 2;
        const rx = Math.cos(runeAngle) * radius * 0.6;
        const ry = Math.sin(runeAngle) * radius * 0.6;
        
        // 每个符文是简单的线条组合
        for (let i = 0; i < pointCount / runeCount; i++) {
          const t = i / (pointCount / runeCount);
          const lineType = Math.floor(t * 3);
          const localT = (t * 3) % 1;
          let dx, dy;
          
          switch(lineType) {
            case 0: // 垂直线
              dx = 0;
              dy = (localT - 0.5) * radius * 0.2;
              break;
            case 1: // 斜线1
              dx = (localT - 0.5) * radius * 0.1;
              dy = (localT - 0.5) * radius * 0.15;
              break;
            case 2: // 斜线2
              dx = (0.5 - localT) * radius * 0.1;
              dy = (localT - 0.5) * radius * 0.15;
              break;
          }
          points.push({ 
            x: rx + dx, 
            y: ry + dy, 
            z: Math.sin(t * Math.PI) * 2 
          });
        }
      }
      break;
  }
  
  return points;
}

// 召唤符文
function summonRune(type, position = { x: 0, y: 0, z: 0 }) {
  const points = generateRunePattern(type);
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(points.length * 3);
  const colors = new Float32Array(points.length * 3);
  const sizes = new Float32Array(points.length);
  const phases = new Float32Array(points.length);
  
  points.forEach((p, i) => {
    positions[i * 3] = p.x + position.x;
    positions[i * 3 + 1] = p.y + position.y;
    positions[i * 3 + 2] = p.z + position.z;
    
    // 金橙色渐变
    const t = i / points.length;
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.5 + Math.sin(t * Math.PI) * 0.5;
    colors[i * 3 + 2] = Math.sin(t * Math.PI * 2) * 0.3;
    
    sizes[i] = 2 + Math.random() * 2;
    phases[i] = Math.random() * Math.PI * 2;
  });
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  
  const runeUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uRotation: { value: 0 }
  };
  
  const material = new THREE.ShaderMaterial({
    uniforms: runeUniforms,
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      attribute float phase;
      
      uniform float uTime;
      uniform float uOpacity;
      uniform float uRotation;
      
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // 旋转
        float c = cos(uRotation);
        float s = sin(uRotation);
        vec3 pos = position;
        float newX = pos.x * c - pos.y * s;
        float newY = pos.x * s + pos.y * c;
        pos.x = newX;
        pos.y = newY;
        
        // 呼吸效果
        float breath = sin(uTime * 2.0 + phase) * 0.1 + 1.0;
        pos *= breath;
        
        // Z轴波动
        pos.z += sin(uTime * 3.0 + phase + pos.x * 0.05) * 3.0;
        
        vColor = color;
        vAlpha = uOpacity;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        float pulse = sin(uTime * 4.0 + phase) * 0.3 + 1.0;
        gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        float glow = 1.0 - r * 2.0;
        glow = pow(glow, 1.5);
        
        vec3 finalColor = vColor;
        float core = 1.0 - smoothstep(0.0, 0.2, r);
        finalColor = mix(finalColor, vec3(1.0), core * 0.5);
        
        gl_FragColor = vec4(finalColor, vAlpha * glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });
  
  const rune = new THREE.Points(geometry, material);
  rune.userData = { 
    uniforms: runeUniforms, 
    birthTime: performance.now(),
    type: type
  };
  
  scene.add(rune);
  activeRunes.push(rune);
  
  // 出现动画
  gsap.to(runeUniforms.uOpacity, {
    value: 1,
    duration: 1,
    ease: "power2.out"
  });
  
  // 持续旋转
  gsap.to(runeUniforms.uRotation, {
    value: Math.PI * 2,
    duration: 20,
    repeat: -1,
    ease: "none"
  });
  
  // 5秒后淡出
  setTimeout(() => {
    gsap.to(runeUniforms.uOpacity, {
      value: 0,
      duration: 2,
      ease: "power2.in",
      onComplete: () => {
        scene.remove(rune);
        const index = activeRunes.indexOf(rune);
        if (index > -1) activeRunes.splice(index, 1);
      }
    });
  }, 8000);
  
  updateStatus(`召唤符文: ${type}`);
  
  // 显示魔法圈指示器
  const indicator = document.getElementById('magic-indicator');
  indicator.classList.add('active');
  setTimeout(() => indicator.classList.remove('active'), 2000);
}

// ========================================
// 创建轨迹系统
// ========================================
function createTrailSystem() {
  const trailCount = 1000;
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(trailCount * 3);
  const colors = new Float32Array(trailCount * 3);
  const sizes = new Float32Array(trailCount);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vColor = color;
        vAlpha = size / 5.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size * (200.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        float glow = 1.0 - r * 2.0;
        gl_FragColor = vec4(vColor, vAlpha * glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  trailSystem = new THREE.Points(geometry, material);
  trailSystem.userData.trailIndex = 0;
  scene.add(trailSystem);
}

// 添加轨迹点
function addTrailPoint(x, y, z) {
  if (!trailSystem) return;
  
  const positions = trailSystem.geometry.attributes.position.array;
  const colors = trailSystem.geometry.attributes.color.array;
  const sizes = trailSystem.geometry.attributes.size.array;
  const index = trailSystem.userData.trailIndex;
  const maxTrails = positions.length / 3;
  
  positions[index * 3] = x;
  positions[index * 3 + 1] = y;
  positions[index * 3 + 2] = z;
  
  colors[index * 3] = 1;
  colors[index * 3 + 1] = 0.6;
  colors[index * 3 + 2] = 0;
  
  sizes[index] = 4;
  
  trailSystem.userData.trailIndex = (index + 1) % maxTrails;
  
  trailSystem.geometry.attributes.position.needsUpdate = true;
  trailSystem.geometry.attributes.color.needsUpdate = true;
  trailSystem.geometry.attributes.size.needsUpdate = true;
  
  // 衰减旧的轨迹
  for (let i = 0; i < maxTrails; i++) {
    sizes[i] *= 0.98;
    if (sizes[i] < 0.1) sizes[i] = 0;
  }
}

// ========================================
// 画圈检测
// ========================================
function detectCircle(x, y, source = 'mouse') {
  const now = performance.now();
  const point = { x, y, time: now };
  
  // 添加点
  circlePoints.push(point);
  
  // 移除过旧的点（超过2秒）
  circlePoints = circlePoints.filter(p => now - p.time < 2000);
  
  if (circlePoints.length < 20) return;
  
  // 计算圆心和半径
  let sumX = 0, sumY = 0;
  circlePoints.forEach(p => {
    sumX += p.x;
    sumY += p.y;
  });
  const centerX = sumX / circlePoints.length;
  const centerY = sumY / circlePoints.length;
  
  // 计算平均半径和方差
  let sumRadius = 0;
  let angles = [];
  circlePoints.forEach(p => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    sumRadius += Math.sqrt(dx * dx + dy * dy);
    angles.push(Math.atan2(dy, dx));
  });
  const avgRadius = sumRadius / circlePoints.length;
  
  // 检查是否形成圆
  if (avgRadius < 30) return; // 太小
  
  // 计算角度覆盖范围
  angles.sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < angles.length; i++) {
    maxGap = Math.max(maxGap, angles[i] - angles[i-1]);
  }
  // 检查首尾间隙
  maxGap = Math.max(maxGap, (Math.PI * 2 + angles[0]) - angles[angles.length - 1]);
  
  // 如果角度覆盖大于270度（最大间隙小于90度），认为是圆
  const coverage = Math.PI * 2 - maxGap;
  circleProgress = Math.min(coverage / (Math.PI * 1.5), 1);
  
  // 更新进度条
  document.getElementById('progress-fill').style.width = (circleProgress * 100) + '%';
  document.getElementById('progress-text').textContent = Math.round(circleProgress * 100) + '%';
  
  if (coverage > Math.PI * 1.8 && now - lastCircleTime > 3000) {
    // 检测到完整的圆！
    lastCircleTime = now;
    circlePoints = [];
    circleProgress = 0;
    
    // 召唤符文
    const runeType = RUNE_PATTERNS[currentRuneIndex];
    summonRune(runeType);
    
    // 重置进度条
    setTimeout(() => {
      document.getElementById('progress-fill').style.width = '0%';
      document.getElementById('progress-text').textContent = '0%';
    }, 500);
  }
}

// ========================================
// 事件监听
// ========================================
function initEventListeners() {
  const canvas = renderer.domElement;
  
  // 鼠标移动
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (uniforms) {
      uniforms.uMouse.value.set(mouseX, mouseY);
      uniforms.uMouseStrength.value = 1;
    }
    
    // 拖拽旋转
    if (isDragging) {
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      
      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;
      
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    }
    
    // 画圈检测
    if (e.buttons === 0) { // 没有按下按钮时检测画圈
      detectCircle(e.clientX, e.clientY, 'mouse');
    }
    
    // 添加轨迹
    const worldX = mouseX * 100;
    const worldY = mouseY * 100;
    addTrailPoint(worldX, worldY, 0);
  });
  
  // 鼠标按下
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  });
  
  // 鼠标松开
  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // 鼠标离开
  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    if (uniforms) uniforms.uMouseStrength.value = 0;
  });
  
  // 滚轮缩放
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.5;
    cameraDistance = Math.max(50, Math.min(500, cameraDistance));
  }, { passive: false });
  
  // 键盘事件
  document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        currentRuneIndex = (currentRuneIndex + 1) % RUNE_PATTERNS.length;
        updateStatus(`切换符文: ${RUNE_PATTERNS[currentRuneIndex]}`);
        break;
      case 'r':
        targetRotationX = 0;
        targetRotationY = 0;
        cameraDistance = 200;
        updateStatus('视角已重置');
        break;
      case 'c':
        toggleCamera();
        break;
      case 'm':
        toggleMarquee();
        break;
    }
  });
  
  // UI 按钮
  document.getElementById('btn-prev').addEventListener('click', () => {
    currentRuneIndex = (currentRuneIndex - 1 + RUNE_PATTERNS.length) % RUNE_PATTERNS.length;
    summonRune(RUNE_PATTERNS[currentRuneIndex]);
  });
  
  document.getElementById('btn-next').addEventListener('click', () => {
    currentRuneIndex = (currentRuneIndex + 1) % RUNE_PATTERNS.length;
    summonRune(RUNE_PATTERNS[currentRuneIndex]);
  });
  
  document.getElementById('btn-camera').addEventListener('click', toggleCamera);
  document.getElementById('btn-effect').addEventListener('click', toggleMarquee);
  
  // 颜色选择器
  document.getElementById('color-picker').addEventListener('input', (e) => {
    primaryColor.set(e.target.value);
    if (uniforms) {
      uniforms.uPrimaryColor.value = primaryColor;
    }
  });
  
  // 全屏
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  
  // 窗口大小变化
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ========================================
// 摄像头控制
// ========================================
function toggleCamera() {
  cameraEnabled = !cameraEnabled;
  const btn = document.getElementById('btn-camera');
  const video = document.getElementById('video-input');
  const handCanvas = document.getElementById('hand-canvas');
  
  if (cameraEnabled) {
    btn.classList.add('active');
    video.classList.remove('hidden');
    initHandTracking();
    updateStatus('摄像头已启用 - 用手画圈召唤符文');
  } else {
    btn.classList.remove('active');
    video.classList.add('hidden');
    handCanvas.style.opacity = '0';
    updateStatus('摄像头已关闭');
  }
}

function initHandTracking() {
  const video = document.getElementById('video-input');
  const handCanvas = document.getElementById('hand-canvas');
  const ctx = handCanvas.getContext('2d');
  
  // 初始化 MediaPipe Hands
  if (!hands) {
    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    hands.onResults((results) => {
      // 清除画布
      ctx.clearRect(0, 0, handCanvas.width, handCanvas.height);
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // 绘制手部关键点
        ctx.fillStyle = '#ff8c00';
        landmarks.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * handCanvas.width, point.y * handCanvas.height, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // 获取食指指尖位置
        const indexTip = landmarks[8];
        const x = indexTip.x * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        
        // 画圈检测
        detectCircle(x, y, 'hand');
        
        // 添加轨迹
        const worldX = (indexTip.x - 0.5) * 200;
        const worldY = (0.5 - indexTip.y) * 200;
        addTrailPoint(worldX, worldY, 0);
        
        // 张合控制
        const thumbTip = landmarks[4];
        const distance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
          Math.pow(thumbTip.y - indexTip.y, 2)
        );
        
        // 映射到鼠标强度
        if (uniforms) {
          uniforms.uMouseStrength.value = Math.min(distance * 5, 1);
          uniforms.uMouse.value.set(
            (indexTip.x - 0.5) * 2,
            (0.5 - indexTip.y) * 2
          );
        }
      }
    });
  }
  
  // 启动摄像头
  const cameraUtils = new Camera(video, {
    onFrame: async () => {
      if (cameraEnabled) {
        await hands.send({ image: video });
      }
    },
    width: 640,
    height: 480
  });
  
  cameraUtils.start();
  
  // 设置画布大小
  handCanvas.width = 200;
  handCanvas.height = 150;
  handCanvas.style.opacity = '1';
}

// ========================================
// 跑马灯效果
// ========================================
function toggleMarquee() {
  marqueeEnabled = !marqueeEnabled;
  const btn = document.getElementById('btn-effect');
  
  if (marqueeEnabled) {
    btn.classList.add('active');
    updateStatus('跑马灯效果已启用');
  } else {
    btn.classList.remove('active');
    if (uniforms) uniforms.uMarquee.value = 0;
    updateStatus('跑马灯效果已关闭');
  }
}

// ========================================
// 更新状态显示
// ========================================
function updateStatus(text) {
  document.getElementById('status-text').textContent = text;
}

// ========================================
// 动画循环
// ========================================
function animate() {
  requestAnimationFrame(animate);
  
  const time = performance.now() * 0.001;
  
  // 更新 uniforms
  if (uniforms) {
    uniforms.uTime.value = time;
    
    if (marqueeEnabled) {
      uniforms.uMarquee.value = Math.min(uniforms.uMarquee.value + 0.02, 1);
      uniforms.uMarqueePhase.value = time * 2;
    }
  }
  
  // 更新星空
  const starField = scene.getObjectByName('starField');
  if (starField && starField.material.uniforms) {
    starField.material.uniforms.uTime.value = time;
    starField.rotation.y = time * 0.02;
  }
  
  // 更新符文
  activeRunes.forEach(rune => {
    if (rune.userData.uniforms) {
      rune.userData.uniforms.uTime.value = time;
    }
  });
  
  // 更新轨迹
  if (trailSystem && trailSystem.material.uniforms) {
    trailSystem.material.uniforms.uTime.value = time;
  }
  
  // 相机控制
  camera.position.x += (Math.sin(targetRotationY) * cameraDistance - camera.position.x) * 0.05;
  camera.position.y += (Math.sin(targetRotationX) * cameraDistance * 0.5 - camera.position.y) * 0.05;
  camera.position.z += (Math.cos(targetRotationY) * cameraDistance - camera.position.z) * 0.05;
  camera.lookAt(0, 0, 0);
  
  // 粒子系统自转
  if (particleSystem) {
    particleSystem.rotation.y = time * 0.1;
    particleSystem.rotation.x = Math.sin(time * 0.2) * 0.1;
  }
  
  renderer.render(scene, camera);
}

// ========================================
// 启动
// ========================================
initThree();
