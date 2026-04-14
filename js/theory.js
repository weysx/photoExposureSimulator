document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".sub-item");
    const contentTitle = document.getElementById("contentTitle");
    const contentBody = document.getElementById("contentBody");

    // 默认加载光圈内容
    fetchData("optics");

    // 绑定菜单点击
    menuItems.forEach(item => {
        item.addEventListener("click", function() {
            menuItems.forEach(i => i.classList.remove("active"));
            this.classList.add("active");

            const key = this.getAttribute("data-key");
            fetchData(key);
        });
    });

    // 从 Java 后端获取数据
    async function fetchData(key) {
        contentBody.style.opacity = "0.5"; // 切换时的视觉反馈
        
        try {
            // 注意：地址必须与你 Java 运行的地址一致
            const response = await fetch(`http://localhost:8080/api/article/${key}`);
            if (!response.ok) throw new Error("后端连接失败");
            
            const data = await response.json();
            
            // 渲染数据
            contentTitle.textContent = data.title;
            contentBody.innerHTML = data.content;
            contentBody.style.opacity = "1";
            
        } catch (error) {
            console.error("Fetch Error:", error);
            contentTitle.textContent = "服务未启动";
            contentBody.innerHTML = "<p style='color:red;'>无法获取内容。请确保后端项目已 Run, 且 MySQL 正常运行。</p>";
        }
    }
});