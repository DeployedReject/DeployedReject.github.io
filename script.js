document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('actionBtn');
    const glow = document.getElementById('glow');

    if (btn) {
        // Button click interaction
        btn.addEventListener('click', () => {
            btn.textContent = 'Clicked! 🎉';
            btn.style.background = 'linear-gradient(135deg, #10b981, #3b82f6)';
            
            setTimeout(() => {
                btn.textContent = 'Click Me';
                btn.style.background = '';
            }, 2000);
        });
    }

    if (glow) {
        // Dynamic background glow following mouse
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            
            // Calculate center-relative coordinates
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            const offsetX = (x - centerX) * 0.1;
            const offsetY = (y - centerY) * 0.1;

            // Use requestAnimationFrame for smoother performance
            requestAnimationFrame(() => {
                glow.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            });
        });
    }
});
