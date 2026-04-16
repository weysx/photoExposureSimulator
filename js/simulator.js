const canvas = document.getElementById('photoCanvas') || document.getElementById('bgCanvas'); //主画面
const ctx = canvas.getContext('2d');
const histCanvas = document.getElementById('histogramCanvas'); //直方图画布
const histCtx = histCanvas.getContext('2d');

//曝光三要素档位
//光圈
const apertures = [2.8, 5.6, 8, 11, 16, 22];
const blurRadii = [8, 4, 2, 1, 0, 0]; // 为每个光圈值映射一个模糊半径（像素）

//快门速度
const shutters = [1/2500, 1/1250, 1/1000, 1/600, 1/500, 1/400, 1/300, 1/200, 1/100, 1/80, 1/60];
const shutterLabels = ["1/2500", "1/1250", "1/1000", "1/600", "1/500", "1/400", "1/300", "1/200", "1/100", "1/80", "1/60"];

//iso
const isos = [100, 200, 400, 800, 1600, 3200, 6400];

const baseAperture = 8;
const baseShutter = 1/125;
const baseIso = 100;

// 性能优化：预计算 Gamma 解码查找表 (LUT)
const gammaDecodeLUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
    gammaDecodeLUT[i] = Math.pow(i / 255.0, 2.2);
}


//画面加载
const bgImg = new Image();
bgImg.src = '../img/background.jpg'; //背景

const fgImg = new Image();
fgImg.src = '../img/front.jpg'; //前景

let imagesLoaded = 0; //全局计数器，记录目前有几张图片已经成功加载

//确保两张图片都加载完毕后再启动模拟器
bgImg.onload = checkLoad;
fgImg.onload = checkLoad;

function checkLoad() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        // 如果HTML中没有设定canvas的尺寸，这里强制设定
        if(canvas.width === 300) {
             canvas.width = 800;
             canvas.height = 500;
        }
        updateExposure(); // 初始化渲染
    }
}

//三要素滑块监听
const apSlider = document.getElementById('apertureSlider');
const shSlider = document.getElementById('shutterSlider');
const isoSlider = document.getElementById('isoSlider');
//发生任何修改，触发重新渲染
[apSlider, shSlider, isoSlider].forEach(slider => {
    slider.addEventListener('input', updateExposure);
});


