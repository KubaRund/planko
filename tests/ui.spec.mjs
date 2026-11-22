import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test('mobile studio: precision preview, explicit placement, camera, catalogue and persistence',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await expect(page.locator('#homeCampaign')).toBeVisible();await page.locator('#homePlay').click();
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
  await page.locator('#catalog').click();await expect(page.locator('[data-challenge]')).toHaveCount(18);
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
  await page.locator('#homePlay').click();
  await expect(page.locator('html')).toHaveAttribute('data-graphics','canvas');await expect(page.locator('#viewport canvas')).toBeVisible();
  await expect(page.locator('#count')).toHaveText('0 / 180');await page.locator('#place').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  await expect(page.locator('#physicsStatus')).toContainText('Stavba v klidu',{timeout:15000});
  await page.locator('#catalog').click();await expect(page.locator('[data-challenge]')).toHaveCount(18);
  await page.locator('[data-challenge="bridge"]').click();await expect(page.locator('#objectiveTitle')).toHaveText('Most přes propast');
  await page.locator('#catalog').click();await page.locator('#sandboxChoice').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  const screenshot=testInfo.outputPath('android-compatible.jpg');fs.mkdirSync(path.dirname(screenshot),{recursive:true});await page.screenshot({path:screenshot,type:'jpeg',quality:90});
  expect(errors).toEqual([]);
});

test('guided campaign: win first level, keep stars after reload and advance',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?renderer=canvas');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.locator('#homeCampaign').click();await expect(page.locator('#objectiveTitle')).toHaveText('První kroky');
  await expect(page.locator('#tutorial')).toBeVisible();await expect(page.locator('[data-tool="stand"]')).toBeDisabled();
  for(let i=1;i<=3;i++){await page.locator('#place').click();await expect(page.locator('#count')).toHaveText(`${i} / 8`);await expect(page.locator('#physicsStatus')).toContainText('Stavba v klidu',{timeout:15000});console.log('Training step',i,await page.locator('#objective').getAttribute('data-measure'));}
  try{await expect(page.locator('#resultNext')).toBeVisible({timeout:18000});}catch(e){console.log('Training final',await page.locator('#objective').getAttribute('data-measure'),await page.locator('#objectiveText').textContent());throw e;}await expect(page.locator('.result-stars')).toHaveText('★★★');
  const shot=testInfo.outputPath('campaign-result.jpg');fs.mkdirSync(path.dirname(shot),{recursive:true});await page.screenshot({path:shot,type:'jpeg',quality:90});
  await page.locator('#resultNext').click();await expect(page.locator('#objectiveTitle')).toHaveText('Křížem přes sebe');
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await expect(page.locator('.campaign-score')).toContainText('1/18');
  await expect(page.locator('.campaign-score')).toContainText('3/54');await page.locator('#homeLevels').click();await expect(page.locator('[data-challenge="training"]')).toHaveClass(/done/);
  expect(errors).toEqual([]);
});

test('undo a placement and keep the dock inside a compact mobile viewport',async({page})=>{
  await page.setViewportSize({width:320,height:560});await page.goto('/?renderer=canvas');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.locator('#homePlay').click();
  await page.locator('#place').click();await expect(page.locator('#count')).toHaveText('1 / 180');await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('0 / 180');
  const bottom=await page.locator('#dock').boundingBox();expect(bottom.y+bottom.height).toBeLessThanOrEqual(561);const place=await page.locator('#place').boundingBox();expect(place.x+place.width).toBeLessThanOrEqual(321);
});

test('create independent gallery projects, use blueprint, rename and revisit after restart',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?renderer=canvas');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.locator('#homeGallery').click();
  await expect(page.locator('[data-template]')).toHaveCount(4);await page.locator('#galleryBlank').click();await page.locator('#projectName').fill('Můj první dům');await page.locator('#createProject').click();await expect(page.locator('#modeName')).toHaveText('Můj první dům');await page.locator('#place').click();await expect(page.locator('#count')).toHaveText('1 / 180');
  await page.locator('#topView').click();await expect(page.locator('#topView')).toHaveClass(/active/);await page.locator('#topView').click();await expect(page.locator('#topView')).not.toHaveClass(/active/);
  await page.locator('#home').click();await page.locator('#homeGallery').click();await page.locator('[data-template="bridge"]').click();await page.locator('#projectName').fill('Most číslo 1');await page.locator('#createProject').click();await expect(page.locator('#count')).toHaveText('11 / 180');await page.locator('#home').click();await page.locator('#homeGallery').click();
  await expect(page.locator('[data-open-project]')).toHaveCount(2);const first=page.locator('.project-row').filter({hasText:'Můj první dům'});await first.locator('[data-manage-project]').click();await page.locator('#projectName').fill('Domeček');await page.locator('#renameProject').click();await page.locator('[data-open-project]').filter({hasText:'Domeček'}).click();await expect(page.locator('#count')).toHaveText('1 / 180');
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.locator('#homeGallery').click();await expect(page.locator('[data-open-project]')).toHaveCount(2);await expect(page.locator('[data-open-project]').filter({hasText:'Domeček'})).toBeVisible();
  const screenshot=testInfo.outputPath('gallery.jpg');fs.mkdirSync(path.dirname(screenshot),{recursive:true});await page.screenshot({path:screenshot,type:'jpeg',quality:90});
  await page.locator('#galleryCopy').click();await page.locator('#projectName').fill('Domeček kopie');await page.locator('#createProject').click();await expect(page.locator('#count')).toHaveText('1 / 180');await page.locator('#home').click();await page.locator('#homeGallery').click();await expect(page.locator('[data-open-project]')).toHaveCount(3);
  await page.locator('.project-row').filter({hasText:'Domeček kopie'}).locator('[data-manage-project]').click();await page.locator('#deleteProject').click();await page.locator('#deleteYes').click();await expect(page.locator('[data-open-project]')).toHaveCount(2);await expect(page.locator('[data-open-project]').filter({hasText:'Domeček'})).toBeVisible();expect(errors).toEqual([]);
});
