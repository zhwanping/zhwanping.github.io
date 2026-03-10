/**
 * 核心功能：页面滚动与导航交互
 * 使用 IIFE 防止全局变量污染 (window.scrollToSection 除外)
 */
(function() {
    'use strict';

    // 配置常量
    const SCROLL_OFFSET_MOBILE = 80;
    const SCROLL_OFFSET_DESKTOP = 40;
    const BREAKPOINT_LG = 1024;

    // 【新增】：用来锁定 Scroll Spy（滚动监听）的状态变量
    let isManualScrolling = false;
    let manualScrollTimer = null;

    /**
     * 辅助函数：切换移动端菜单状态
     * @param {boolean} shouldOpen - true 打开, false 关闭
     */
    function toggleMobileMenuLogic(shouldOpen) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const bars = toggleBtn ? toggleBtn.querySelectorAll('.bar') : [];

        if (!sidebar || !overlay) return;

        if (shouldOpen) {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
            bars.forEach(bar => bar.classList.add('active'));
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
            bars.forEach(bar => bar.classList.remove('active'));
        }
    }

    /**
     * 辅助函数：更新侧边栏高亮状态
     * @param {string} id - 当前激活的 Section ID
     */
    function highlightNav(id) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const dataId = item.getAttribute('data-id');
            if (dataId === id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * 全局函数：滚动到指定区域
     * 暴露给 HTML onclick 使用
     * @param {string} id - 目标 Section ID
     */
    window.scrollToSection = function(id) {
        const element = document.getElementById(id);
        if (!element) return;

        // 【新增】：开启点击滚动锁，并立即高亮目标导航
        isManualScrolling = true;
        highlightNav(id);

        const isMobile = window.innerWidth < BREAKPOINT_LG;
        const offset = isMobile ? SCROLL_OFFSET_MOBILE : SCROLL_OFFSET_DESKTOP;

        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;

        // Hero 区域特殊处理：总是滚到绝对顶部
        const offsetPosition = id === 'hero' ? 0 : elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // 移动端：点击后自动收起菜单
        const sidebar = document.getElementById('sidebar');
        if (isMobile && sidebar && sidebar.classList.contains('open')) {
            toggleMobileMenuLogic(false);
        }
    };

    /**
     * DOM 加载后初始化事件监听
     */
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('mobile-menu-toggle');

        // 1. 移动端菜单事件绑定
        function handleMenuToggle() {
            if (!sidebar) return;
            const isOpen = sidebar.classList.contains('open');
            toggleMobileMenuLogic(!isOpen);
        }

        if (toggleBtn) toggleBtn.addEventListener('click', handleMenuToggle);
        if (overlay) overlay.addEventListener('click', handleMenuToggle);

        // 2. Scroll Spy (滚动监听)
        const observerOptions = {
            root: null,
            // 视口中上部触发，体验更符合直觉
            rootMargin: '-30% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            // 【新增】：如果正在进行点击跳转的滚动，忽略中途的触发
            if (isManualScrolling) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    highlightNav(entry.target.id);
                }
            });
        }, observerOptions);

        // 监听所有内容区块
        document.querySelectorAll('.scroll-spy-section').forEach(section => {
            observer.observe(section);
        });

        // 3. 回到顶部时清除高亮 (添加了节流优化) + 滚动结束解锁机制
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = requestAnimationFrame(() => {
                    if (window.scrollY < 200) {
                        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                    }
                    scrollTimeout = null;
                });
            }

            // 【新增】：利用防抖机制，检测平滑滚动是否结束，结束则解锁
            if (isManualScrolling) {
                clearTimeout(manualScrollTimer);
                manualScrollTimer = setTimeout(() => {
                    isManualScrolling = false;
                }, 100); // 只要页面停顿超过 100ms，就认为滚动结束了，解开状态锁
            }
        }, { passive: true });

        // 4. 视频性能优化：按需播放 (Intersection Observer)
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            // 设置观察器：当视频有 10% 进入屏幕时触发
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 进入视口，开始播放
                        entry.target.play().catch(err => console.log("视频自动播放被拦截:", err));
                    } else {
                        // 离开视口，暂停播放以释放内存
                        entry.target.pause();
                    }
                });
            }, { rootMargin: '50px', threshold: 0.1 });

            videos.forEach(video => {
                videoObserver.observe(video);
            });
        }

    });

})();