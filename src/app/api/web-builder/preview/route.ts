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
    // --- Smart Patching: DISABLED (Conflicts with ai/route.ts self-healing) ---
    let filesToProcess = { ...files };
    /*
    try {
        const entryPath = Object.keys(files).find(k => k === 'src/main.tsx' || k === 'src/index.tsx');
        const usesRouter = Object.values(files).some(content =>
            content.includes('react-router-dom') ||
            content.includes('Routes') ||
            content.includes('Route')
        );

        if (entryPath && usesRouter) {
            const entryContent = files[entryPath];
            const hasRouter = entryContent.includes('BrowserRouter') ||
                entryContent.includes('HashRouter') ||
                entryContent.includes('RouterProvider');

            if (!hasRouter) {
                console.log('[Preview] Auto-patching entry point with BrowserRouter');
                let newContent = entryContent.replace('import React from', 'import { BrowserRouter } from "react-router-dom";\nimport React from');
                if (newContent.includes('<App')) {
                    newContent = newContent.replace(/<App\s*\/?>/g, '<BrowserRouter><App /></BrowserRouter>');
                } else if (newContent.includes('<React.StrictMode>')) {
                    newContent = newContent.replace('<React.StrictMode>', '<React.StrictMode><BrowserRouter>');
                    newContent = newContent.replace('</React.StrictMode>', '</BrowserRouter></React.StrictMode>');
                }
                filesToProcess[entryPath] = newContent;
            }
        }
    } catch (e) {
        console.warn('[Preview] Auto-patch failed, using original files', e);
    }
    */

    // Extract CSS
    const cssFiles = Object.entries(filesToProcess).filter(([path]) => path.endsWith('.css'));
    const cssContent = cssFiles.map(([_, content]) => content).join('\n');

    // Extract and prepare TypeScript/TSX files
    const codeFiles = Object.entries(filesToProcess).filter(([path]) => {
        // Exclude config files that shouldn't run in browser
        if (path.includes('vite.config') ||
            path.includes('eslint.config') ||
            path.includes('postcss.config') ||
            path.includes('tailwind.config')) {
            return false;
        }

        return path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js');
    });

    const filesJSON = JSON.stringify(Object.fromEntries(codeFiles));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    
    <!-- React & ReactDOM (UMD) -->
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
    
    <!-- React Router DOM (UMD) - Bundles history & react-router -->
    <script crossorigin src="https://unpkg.com/@remix-run/router@1.16.1/dist/router.umd.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-router@6.23.1/dist/umd/react-router.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-router-dom@6.23.1/dist/umd/react-router-dom.production.min.js"></script>
    
    <!-- Babel Standalone -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.5/babel.min.js"></script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Lucide Icons - Base package (exposes window.lucide) -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <script>
        // Create React component wrappers for lucide icons
        (function() {
            if (!window.lucide || !window.React) {
                console.error('[Preview] Lucide or React not loaded');
                window.lucideReact = {};
                return;
            }
            
            window.lucideReact = {};
            
            // Get all icon names from lucide.icons
            const iconNames = Object.keys(window.lucide.icons || {});
            
            // Create a React component for each icon
            iconNames.forEach(function(iconName) {
                window.lucideReact[iconName] = function(props) {
                    props = props || {};
                    
                    // Get the icon data for this icon
                    const iconData = window.lucide.icons[iconName];
                    if (!iconData || !Array.isArray(iconData)) {
                        console.warn('[Preview] Icon data not found or invalid for:', iconName);
                        return window.React.createElement('span', { style: { color: 'red' } }, '?');
                    }
                    
                    // Lucide icon data format: [['tag', { attrs }], ['tag', { attrs }], ...]
                    // Create child elements from the icon data
                    const children = iconData.map(function(item, index) {
                        if (!Array.isArray(item) || item.length < 2) {
                            return null;
                        }
                        
                        const tagName = item[0];
                        const attributes = item[1] || {};
                        
                        // Create the element with its attributes
                        return window.React.createElement(tagName, {
                            key: index,
                            ...attributes
                        });
                    }).filter(Boolean);
                    
                    // Create SVG element with the icon's children
                    return window.React.createElement(
                        'svg',
                        {
                            xmlns: 'http://www.w3.org/2000/svg',
                            width: props.width || props.size || 24,
                            height: props.height || props.size || 24,
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            stroke: props.color || 'currentColor',
                            strokeWidth: props.strokeWidth || 2,
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            className: props.className || '',
                            style: props.style
                        },
                        children
                    );
                };
            });
            
            console.log('[Preview] Created ' + iconNames.length + ' lucide-react icon components');
        })();
    </script>
    
    <!-- Custom Styles -->
    <style>
        ${cssContent}
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: sans-serif; }
        #root { min-height: 100vh; }
        .status-container {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100vh; color: #888; gap: 1rem;
        }
        .spinner {
            width: 24px; height: 24px; border: 2px solid #333; border-top-color: #fff;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-box {
            padding: 24px; background: #1a0505; border: 1px solid #450a0a;
            color: #fca5a5; border-radius: 12px; max-width: 90%; font-family: monospace;
            white-space: pre-wrap; margin: 20px;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="status-container">
            <div class="spinner"></div>
            <div id="status-text">Loading libraries...</div>
        </div>
    </div>
    
    <script>
        // Global Error Handler
        window.onerror = function(msg, url, line, col, error) {
            document.getElementById('root').innerHTML = \`
                <div class="error-box">
                    <h3 style="margin-top:0">Runtime Error</h3>
                    <div>\${msg}</div>
                    <div style="font-size:12px; opacity:0.7; margin-top:8px">
                        \${url ? url.split('/').pop() : 'script'}:\${line}:\${col}
                    </div>
                </div>
            \`;
            return false;
        };

        (function() {
            const files = ${filesJSON};
            const modules = {};
            const loadedModules = {};
            
            function updateStatus(msg) {
                const el = document.getElementById('status-text');
                if (el) el.innerText = msg;
            }

            // --- Helper: Path Join & Normalize ---
            function joinPath(base, relative) {
                const parts = base.split('/');
                parts.pop(); // Remove filename
                const relativeParts = relative.split('/');
                for (const part of relativeParts) {
                    if (part === '.') continue;
                    if (part === '..') { if (parts.length > 0) parts.pop(); }
                    else { parts.push(part); }
                }
                return parts.join('/');
            }

            // --- Robust Module Resolution ---
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

            // --- Fallback Component for Missing Imports ---
            const FallbackComponent = ({ children, ...props }) => {
                console.warn('Rendering FallbackComponent due to missing module/export');
                return window.React.createElement(
                    'div', 
                    { style: { border: '1px dashed red', padding: '4px', display: 'inline-block', color: 'red' }, title: 'Missing Component' }, 
                    '?' + (children || '')
                );
            };

            const createRequire = (currentFilePath) => {
                return function require(path) {
                    // Global Dependencies
                    if (path === 'react') return window.React;
                    if (path === 'react-dom' || path === 'react-dom/client') return window.ReactDOM;
                    if (path === 'react-router-dom') return window.ReactRouterDOM;
                    if (path === 'react-router') return window.ReactRouterDOM;
                    
                    // History module - provide complete mock
                    if (path === 'history') {
                        return {
                            createBrowserHistory: function() {
                                return {
                                    push: function() {},
                                    replace: function() {},
                                    go: function() {},
                                    goBack: function() {},
                                    goForward: function() {},
                                    listen: function() { return function() {}; },
                                    location: { pathname: '/', search: '', hash: '', state: null }
                                };
                            },
                            createHashHistory: function() {
                                return {
                                    push: function() {},
                                    replace: function() {},
                                    go: function() {},
                                    goBack: function() {},
                                    goForward: function() {},
                                    listen: function() { return function() {}; },
                                    location: { pathname: '/', search: '', hash: '', state: null }
                                };
                            }
                        };
                    }
                    
                    // Lucide React - Use CDN library if available, otherwise fallback
                    if (path === 'lucide-react') {
                        // Check if CDN loaded successfully
                        if (window.lucideReact && Object.keys(window.lucideReact).length > 0) {
                            console.log('[Preview] Using lucide-react from CDN');
                            return window.lucideReact;
                        }
                        if (window.lucide && Object.keys(window.lucide).length > 0) {
                            console.log('[Preview] Using lucide from CDN');
                            return window.lucide;
                        }
                        
                        console.warn('[Preview] Lucide library not available, using FallbackComponent for icons');
                        
                        return new Proxy({}, {
                            get: function(target, prop) {
                                if (prop === '__esModule') return true;
                                if (prop === 'default') return FallbackComponent;
                                // Return FallbackComponent for ANY icon request
                                return FallbackComponent;
                            }
                        });
                    }
                    
                    // Framer Motion
                    if (path === 'framer-motion') {
                        return {
                            motion: new Proxy({}, {
                                get: function() {
                                    return function(props) {
                                        return window.React.createElement('div', props);
                                    };
                                }
                            }),
                            AnimatePresence: function(props) {
                                return props.children;
                            }
                        };
                    }
                    
                    // CSS utilities & Variants
                    if (path === 'clsx' || path === 'classnames' || path === 'tailwind-merge' || path === 'class-variance-authority') {
                        const cnFn = function() {
                            return Array.from(arguments).flat().filter(Boolean).join(' ');
                        };
                        
                        if (path === 'class-variance-authority') {
                            return {
                                cva: function(base, config) {
                                    return function(props) {
                                        let classes = base || '';
                                        if (config && config.variants && props) {
                                            Object.keys(config.variants).forEach(key => {
                                                const val = props[key] || config.defaultVariants?.[key];
                                                if (val && config.variants[key][val]) {
                                                    classes += ' ' + config.variants[key][val];
                                                }
                                            });
                                        }
                                        if (props && props.className) classes += ' ' + props.className;
                                        return classes;
                                    };
                                },
                                cx: cnFn
                            };
                        }

                        return {
                            default: cnFn,
                            clsx: cnFn,
                            twMerge: cnFn,
                            cn: cnFn
                        };
                    }

                    // Try to resolve local modules
                    const resolvedPath = resolveModulePath(path, currentFilePath);
                    if (resolvedPath) {
                        if (loadedModules[resolvedPath]) return loadedModules[resolvedPath];
                        if (modules[resolvedPath]) {
                             const moduleExports = {};
                             const module = { exports: moduleExports };
                             loadedModules[resolvedPath] = moduleExports;
                             try {
                                 modules[resolvedPath](createRequire(resolvedPath), module, moduleExports);
                                 loadedModules[resolvedPath] = module.exports;
                                 return module.exports;
                             } catch (e) {
                                 console.error('[Preview] Error executing module ' + resolvedPath, e);
                                 // Return Proxy with FallbackComponent on execution error
                                 return new Proxy({}, {
                                     get: function(target, prop) {
                                         if (prop === '__esModule') return true;
                                         if (prop === 'default') return FallbackComponent;
                                         return FallbackComponent;
                                     }
                                 });
                             }
                         }
                    }
                    
                    console.warn('[Preview] Module not resolved: ' + path + ' (from ' + currentFilePath + ')');
                    
                    // Return Proxy that provides FallbackComponent for any property access
                    return new Proxy({}, {
                        get: function(target, prop) {
                            if (prop === '__esModule') return true;
                            if (prop === 'default') return FallbackComponent;
                            // Return FallbackComponent for any property (like icon names)
                            return FallbackComponent;
                        }
                    });
                };
            };
            
            function loadModules() {
                updateStatus('Transpiling components...');
                const root = document.getElementById('root');
                
                try {
                    // 1. Transpile
                    Object.entries(files).forEach(([path, content]) => {
                        const result = Babel.transform(content, {
                            presets: [
                                ['react', { runtime: 'classic' }],
                                'typescript',
                                ['env', { modules: 'commonjs' }]
                            ],
                            filename: path
                        });
                        modules[path] = new Function('require', 'module', 'exports', result.code);
                    });
                    
                    // 2. Pre-load
                    updateStatus('Linking modules...');
                    Object.keys(modules).forEach(path => {
                        if (!loadedModules[path]) {
                            const moduleExports = {};
                            const module = { exports: moduleExports };
                            loadedModules[path] = moduleExports;
                            modules[path](createRequire(path), module, moduleExports);
                            loadedModules[path] = module.exports;
                        }
                    });
                    
                    // 3. Render
                    updateStatus('Starting app...');
                    const entryPath = Object.keys(files).find(k => k === 'src/main.tsx' || k === 'src/index.tsx');
                    
                    if (entryPath) {
                        return; // main.tsx execution (in step 2) should have mounted the app
                    }
                    
                    // Fallback mount
                    const appPath = Object.keys(files).find(k => k.endsWith('App.tsx'));
                    if (appPath) {
                         const App = loadedModules[appPath].default || loadedModules[appPath];
                         const reactRoot = ReactDOM.createRoot(root);
                         
                         const usesRouter = Object.values(files).some(c => c.includes('react-router-dom'));
                         if (usesRouter && window.ReactRouterDOM) {
                             const { BrowserRouter } = window.ReactRouterDOM;
                             reactRoot.render(React.createElement(BrowserRouter, null, React.createElement(App)));
                         } else {
                             reactRoot.render(React.createElement(App));
                         }
                    } else {
                        throw new Error('No entry point found (src/main.tsx or App.tsx)');
                    }
                    
                } catch (error) {
                    console.error('Preview error:', error);
                    root.innerHTML = \`<div class="error-box"><h3>Preview Error</h3><div>\${error.message}</div></div>\`;
                }
            }
            
            // Wait for libs
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                checkCount++;
                if (window.React && window.ReactDOM && window.Babel && window.ReactRouterDOM) {
                    clearInterval(checkInterval);
                    loadModules();
                } else if (checkCount > 100) {
                    clearInterval(checkInterval);
                    const missing = [];
                    if (!window.React) missing.push('React');
                    if (!window.ReactDOM) missing.push('ReactDOM');
                    if (!window.Babel) missing.push('Babel');
                    if (!window.ReactRouterDOM) missing.push('ReactRouterDOM');
                    
                    document.getElementById('root').innerHTML = \`
                        <div class="error-box">
                            <h3>Connection Timeout</h3>
                            <div>Failed to load libraries: \${missing.join(', ')}</div>
                            <div style="font-size:12px;margin-top:10px">Check internet connection.</div>
                        </div>\`;
                }
            }, 100);
        })();
    </script>
</body>
</html>
    `.trim();
}
