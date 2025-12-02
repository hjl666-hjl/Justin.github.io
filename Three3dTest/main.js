// main.js

// --- 1. 全局变量 ---
let scene, camera, renderer;
let particleSystem, uniforms;
let currentModelIndex = 0;
const modelImages = ['./assets/heart.png', './assets/skull.png', './assets/star.png']; // 替换为你的图片路径
let isGestureActive = false; // 手势是否被检测到
// ...之前的变量
let isHandDetected = false; // 标记当前是否检测到手
let isMouseDown = false;    // 标记鼠标是否按下
let mouseSwipeStartX = 0;   // 用于计算鼠标拖拽

// 新增：更多交互状态
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let currentRotationX = 0, currentRotationY = 0;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let particleScale = 1.0; // 粒子缩放

// 新增：内置几何形状生成器
const geometricShapes = {
  sphere: generateSphere,
  cube: generateCube,
  helix: generateHelix,
  wave: generateWave,
  galaxy: generateGalaxy,
  torus: generateTorus
};

let currentShapeType = 'sphere'; // 当前形状类型
let useGeometricShape = false; // 是否使用几何形状而非图片


// --- 2. Three.js 初始化 ---
function initThree() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0008); // 添加雾效，增强深度感

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 150;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 添加星空背景
  createStarField();

  // 初始化粒子系统
  createParticleSystem();

  // 监听窗口大小
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 初始化鼠标控制 (新增)
  initMouseControl();

  animate();
}

// --- 新增：创建星空背景 ---
function createStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 15000;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // 随机分布在球形空间中
    const radius = 300 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
    
    starSizes[i] = Math.random() * 2 + 0.5;
    
    // 星星颜色变化（蓝白黄）
    const colorType = Math.random();
    if (colorType < 0.3) {
      starColors[i * 3] = 0.5 + Math.random() * 0.5;
      starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      starColors[i * 3 + 2] = 1.0;
    } else if (colorType < 0.6) {
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 1.0;
      starColors[i * 3 + 2] = 1.0;
    } else {
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      starColors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
    }
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

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
        
        // 闪烁效果
        float twinkle = sin(uTime * 2.0 + position.x * 0.01) * 0.3 + 0.7;
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
        
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 2.0);
        
        gl_FragColor = vec4(vColor, vAlpha * glow * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const starField = new THREE.Points(starGeometry, starMaterial);
  starField.name = 'starField';
  scene.add(starField);
}

// --- 3. 图像处理：将图片转换为粒子坐标 ---
function getImageData(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 300; // 提高分辨率，增加粒子密度
  canvas.height = 300;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const particles = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const alpha = imgData.data[i + 3];

      if (alpha > 128) { // 只取不透明的像素
        particles.push({
          x: (x - canvas.width / 2), // 居中
          y: -(y - canvas.height / 2), // 翻转Y轴
          z: 0
        });
      }
    }
  }
  return particles;
}

// --- 新增：几何形状生成器 ---
function generateSphere(count = 15000) {
  const particles = [];
  const radius = 80;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particles.push({
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    });
  }
  return particles;
}

function generateCube(count = 15000) {
  const particles = [];
  const size = 100;
  for (let i = 0; i < count; i++) {
    const face = Math.floor(Math.random() * 6);
    let x, y, z;
    const u = Math.random() * size - size / 2;
    const v = Math.random() * size - size / 2;
    
    switch(face) {
      case 0: x = size/2; y = u; z = v; break;
      case 1: x = -size/2; y = u; z = v; break;
      case 2: x = u; y = size/2; z = v; break;
      case 3: x = u; y = -size/2; z = v; break;
      case 4: x = u; y = v; z = size/2; break;
      case 5: x = u; y = v; z = -size/2; break;
    }
    particles.push({ x, y, z });
  }
  return particles;
}

function generateHelix(count = 15000) {
  const particles = [];
  const radius = 50;
  const height = 150;
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 8;
    particles.push({
      x: Math.cos(t) * radius,
      y: (i / count) * height - height / 2,
      z: Math.sin(t) * radius
    });
  }
  return particles;
}

