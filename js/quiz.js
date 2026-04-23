// =========================================================
// 摄影教学系统 - 测验题库与逻辑控制
// =========================================================

const quizDatabase = {
    "optics": {
        tag: "镜头光学基础测验",
        questions: [
            { 
                q: "焦距越短（例如 16mm），镜头的视角会发生什么变化？", 
                options: ["视角越窄，能拍到很远的局部", "视角越广，能收纳更多的环境", "视角不变，但画质变差", "背景会被明显拉近放大"], 
                answer: 1, 
                info: "焦距与视角成反比。焦距数值越小，视角越大，适合拍摄大场景。" 
            },
            { 
                q: "想要拍摄出“背景被拉近且贴近主体”的空间压缩感，应该使用什么镜头？", 
                options: ["超广角镜头 (如 14mm)", "标准定焦镜头 (如 50mm)", "长焦镜头 (如 200mm)", "鱼眼镜头"], 
                answer: 2, 
                info: "长焦镜头不仅能“望远”，还会压缩画面前后的空间透视，让背景看起来离主体非常近。" 
            },
            { 
                q: "相比于可以缩放画面的变焦镜头，定焦镜头（如 50mm f/1.4）最大的优势通常是什么？", 
                options: ["通常拥有更大的最大光圈和更好的画质", "可以随时改变焦距抓拍", "防抖性能绝对比变焦镜头好", "景深永远都是最深的"], 
                answer: 0, 
                info: "定焦镜头内部光学镜片组结构相对简单，所以通常能做到非常大的光圈，且中心画质往往非常锐利。" 
            }
        ]
    },
    "aperture": {
        tag: "光圈控制测验",
        questions: [
            { 
                q: "关于光圈的 F 数值，以下说法正确的是？", 
                options: ["F值越大，光圈孔径越大，进光量越多", "F值越小，光圈孔径越大，进光量越多", "F值大小只影响颜色，不影响亮度", "F值越小，快门速度就会变得越慢"], 
                answer: 1, 
                info: "F值是焦距与光圈直径的比值。因此 F2.8 的光圈开孔比 F8 要大得多，进光量也更多。" 
            },
            { 
                q: "想要拍摄出背景模糊、主体突出的唯美人像（浅景深），你应该如何设置？", 
                options: ["设置一个小光圈，如 f/16", "调高 ISO 感光度", "设置一个大光圈，如 f/1.8", "使用广角镜头并离人物很远"], 
                answer: 2, 
                info: "大光圈可以显著减小景深，从而让焦外背景产生虚化效果，从而突出主体。" 
            },
            { 
                q: "在拍摄壮丽的自然风光时，为了让距离相机近的石头和远处的雪山都保持清晰，通常会使用：", 
                options: ["极大的光圈 (如 f/1.4)", "小光圈 (如 f/8 到 f/11)", "最快的快门速度", "最高的 ISO 感光度"], 
                answer: 1, 
                info: "缩小光圈能扩大景深范围，使画面从前到后都能清晰成像。" 
            }
        ]
    },
    "shutter": {
        tag: "快门控制测验",
        questions: [
            { 
                q: "在体育摄影中，为了瞬间定格运动员奔跑的清晰动作，你需要怎样的快门速度？", 
                options: ["高速快门 (如 1/1000s)", "慢速快门 (如 1/10s)", "长曝光 (如 5秒)", "快门速度无关紧要，只要光圈大就行"], 
                answer: 0, 
                info: "高速运动的物体需要极快的快门速度来“凝固”瞬间，否则会出现明显的拖影。" 
            },
            { 
                q: "如果在夜晚拍摄马路上的车流，想要拍出一条条红白色“车轨”的流线效果，应该使用：", 
                options: ["1/4000s 的极速快门", "大光圈配合 1/60s 快门", "慢速快门 (长曝光，如 3 到 5 秒)", "调高 ISO 并使用闪光灯"], 
                answer: 2, 
                info: "长曝光（慢门）可以持续记录发光物体在一段时间内的移动轨迹，常用于车轨、星轨或丝滑的水流拍摄。" 
            },
            { 
                q: "手持相机拍摄时，为了防止手抖导致画面模糊，通常有一个“安全快门”的法则，它是指：", 
                options: ["快门速度不能慢于 1/60s", "快门速度应不慢于镜头焦距的倒数 (如 50mm 镜头配 1/50s)", "快门速度必须等于 ISO 的数值", "只要光圈足够小，快门多慢都不会手抖"], 
                answer: 1, 
                info: "安全快门法则建议：快门速度的底线应是焦距的倒数（如200mm镜头，手持快门最好快于 1/200s）。" 
            }
        ]
    },
    "iso": {
        tag: "感光度 (ISO) 测验",
        questions: [
            { 
                q: "在相机的曝光三要素中，ISO 感光度主要代表什么？", 
                options: ["镜头允许光线通过的孔径大小", "快门帘幕打开的时间长短", "图像传感器对光线的敏感程度", "照片的色彩饱和度"], 
                answer: 2, 
                info: "ISO 决定了传感器对光的敏感度。" 
            },
            { 
                q: "在光线极暗的室内，你被迫大幅度提高 ISO（例如开到 ISO 6400），这会给画面带来什么副作用？", 
                options: ["景深会变得非常浅", "画面中会出现大量的彩色噪点和颗粒感，画质下降", "背景会被明显压缩", "快门速度会强制变慢"], 
                answer: 1, 
                info: "提高 ISO 会放大电信号，但同时也会把干扰信号一起放大，表现为噪点密集、色彩变差。" 
            },
            { 
                q: "在阳光明媚的户外拍摄风景时，为了获得最纯净、细腻的画质，通常应该如何设置 ISO？", 
                options: ["设置在 ISO 3200 左右", "设置在相机的原生最低 ISO (通常为 100 或 200)", "开启自动 ISO 不加限制", "越高越好，能防手抖"], 
                answer: 1, 
                info: "在光线充足的环境下，应尽量使用基础 ISO（如 100），此时传感器的信噪比最高，能呈现最干净的画面细节。" 
            }
        ]
    },
    "reciprocity": {
        tag: "曝光互易律测验",
        questions: [
            { 
                q: "“曝光互易律”的核心概念是指：", 
                options: ["光圈和快门的数值必须一致", "只要总曝光量相同，三要素（光圈、快门、ISO）可以互相等效替换", "ISO 是无法和其他参数互换的", "光圈越大，照片必定越亮，无法改变"], 
                answer: 1, 
                info: "互易律意味着曝光是一场“拆东墙补西墙”的平衡游戏。比如光圈缩小一档导致的进光减少，可以通过将快门放慢一档来完全补偿。" 
            },
            { 
                q: "场景测试：目前画面曝光准确（参数为 f/2.8，1/1000s）。如果此时你想增加景深，把光圈缩小两档到了 f/5.6，为了保持画面亮度不变，快门应该调到多少？", 
                options: ["1/2000s", "1/1000s", "1/250s", "1/60s"], 
                answer: 2, 
                info: "光圈从 f/2.8 缩小到 f/5.6 是缩小了两档（进光量变为 1/4）。为了维持曝光，快门时间需要延长四倍，即从 1/1000 变为 1/250s。" 
            },
            { 
                q: "你正在拍摄夜景，为了减少噪点，你决定把 ISO 从 1600 降低到 400（降低两档）。为了让画面不变成死黑，你可以怎么做？", 
                options: ["把快门速度变快两档", "把快门时间延长两档（变慢）", "把光圈缩小两档", "同时把光圈和快门都变快一档"], 
                answer: 1, 
                info: "ISO 降低两档导致画面变暗，必须通过增加两档进光量来补偿，放慢两档快门或开大两档光圈都可以做到。" 
            }
        ]
    },
    "histogram": {
        tag: "曝光直方图测验",
        questions: [
            { 
                q: "在观察相机直方图时，它的横轴从左到右代表什么信息？", 
                options: ["从画面的左边到右边", "从冷色调到暖色调", "从最暗的阴影到最亮的高光", "从画面模糊到锐利"], 
                answer: 2, 
                info: "直方图是像素亮度的统计图。横轴最左边代表纯黑（暗部），中间是中间调，最右边代表纯白（高光）。" 
            },
            { 
                q: "如果一张照片拍完后，你发现直方图的“山峰”大量堆积在最左侧，甚至紧紧贴着左边缘，这说明什么？", 
                options: ["照片严重过曝（死白）", "照片曝光严重不足，暗部丢失了细节（死黑）", "这说明是一张完美的黑白照片", "说明背景虚化很好"], 
                answer: 1, 
                info: "左侧贴边意味着有大量像素变成了没有信息的纯黑（欠曝），这些死黑区域在后期软件里通常很难拉回细节。" 
            },
            { 
                q: "摄影界常说的“向右曝光（ETTR）”技巧，主要是为了什么目的？", 
                options: ["让直方图彻底贴住右边，越白越好", "把拍摄主体放在画面的右侧（三分法）", "在不过曝的前提下，尽量让直方图靠右，以获得更好的信噪比和更少的暗部噪点", "为了让快门速度更快"], 
                answer: 2, 
                info: "向右曝光是在保留高光细节（不贴右墙）的前提下，尽可能多地收集光信号。这样在后期压暗画面时，能有效隐藏噪点，获得极佳画质。" 
            }
        ]
    }
};

