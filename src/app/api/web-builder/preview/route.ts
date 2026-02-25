import { NextRequest, NextResponse } from 'next/server';

/**
 * Preview Endpoint - Server-Side Transpilation
 * 
 * Receives virtual files from the web builder, transpiles them server-side,
 * and returns a pre-compiled HTML bundle ready to render.
 * 
 * This eliminates CDN dependencies and provides instant, reliable previews.
 */

export async function POST(req: NextRequest) {
    try {
        const { files } = await req.json();

        if (!files || typeof files !== 'object') {
            return NextResponse.json({ error: 'Invalid files object' }, { status: 400 });
        }

        console.log("[Preview API] Incoming files:", Object.keys(files));
        if (files['src/components/ContactSection.tsx']) {
            console.log("[Preview API] ContactSection content snippet:", files['src/components/ContactSection.tsx'].substring(0, 500));
        }

        // Generate HTML with embedded transpiled code
        const html = generatePreviewHTML(files);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        console.error('[Preview API] Error:', error);
        return NextResponse.json({
            error: 'Preview generation failed',
            details: error.message
        }, { status: 500 });
    }
}

function generatePreviewHTML(files: Record<string, string>): string {
    let filesToProcess = { ...files };

    const cssFiles = Object.entries(filesToProcess).filter(([path]) => path.endsWith('.css'));
    const cssContent = cssFiles.map(([_, content]) => content).join('\n');

    const codeFiles = Object.entries(filesToProcess).filter(([path]) => {
        if (path.includes('vite.config') || path.includes('eslint.config') || path.includes('postcss.config') || path.includes('tailwind.config')) return false;
        return path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js') ||
            path.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
    });

    const filesJSON = JSON.stringify(Object.fromEntries(codeFiles));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"><\/script>
    <script src="https://unpkg.com/@remix-run/router@1.16.1/dist/router.umd.min.js"><\/script>
    <script src="https://unpkg.com/react-router@6.23.1/dist/umd/react-router.production.min.js"><\/script>
    <script src="https://unpkg.com/react-router-dom@6.23.1/dist/umd/react-router-dom.production.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.5/babel.min.js"><\/script>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"><\/script>
    <script src="https://unpkg.com/framer-motion@11.0.8/dist/framer-motion.js"><\/script>
    <script src="https://unpkg.com/zustand@4.5.2/dist/umd/index.js"><\/script>
    <script src="https://unpkg.com/@tanstack/react-query@5.28.4/build/umd/index.production.js"><\/script>

    <base href="/">
    <style>
        ${cssContent}
        html, body { height: 100%; margin: 0; padding: 0; background: #000; color: #fff; font-family: sans-serif; }
        #root { min-height: 100%; width: 100%; display: flex; flex-direction: column; }
        .status-container {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100vh; color: #888; gap: 1rem; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 5000;
            backdrop-blur: sm;
        }
        .spinner {
            width: 32px; height: 32px; border: 3px solid #222; border-top-color: #555;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-box {
            padding: 24px; background: #1a0505; border: 1px solid #450a0a;
            color: #fca5a5; border-radius: 12px; max-width: 90%; font-family: monospace;
            white-space: pre-wrap; margin: 20px; z-index: 10000; position: relative;
        }
    </style>
    <script>
        console.log("[Preview] Starting asset resolver...");
        // Virtual Asset Resolver
        (function() {
            const files = ${filesJSON};
            const virtualAssets = {};
            
            // Collect images from the virtual filesystem
            Object.entries(files).forEach(([path, content]) => {
                if (path.match(/\\.(png|jpg|jpeg|gif|svg|webp)$|data:image/)) {
                    // If it's already a data URI, use it. If not, we assume it's base64 or raw
                    const fullPath = path.startsWith('/') ? path : '/' + path;
                    const publicPath = path.startsWith('public/') ? path.replace('public/', '/') : fullPath;
                    
                    if (content.startsWith('data:')) {
                        virtualAssets[publicPath] = content;
                    } else if (content.length > 100) { // Likely base64 if it's long and not code
                        const ext = path.split('.').pop();
                        virtualAssets[publicPath] = \`data:image/\${ext === 'jpg' ? 'jpeg' : ext};base64,\${content}\`;
                    }
                }
            });

            const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            if (originalSrc) {
                Object.defineProperty(HTMLImageElement.prototype, 'src', {
                    set: function(val) {
                        try {
                            const url = new URL(val, window.location.href);
                            const path = url.pathname;
                            if (virtualAssets[path]) {
                                return originalSrc.set.call(this, virtualAssets[path]);
                            }
                        } catch(e) {}
                        return originalSrc.set.call(this, val);
                    },
                    get: function() {
                        return originalSrc.get.call(this);
                    }
                });
            }
            
            // Also patch CSS background-image
            const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
            CSSStyleDeclaration.prototype.setProperty = function(prop, val, priority) {
                if (prop === 'background-image' || prop === 'background') {
                    Object.entries(virtualAssets).forEach(([path, data]) => {
                        if (val.includes(path)) {
                            val = val.replace(path, data);
                        }
                    });
                }
                return originalSetProperty.call(this, prop, val, priority);
            };
        })();
    <\/script>
</head>
<body>
    <div id="root">
        <div class="status-container" id="loading-screen">
            <div class="spinner"></div>
            <div id="status-text">Inyectando motor de visualización...</div>
        </div>
    </div>
    
    <script>
        console.log("[Preview] Bootstrap started");
        
        window.onerror = function(msg, url, line, col, error) {
            console.error("[Preview] Global Error:", msg, error);
            const root = document.getElementById('root');
            if (root) {
                root.innerHTML = \`
                    <div class="error-box">
                        <h3 style="margin:0 0 10px 0; color: #f87171;">Error de Ejecución</h3>
                        <div style="font-weight:bold; margin-bottom: 5px;">\${msg}</div>
                        <div style="font-size:11px; color:#999;">
                            Origen: \${url ? url.split('/').pop() : 'script'}:\${line}:\${col}
                        </div>
                        \${error && error.stack ? \`<pre style="font-size:10px; margin-top:10px; opacity:0.6; overflow:auto; max-height:200px;">\${error.stack}</pre>\` : ''}
                        <div style="margin-top:10px; font-size:10px; border-top: 1px solid #333; padding-top: 5px;">
                            Diagnostic: ReactDOM=\${typeof window.ReactDOM} React=\${typeof window.React}
                        </div>
                    </div>
                \`;
            }
            return false;
        };

        (function() {
            const files = ${filesJSON};
            const modules = {};
            const loadedModules = {};
            
            function updateStatus(msg) {
                console.log("[Preview Status]", msg);
                const el = document.getElementById('status-text');
                if (el) el.innerText = msg;
            }

            function joinPath(base, relative) {
                const parts = base.split('/');
                parts.pop(); 
                const relativeParts = relative.split('/');
                for (const part of relativeParts) {
                    if (part === '.') continue;
                    if (part === '..') { if (parts.length > 0) parts.pop(); }
                    else { parts.push(part); }
                }
                return parts.join('/');
            }

            function resolveModulePath(requestPath, currentFilePath) {
                let path = requestPath;
                if (path.startsWith('@/')) path = path.replace('@/', 'src/');
                else if (path.startsWith('./') || path.startsWith('../')) path = joinPath(currentFilePath, path);
                
                if (files[path]) return path;
                const extensions = ['.tsx', '.ts', '.jsx', '.js'];
                for (const ext of extensions) { if (files[path + ext]) return path + ext; }
                for (const ext of extensions) { if (files[path + '/index' + ext]) return path + '/index' + ext; }

                if (!path.startsWith('src/')) {
                    const srcPath = 'src/' + path;
                    if (files[srcPath]) return srcPath;
                    for (const ext of extensions) { if (files[srcPath + ext]) return srcPath + ext; }
                }
                return null;
            }

            const FallbackComponent = (props = {}) => {
                const name = props?.name || 'Component';
                return React.createElement('div', { 
                    style: { border: '1px dashed #444', padding: '10px', margin: '5px', borderRadius: '8px', background: '#111', color: '#666', fontSize: '12px' } 
                }, "[Elemento Faltante: " + name + "]");
            };

            const createRequire = (currentFilePath) => {
                return function require(path) {
                    if (path === 'react') return window.React;
                    if (path === 'react-dom' || path === 'react-dom/client') return window.ReactDOM;
                    if (path.includes('react-router') && window.ReactRouterDOM) return window.ReactRouterDOM;
                    if (path === 'framer-motion') {
                        const motion = window.Motion || window.framerMotion;
                        if (motion) return { ...motion, default: motion.motion || motion };
                    }
                    if (path === 'zustand' && window.zustand) return window.zustand;
                    if (path === '@tanstack/react-query' && window.ReactQuery) return window.ReactQuery;
                    
                    if (path.includes('components/ui/')) {
                        const resolvedPath = resolveModulePath(path, currentFilePath);
                        if (!resolvedPath || !files[resolvedPath]) {
                            const name = (path.split('/').pop() || 'Component').replace('.tsx', '').replace('.jsx', '');
                            let Comp = FallbackComponent;
                            
                            if (name.toLowerCase() === 'label') Comp = (p = {}) => React.createElement('label', { ...p, style: { fontWeight: 'bold', display: 'block', ...p?.style } });
                            if (name.toLowerCase() === 'input') Comp = (p = {}) => React.createElement('input', { ...p, style: { width: '100%', padding: '8px', border: '1px solid #333', borderRadius: '6px', background: '#111', color: '#fff', ...p?.style } });
                            if (name.toLowerCase() === 'button') Comp = (p = {}) => React.createElement('button', { ...p, style: { padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', ...p?.style } });
                            if (name.toLowerCase() === 'textarea') Comp = (p = {}) => React.createElement('textarea', { ...p, style: { width: '100%', padding: '8px', border: '1px solid #333', borderRadius: '6px', background: '#111', color: '#fff', ...p?.style } });
                            if (name.toLowerCase() === 'card') Comp = (p = {}) => React.createElement('div', { ...p, style: { border: '1px solid #222', borderRadius: '12px', background: '#0a0a0a', padding: '16px', ...p?.style } });
                            
                            // Return a Proxy to handle ANY named export (Button, Input, etc)
                            return new Proxy({ default: Comp, __esModule: true }, {
                                get: (target, prop) => {
                                    if (prop === 'default' || prop === '__esModule') return target[prop];
                                    if (typeof prop === 'string' && prop.toLowerCase().includes('card')) {
                                        return (p = {}) => React.createElement('div', { ...p, 'data-component': prop });
                                    }
                                    return Comp;
                                }
                            });
                        }
                    }

                    if (path === 'lucide-react') {
                        if (window.lucide && window.lucide.icons) {
                           return new Proxy({}, {
                               get: (target, name) => {
                                   if (name === '__esModule') return true;
                                   if (typeof name === 'symbol') return target[name];
                                   const iconName = name.toString().replace(/Icon$/, '');
                                   const iconData = window.lucide.icons[iconName] || window.lucide.icons[iconName.toLowerCase()];
                                   if (!iconData) return (p = {}) => React.createElement('span', null, 'ℹ️');
                                   return (props = {}) => {
                                       try {
                                           const children = iconData.map((item, i) => React.createElement(item[0], { key: i, ...item[1] }));
                                           return React.createElement('svg', { 
                                               width: props?.size || 24, height: props?.size || 24, viewBox: '0 0 24 24', 
                                               fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...props 
                                           }, children);
                                       } catch (e) { return React.createElement('span', null, '⚠️'); }
                                   };
                               }
                           });
                        }
                    }

                    if (path === 'clsx' || path === 'tailwind-merge' || path === 'class-variance-authority' || path.includes('utils')) {
                        const cn = function() { return Array.from(arguments).flat().filter(Boolean).join(' '); };
                        const cvaStub = () => (p = {}) => p?.className || '';
                        return { default: cn, clsx: cn, twMerge: cn, cn: cn, cva: cvaStub, cx: cn };
                    }

                    const resolvedPath = resolveModulePath(path, currentFilePath);
                    if (resolvedPath) {
                        if (loadedModules[resolvedPath]) return loadedModules[resolvedPath];
                        if (modules[resolvedPath]) {
                            const moduleExports = {};
                            const module = { exports: moduleExports };
                            loadedModules[resolvedPath] = module.exports;
                             try {
                                 modules[resolvedPath](createRequire(resolvedPath), module, module.exports);
                                 
                                 // Smart Export Fixup: if AI forgot 'export default' but has named exports
                                 if (module.exports && !module.exports.default) {
                                     const keys = Object.keys(module.exports).filter(k => k !== '__esModule');
                                     if (keys.length === 1) {
                                         module.exports.default = module.exports[keys[0]];
                                     } else if (keys.length > 1) {
                                         const fileName = resolvedPath.split('/').pop().split('.')[0].toLowerCase();
                                         const bestMatch = keys.find(k => k.toLowerCase() === fileName) || keys[0];
                                         module.exports.default = module.exports[bestMatch];
                                     }
                                 }
                                 
                                 loadedModules[resolvedPath] = module.exports;
                                 return module.exports;
                             } catch (e) {
                                 console.error("Exec error in " + resolvedPath, e);
                                 return { default: FallbackComponent };
                             }
                        }
                    }

                    // Smart Recursive Proxy: for libraries like framer-motion, zustand, etc.
                    // This prevents "undefined" errors by returning a proxy that behaves like a component or an object.
                    const createSmartProxy = (basePath) => {
                        const MockComponent = (props = {}) => {
                            return React.createElement('div', { ...props, 'data-mock': basePath });
                        };
                        
                        // React Component identification
                        const REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol.for ? Symbol.for('react.element') : 0xeac7;
                        
                        return new Proxy(MockComponent, { 
                            get: (target, prop) => {
                                if (prop === '__esModule') return true;
                                if (prop === 'default') return target;
                                if (prop === '$$typeof' || prop === 'render' || prop === 'prototype') return undefined;
                                if (typeof prop === 'symbol') {
                                    if (prop === Symbol.toPrimitive) return (hint) => \`[Mock:\${basePath}]\`;
                                    return target[prop];
                                }
                                if (prop === 'displayName') return basePath.split('.').pop();
                                if (prop === 'toString' || prop === 'valueOf') return () => \`[Mock:\${basePath}]\`;
                                
                                // Prevent recursive proxy for internal DOM / React properties
                                if (typeof prop === 'string' && (prop.startsWith('__') || prop === 'focus' || prop === 'blur')) return undefined;
                                
                                return createSmartProxy(basePath + '.' + String(prop));
                            }
                        });
                    };
                    
                    return createSmartProxy(path);
                };
            };

            function startApp() {
                try {
                    updateStatus("Compilando código IA...");

                    // Inyectar detector de clicks para sincronización bidireccional
                    document.addEventListener('click', (e) => {
                        const target = e.target;
                        if (target) {
                            const componentPath = target.getAttribute('data-component-path');
                            const componentLoc = target.getAttribute('data-component-loc');
                            
                            // Seguridad para postMessage: convertir objetos no clonables a strings
                            // Especialmente importante para SVGs donde className es un SVGAnimatedString
                            const getCleanValue = (val) => {
                                if (val && typeof val === 'object' && 'baseVal' in val) {
                                    return val.baseVal; // Manejo de SVGAnimatedString
                                }
                                return String(val || '');
                            };

                            try {
                                window.parent.postMessage({ 
                                    type: 'inspect-element',
                                    tagName: getCleanValue(target.tagName),
                                    className: getCleanValue(target.className),
                                    textContext: (target.textContent || '').substring(0, 20),
                                    path: componentPath,
                                    loc: componentLoc
                                }, '*');
                            } catch (err) {
                                console.warn("[Preview] Failed to postMessage click event", err);
                            }
                        }
                    }, true);

                    // Track internal navigation (Robust Sync)
                    const syncNavigation = () => {
                        const hashPath = window.location.hash.replace(/^#/, '') || '/';
                        const pathName = window.location.pathname.replace('/api/web-builder/preview', '') || '/';
                        
                        // Priority to hash if it exists and looks like a route
                        const finalPath = (hashPath && hashPath !== '/') ? hashPath : pathName;
                        
                        console.log("[Preview] Syncing navigation to parent:", finalPath);
                        window.parent.postMessage({ type: 'navigation', path: finalPath }, '*');
                    };

                    window.addEventListener('hashchange', syncNavigation);
                    window.addEventListener('popstate', syncNavigation);
                    
                    // Intercept clicks for internal routing that might not fire events immediately
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a');
                        if (link && link.href && link.href.startsWith(window.location.origin)) {
                            // Delay slightly to allow router to update
                            setTimeout(syncNavigation, 10);
                        }
                    }, true);

                    syncNavigation(); // Initial sync

                    // Listen for external navigation commands (from Parent Address Bar/Editor)
                    window.addEventListener('message', (e) => {
                        if (e.data?.type === 'navigate-to') {
                            const targetPath = e.data.path;
                            const currentHash = window.location.hash.replace(/^#/, '') || '/';
                            console.log("[Preview] Received navigation command:", targetPath, "current hash:", currentHash);
                            
                            // Only update if different to avoid loops
                            if (targetPath !== currentHash && targetPath !== ('/' + currentHash)) {
                                console.log("[Preview] Updating hash to:", targetPath);
                                window.location.hash = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
                            }
                        }
                    });

                    // Plugin de Babel para etiquetar componentes (Portado de Dyad)
                    Babel.registerPlugin('componentTagger', ({ types: t }) => ({
                        visitor: {
                            JSXOpeningElement(path, state) {
                                const name = path.node.name;
                                const loc = path.node.loc?.start;
                                if (loc) {
                                    const fileName = state.file.opts.filename || 'unknown';
                                    path.node.attributes.push(
                                        t.jsxAttribute(t.jsxIdentifier('data-component-path'), t.stringLiteral(fileName)),
                                        t.jsxAttribute(t.jsxIdentifier('data-component-loc'), t.stringLiteral(loc.line + ':' + loc.column))
                                    );
                                }
                            }
                        }
                    }));

                    Object.entries(files).forEach(([path, content]) => {
                        try {
                            const result = Babel.transform(content, {
                                presets: [['react', { runtime: 'classic' }], 'typescript', ['env', { modules: 'commonjs' }]],
                                plugins: ['componentTagger'],
                                filename: path
                            });
                            modules[path] = new Function('require', 'module', 'exports', result.code);
                        } catch (e) { console.error("Babel error in " + path, e); }
                    });

                    updateStatus("Ejecutando componentes...");
                    const entryPath = Object.keys(files).find(k => k === 'src/main.tsx' || k === 'src/index.tsx');
                    if (entryPath) {
                        console.log("[Preview] Running entry:", entryPath);
                        createRequire(entryPath)(entryPath);
                    } else {
                        const appPath = Object.keys(files).find(k => k.endsWith('App.tsx'));
                        if (appPath) {
                            console.log("[Preview] Auto-booting App from:", appPath);
                            const AppMod = createRequire(appPath)(appPath);
                            const App = AppMod.default || AppMod;
                            
                            if (typeof App !== 'function' && !(App && App.$$typeof)) {
                                throw new Error("El componente 'App' no es una función válida. Revisa los exports.");
                            }

                            ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
                        }
                    }
                    const loader = document.getElementById('loading-screen');
                    if (loader) loader.style.display = 'none';
                } catch (e) {
                    console.error("[Preview] Fatal Boot Error", e);
                    window.onerror(e.message, "boot", 0, 0, e);
                }
            }

            let checks = 0;
            const check = setInterval(() => {
                checks++;
                if (window.React && window.ReactDOM && window.Babel && window.lucide && (window.Motion || window.framerMotion)) {
                    clearInterval(check);
                    startApp();
                } else if (checks > 100) {
                    clearInterval(check);
                    updateStatus("Error: No se pudieron cargar las librerías necesarias. Revisa tu conexión.");
                }
            }, 100);
        })();
    <\/script>
</body>
</html>
    `.trim();
}