function generateWave(count = 15000) {
  const particles = [];
  const gridSize = Math.sqrt(count);
  const spacing = 150 / gridSize;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = i * spacing - 75;
      const z = j * spacing - 75;
      const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 20;
      particles.push({ x, y, z });
    }
  }
  return particles;
}

function generateGalaxy(count = 20000) {
  const particles = [];
  const arms = 4;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * arms;
    const radius = (i / count) * 120;
    const spread = Math.random() * 15;
    const armOffset = Math.random() * 0.5;
    particles.push({
      x: Math.cos(angle + armOffset) * radius + (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * 10 * (1 - radius / 120),
      z: Math.sin(angle + armOffset) * radius + (Math.random() - 0.5) * spread
    });
  }
  return particles;
}

function generateTorus(count = 15000) {
  const particles = [];
  const majorRadius = 60;
  const minorRadius = 25;
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    particles.push({
      x: (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
      y: minorRadius * Math.sin(v),
      z: (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u)
    });
  }
  return particles;
}

// --- 4. 创建粒子系统 (Shader) ---
function createParticleSystem() {
  // 大幅增加粒子数量，打造宇宙级效果
  const maxParticles = 100000;
  const geometry = new THREE.BufferGeometry();

  // 属性数组
  const positions = new Float32Array(maxParticles * 3); // 当前位置
  const targets = new Float32Array(maxParticles * 3);   // 目标位置（图案）
  const randoms = new Float32Array(maxParticles * 3);   // 随机散开的位置
  const scales = new Float32Array(maxParticles);        // 每个粒子的随机大小
  const phases = new Float32Array(maxParticles);        // 动画相位偏移

  for(let i=0; i<maxParticles; i++) {
    positions[i*3] = 0; positions[i*3+1] = 0; positions[i*3+2] = 0;

    // 随机散开的目标点 (用于扩散效果)
    randoms[i*3] = (Math.random() - 0.5) * 300;
    randoms[i*3+1] = (Math.random() - 0.5) * 300;
    randoms[i*3+2] = (Math.random() - 0.5) * 300;
    
    // 粒子大小变化
    scales[i] = 0.3 + Math.random() * 1.2;
    // 动画相位
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  // Shader 材质
  uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x00ffff) },
    uExpansion: { value: 1.0 }, // 0 = 凝聚, 1 = 扩散（初始为散开状态）
    uPointSize: { value: 2.5 },
    uColorVariation: { value: 0.3 } // 颜色变化程度
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
            uniform float uTime;
            uniform float uExpansion;
            uniform float uPointSize;
            
            attribute vec3 target;
            attribute vec3 aRandom;
            attribute float aScale;
            attribute float aPhase;
            
            varying float vAlpha;
            varying float vDepth;
            varying float vPhase;

            void main() {
                // 核心逻辑：在凝聚点和目标形态之间插值
                vec3 centerPoint = vec3(0.0, 0.0, 0.0);
                vec3 pos = mix(centerPoint, target, uExpansion);
                
                // 增强的动态效果
                float wave = sin(uTime * 1.5 + aPhase + pos.y * 0.05) * 0.8;
                float pulse = sin(uTime * 3.0 + aPhase) * 0.3;
                
                pos.x += wave * uExpansion;
                pos.y += cos(uTime * 1.2 + aPhase + pos.x * 0.05) * 0.6 * uExpansion;
                pos.z += sin(uTime * 0.8 + aPhase) * 0.4 * uExpansion;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // 景深效果：距离越远粒子越小
                float depth = -mvPosition.z;
                vDepth = depth;
                
                // 粒子大小随机变化 + 脉动效果
                float sizeFactor = aScale * (1.0 + pulse * 0.2);
                gl_PointSize = uPointSize * sizeFactor * (400.0 / depth);
                
                // 透明度随深度和扩散状态变化
                vAlpha = (uExpansion * 0.7 + 0.3) * (1.0 - depth * 0.001);
                vPhase = aPhase;
            }
        `,
    fragmentShader: `
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uColorVariation;
            
            varying float vAlpha;
            varying float vDepth;
            varying float vPhase;
            
            void main() {
                // 圆形粒子
                vec2 center = gl_PointCoord - vec2(0.5);
                float r = length(center);
                if (r > 0.5) discard;
                
                // 多层光晕效果
                float glow1 = 1.0 - (r * 2.0);
                glow1 = pow(glow1, 2.5);
                
                float glow2 = 1.0 - (r * 1.5);
                glow2 = pow(glow2, 4.0);
                
                float finalGlow = mix(glow1, glow2, 0.5);
                
                // 颜色变化：基于相位和深度
                vec3 color1 = uColor;
                vec3 color2 = vec3(uColor.b, uColor.r, uColor.g); // 颜色偏移
                vec3 finalColor = mix(color1, color2, sin(vPhase + uTime * 0.5) * uColorVariation);
                
                // 添加白色核心
                float core = 1.0 - smoothstep(0.0, 0.2, r);
                finalColor = mix(finalColor, vec3(1.0), core * 0.5);
                
                gl_FragColor = vec4(finalColor, vAlpha * finalGlow);
            }
        `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // 先加载默认几何形状，避免初始状态全是0导致看不见
  loadGeometricShape('sphere');
  
  // 延迟加载第一个图片模型（可选）
  // setTimeout(() => loadModel(0), 100);
}

// 加载图片并更新粒子目标位置
function loadModel(index) {
  if (index < 0) index = modelImages.length - 1;
  if (index >= modelImages.length) index = 0;
  currentModelIndex = index;

  const img = new Image();
  img.src = modelImages[index];
  img.onload = () => {
    useGeometricShape = false;
    const points = getImageData(img);
    updateParticleTargets(points);
    updateHint(`状态: 已加载图片模型 ${index + 1}/${modelImages.length}`);
  };
  img.onerror = () => {
    console.warn('图片加载失败，使用几何形状');
    loadGeometricShape('sphere');
    updateHint('状态: 图片加载失败，已切换到几何形状');
  };
}

// 新增：加载几何形状
function loadGeometricShape(shapeName) {
  useGeometricShape = true;
  currentShapeType = shapeName;
  const generator = geometricShapes[shapeName];
  if (generator) {
    const points = generator();
    updateParticleTargets(points);
    updateHint(`状态: 几何形状 - ${shapeName} | 粒子数: ${points.length}`);
  }
}

// 新增：统一更新粒子目标位置的函数
function updateParticleTargets(points) {
  const geometry = particleSystem.geometry;
  const targets = geometry.attributes.target.array;

  // 更新目标位置
  for(let i=0; i < targets.length / 3; i++) {
    if (i < points.length) {
      targets[i*3] = points[i].x;
      targets[i*3+1] = points[i].y;
      targets[i*3+2] = points[i].z;
    } else {
      // 多余的粒子隐藏到中心
      targets[i*3] = 0; targets[i*3+1] = 0; targets[i*3+2] = 0;
    }
  }
  geometry.attributes.target.needsUpdate = true;

  // 切换模型时播放一个简单的过渡动画：先凝聚再散开
  gsap.fromTo(uniforms.uExpansion, {value: 0}, {value: 1, duration: 1.5, ease: "elastic.out(1, 0.5)"});
}

// --- 5. MediaPipe 手势集成 ---
const videoElement = document.getElementById('video-input');
const hintElement = document.getElementById('gesture-hint');

let lastWristX = 0;
let swipeCooldown = false;

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    isGestureActive = true;
    const landmarks = results.multiHandLandmarks[0]; // 获取第一只手

    // --- 逻辑 1: 张合控制 (扩散/凝聚) ---
    // 计算拇指指尖(4)和食指指尖(8)的距离，或者计算所有指尖到手腕(0)的平均距离
    // 这里使用简单的拇指-食指距离归一化
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // 映射距离到 0-1 之间 (根据实际测试调整阈值)
    // 距离小(握拳) -> expansion = 0 (凝聚到中心)
    // 距离大(张开) -> expansion = 1 (散开成完整形状)
    let expansionTarget = Math.min(Math.max((distance - 0.05) * 4, 0), 1);

    // 使用 GSAP 平滑过渡数值，避免抖动
    gsap.to(uniforms.uExpansion, {
      value: expansionTarget,
      duration: 0.2
    });

    // --- 逻辑 2: 左右挥手 (切换模型) ---
    const wrist = landmarks[0];
    const currentWristX = wrist.x;

    if (!swipeCooldown) {
      const velocity = currentWristX - lastWristX;
      // 阈值检测 (注意：摄像头是镜像的，方向可能相反)
      if (velocity > 0.08) { // 向左挥 (屏幕镜像)
        triggerSwipe('prev');
      } else if (velocity < -0.08) { // 向右挥
        triggerSwipe('next');
      }
    }
    lastWristX = currentWristX;

    hintElement.innerText = `状态: 交互中 | 张合度: ${distance.toFixed(2)}`;
  } else {
    // 如果之前是检测到手的状态，现在手刚消失
    if (isHandDetected) {
      isHandDetected = false; // 解锁：允许鼠标控制

      // 手消失时，恢复到正常大小
      if (!isMouseDown) {
        gsap.to(particleSystem.scale, { x: 1, y: 1, z: 1, duration: 1 });
        particleScale = 1.0;
        updateHint("状态: 等待手势 / 请使用鼠标");
      }
    }
  }
}

function triggerSwipe(direction) {
  swipeCooldown = true;
  switchModel(direction);
  // 冷却 1 秒防止连续触发
  setTimeout(() => { swipeCooldown = false; }, 1000);
}

// 初始化 MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
cameraUtils.start();

// --- 6. 辅助功能与渲染循环 ---

// 切换模型（支持图片和几何形状）
window.switchModel = function(direction) {
  if (useGeometricShape) {
    // 如果当前是几何形状，切换到下一个几何形状
    const shapes = Object.keys(geometricShapes);
    let currentIndex = shapes.indexOf(currentShapeType);
    if (direction === 'next') currentIndex++;
    else currentIndex--;
    
    if (currentIndex < 0) currentIndex = shapes.length - 1;
    if (currentIndex >= shapes.length) currentIndex = 0;
    
    loadGeometricShape(shapes[currentIndex]);
  } else {
    // 切换图片模型
    let nextIndex = currentModelIndex;
    if (direction === 'next') nextIndex++;
    else nextIndex--;
    loadModel(nextIndex);
  }
};

// 新增：快捷键控制
document.addEventListener('keydown', (e) => {
  if (isHandDetected) return;
  
  switch(e.key) {
    case 'ArrowLeft':
      switchModel('prev');
      break;
    case 'ArrowRight':
      switchModel('next');
      break;
    case ' ': // 空格键：切换扩散/凝聚
      const currentExpansion = uniforms.uExpansion.value;
      gsap.to(uniforms.uExpansion, {
        value: currentExpansion > 0.5 ? 0 : 1,
        duration: 1,
        ease: "power2.inOut"
      });
      break;
    case 'r': // R键：重置
      targetRotationX = 0;
      targetRotationY = 0;
      particleScale = 1.0;
      gsap.to(particleSystem.rotation, { x: 0, y: 0, z: 0, duration: 1 });
      gsap.to(particleSystem.scale, { x: 1, y: 1, z: 1, duration: 1 });
      break;
    case 'g': // G键：切换到几何形状模式
      loadGeometricShape('sphere');
      break;
  }
});

// 颜色选择器
document.getElementById('color-picker').addEventListener('input', (e) => {
  const color = new THREE.Color(e.target.value);
  gsap.to(uniforms.uColor.value, {
    r: color.r, g: color.g, b: color.b,
    duration: 0.5
  });
});

// 全屏控制
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;
  if (uniforms) uniforms.uTime.value = time;

  // 更新星空背景
  const starField = scene.getObjectByName('starField');
  if (starField && starField.material.uniforms) {
    starField.material.uniforms.uTime.value = time;
    starField.rotation.y = time * 0.01; // 缓慢旋转
  }

  // 平滑插值旋转（鼠标控制）
  if (particleSystem && !isHandDetected) {
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;
    
    particleSystem.rotation.x = currentRotationX;
    particleSystem.rotation.y = currentRotationY;
    
    // 添加微小的自动旋转（仅在不拖拽时）
    if (!isDragging) {
      particleSystem.rotation.z = Math.sin(time * 0.2) * 0.1;
    }
  }

  renderer.render(scene, camera);
}

function initMouseControl() {
  // 1. 鼠标移动 - 增强版：拖拽旋转 + 视差效果
  document.addEventListener('mousemove', (e) => {
    if (isHandDetected) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    // 如果正在拖拽，计算旋转
    if (isDragging) {
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      
      updateHint(`状态: 拖拽旋转中 | 角度: ${targetRotationY.toFixed(2)}`);
    } else {
      // 非拖拽时的视差效果
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      targetRotationY = x * 0.3;
      targetRotationX = y * 0.3;
    }
  });

  // 2. 鼠标按下 - 开始拖拽 + 缩小效果
  document.addEventListener('mousedown', (e) => {
    if (isHandDetected) return;

    isMouseDown = true;
    isDragging = true;
    mouseSwipeStartX = e.clientX;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;

    // 触发缩小动画（保持形状，只是缩小到 0.5 倍）
    gsap.to(particleSystem.scale, {
      x: 0.5,
      y: 0.5,
      z: 0.5,
      duration: 0.6,
      ease: "power2.in"
    });
    
    // 同步更新 particleScale 变量
    particleScale = 0.5;

    updateHint("状态: 按住拖拽旋转 | 缩小查看整体");
  });

  // 3. 鼠标松开 - 停止拖拽 + 放大查看细节
  document.addEventListener('mouseup', (e) => {
    if (isHandDetected) return;

    isMouseDown = false;
    isDragging = false;
    const deltaX = e.clientX - mouseSwipeStartX;

    // 判断是否是快速滑动切换
    if (Math.abs(deltaX) > 100 && Math.abs(e.clientX - previousMouseX) > 5) {
      if (deltaX > 0) {
        switchModel('prev');
      } else {
        switchModel('next');
      }
    }

    // 放大到 1.5 倍，查看细节（带弹性效果）
    gsap.to(particleSystem.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 1.2,
      ease: "elastic.out(1, 0.5)"
    });
    
    // 同步更新 particleScale 变量
    particleScale = 1.5;

    updateHint("状态: 放大查看细节 | 滚轮缩放 | 拖拽旋转");
  });

  // 4. 新增：鼠标滚轮 - 缩放效果（扩大缩放范围）
  document.addEventListener('wheel', (e) => {
    if (isHandDetected) return;
    
    e.preventDefault();
    const delta = e.deltaY * -0.002; // 增加滚轮灵敏度
    particleScale = Math.max(0.1, Math.min(10, particleScale + delta)); // 扩大缩放范围：0.1x - 10x
    
    gsap.to(particleSystem.scale, {
      x: particleScale,
      y: particleScale,
      z: particleScale,
      duration: 0.3
    });
    
    updateHint(`状态: 缩放 ${(particleScale * 100).toFixed(0)}%`);
  }, { passive: false });

  // 5. 新增：双击 - 切换几何形状
  document.addEventListener('dblclick', (e) => {
    if (isHandDetected) return;
    
    const shapes = Object.keys(geometricShapes);
    const currentIndex = shapes.indexOf(currentShapeType);
    const nextIndex = (currentIndex + 1) % shapes.length;
    const nextShape = shapes[nextIndex];
    
    loadGeometricShape(nextShape);
    updateHint(`状态: 切换形状 - ${nextShape}`);
  });

  // 6. 新增：右键 - 重置视角和状态
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isHandDetected) return;
    
    // 重置所有状态到默认值
    targetRotationX = 0;
    targetRotationY = 0;
    particleScale = 1.0;
    
    gsap.to(particleSystem.rotation, { x: 0, y: 0, z: 0, duration: 1 });
    gsap.to(particleSystem.scale, { x: 1, y: 1, z: 1, duration: 1 });
    
    updateHint("状态: 已重置视角和缩放");
  });
}

// 辅助函数：更新界面提示
function updateHint(text) {
  const hint = document.getElementById('gesture-hint');
  if(hint) hint.innerText = text;
}


// 启动
initThree();
