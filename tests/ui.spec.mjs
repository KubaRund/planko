import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test('mobile studio: precision preview, explicit placement, camera, catalogue and persistence',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await expect(page.locator('#viewport canvas')).toBeVisible();await expect(page.locator('#count')).toHaveText('0 / 180');
  const canvas=page.locator('#viewport canvas'),box=await canvas.boundingBox();
  await canvas.tap({position:{x:box.width*.48,y:box.height*.62}});await expect(page.locator('#count')).toHaveText('0 / 180');
  await page.locator('#precisionToggle').click();await expect(page.locator('#precisionPad')).toBeVisible();
  await page.locator('[data-nudge="left"]').click();await page.locator('#rotateRight').click();await expect(page.locator('#angle')).toHaveText('15°');
  await page.locator('#place').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  await expect(page.locator('#physicsStatus')).toContainText('Stavba v klidu',{timeout:15000});
  await page.locator('[data-mode="camera"]').click();await expect(page.locator('#placeLabel')).toHaveText('ZPĚT KE STAVĚNÍ');
  await canvas.tap({position:{x:box.width*.55,y:box.height*.55}});await expect(page.locator('#count')).toHaveText('1 / 180');
  await page.locator('#place').click();await expect(page.locator('#placeLabel')).toHaveText('POLOŽIT');
  await page.locator('#catalog').click();await expect(page.locator('[data-challenge]')).toHaveCount(10);
  const catalogImage=testInfo.outputPath('challenge-catalog.jpg');fs.mkdirSync(path.dirname(catalogImage),{recursive:true});await page.screenshot({path:catalogImage,type:'jpeg',quality:85});
  await page.locator('[data-challenge="bridge"]').click();await expect(page.locator('#objectiveTitle')).toHaveText('Most přes propast');await expect(page.locator('#count')).toHaveText('0 / 12');
  await page.locator('#catalog').click();await page.locator('[data-challenge="layer"]').click();await expect(page.locator('[data-tool="stand"]')).toBeDisabled();
  await page.locator('#catalog').click();await page.locator('#sandboxChoice').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  const screenshot=testInfo.outputPath('studio-mobile.jpg');await page.screenshot({path:screenshot,type:'jpeg',quality:90});
  const dock=await page.locator('#dock').boundingBox();expect(dock.y+dock.height).toBeLessThanOrEqual(821);
  expect(errors).toEqual([]);
});

test('Android-safe renderer starts and renders a working game without WebGL',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')throw new Error('WebGL forbidden in compatibility test');return original.call(this,type,...args)}});
  await page.goto('/?renderer=canvas');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','canvas');await expect(page.locator('#viewport canvas')).toBeVisible();
  await expect(page.locator('#count')).toHaveText('0 / 180');await page.locator('#place').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  await expect(page.locator('#physicsStatus')).toContainText('Stavba v klidu',{timeout:15000});
  await page.locator('#catalog').click();await expect(page.locator('[data-challenge]')).toHaveCount(10);
  await page.locator('[data-challenge="bridge"]').click();await expect(page.locator('#objectiveTitle')).toHaveText('Most přes propast');
  await page.locator('#catalog').click();await page.locator('#sandboxChoice').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  const screenshot=testInfo.outputPath('android-compatible.jpg');fs.mkdirSync(path.dirname(screenshot),{recursive:true});await page.screenshot({path:screenshot,type:'jpeg',quality:90});
  expect(errors).toEqual([]);
});
