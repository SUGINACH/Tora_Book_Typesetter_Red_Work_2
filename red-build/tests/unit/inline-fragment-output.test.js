// S14 P0 — projected mixed fragments are positioned once and rendered without flattening.
'use strict';

const assert = require('node:assert/strict');
const { projectLine } = require('../../src/engine/output/geometry-projector');
const { renderLine, registerInlineItemRenderer, bytesToBase64 } = require('../../src/engine/output/dom-renderer');
const { layoutHash, bodyGeometryHash } = require('../../src/engine/layout/dp-planner');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

function createElement(tagName) {
  return {
    tagName,
    style:{},
    dataset:{},
    children:[],
    attributes:{},
    setAttribute(name,value){this.attributes[name]=value;},
    appendChild(child){this.children.push(child);child.parentNode=this;return child;},
    get firstChild(){return this.children[0]||null;},
    insertBefore(child,before){
      const index=before?this.children.indexOf(before):-1;
      if(index<0)this.children.unshift(child);else this.children.splice(index,0,child);
      child.parentNode=this;return child;
    }
  };
}
const doc={createElement};

test('layout signatures detect rich font and image geometry changes without changing legacy signatures',()=>{
  const makePage=(sizePt,widthPx,kind='text')=>{
    const fragment=kind==='text'
      ? {kind:'text',text:'מילה',widthPx,heightPx:18,gapAfterPx:0,sizePt,
         segments:[{text:'מילה',fontFamily:'Inline Alpha',widthPx,sizePt}]}
      : {kind:'image',id:'asset-1',resourceId:'asset-1',resourcePath:'a.png',widthPx,heightPx:30,gapAfterPx:0};
    const line={tokenId:'t1',words:['מילה'],heightPx:18,fragments:[fragment]};
    return {index:0,type:'regular',columns:[[line]],footnotes:[],sideNotes:[]};
  };
  const small=makePage(10,30);
  const large=makePage(14,42);
  assert.notEqual(layoutHash([small]),layoutHash([large]));
  assert.notEqual(bodyGeometryHash([small]),bodyGeometryHash([large]));
  const image=makePage(null,50,'image');
  assert.notEqual(layoutHash([small]),layoutHash([image]));
});

test('projectLine positions text, font segments and images from measured widths only',()=>{
  const settings=getDefaultSettings();
  const api=new MeasureAPI(settings);
  const line={
    kind:'paragraph',
    heightPx:54,
    isLast:true,
    fragments:[
      {kind:'text',text:'אבגד',widthPx:40,heightPx:18,gapAfterPx:8,
       segments:[
         {text:'אב',fontFamily:'Inline Alpha',widthPx:20},
         {text:'גד',fontFamily:'Inline Beta',widthPx:20}
       ],sourceStart:0,sourceEnd:14},
      {kind:'image',id:'asset-1',resourceId:'asset-1',resourcePath:'images/plate.png',
       bytes:Uint8Array.from([1,2,3]),mimeType:'image/png',widthPx:60,heightPx:54,aspectRatio:60/54,
       gapAfterPx:0,sourceStart:15,sourceEnd:35}
    ]
  };
  const projected=projectLine(line,10,20,200,settings,api,'right');
  assert.equal(projected.fragments.length,2);
  assert.equal(projected.fragments[0].x,170);
  assert.equal(projected.fragments[1].x,102);
  assert.equal(projected.fragments[0].segments[0].x,190);
  assert.equal(projected.fragments[0].segments[1].x,170);
  assert.equal(projected.fragments[1].resourceId,'asset-1');
  assert.equal(projected.h,54);
  assert.equal(projected.words[0].text,'אבגד');
});

test('DOM renderer keeps inline font subsegments and renders an image from local bytes',()=>{
  const settings=getDefaultSettings();
  const api=new MeasureAPI(settings);
  const line={
    kind:'paragraph',heightPx:54,isLast:true,
    fragments:[
      {kind:'text',text:'אבגד',widthPx:40,heightPx:18,gapAfterPx:8,
       segments:[
         {text:'אב',fontFamily:'Inline Alpha',widthPx:20,sizePt:12},
         {text:'גד',fontFamily:'Inline Beta',widthPx:20,sizePt:12}
       ]},
      {kind:'image',id:'asset-1',resourceId:'asset-1',resourcePath:'images/plate.png',
       bytes:Uint8Array.from([1,2,3]),mimeType:'image/png',widthPx:60,heightPx:54,gapAfterPx:0}
    ]
  };
  const projected=projectLine(line,10,20,200,settings,api,'right');
  const element=renderLine(projected,doc,settings);
  assert.equal(element.children.length,2);
  const word=element.children[0];
  assert.equal(word.className,'w');
  assert.deepEqual(word.children.map(child=>child.textContent),['אב','גד']);
  assert(word.children[0].style.fontFamily.includes('Inline Alpha'));
  assert(word.children[1].style.fontFamily.includes('Inline Beta'));
  const image=element.children[1];
  assert.equal(image.tagName,'img');
  assert.equal(image.src,'data:image/png;base64,AQID');
  assert.equal(image.style.width,'60px');
  assert.equal(image.style.height,'54px');
});

test('registered custom inline renderer is an explicit extension point',()=>{
  const settings=getDefaultSettings();
  const unregister=registerInlineItemRenderer('qr-code',(item,document)=>{
    const canvas=document.createElement('canvas');
    canvas.dataset.value=item.payload.value;
    return canvas;
  });
  try{
    const line={kind:'paragraph',heightPx:24,isLast:true,fragments:[
      {kind:'qr-code',id:'qr-1',payload:{value:'book:1'},widthPx:24,heightPx:24,gapAfterPx:0}
    ]};
    const projected=projectLine(line,0,0,100,settings,new MeasureAPI(settings),'right');
    const element=renderLine(projected,doc,settings);
    assert.equal(element.children[0].tagName,'canvas');
    assert.equal(element.children[0].dataset.value,'book:1');
  }finally{unregister();}
});

test('byte-to-base64 conversion is deterministic for all final quantum lengths',()=>{
  assert.equal(bytesToBase64(Uint8Array.from([1])),'AQ==');
  assert.equal(bytesToBase64(Uint8Array.from([1,2])),'AQI=');
  assert.equal(bytesToBase64(Uint8Array.from([1,2,3])),'AQID');
});

console.log('inline-fragment-output: ' + passed + ' tests passed');