//*核心算法：电影级ACES色调映射拟合函数
function acesFilm(x) {
    x = Math.max(0, x);
    const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

//渲染主引擎
function updateExposure() {
    //获取滑块对应的物理参数
    const fIndex = parseInt(apSlider.value, 10);
    const f = apertures[fIndex];
    const blurAmount = blurRadii[fIndex]; 

    const t = shutters[parseInt(shSlider.value, 10)]; 
    const iso = isos[parseInt(isoSlider.value, 10)];  

    // 更新界面文字
    document.getElementById('apertureVal').textContent = 'f/' + f;
    document.getElementById('shutterVal').textContent = shutterLabels[parseInt(shSlider.value, 10)]; 
    document.getElementById('isoVal').textContent = iso;
 
    // ---------------------------------------------------------
    // 第一步：光学成像模拟 (处理景深)
    // ---------------------------------------------------------
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `blur(${blurAmount}px)`; //虚化效果
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); //制造虚化背景

    ctx.filter = 'none'; //去虚化
    const fgWidth = 350;
    const fgHeight = 350 * (fgImg.height / fgImg.width);
    ctx.drawImage(fgImg, (canvas.width - fgWidth) / 2, canvas.height - fgHeight - 20, fgWidth, fgHeight); //前景绘制

    // ---------------------------------------------------------
    // 第二步：电子传感器模拟 (提取合成后的像素，处理曝光和噪点)
    // ---------------------------------------------------------
    let imgData;
    let data;
    try {
        imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        data = imgData.data;
    } catch (error) {
        console.error("跨域拦截报错：", error);
        alert("提取像素失败！请务必使用服务器运行本项目！");
        return; 
    }

    //*核心算法：曝光值EV差量计算
    const evA = 2 * Math.log2(baseAperture / f); //光圈曝光差
    const evT = Math.log2(t / baseShutter); //快门曝光差
    const evS = Math.log2(iso / baseIso); //iso曝光差
    const deltaEV = evA + evT + evS; //总曝光差
    const multiplier = Math.pow(2, deltaEV); //EV值对应像素处理倍数
    
    //*核心算法：基于ISET物理模型的噪声参数计算
    const analogGain = iso / 100; //模拟增益
    //调整噪声基础强度 (因为现在计算是在 0.0-1.0 的线性空间)
    const darkNoiseBase = analogGain * 0.005; //暗电流噪声
    const shotNoiseBase = Math.sqrt(analogGain) * 0.01; //散粒噪声

    for (let i = 0; i < data.length; i += 4) {
        //跳过透明像素（Alpha透明度通道），防止透明背景变成黑色或白色块
        if (data[i+3] === 0) continue; 

        //*核心算法：解除原图自带的Gamma压缩，还原出真实世界的“线性光子能量”（利用 LUT 极速解除原图自带的Gamma压缩）
        let r = gammaDecodeLUT[data[i]];
        let g = gammaDecodeLUT[data[i+1]];
        let b = gammaDecodeLUT[data[i+2]];

        //应用基础曝光亮度 (此时值可能会超过1.0，代表真实世界的高光)
        r *= multiplier;
        g *= multiplier;
        b *= multiplier;

        //应用噪声算法（在iso>100时）
        if (analogGain > 1) {
            let noiseR = (Math.random() - 0.5) * darkNoiseBase + (Math.random() - 0.5) * shotNoiseBase * Math.sqrt(Math.max(0, r));
            let noiseG = (Math.random() - 0.5) * darkNoiseBase + (Math.random() - 0.5) * shotNoiseBase * Math.sqrt(Math.max(0, g));
            let noiseB = (Math.random() - 0.5) * darkNoiseBase + (Math.random() - 0.5) * shotNoiseBase * Math.sqrt(Math.max(0, b));

            r += noiseR;
            g += noiseG;
            b += noiseB;
        }

        //*核心算法：色调映射（将超亮的高光柔和地压回0.0-1.0，防止死白）
        r = acesFilm(r);
        g = acesFilm(g);
        b = acesFilm(b);

        //*核心算法：重新加上 Gamma 校正 (匹配普通显示器的 2.2Gamma，还原暗部细节)
        r = Math.pow(r, 1.0 / 2.2);
        g = Math.pow(g, 1.0 / 2.2);
        b = Math.pow(b, 1.0 / 2.2);

        // 重新量化回 0-255 并写入数据
        data[i] = Math.min(255, Math.max(0, r * 255));
        data[i+1] = Math.min(255, Math.max(0, g * 255));
        data[i+2] = Math.min(255, Math.max(0, b * 255));
    }
    
    ctx.putImageData(imgData, 0, 0);

    // ---------------------------------------------------------
    // 第三步：数据可视化 (更新直方图)
    // ---------------------------------------------------------
    drawHistogram(imgData.data);
}

//曝光直方图绘制
function drawHistogram(pixelData) {
    const hist = new Array(256).fill(0); //准备256个统计桶
    for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i+1];
        const b = pixelData[i+2];
        let luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b); //色彩空间公式 Rec.601亮度方程，模拟不同颜色对人眼亮度的“贡献权重”
        luminance = Math.min(255, Math.max(0, luminance));
        hist[luminance]++;
    }

    const maxCount = Math.max(...hist);
    histCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);
    histCtx.fillStyle = 'rgba(236, 240, 241, 0.8)';

    for (let i = 0; i < 256; i++) {
        const height = (hist[i] / maxCount) * histCanvas.height;
        histCtx.fillRect(i, histCanvas.height - height, 1, height);
    }
}

// =========================================================
// 相机 HUD 屏幕 UI 系统 (独立图层以保证性能)
// =========================================================

// 1. 动态创建 UI 覆盖层 Canvas
const container = document.querySelector('.canvas-container');
const uiCanvas = document.createElement('canvas');
uiCanvas.id = 'cameraUICanvas';
uiCanvas.style.position = 'absolute';
uiCanvas.style.top = '0';
uiCanvas.style.left = '0';
uiCanvas.style.width = '100%';
uiCanvas.style.height = '100%';
uiCanvas.style.pointerEvents = 'auto'; 
uiCanvas.style.cursor = 'crosshair'; // 变为准星鼠标
container.appendChild(uiCanvas);

const uiCtx = uiCanvas.getContext('2d');

// 同步画布尺寸
function resizeUI() {
    uiCanvas.width = canvas.width || 800;
    uiCanvas.height = canvas.height || 500;
    drawCameraUI();
}

// 2. 对焦状态变量
let focusX = 400; 
let focusY = 250;
let focusProgress = 1; 
let isFocusing = false;
let focusTimer = null;


