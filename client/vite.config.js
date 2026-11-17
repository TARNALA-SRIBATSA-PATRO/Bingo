import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Duplicates every `@media (max-width: Npx)` block as rules scoped under
// `html.phone-N`, so the app can switch to the phone layout by class when a
// phone browser in "Desktop site" mode ignores the viewport meta.
// See src/utils/phoneLayout.js.
const phoneClassMedia = {
  postcssPlugin: 'phone-class-media',
  Once(root) {
    root.walkAtRules('media', (atRule) => {
      const m = /^\(max-width:\s*(\d+)px\)$/.exec(atRule.params.trim());
      if (!m) return;
      const cls = `html.phone-${m[1]}`;
      const clones = [];
      atRule.each((child) => {
        if (child.type !== 'rule') return;
        const clone = child.clone();
        clone.selectors = clone.selectors.map((sel) => {
          const s = sel.trim();
          if (s === 'html' || s === ':root') return cls;
          if (s.startsWith('html') || s.startsWith(':root')) return s.replace(/^(html|:root)/, cls);
          return `${cls} ${s}`;
        });
        clones.push(clone);
      });
      if (clones.length) atRule.after(clones);
    });
  }
};

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: { plugins: [phoneClassMedia] }
  },
  define: {
    __APP_VERSION__: JSON.stringify('2.6.3'),
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now().toString()),
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
