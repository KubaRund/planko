import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'.',testMatch:'ui.spec.mjs',workers:1,timeout:60000,expect:{timeout:10000},
  outputDir:'../test-results',reporter:'list',
  use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',headless:true,viewport:{width:393,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:1,screenshot:'only-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
  webServer:{command:'node tests/serve.mjs',cwd:new URL('..',import.meta.url).pathname,port:4173,timeout:30000,reuseExistingServer:false}
});