// =========================================================
// UI 交互与逻辑控制模块
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. 获取 URL 参数中的知识点 key
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic') || 'aperture'; // 默认 fallback 到光圈
    
    // 如果 URL 里传了一个乱码或者不存在的 key，默认加载光学基础
    const data = quizDatabase[topic] || quizDatabase['optics'];
    
    let currentIdx = 0;
    let score = 0;
    
    // 获取所需 DOM 节点
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const categoryTag = document.getElementById('categoryTag');
    const questionText = document.getElementById('questionText');
    const optionsList = document.getElementById('optionsList');
    const feedbackPanel = document.getElementById('feedbackPanel');
    const feedbackText = document.getElementById('feedbackText');
    const nextBtn = document.getElementById('nextBtn');
    
    const quizCard = document.getElementById('quizCard');
    const resultCard = document.getElementById('resultCard');
    
    // 核心函数：渲染当前题目
    const updateUI = () => {
        const qData = data.questions[currentIdx];
        
        // 更新进度条和题目标签
        progressText.textContent = `${currentIdx + 1} / ${data.questions.length}`;
        progressBar.style.width = `${((currentIdx) / data.questions.length) * 100}%`;
        categoryTag.textContent = data.tag;
        questionText.textContent = qData.q;
        
        // 清空上一题的选项并重新渲染
        optionsList.innerHTML = '';
        qData.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`; // 添加 A. B. C. D. 前缀
            
            // 绑定点击事件
            btn.onclick = () => selectOption(i, btn);
            optionsList.appendChild(btn);
        });
        
        // 隐藏反馈面板
        feedbackPanel.style.display = 'none';
    };
    
    // 核心函数：处理选项点击
    const selectOption = (idx, selectedBtn) => {
        const qData = data.questions[currentIdx];
        const allBtns = document.querySelectorAll('.option-btn');
        
        // 点击后立即锁定所有按钮，防止重复点击刷分
        allBtns.forEach(btn => {
            btn.onclick = null;
            btn.style.cursor = 'default';
        });
        
        // 判定对错并添加对应的 CSS 类名
        if(idx === qData.answer) {
            selectedBtn.classList.add('correct');
            // 动态计算单题分值 (保证满分100)
            score += Math.round(100 / data.questions.length);
            feedbackText.innerHTML = `<strong>回答正确！</strong> ${qData.info}`;
        } else {
            selectedBtn.classList.add('wrong');
            allBtns[qData.answer].classList.add('correct'); // 把正确答案高亮出来给用户看
            feedbackText.innerHTML = `<strong>回答错误。</strong> ${qData.info}`;
        }
        
        // 显示底部的解析面板
        feedbackPanel.style.display = 'flex';
        
        // 如果是最后一题，把按钮文字改成“查看成绩”
        if (currentIdx === data.questions.length - 1) {
            nextBtn.textContent = "查看成绩";
        }
    };
    
    // 绑定下一题按钮
    nextBtn.onclick = () => {
        currentIdx++;
        if(currentIdx < data.questions.length) {
            updateUI(); // 加载下一题
        } else {
            // 所有题目答完，显示结算页面
            quizCard.style.display = 'none';
            resultCard.style.display = 'block';
            
            // 确保满分精准为 100
            const finalScore = score >= 99 ? 100 : score;
            document.getElementById('finalScore').textContent = finalScore;
            progressBar.style.width = '100%';
            
            // 根据分数给出不同评价
            const resultDesc = document.getElementById('resultDesc');
            if (finalScore === 100) {
                resultDesc.textContent = "太完美了！你已经完全掌握了本章的核心逻辑。";
            } else if (finalScore >= 60) {
                resultDesc.textContent = "表现不错，但还有提升空间。可以在实操中加深理解。";
            } else {
                resultDesc.textContent = "看来这部分理论有些烧脑，建议返回理论库再复习一下哦。";
            }
        }
    };
    
    // 初始化启动第一题
    updateUI();
});