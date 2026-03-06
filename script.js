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

        // 立即手动高亮（提升响应速度，不用等 Observer 回调）
        highlightNav(id);
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

        // 3. 回到顶部时清除高亮 (Hero区域逻辑)
        window.addEventListener('scroll', () => {
            if (window.scrollY < 200) {
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            }
        }, { passive: true });
    });

})();