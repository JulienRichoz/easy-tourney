if(!self.define){let e,s={};const n=(n,l)=>(n=new URL(n+".js",l).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(l,r)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let o={};const u=e=>n(e,i),f={module:{uri:i},exports:o,require:u};s[i]=Promise.all(l.map((e=>f[e]||u(e)))).then((e=>(r(...e),o)))}}define(["./workbox-74076051"],(function(e){"use strict";e.setCacheNameDetails({prefix:"frontend"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/css/app.e3803d86.css",revision:null},{url:"/css/chunk-vendors.a142d91f.css",revision:null},{url:"/fonts/fa-brands-400.86ee2658.woff2",revision:null},{url:"/fonts/fa-brands-400.8eaf0c88.ttf",revision:null},{url:"/fonts/fa-regular-400.849b82e2.woff2",revision:null},{url:"/fonts/fa-regular-400.bd1cf947.ttf",revision:null},{url:"/fonts/fa-solid-900.7a5aa5ab.ttf",revision:null},{url:"/fonts/fa-solid-900.ee698398.woff2",revision:null},{url:"/fonts/fa-v4compatibility.c63df8a6.ttf",revision:null},{url:"/index.html",revision:"fcbb7b8aa1938fba01c0f1acc83b512e"},{url:"/js/24.16f174f9.js",revision:null},{url:"/js/249.fba376ac.js",revision:null},{url:"/js/481.12194024.js",revision:null},{url:"/js/71.bfd53214.js",revision:null},{url:"/js/8.02116c4a.js",revision:null},{url:"/js/app.49f00883.js",revision:null},{url:"/js/chunk-vendors.8b76fcb5.js",revision:null},{url:"/manifest.json",revision:"a85a41f21e60d8191430c03dedef6df6"},{url:"/robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{}),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/index.html"))),e.registerRoute(/^https:\/\/easy-tourney-backend-6cdfc7a64550.herokuapp.com\/api/,new e.NetworkFirst({cacheName:"api-cache",networkTimeoutSeconds:10,plugins:[new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")}));
//# sourceMappingURL=service-worker.js.map
