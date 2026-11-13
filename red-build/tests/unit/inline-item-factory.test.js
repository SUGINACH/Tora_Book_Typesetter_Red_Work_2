// S14 P0 — canonical text/image/anchor runs become one measured item stream.
'use strict';

const assert = require('node:assert/strict');
const { createMeasuredInlineItems } = require('../../src/engine/layout/inline-item-factory');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

function measure(text, family) {
  const factor = family === 'Alpha' ? 2 : family === 'Beta' ? 3 : 1;
  return [...String(text)].length * factor;
}

test('text runs become atomic words and one measured glue per whitespace run', () => {
  const result = createMeasuredInlineItems([
    { kind:'text', text:'שלום   עולם', fontFamily:'Alpha', sourceStart:10, sourceEnd:21 }
  ], { measureText:measure, lineHeightPx:18, defaultFontFamily:'Body' });
  assert.deepEqual(result.items.map(item=>item.kind), ['text','glue','text']);
  assert.deepEqual(result.items.map(item=>item.text || null), ['שלום',null,'עולם']);
  assert.equal(result.items[0].widthPx, 8);
  assert.equal(result.items[1].widthPx, 2);
  assert.equal(result.items[2].widthPx, 8);
  assert.deepEqual([result.items[0].sourceStart,result.items[0].sourceEnd],[10,14]);
  assert.deepEqual([result.items[1].sourceStart,result.items[1].sourceEnd],[14,17]);
  assert.deepEqual([result.items[2].sourceStart,result.items[2].sourceEnd],[17,21]);
});

test('adjacent font runs inside one lexical word remain one atom with measured subsegments', () => {
  const result = createMeasuredInlineItems([
    { kind:'text', text:'אב', fontFamily:'Alpha', sourceStart:20, sourceEnd:22 },
    { kind:'text', text:'גד', fontFamily:'Beta', sourceStart:22, sourceEnd:24 }
  ], { measureText:measure, lineHeightPx:20 });
  assert.equal(result.items.length,1);
  assert.equal(result.items[0].kind,'text');
  assert.equal(result.items[0].text,'אבגד');
  assert.equal(result.items[0].widthPx,10);
  assert.deepEqual(result.items[0].segments.map(s=>s.fontFamily),['Alpha','Beta']);
  assert.deepEqual(result.items[0].segments.map(s=>s.widthPx),[4,6]);
  assert.deepEqual([result.items[0].sourceStart,result.items[0].sourceEnd],[20,24]);
});

test('an explicit whitespace boundary separates adjacent font runs and keeps the run family on glue', () => {
  const result = createMeasuredInlineItems([
    { kind:'text', text:'שלום ', fontFamily:'Alpha', sourceStart:0, sourceEnd:5 },
    { kind:'text', text:'עולם', fontFamily:'Beta', sourceStart:5, sourceEnd:9 }
  ], { measureText:measure, lineHeightPx:18 });
  assert.deepEqual(result.items.map(item=>item.kind),['text','glue','text']);
  assert.equal(result.items[1].fontFamily,'Alpha');
  assert.equal(result.items[1].widthPx,2);
  assert.equal(result.items[2].fontFamily,'Beta');
  assert.equal(result.items[2].widthPx,12);
});

test('images are measured atomic boxes and retain source/resource identity', () => {
  const result = createMeasuredInlineItems([
    { kind:'text', text:'לפני ', sourceStart:0, sourceEnd:5 },
    { kind:'image', resourcePath:'images/plate.png', sourceStart:5, sourceEnd:25 },
    { kind:'text', text:' אחרי', sourceStart:25, sourceEnd:30 }
  ], {
    measureText:measure,
    lineHeightPx:18,
    resolveImage:run=>({ok:true,image:{
      id:'asset-plate',resourcePath:run.resourcePath,widthPx:60,heightPx:40,aspectRatio:1.5
    }})
  });
  assert.deepEqual(result.items.map(item=>item.kind),['text','glue','image','glue','text']);
  assert.equal(result.items[2].id,'asset-plate');
  assert.equal(result.items[2].heightPx,40);
  assert.deepEqual([result.items[2].sourceStart,result.items[2].sourceEnd],[5,25]);
});

test('missing image resources produce diagnostics and do not leak syntax markers into text', () => {
  const result = createMeasuredInlineItems([
    { kind:'text',text:'לפני ',sourceStart:0,sourceEnd:5 },
    { kind:'image',resourcePath:'missing.png',sourceStart:5,sourceEnd:18 },
    { kind:'text',text:' אחרי',sourceStart:18,sourceEnd:23 }
  ], { measureText:measure });
  assert.equal(result.items.some(item=>item.kind==='image'),false);
  assert.deepEqual(result.items.filter(item=>item.kind==='text').map(item=>item.text),['לפני','אחרי']);
  assert.equal(result.diagnostics.length,1);
  assert.equal(result.diagnostics[0].code,'INLINE_IMAGE_RESOLVER_MISSING');
});

test('inline anchors and future custom item kinds share the same measured-box stream', () => {
  const result = createMeasuredInlineItems([
    {kind:'text',text:'א',sourceStart:0,sourceEnd:1},
    {kind:'anchor',id:'fn:1',sourceStart:1,sourceEnd:1},
    {kind:'qr-code',id:'qr:1',widthPx:24,heightPx:24,payload:{value:'1'}}
  ], {measureText:measure,lineHeightPx:18});
  assert.deepEqual(result.items.map(item=>item.kind),['text','anchor','qr-code']);
  assert.equal(result.items[1].id,'fn:1');
  assert.equal(result.items[1].widthPx,0);
  assert.equal(result.items[2].payload.value,'1');
});

test('invalid measured widths and incomplete custom items are rejected explicitly', () => {
  assert.throws(()=>createMeasuredInlineItems([{kind:'text',text:'x'}],{
    measureText:()=>NaN
  }),/measured text width/);
  assert.throws(()=>createMeasuredInlineItems([{kind:'widget',widthPx:1,heightPx:1}],{
    measureText:measure
  }),/stable id/);
});

console.log('inline-item-factory: ' + passed + ' tests passed');
