// Инициализация Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('.glitch-wrapper').appendChild(renderer.domElement);

// Начальная позиция камеры
camera.position.z = 5;

// Глитч-эффект
window.addEventListener('load', function() {
    PowerGlitch.glitch('.glitch-wrapper', {
        playMode: 'always',
        hideOverflow: true,
        timing: {
            duration: 600,
            iterations: Infinity,
            easing: 'linear'
        },
        shake: {
            velocity: 15,
            amplitudeX: 0.005,
            amplitudeY: 0.005
        },
        slice: {
            count: 1,
            velocity: 1,
            minHeight: 0.002,
            maxHeight: 0.01,
            hueRotate: true
        },
        pulse: false
    });
});

// 25-й кадр
const frameConfig = {
    duration: 42,
    cooldown: 10000,
    triggerPoints: [0.2, 0.4, 0.6, 0.8],
    flashCount: 1,
    images: [
        'images/shot_01.png',
        'images/shot_02.png', 
        'images/shot_03.png'
    ]
};

let frameShown = false;
const container = document.getElementById('hidden-frames-container');

frameConfig.images.forEach(imgSrc => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.className = 'hidden-frame';
    img.alt = '25th Frame';
    container.appendChild(img);
});

const allFrames = document.querySelectorAll('.hidden-frame');

function showRandomFrame() {
    if (frameShown) return;
    
    frameShown = true;
    let flashes = 0;
    const randomIndex = Math.floor(Math.random() * allFrames.length);
    const frame = allFrames[randomIndex];
    
    const flashInterval = setInterval(() => {
        frame.classList.toggle('visible');
        flashes++;
        
        if (flashes >= frameConfig.flashCount * 2) {
            clearInterval(flashInterval);
            frame.classList.remove('visible');
            setTimeout(() => {
                frameShown = false;
            }, frameConfig.cooldown);
        }
    }, frameConfig.duration);
}

// VHS эффект
const vhsCanvas = document.createElement('canvas');
const vhsCtx = vhsCanvas.getContext('2d');
vhsCanvas.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s linear;
    mix-blend-mode: overlay;
`;
document.body.appendChild(vhsCanvas);

function resizeVHSCanvas() {
    vhsCanvas.width = window.innerWidth;
    vhsCanvas.height = window.innerHeight;
}

function drawVHSEffect(intensity) {
    vhsCtx.clearRect(0, 0, vhsCanvas.width, vhsCanvas.height);
    
    const imageData = vhsCtx.createImageData(vhsCanvas.width, vhsCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const val = Math.floor(Math.random() * 255 * intensity);
        imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = val;
        imageData.data[i + 3] = 255;
    }
    vhsCtx.putImageData(imageData, 0, 0);
    
    vhsCtx.strokeStyle = `rgba(255, 255, 255, ${0.1 * intensity})`;
    for (let y = 0; y < vhsCanvas.height; y += 3) {
        vhsCtx.beginPath();
        vhsCtx.moveTo(0, y);
        vhsCtx.lineTo(vhsCanvas.width, y);
        vhsCtx.stroke();
    }
}

let transitionTriggered = false;
const transitionThreshold = 0.8;

function startSceneTransition() {
    vhsCanvas.style.transition = 'opacity 2s linear';
    vhsCanvas.style.opacity = '1';
    vhsCanvas.style.background = 'black';
    const interval = setInterval(() => {
        drawVHSEffect(1);
    }, 50);
}

// Three.js модели
const loader = new THREE.GLTFLoader();
let tapeCover, tape;

// Состояния анимации
let isRotating = true;
let hasScrolled = false;
let targetRotation = { y: 0 };
const rotationSpeed = 0.25;
const initialScale = 1;
const maxScale = 2.5;

// Загрузка моделей
loader.load('models/cover.glb', (gltf) => {
    tapeCover = gltf.scene;
    tapeCover.scale.set(initialScale, initialScale, initialScale);
    scene.add(tapeCover);
});

loader.load('models/tape.glb', (gltf) => {
    tape = gltf.scene;
    tape.position.z = -0.5;
    tape.scale.set(initialScale, initialScale, initialScale);
    scene.add(tape);
});

// Единый обработчик скролла
window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(scrollY / maxScroll, 1);
    
    const firstRule = document.querySelector('.first-rule-is');
    const answerBtn = document.querySelector('.answer-button');

    if (scrollPercent > 0.05) {
        // Показываем элементы
        firstRule.style.opacity = '1';
        firstRule.style.pointerEvents = 'auto';

        answerBtn.style.opacity = '1';
        answerBtn.style.pointerEvents = 'auto';
    } else {
        // Скрываем элементы
        firstRule.style.opacity = '0';
        firstRule.style.pointerEvents = 'none';

        answerBtn.style.opacity = '0';
        answerBtn.style.pointerEvents = 'none';
    }
    
    // 25-й кадр
    frameConfig.triggerPoints.forEach(point => {
        const triggerPosition = point * maxScroll;
        if (!frameShown && scrollY > triggerPosition - 250 && scrollY < triggerPosition + 250) {
            showRandomFrame();
        }
    });
    
    // Three.js анимация
    if (tape && tapeCover) {
        // Плавный переход к фронтальному виду
        if (!hasScrolled && scrollY > 10) {
            isRotating = false;
            hasScrolled = true;
            targetRotation.y = 0;
        }
        
        // Эффект приближения
        const scaleFactor = initialScale + (maxScale - initialScale) * scrollPercent;
        tapeCover.scale.set(scaleFactor, scaleFactor, scaleFactor);
        tape.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Управление черным фоном
        const bgElement = document.querySelector('.tape-background');
        const bgOpacity = Math.pow(Math.max(0, (scrollPercent - 0.1) / 0.9), 0.5) * 1.9;
        bgElement.style.backgroundColor = `rgba(0, 0, 0, ${bgOpacity})`;
        
        // Разделение после 5% прокрутки
        if (scrollPercent > 0.05) {
            const progress = (scrollPercent - 0.05) / 0.95;
            tape.position.x = progress * 6 * scaleFactor;
            tapeCover.position.x = -progress * 4.5 * scaleFactor;
            tapeCover.rotation.x = 0;
            tapeCover.rotation.z = 0;
        }
    }
    
    // VHS эффект
    const intensity = Math.min(scrollPercent / transitionThreshold, 1);
    if (!transitionTriggered) {
        vhsCanvas.style.opacity = intensity;
        drawVHSEffect(intensity);
    }
    if (!transitionTriggered && scrollPercent > transitionThreshold) {
        transitionTriggered = true;
        startSceneTransition();
    }
});

// Анимация
function animate() {
    requestAnimationFrame(animate);
    
    if (isRotating && tapeCover && tape) {
        tapeCover.rotation.y += 0.025;
        tape.rotation.y += 0.025;
    } else if (tapeCover && tape) {
        tapeCover.rotation.y += (targetRotation.y - tapeCover.rotation.y) * rotationSpeed;
        tape.rotation.y += (targetRotation.y - tape.rotation.y) * rotationSpeed;
        
        if (Math.abs(tapeCover.rotation.y - targetRotation.y) < 0.001) {
            tapeCover.rotation.y = targetRotation.y;
            tape.rotation.y = targetRotation.y;
        }
    }
    
    renderer.render(scene, camera);
}

// Инициализация
resizeVHSCanvas();
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeVHSCanvas();
});

// Предзагрузка изображений для 25-го кадра
window.addEventListener('load', function() {
    allFrames.forEach(frame => {
        new Image().src = frame.src;
    });
});

animate();