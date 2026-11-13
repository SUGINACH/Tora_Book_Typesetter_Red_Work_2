// S14 P0 — integration of canonical inline runs with registered-font measurement and the shared solver.
'use strict';

const assert = require('node:assert/strict');
const {
  MeasureAPI,
  registerFont,
  clearRegisteredFonts,
  resolveMeasureImpl
} = require('../../src/engine/typography/measure-api');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildTtfFixture } = require('../fixtures/gen_ttf_fixture');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

const fontBytes = buildTtfFixture({ kern:false }).bytes;
function registerFixtureFonts() {
  clearRegisteredFonts();
  assert.equal(registerFont('Inline Alpha', fontBytes).ok, true);
  assert.equal(registerFont('Inline Beta', fontBytes).ok, true);
}
function makeApi() {
  registerFixtureFonts();
  const settings = { ...getDefaultSettings(), 'body-font':'Inline Alpha' };
  return new MeasureAPI(settings, resolveMeasureImpl(settings));
}

test('MeasureAPI measures mixed-family subsegments and keeps a single lexical word atomic', () => {
  const api = makeApi();
  try {
    const result = api.layoutInlineRuns([
      { kind:'text', text:'אב', fontFamily:'Inline Alpha', sourceStart:0, sourceEnd:2 },
      // The gap models removed inline-style markers; it is not visible whitespace.
      { kind:'text', text:'גד', fontFamily:'Inline Beta', sourceStart:12, sourceEnd:14 }
    ], 500, { sizePt:12 });

    assert.equal(result.ok, true);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].fragments.length, 1);
    const word = result.lines[0].fragments[0];
    assert.equal(word.kind, 'text');
    assert.equal(word.text, 'אבגד');
    assert.deepEqual(word.segments.map(segment=>segment.fontFamily),['Inline Alpha','Inline Beta']);
    assert.deepEqual([word.sourceStart,word.sourceEnd],[0,14]);
    assert(word.widthPx > 0);
    assert.equal(result.diagnostics.length,0);
  } finally {
    clearRegisteredFonts();
  }
});

test('an explicit whitespace run creates a solver glue and preserves the family on each side', () => {
  const api = makeApi();
  try {
    const result = api.layoutInlineRuns([
      { kind:'text', text:'שלום ', fontFamily:'Inline Alpha', sourceStart:0, sourceEnd:5 },
      { kind:'text', text:'עולם', fontFamily:'Inline Beta', sourceStart:5, sourceEnd:9 }
    ], 500, { sizePt:12 });
    assert.equal(result.ok,true);
    assert.deepEqual(result.lines[0].fragments.map(fragment=>fragment.kind),['text','text']);
    assert.equal(result.lines[0].fragments[0].segments[0].fontFamily,'Inline Alpha');
    assert.equal(result.lines[0].fragments[1].segments[0].fontFamily,'Inline Beta');
    assert(result.lines[0].fragments[0].gapAfterPx > 0);
  } finally {
    clearRegisteredFonts();
  }
});

test('an image enters the same line solver as an atomic box and determines line height', () => {
  const api = makeApi();
  try {
    const result = api.layoutInlineRuns([
      {kind:'text',text:'לפני ',fontFamily:'Inline Alpha',sourceStart:0,sourceEnd:5},
      {kind:'image',resourcePath:'images/plate.png',sourceStart:5,sourceEnd:25},
      {kind:'text',text:' אחרי',fontFamily:'Inline Beta',sourceStart:25,sourceEnd:30}
    ],500,{
      sizePt:12,
      resolveImage:run=>({ok:true,image:{
        id:'asset:plate',
        resourcePath:run.resourcePath,
        widthPx:72,
        heightPx:54,
        aspectRatio:4/3
      }})
    });
    assert.equal(result.ok,true);
    assert.deepEqual(result.lines[0].fragments.map(fragment=>fragment.kind),['text','image','text']);
    assert.equal(result.lines[0].fragments[1].id,'asset:plate');
    assert.equal(result.lines[0].heightPx,54);
    assert(result.lines[0].fragments[1].widthPx===72);
  } finally {
    clearRegisteredFonts();
  }
});

test('an unregistered explicit family fails loudly instead of silently measuring in the body font', () => {
  const api = makeApi();
  try {
    assert.throws(()=>api.layoutInlineRuns([
      {kind:'text',text:'שלום',fontFamily:'Not Registered'}
    ],500,{sizePt:12}),/font family is not registered/);
  } finally {
    clearRegisteredFonts();
  }
});

test('missing image resources are returned as diagnostics without inserting phantom geometry', () => {
  const api = makeApi();
  try {
    const result = api.layoutInlineRuns([
      {kind:'text',text:'לפני ',fontFamily:'Inline Alpha'},
      {kind:'image',resourcePath:'missing.png'},
      {kind:'text',text:' אחרי',fontFamily:'Inline Alpha'}
    ],500,{
      sizePt:12,
      resolveImage:()=>({ok:false,code:'INLINE_IMAGE_RESOURCE_MISSING'})
    });
    assert.equal(result.ok,true);
    assert.equal(result.lines[0].fragments.some(fragment=>fragment.kind==='image'),false);
    assert.equal(result.diagnostics.length,1);
    assert.equal(result.diagnostics[0].code,'INLINE_IMAGE_RESOURCE_MISSING');
  } finally {
    clearRegisteredFonts();
  }
});

console.log('inline-measure: ' + passed + ' tests passed');