// 3. 绘制相机的 UI 界面
function drawCameraUI() {
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

    // 获取当前曝光参数
    const fIndex = parseInt(apSlider.value, 10);
    const f = apertures[fIndex];
    const t = shutters[parseInt(shSlider.value, 10)];
    const tLabel = shutterLabels[parseInt(shSlider.value, 10)];
    const iso = isos[parseInt(isoSlider.value, 10)];

    const cx = uiCanvas.width / 2;
    const cy = uiCanvas.height / 2;

    // --- A. 绘制九宫格与中心十字/测光圆 ---
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    uiCtx.lineWidth = 1;

    // 九宫格
    const w3 = uiCanvas.width / 3;
    const h3 = uiCanvas.height / 3;
    uiCtx.beginPath();
    uiCtx.moveTo(w3, 0); uiCtx.lineTo(w3, uiCanvas.height);
    uiCtx.moveTo(w3 * 2, 0); uiCtx.lineTo(w3 * 2, uiCanvas.height);
    uiCtx.moveTo(0, h3); uiCtx.lineTo(uiCanvas.width, h3);
    uiCtx.moveTo(0, h3 * 2); uiCtx.lineTo(uiCanvas.width, h3 * 2);
    uiCtx.stroke();

    // 中央点测光圆圈 (新增)
    // uiCtx.beginPath();
    // uiCtx.arc(cx, cy, 24, 0, Math.PI * 2);
    // uiCtx.stroke();

    // 左右水平辅助线
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    uiCtx.beginPath();
    uiCtx.moveTo(cx - 200, cy); uiCtx.lineTo(cx - 50, cy);
    uiCtx.moveTo(cx + 50, cy); uiCtx.lineTo(cx + 200, cy);
    uiCtx.stroke();

    // 中心微型十字准星
    uiCtx.beginPath();
    uiCtx.moveTo(cx, cy - 10); uiCtx.lineTo(cx, cy + 10);
    uiCtx.moveTo(cx - 10, cy); uiCtx.lineTo(cx + 10, cy);
    uiCtx.stroke();

    // --- B. 绘制顶部状态栏 (新增专业元素) ---
    uiCtx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // 顶部半透明渐变或背景栏
    uiCtx.fillRect(0, 0, uiCanvas.width, 36);

    uiCtx.font = 'bold 16px "SF Pro Display", sans-serif';
    uiCtx.fillStyle = '#FFFFFF';
    uiCtx.textAlign = 'left';
    uiCtx.textBaseline = 'middle';
    
    // 左上角状态
    uiCtx.fillText('M', 20, 18); // 手动模式
    uiCtx.font = '14px "SF Pro Display", sans-serif';
    uiCtx.fillText('AWB', 50, 18); // 自动白平衡
    uiCtx.fillText('AF-S', 100, 18); // 单次对焦
    
    // 右上角状态
    uiCtx.textAlign = 'right';
    uiCtx.fillText('RAW+J', uiCanvas.width - 90, 18); // 照片格式
    uiCtx.fillText('[999]', uiCanvas.width - 45, 18); // 剩余张数
    // 简易电池图标
    uiCtx.strokeStyle = '#FFFFFF';
    uiCtx.strokeRect(uiCanvas.width - 35, 12, 20, 10);
    uiCtx.fillRect(uiCanvas.width - 33, 14, 16, 6);
    uiCtx.fillRect(uiCanvas.width - 15, 15, 2, 4);

    // --- C. 绘制底部曝光参数栏 ---
    uiCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    // 将高度减小到 36，让灰条变窄
    uiCtx.fillRect(0, uiCanvas.height - 36, uiCanvas.width, 36); 

    uiCtx.font = '16px "SF Pro Display", sans-serif';
    uiCtx.fillStyle = '#ffffff'; 
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    
    // 文字的高度也跟着调整到灰条中心
    const textY = uiCanvas.height - 18; 
    // 测光表变长了，为了防止拥挤，把 F 和 ISO 稍微再往两边推一点 (从200改成260)
    uiCtx.fillText(`F${f}`, cx - 260, textY); 
    uiCtx.fillText(`${tLabel}s`, cx, textY);
    uiCtx.fillText(`ISO ${iso}`, cx + 260, textY);

    // --- D. 绘制曝光指示表 EV Meter (核心专业感) ---
    // 计算当前的真实曝光差值 (复用你底层的逻辑)
    const evA = 2 * Math.log2(baseAperture / f); 
    const evT = Math.log2(t / baseShutter); 
    const evS = Math.log2(iso / baseIso); 
    let deltaEV = evA + evT + evS;
    // 限制在 -3 到 +3 之间显示
    const displayEV = Math.max(-3, Math.min(3, deltaEV)); 

    const meterWidth = 200;
    const meterStartX = cx - meterWidth / 2;
    const meterY = uiCanvas.height - 40; // 放置在参数上方一点

    uiCtx.strokeStyle = '#FFFFFF';
    uiCtx.fillStyle = '#FFFFFF';
    uiCtx.lineWidth = 1;
    uiCtx.font = '10px sans-serif';

    // 绘制刻度线
    for (let i = -3; i <= 3; i++) {
        const x = meterStartX + (i + 3) * (meterWidth / 6);
        const tickHeight = (i === 0) ? 8 : (i % 1 === 0 ? 5 : 3); // 0刻度最长
        
        uiCtx.beginPath();
        uiCtx.moveTo(x, meterY);
        uiCtx.lineTo(x, meterY - tickHeight);
        uiCtx.stroke();

        // 标出数字 -3, 0, +3
        if (i === -3 || i === 0 || i === 3) {
            let label = i > 0 ? `+${i}` : i;
            uiCtx.fillText(label, x, meterY - 12);
        }
    }
    
    // 绘制当前 EV 所在的动态指针 (小倒三角)
    const pointerX = meterStartX + (displayEV + 3) * (meterWidth / 6);
    uiCtx.fillStyle = (Math.abs(deltaEV) > 2) ? '#FF4444' : '#00FF00'; // 曝光严重不足/过度时变红
    uiCtx.beginPath();
    uiCtx.moveTo(pointerX, meterY + 2);
    uiCtx.lineTo(pointerX - 4, meterY + 8);
    uiCtx.lineTo(pointerX + 4, meterY + 8);
    uiCtx.fill();


    // --- E. 绘制动态对焦框 ---
    const boxSize = 80 - (focusProgress * 40); 
    uiCtx.lineWidth = 2;
    uiCtx.strokeStyle = isFocusing ? '#FFFFFF' : '#00FF00'; 

    const halfBox = boxSize / 2;
    const corner = 12; 

    uiCtx.beginPath();
    uiCtx.moveTo(focusX - halfBox, focusY - halfBox + corner);
    uiCtx.lineTo(focusX - halfBox, focusY - halfBox);
    uiCtx.lineTo(focusX - halfBox + corner, focusY - halfBox);
    uiCtx.moveTo(focusX + halfBox - corner, focusY - halfBox);
    uiCtx.lineTo(focusX + halfBox, focusY - halfBox);
    uiCtx.lineTo(focusX + halfBox, focusY - halfBox + corner);
    uiCtx.moveTo(focusX + halfBox, focusY + halfBox - corner);
    uiCtx.lineTo(focusX + halfBox, focusY + halfBox);
    uiCtx.lineTo(focusX + halfBox - corner, focusY + halfBox);
    uiCtx.moveTo(focusX - halfBox + corner, focusY + halfBox);
    uiCtx.lineTo(focusX - halfBox, focusY + halfBox);
    uiCtx.lineTo(focusX - halfBox, focusY + halfBox - corner);
    uiCtx.stroke();
    
    if (isFocusing) {
        requestAnimationFrame(drawCameraUI);
    }
}

// 4. 处理鼠标点击对焦交互
uiCanvas.addEventListener('mousedown', (e) => {
    const rect = uiCanvas.getBoundingClientRect();
    const scaleX = uiCanvas.width / rect.width;
    const scaleY = uiCanvas.height / rect.height;
    
    focusX = (e.clientX - rect.left) * scaleX;
    focusY = (e.clientY - rect.top) * scaleY;
    
    startFocusAnimation();
});

function startFocusAnimation() {
    if (focusTimer) clearInterval(focusTimer);
    isFocusing = true;
    focusProgress = 0; 
    
    focusTimer = setInterval(() => {
        focusProgress += 0.1;
        if (focusProgress >= 1) {
            focusProgress = 1;
            isFocusing = false;
            clearInterval(focusTimer);
            drawCameraUI(); 
        }
    }, 30);
    
    drawCameraUI(); 
}

// 5. 参数同步：直接将 UI 绘制函数绑定到滑块事件上
[apSlider, shSlider, isoSlider].forEach(slider => {
    slider.addEventListener('input', drawCameraUI);
});

// 监听窗口缩放防错位
window.addEventListener('resize', resizeUI);
// 初始化时等待原画布加载完成再对齐尺寸
setTimeout(resizeUI, 500);