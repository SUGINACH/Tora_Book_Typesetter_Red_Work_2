// S14 P0 — PNG/JPEG inline image XObjects and mixed text fragments in PDF.
'use strict';

const assert = require('node:assert/strict');
const { writePdf, decodePngForPdf, registerPdfInlineItemRenderer } = require('../../src/engine/output/pdf-writer');
const { crc32 } = require('../../src/engine/import/zip-reader');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }
const u32=(v)=>Uint8Array.from([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]);
function concat(parts){
  const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;
  for(const p of parts){out.set(p,at);at+=p.length;}return out;
}
function pngRgba1x1(){
  const signature=Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const zlib=Uint8Array.from([0x78,0x01,0x01,0x05,0x00,0xfa,0xff,0x00,0xff,0x00,0x00,0x80,0x00,0x00,0x01,0x01,0x00,0x80]);
  const chunk=(type,data)=>{
    const t=Uint8Array.from([...type].map(c=>c.charCodeAt(0)));
    const check=concat([t,data]);
    return concat([u32(data.length),check,u32(crc32(check))]);
  };
  const ihdr=concat([u32(1),u32(1),Uint8Array.from([8,6,0,0,0])]);
  return concat([signature,chunk('IHDR',ihdr),chunk('IDAT',zlib),chunk('IEND',new Uint8Array(0))]);
}
function fakeFont(){
  return {
    subsetBytes:Uint8Array.from([0,1,2,3]),
    widthsUnits:new Map([[1,500]]),
    unitsPerEm:1000,
    cidOf:()=>1,
    charToGidEntries:()=>[['א',1]]
  };
}
function fakePage(fragments){
  return {
    lines:[{x:0,y:20,w:200,h:60,sizePt:12,baselineY:40,words:[],fragments}],
    spanning:null,footnotes:[],folio:null,header:null,decorations:[]
  };
}

test('PNG decoder validates and extracts RGB plus alpha from a local RGBA PNG',()=>{
  const decoded=decodePngForPdf(pngRgba1x1());
  assert.equal(decoded.width,1);
  assert.equal(decoded.height,1);
  assert.deepEqual([...decoded.rgbBytes],[255,0,0]);
  assert.deepEqual([...decoded.alphaBytes],[128]);
});

test('PDF writer emits PNG XObject with a soft mask and invokes it at projected geometry',()=>{
  const bytes=writePdf({
    pages:[fakePage([{
      kind:'image',id:'img:1',resourceId:'img:1',resourcePath:'image.png',
      mimeType:'image/png',bytes:pngRgba1x1(),
      intrinsicWidthPx:1,intrinsicHeightPx:1,
      x:10,y:20,widthPx:40,heightPx:30,heightPx:30
    }])],
    pageSizeMm:{w:210,h:297},
    font:fakeFont(),
    settings:getDefaultSettings()
  });
  const pdf=bytes.toString('latin1');
  assert(pdf.includes('/Subtype /Image'));
  assert(pdf.includes('/SMask'));
  assert(pdf.includes('/XObject << /Im1'));
  assert(pdf.includes('/Im1 Do'));
  assert(pdf.includes('40 0 0 30'));
});

test('PDF writer draws text subsegments using their registered family keys',()=>{
  const font=fakeFont();
  const bytes=writePdf({
    pages:[fakePage([{
      kind:'text',id:'word:1',text:'אבגד',x:10,y:20,widthPx:40,heightPx:18,
      sizePt:12,
      segments:[
        {text:'אב',x:30,widthPx:20,sizePt:12,fontKey:'Inline Alpha'},
        {text:'גד',x:10,widthPx:20,sizePt:12,fontKey:'Inline Beta'}
      ]
    }])],
    pageSizeMm:{w:210,h:297},
    font,
    extraFonts:[{key:'Inline Alpha',font},{key:'Inline Beta',font}],
    settings:getDefaultSettings()
  });
  const pdf=bytes.toString('latin1');
  assert(pdf.includes('/F7 12 Tf'));
  assert(pdf.includes('/F8 12 Tf'));
});

test('custom inline PDF items require an explicit renderer instead of disappearing',()=>{
  assert.throws(()=>writePdf({
    pages:[fakePage([{kind:'qr-code',id:'qr:1',x:10,y:20,widthPx:20,heightPx:20}])],
    pageSizeMm:{w:210,h:297},font:fakeFont(),settings:getDefaultSettings()
  }),/no PDF renderer registered/);

  const unregister=registerPdfInlineItemRenderer('qr-code',(item,ctx)=>[
    'q 20 0 0 20 10 200 cm',
    '% registered qr renderer'
  ]);
  try{
    const bytes=writePdf({
      pages:[fakePage([{kind:'qr-code',id:'qr:1',x:10,y:20,widthPx:20,heightPx:20}])],
      pageSizeMm:{w:210,h:297},font:fakeFont(),settings:getDefaultSettings()
    });
    assert(bytes.toString('latin1').includes('% registered qr renderer'));
  }finally{unregister();}
});

console.log('pdf-inline-items: ' + passed + ' tests passed');
