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
bgImg.src = './background.jpg'; //背景

const fgImg = new Image();
fgImg.src = './front.png'; //前景

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