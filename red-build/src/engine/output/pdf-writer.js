// src/engine/output/pdf-writer.js — Pure-JS PDF 1.4 writer (S12.1-3, REQ-EXP-03)
'use strict';

const { crc32, inflateRawPure } = require('../import/zip-reader');

/**
 * כותב PDF מהקרנת הגיאומטריה (geometry-projector — מקור יחיד) + תת־גופן
 * TrueType מוטמע (CIDFontType2 + ToUnicode — טקסט אמיתי נבחר/מופק).
 *
 * יכולות (חוזה S12.1-3):
 *  - MediaBox/TrimBox/BleedBox מרישום גדלי העמוד (מ״מ→pt) + export-bleed-mm;
 *  - סימני חיתוך (pdf-crop-marks) — קווים מחוץ לתבנית החיתוך ב־4 פינות;
 *  - עץ סימניות (Outlines) ממודל הכותרות — H1 רמה 1, H2 רמה 2 תחתיו;
 *  - יעדי קישור לחיצים משורות ה־TOC (Link/GoTo → עמוד הכותרת);
 *  - טקסט אמיתי לכל מילה (BT/Tf/Td/Tj) — RTL מוצב מפורש;
 *  - דטרמיניזם: אין תאריך/מזהים אקראיים; סדר אובייקטים קבוע; ייצוא כפול ⇒ בתים זהים.
 *
 * עצמאי לחלוטין — אפס תלות חיצונית (אותה דוקטרינה כמו zip-writer/xml-lite).
 * מוכן גם לצינור הדפסת Chromium: ה־HTML העצמאי (html-export) כולל את אותם
 * כללי @page; ה־PDF הכתוב כאן הוא המסלול המנועי המלא (סימניות+קישורים).
 */

const PX_TO_PT = 72 / 96;
const MM_TO_PT = 72 / 25.4;

/** כתיבת מסמך PDF — אוסף אובייקטים ומרכיב xref מדויק. */
class PdfBuilder {
  constructor() {
    this.objects = new Map(); // id → Buffer (האובייקט בלבד, בלי "N 0 obj")
    this.nextId = 1;
  }
  reserve() { return this.nextId++; }
  put(id, content) {
    this.objects.set(id, Buffer.isBuffer(content) ? content : Buffer.from(content, 'latin1'));
    return id;
  }
  add(content) { return this.put(this.reserve(), content); }
  build() {
    const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
    let pos = parts[0].length;
    const offsets = new Map();
    const maxId = Math.max(0, ...this.objects.keys());
    for (let id = 1; id <= maxId; id++) {
      if (!this.objects.has(id)) continue;
      const head = Buffer.from(`${id} 0 obj\n`, 'latin1');
      const body = this.objects.get(id);
      const tail = Buffer.from('\nendobj\n', 'latin1');
      offsets.set(id, pos);
      pos += head.length + body.length + tail.length;
      parts.push(head, body, tail);
    }
    const xrefPos = pos;
    let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= maxId; id++) {
      if (offsets.has(id)) xref += `${String(offsets.get(id)).padStart(10, '0')} 00000 n \n`;
      else xref += `0000000000 65535 f \n`;
    }
    parts.push(Buffer.from(xref, 'latin1'));
    parts.push(Buffer.from(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`, 'latin1'));
    return Buffer.concat(parts);
  }
}

function escapePdfText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function round2(v) { return Math.round(v * 100) / 100; }

/** **כותרת סימנייה עברית:** מחרוזת טקסט PDF לא־לטינית ⇒ UTF-16BE עם BOM
 * כמחרוזת הקסדצימלית (חוזה PDF 1.4 §3.8.4) — קוראים מציגים עברית תקינה. */
function pdfTitleHex(s) {
  let out = 'FEFF';
  for (const ch of String(s)) {
    const cp = ch.codePointAt(0);
    if (cp > 0xFFFF) {
      const v = cp - 0x10000;
      const hi = 0xD800 + (v >> 10), lo = 0xDC00 + (v & 0x3FF);
      out += hi.toString(16).padStart(4, '0') + lo.toString(16).padStart(4, '0');
    } else {
      out += cp.toString(16).padStart(4, '0');
    }
  }
  return `<${out.toUpperCase()}>`;
}

/** **D-89 (דיווח משתמש: "כיוון הסוגריים בכל המופעים הפוך"):** חיקוי ה-bidi
 * של הדפדפן למילה עברית שמצוירת בסדר ויזואלי:
 *  - אותיות עברית/ניטרליים מהופכים (התו הלוגי הראשון בצד ימין) — כמו קודם;
 *  - ריצות ספרות/לטינית נשארות בסדר לוגי (קריאות שמאל→ימין). בלי זה מספר
 *    הטלפון 052-7666666 הוצג הפוך (6666667-250) — מדגם ה-CUTOVER, עמ' 2.
 *    פיסוק מספרי קצר (.,-+/:;%) בין שתי ריצות LTR נבלע לתוכן (1.5, 052-7666666);
 *    פיסוק עוקב/קודם (סוף משפט) נשאר בהקשר RTL — כמו UAX#9 בדפדפן.
 *  - סוגריים מכוונים בהקשר RTL משוקפים (Bidi Mirrored, UAX#9 §3.1.4):
 *    '(' לוגי מצויר כגליף ')' בקצה ימין של הרץ — "נפתח" כלפי כיוון הקריאה.
 *    סוגריים בתוך ריצת LTR (ספרות) אינם משוקפים.
 * המודול מיוצא לבדיקות (visualOrderRtl) — מקור יחיד לשני הצרכנים העתידיים. */
const LTR_RE = /[0-9A-Za-z]/;
const BRACKET_MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };
// פיסוק ביניים (CS/ES — נבלע במספר רק **בין** שתי ריצות LTR: 052-7666666, 1.5)
const NUM_MID_GLUE = '.,-+/:;';
// פיסוק עוקב/קודם מסוג ET (W5 — נדבק למספר גם בקצה: 1.5%, $20)
const NUM_ET_GLUE = '%$#°₪';

function visualOrderRtl(chars) {
  // חלוקה לריצות LTR/שאר
  const runs = [];
  for (const ch of chars) {
    const l = LTR_RE.test(ch);
    if (runs.length && runs[runs.length - 1].ltr === l) runs[runs.length - 1].chars.push(ch);
    else runs.push({ ltr: l, chars: [ch] });
  }
  // בליעת פיסוק בין/בקצה ריצות LTR — חלק מהמספר (052-7666666, 1.5, 1.5%).
  // פיסוק ביניים נבלע רק כשריצת LTR באה אחריו; פיסוק ET נבלע גם בקצה (W5).
  const merged = [];
  for (const r of runs) {
    const prev = merged[merged.length - 1];
    const isMid = r.chars.length <= 3 && r.chars.every(c => NUM_MID_GLUE.includes(c));
    const isEt = r.chars.length <= 3 && r.chars.every(c => NUM_ET_GLUE.includes(c));
    if (!r.ltr && prev && prev.ltr && (isMid || isEt)) {
      prev._glue = (prev._glue || []).concat(r.chars); // עדיין לא ידוע אם תבוא LTR אחרי
      continue;
    }
    if (r.ltr && prev && prev._glue) { prev.chars.push(...prev._glue, ...r.chars); prev._glue = null; continue; }
    if (prev && prev._glue) {
      // לא באה LTR אחרי הפיסוק: ET נדבק למספר שלפניו (1.5%); ביניים — הקשר RTL (סוף משפט)
      if (prev._glue.every(c => NUM_ET_GLUE.includes(c))) { prev.chars.push(...prev._glue); }
      else merged.push({ ltr: false, chars: prev._glue });
      prev._glue = null;
    }
    merged.push({ ltr: r.ltr, chars: r.chars.slice() });
  }
  const tail = merged[merged.length - 1];
  if (tail && tail._glue) {
    if (tail._glue.every(c => NUM_ET_GLUE.includes(c))) { tail.chars.push(...tail._glue); }
    else merged.push({ ltr: false, chars: tail._glue }); // פיסוק עוקב בלי LTR אחריו — הקשר RTL
    tail._glue = null;
  }
  // סדר ויזואלי: היפוך סדר הריצות; RTL — היפוך פנימי + שיקוף סוגריים; LTR — כמו שהוא
  const out = [];
  for (let i = merged.length - 1; i >= 0; i--) {
    const r = merged[i];
    if (r.ltr) { out.push(...r.chars); continue; }
    for (let j = r.chars.length - 1; j >= 0; j--) out.push(BRACKET_MIRROR[r.chars[j]] || r.chars[j]);
  }
  return out;
}

/** מחרוזת CID הקסדצימלית לטקסט (Identity-H: 2 בתים לגליף).
 * **RTL:** PDF מתקדם ימינה מ־Td ברוחבים חיוביים; לכן התווים נפלטים בסדר
 * **ויזואלי** (חילוץ לוגי אחרון ראשון = השמאלי ביותר) — דרך visualOrderRtl
 * (D-89: ריצות LTR שלמות + שיקוף סוגריים) — המילה מרונדרת נכון לקורא עברי. */
function cidHex(text, font) {
  const chars = [...String(text)].filter(ch => {
    const cp = ch.codePointAt(0);
    return cp >= 0x20 && cp !== 0x7F;
  });
  let out = '';
  for (const ch of visualOrderRtl(chars)) {
    const g = font.cidOf(ch);
    if (g === 0) continue;
    out += g.toString(16).padStart(4, '0');
  }
  return out;
}

/** ToUnicode CMap — מיפוי gid → Unicode (חילוץ טקסט אמיתי ב־pdftotext). */
function buildToUnicode(font) {
  const lines = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange'
  ];
  const entries = [];
  for (const [ch, gid] of font.charToGidEntries()) {
    if (gid === 0) continue;
    entries.push(`<${gid.toString(16).padStart(4, '0')}> <${ch.codePointAt(0).toString(16).padStart(4, '0')}>`);
  }
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    lines.push(`${chunk.length} beginbfchar`, ...chunk, 'endbfchar');
  }
  lines.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
  return lines.join('\n');
}


const pdfInlineItemRenderers = new Map();

function registerPdfInlineItemRenderer(kind, renderer) {
  if (typeof kind !== 'string' || !kind.trim()) {
    throw new TypeError('pdf-writer: inline item kind must be a non-empty string');
  }
  if (typeof renderer !== 'function') {
    throw new TypeError('pdf-writer: inline item renderer must be a function');
  }
  pdfInlineItemRenderers.set(kind, renderer);
  return () => {
    if (pdfInlineItemRenderers.get(kind) === renderer) pdfInlineItemRenderers.delete(kind);
  };
}

function asByteView(input) {
  if (input instanceof Uint8Array) return input;
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return null;
}
function readU32BE(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}
function adler32(bytes) {
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}
function encodeZlibStored(bytesInput) {
  const bytes = asByteView(bytesInput);
  if (!bytes) throw new TypeError('pdf-writer: zlib input must be bytes');
  const blockCount = Math.max(1, Math.ceil(bytes.length / 65535));
  const out = new Uint8Array(2 + bytes.length + blockCount * 5 + 4);
  let p = 0;
  out[p++] = 0x78;
  out[p++] = 0x01;
  let offset = 0;
  for (let block = 0; block < blockCount; block++) {
    const length = Math.min(65535, bytes.length - offset);
    out[p++] = block === blockCount - 1 ? 1 : 0; // BFINAL, BTYPE=00, aligned
    out[p++] = length & 255;
    out[p++] = (length >>> 8) & 255;
    const inverse = (~length) & 0xffff;
    out[p++] = inverse & 255;
    out[p++] = (inverse >>> 8) & 255;
    if (length) out.set(bytes.subarray(offset, offset + length), p);
    p += length;
    offset += length;
  }
  const checksum = adler32(bytes);
  out[p++] = (checksum >>> 24) & 255;
  out[p++] = (checksum >>> 16) & 255;
  out[p++] = (checksum >>> 8) & 255;
  out[p++] = checksum & 255;
  return out;
}

/**
 * Decode PNG pixels into DeviceRGB plus an optional 8-bit alpha plane.
 * Supports color types 0/2/3/4/6, bit depths 1/2/4/8/16 and both standard
 * and Adam7 interlaced images. PNG chunk CRCs and the zlib Adler checksum are
 * validated before any PDF object is emitted.
 */
function decodePngForPdf(input) {
  const bytes = asByteView(input);
  const signature = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if (!bytes || bytes.length < 33 || !signature.every((v,i)=>bytes[i]===v)) {
    throw new Error('pdf-writer: PNG signature or data is invalid');
  }
  let width=0,height=0,bitDepth=0,colorType=-1,interlace=0;
  let palette=null, transparency=null, sawHeader=false, sawEnd=false;
  const idat=[];
  let idatLength=0;
  for(let offset=8;offset<bytes.length;){
    if(offset+12>bytes.length)throw new Error('pdf-writer: truncated PNG chunk');
    const length=readU32BE(bytes,offset);
    const typeStart=offset+4, dataStart=offset+8, dataEnd=dataStart+length, chunkEnd=dataEnd+4;
    if(chunkEnd>bytes.length||dataEnd<dataStart)throw new Error('pdf-writer: PNG chunk exceeds input');
    const type=String.fromCharCode(bytes[typeStart],bytes[typeStart+1],bytes[typeStart+2],bytes[typeStart+3]);
    const crcExpected=readU32BE(bytes,dataEnd);
    const crcActual=crc32(bytes.subarray(typeStart,dataEnd));
    if(crcExpected!==crcActual)throw new Error('pdf-writer: PNG CRC mismatch in '+type);
    if(!sawHeader){
      if(type!=='IHDR'||length!==13)throw new Error('pdf-writer: PNG IHDR is missing or invalid');
      width=readU32BE(bytes,dataStart);
      height=readU32BE(bytes,dataStart+4);
      bitDepth=bytes[dataStart+8];
      colorType=bytes[dataStart+9];
      if(bytes[dataStart+10]!==0||bytes[dataStart+11]!==0)throw new Error('pdf-writer: unsupported PNG compression or filter method');
      interlace=bytes[dataStart+12];
      sawHeader=true;
    }else if(type==='IHDR'){
      throw new Error('pdf-writer: duplicate PNG IHDR');
    }
    if(type==='PLTE')palette=bytes.slice(dataStart,dataEnd);
    if(type==='tRNS')transparency=bytes.slice(dataStart,dataEnd);
    if(type==='IDAT'){
      idat.push(bytes.subarray(dataStart,dataEnd));
      idatLength+=length;
    }
    if(type==='IEND'){
      if(length!==0){throw new Error('pdf-writer: invalid PNG IEND');}
      sawEnd=true;
      if(chunkEnd!==bytes.length)throw new Error('pdf-writer: trailing data after PNG IEND');
      break;
    }
    offset=chunkEnd;
  }
  const validDepths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
  const channelsByType={0:1,2:3,3:1,4:2,6:4};
  if(!sawHeader||!sawEnd||!idatLength)throw new Error('pdf-writer: incomplete PNG structure');
  if(!validDepths[colorType]||!validDepths[colorType].includes(bitDepth))throw new Error('pdf-writer: unsupported PNG color type or bit depth');
  if(interlace!==0&&interlace!==1)throw new Error('pdf-writer: unsupported PNG interlace mode');
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>100000000) {
    throw new Error('pdf-writer: PNG dimensions exceed safety limits');
  }
  if(colorType===3&&(!palette||palette.length%3!==0||palette.length>768))throw new Error('pdf-writer: indexed PNG palette is invalid');
  if(colorType===3&&transparency&&transparency.length>palette.length/3)throw new Error('pdf-writer: indexed PNG transparency is invalid');

  const zlibBytes=new Uint8Array(idatLength);
  let zOffset=0;
  for(const chunk of idat){zlibBytes.set(chunk,zOffset);zOffset+=chunk.length;}
  if(zlibBytes.length<6||(zlibBytes[0]&15)!==8||(((zlibBytes[0]<<8)|zlibBytes[1])%31)!==0||(zlibBytes[1]&32)!==0) {
    throw new Error('pdf-writer: invalid PNG zlib header');
  }
  const deflateBytes=zlibBytes.subarray(2,zlibBytes.length-4);
  const inflated=inflateRawPure(deflateBytes,0,-1);
  const adlerExpected=readU32BE(zlibBytes,zlibBytes.length-4);
  if(adler32(inflated)!==adlerExpected)throw new Error('pdf-writer: PNG Adler checksum mismatch');

  const passes=interlace===0
    ? [[0,0,1,1]]
    : [[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]];
  const channels=channelsByType[colorType];
  const sampleMax=bitDepth===16?65535:(1<<bitDepth)-1;
  const rgb=new Uint8Array(width*height*3);
  const alpha=new Uint8Array(width*height);
  alpha.fill(255);
  let hasAlpha=false, readOffset=0;

  const scaleSample=value=>bitDepth===16?Math.round(value/257):(bitDepth===8?value:Math.round(value*255/sampleMax));
  const sampleAt=(row,pixel,channel)=>{
    const sampleIndex=pixel*channels+channel;
    if(bitDepth===16)return (row[sampleIndex*2]<<8)|row[sampleIndex*2+1];
    if(bitDepth===8)return row[sampleIndex];
    const bitOffset=sampleIndex*bitDepth;
    const shift=8-bitDepth-(bitOffset&7);
    return (row[bitOffset>>3]>>shift)&sampleMax;
  };
  const paeth=(a,b,c)=>{
    const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
    return pa<=pb&&pa<=pc?a:(pb<=pc?b:c);
  };

  for(const pass of passes){
    const [x0,y0,dx,dy]=pass;
    const passWidth=width<=x0?0:Math.ceil((width-x0)/dx);
    const passHeight=height<=y0?0:Math.ceil((height-y0)/dy);
    if(!passWidth||!passHeight)continue;
    const rowBytes=Math.ceil(passWidth*channels*bitDepth/8);
    const bytesPerPixel=Math.max(1,Math.ceil(channels*bitDepth/8));
    let previous=new Uint8Array(rowBytes);
    for(let py=0;py<passHeight;py++){
      if(readOffset+1+rowBytes>inflated.length)throw new Error('pdf-writer: truncated PNG scanline data');
      const filter=inflated[readOffset++];
      const raw=inflated.subarray(readOffset,readOffset+rowBytes);
      readOffset+=rowBytes;
      const row=new Uint8Array(rowBytes);
      for(let i=0;i<rowBytes;i++){
        const value=raw[i];
        const left=i>=bytesPerPixel?row[i-bytesPerPixel]:0;
        const up=previous[i]||0;
        const upperLeft=i>=bytesPerPixel?previous[i-bytesPerPixel]||0:0;
        if(filter===0)row[i]=value;
        else if(filter===1)row[i]=(value+left)&255;
        else if(filter===2)row[i]=(value+up)&255;
        else if(filter===3)row[i]=(value+Math.floor((left+up)/2))&255;
        else if(filter===4)row[i]=(value+paeth(left,up,upperLeft))&255;
        else throw new Error('pdf-writer: unknown PNG scanline filter '+filter);
      }
      previous=row;
      for(let px=0;px<passWidth;px++){
        const x=x0+px*dx,y=y0+py*dy,pixel=y*width+x,out=pixel*3;
        let r=0,g=0,b=0,a=255;
        if(colorType===0){
          const gray=sampleAt(row,px,0);
          r=g=b=scaleSample(gray);
          if(transparency&&transparency.length>=2&&gray===((transparency[0]<<8)|transparency[1]))a=0;
        }else if(colorType===2){
          const rr=sampleAt(row,px,0),gg=sampleAt(row,px,1),bb=sampleAt(row,px,2);
          r=scaleSample(rr);g=scaleSample(gg);b=scaleSample(bb);
          if(transparency&&transparency.length>=6&&rr===((transparency[0]<<8)|transparency[1])&&gg===((transparency[2]<<8)|transparency[3])&&bb===((transparency[4]<<8)|transparency[5]))a=0;
        }else if(colorType===3){
          const index=sampleAt(row,px,0),paletteAt=index*3;
          if(!palette||paletteAt+2>=palette.length)throw new Error('pdf-writer: PNG palette index is out of range');
          r=palette[paletteAt];g=palette[paletteAt+1];b=palette[paletteAt+2];
          if(transparency&&index<transparency.length)a=transparency[index];
        }else if(colorType===4){
          const gray=sampleAt(row,px,0);
          r=g=b=scaleSample(gray);
          a=scaleSample(sampleAt(row,px,1));
        }else{
          r=scaleSample(sampleAt(row,px,0));
          g=scaleSample(sampleAt(row,px,1));
          b=scaleSample(sampleAt(row,px,2));
          a=scaleSample(sampleAt(row,px,3));
        }
        rgb[out]=r;rgb[out+1]=g;rgb[out+2]=b;
        alpha[pixel]=a;
        if(a!==255)hasAlpha=true;
      }
    }
  }
  if(readOffset!==inflated.length)throw new Error('pdf-writer: unexpected trailing PNG scanline data');
  return {width,height,rgbBytes:rgb,alphaBytes:hasAlpha?alpha:null};
}

function imageKey(fragment) {
  const value=fragment.resourceId || fragment.id || fragment.resourcePath;
  if(value==null||String(value).trim()==='')throw new Error('pdf-writer: image fragment requires stable resource identity');
  return String(value);
}
function preparePdfImage(fragment) {
  const bytes=asByteView(fragment.bytes);
  if(!bytes||!bytes.length)throw new Error('pdf-writer: image '+imageKey(fragment)+' has no embedded bytes');
  if(bytes.length>64*1024*1024)throw new Error('pdf-writer: image exceeds 64MB safety limit');
  const mime=String(fragment.mimeType||'').toLowerCase();
  if(mime==='image/jpeg'||mime==='image/jpg'){
    if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9) {
      throw new Error('pdf-writer: JPEG image '+imageKey(fragment)+' has invalid SOI/EOI markers');
    }
    const width=Number(fragment.intrinsicWidthPx||fragment.widthPx);
    const height=Number(fragment.intrinsicHeightPx||fragment.heightPx);
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)throw new Error('pdf-writer: JPEG image has invalid intrinsic dimensions');
    return {key:imageKey(fragment),name:null,width,height,filter:'DCTDecode',colorSpace:'DeviceRGB',bits:8,data:bytes,alphaBytes:null};
  }
  if(mime==='image/png'){
    const decoded=decodePngForPdf(bytes);
    if(fragment.intrinsicWidthPx!=null&&Number(fragment.intrinsicWidthPx)!==decoded.width)throw new Error('pdf-writer: PNG intrinsic width does not match metadata');
    if(fragment.intrinsicHeightPx!=null&&Number(fragment.intrinsicHeightPx)!==decoded.height)throw new Error('pdf-writer: PNG intrinsic height does not match metadata');
    return {key:imageKey(fragment),name:null,width:decoded.width,height:decoded.height,filter:'FlateDecode',colorSpace:'DeviceRGB',bits:8,data:encodeZlibStored(decoded.rgbBytes),alphaBytes:decoded.alphaBytes?encodeZlibStored(decoded.alphaBytes):null};
  }
  throw new Error('pdf-writer: unsupported raster image MIME type '+mime);
}
function streamBuffer(dictionary, bytes) {
  const data=Buffer.from(bytes);
  return Buffer.concat([
    Buffer.from(dictionary.replace('__LENGTH__',String(data.length))+'\nstream\n','latin1'),
    data,
    Buffer.from('\nendstream','latin1')
  ]);
}

/**
 * כתיבת מסמך PDF שלם.
 * @param {object} opts
 * @param {Array} opts.pages — תוצר projectPage() לכל עמוד
 * @param {{w:number,h:number}} opts.pageSizeMm — גודל עמוד במ״מ (מרישום גדלי העמוד)
 * @param {object} opts.font — {subsetBytes, widthsUnits:Map(gid→units), unitsPerEm, cidOf:(ch)=>gid, charToGidEntries:()=>[ch,gid][]}
 * @param {object} [opts.font2] — **S4.15:** גופן משני (FrankReal-Bold — מילות-חלון):
 *   אותה צורה; מילים עם fontKey==='window' נציירות בו (/F2). בלעדיו — הכל ב-/F1.
 * @param {object} [opts.font5] — **S5.1:** גוף ההערה (Frank Ruhl Libre — fontKey
 *   'fnbody'): אותה צורה; /F5. בלעדיו — הערות ב-/F1 (התנהגות קודמת).
 * @param {object} [opts.font6] — **S5.1:** הערות-צד (Hadassah Friedlaender —
 *   fontKey 'margin'): אותה צורה; /F6. בלעדיו — הערות-צד ב-/F1.
 * @param {Array} [opts.extraFonts] — **S73 (תצוגה=ייצוא בגופנים):** גופנים
 *   דינמיים לפי משפחה — [{key, font, ascentEm?, descentEm?}]. מילה שה-fontKey
 *   שלה שווה ל-key מצוירת בגופן זה (/F7, /F8, … לפי הסדר). מיועד למשפחות
 *   הכותרות/השער/הכותרות-העליונות מההגדרות — כמו שה-DOM מציג. משפחה
 *   שלא סופקה כאן נופלת ל-/F1 (גוף הטקסט) — התנהגות קודמת.
 * @param {object} opts.settings — pdf-crop-marks, export-bleed-mm
 * @param {Array} [opts.outline] — [{title, page, level}] — סימניות מכותרות
 * @param {Array} [opts.tocLinks] — [{page, x, y, w, h, targetPage}] — קישורי TOC (px מהמקרן)
 * @returns {Buffer}
 */
function writePdf(opts) {
  const { pages, pageSizeMm, font, font2, font3, font4, font5, font6, settings, outline, tocLinks } = opts;
  const pdf = new PdfBuilder();

  const wPt = pageSizeMm.w * MM_TO_PT;
  const hPt = pageSizeMm.h * MM_TO_PT;
  const bleedPt = (Number(settings['export-bleed-mm']) || 0) * MM_TO_PT;
  const cropMarks = settings['pdf-crop-marks'] === true;
  const pageCount = pages.length;

  // ---- הקצאת מזהים דטרמיניסטית מראש ----
  // מפת מזהים קבוע: 1 קטלוג, 2 דפים, 3 Type0, 4 CIDFont, 5 FontDescriptor,
  // 6 FontFile2 (stream), 7 ToUnicode (stream), 8 Outlines; 9 שמור; 10+ דינמי.
  const ID = {
    catalog: 1, pages: 2, type0: 3, cidFont: 4, fontDescriptor: 5, fontFile: 6, toUnicode: 7, outlines: 8
  };
  pdf.nextId = 10;
  // **S4.15:** מזהי הגופן המשני (קבועים — דטרמיניזם): 9 היה שמור; 4 נוספים דינמיים
  // מיד אחריו, לפני הדפים — סדר קבוע לכל הרצות.
  if (font2) {
    ID.type0b = 9;
    ID.cidFontb = pdf.reserve();
    ID.fontDescriptorb = pdf.reserve();
    ID.fontFileb = pdf.reserve();
    ID.toUnicodeb = pdf.reserve();
  }
  // **S4.26:** מזהי הגופן השלישי (DavidLibre-Bold — כותרות) — אחרי אלו של
  // font2, סדר קבוע לפני הדפים (דטרמיניזם).
  if (font3) {
    ID.type0c = pdf.reserve();
    ID.cidFontc = pdf.reserve();
    ID.fontDescriptorc = pdf.reserve();
    ID.fontFilec = pdf.reserve();
    ID.toUnicodec = pdf.reserve();
  }
  // **S4.26:** מזהי הגופן הרביעי (Frank Ruhl Libre — fallback לפיסוק שחסר
  // בגוף הראשי, כמו מחסנית ה-CSS בדפדפן).
  if (font4) {
    ID.type0d = pdf.reserve();
    ID.cidFontd = pdf.reserve();
    ID.fontDescriptord = pdf.reserve();
    ID.fontFiled = pdf.reserve();
    ID.toUnicoded = pdf.reserve();
  }
  // **S5.1:** מזהי הגופן החמישי (Frank Ruhl Libre — גוף ההערה, /F5) והשישי
  // (Hadassah Friedlaender — הערות-צד, /F6) — אותו סדר קבוע (דטרמיניזם).
  if (font5) {
    ID.type0e = pdf.reserve();
    ID.cidFonte = pdf.reserve();
    ID.fontDescriptore = pdf.reserve();
    ID.fontFilee = pdf.reserve();
    ID.toUnicodee = pdf.reserve();
  }
  if (font6) {
    ID.type0f = pdf.reserve();
    ID.cidFontf = pdf.reserve();
    ID.fontDescriptorf = pdf.reserve();
    ID.fontFilef = pdf.reserve();
    ID.toUnicodef = pdf.reserve();
  }
  // **S73 (גופנים דינמיים — תצוגה=ייצוא):** משפחות נוספות (כותרות/שער/כותרות
  // עליונות מההגדרות). מזהים דטרמיניסטיים — 5 ברצף לכל גופן, בסדר המערך
  // שנקבע מראש ב-export-api (מיון לפי key) — ייצוא כפול ⇒ בתים זהים.
  const extraFonts = [];
  for (const ef of (opts.extraFonts || [])) {
    if (!ef || !ef.font) continue;
    extraFonts.push({
      key: String(ef.key),
      font: ef.font,
      ascentEm: Number.isFinite(ef.ascentEm) ? ef.ascentEm : 0.8,
      descentEm: Number.isFinite(ef.descentEm) ? ef.descentEm : 0.2,
      ids: { type0: pdf.reserve(), cidFont: pdf.reserve(), fontDescriptor: pdf.reserve(), fontFile: pdf.reserve(), toUnicode: pdf.reserve() }
    });
  }
  /** מפת key → {font, name} לציור מיידי ב-emitWord (נתיב יחיד). */
  const extraByKeys = new Map(extraFonts.map((ef, i) => [ef.key, { font: ef.font, name: `F${7 + i}` }]));
  const inlineImages = [];
  const inlineImageByKey = new Map();
  for (const page of pages) {
    const lines = [
      ...(page.spanning && Array.isArray(page.spanning.lines) ? page.spanning.lines : []),
      ...(Array.isArray(page.lines) ? page.lines : [])
    ];
    for (const line of lines) {
      for (const fragment of (line.fragments || [])) {
        if (!fragment || fragment.kind !== 'image') continue;
        const key = imageKey(fragment);
        if (inlineImageByKey.has(key)) continue;
        const image = preparePdfImage(fragment);
        image.name = 'Im' + String(inlineImages.length + 1);
        image.objectId = pdf.reserve();
        image.smaskId = image.alphaBytes ? pdf.reserve() : null;
        inlineImages.push(image);
        inlineImageByKey.set(key, image);
      }
    }
  }

  const pageIds = pages.map(() => pdf.reserve());
  const contentIds = pages.map(() => pdf.reserve());
  const linkIds = new Map(); // pageIndex → [ids]
  for (const link of tocLinks || []) {
    if (!linkIds.has(link.page)) linkIds.set(link.page, []);
    linkIds.get(link.page).push(pdf.reserve());
  }
  const outlineItems = (outline || []).map(o => ({ ...o, id: pdf.reserve() }));

  // ---- עץ הסימניות: היררכיה לפי level ----
  const stack = [];
  const roots = [];
  for (const it of outlineItems) {
    while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
    it.parent = stack.length ? stack[stack.length - 1] : null;
    it.children = [];
    if (!it.parent) roots.push(it); else it.parent.children.push(it);
    stack.push(it);
  }
  const flatOrder = [];
  const walk = (list) => { for (const x of list) { flatOrder.push(x); walk(x.children); } };
  walk(roots);
  for (const list of [roots, ...flatOrder.filter(f => f.children.length).map(f => f.children)]) {
    for (let i = 0; i < list.length; i++) { list[i].prev = list[i - 1] || null; list[i].next = list[i + 1] || null; }
  }

  // ---- תוכן לכל עמוד (content streams) ----
  const contents = pages.map((pg) => {
    const ops = [];
    // **S6.0 (R5-M2 — צבע דביק):** מצב מילוי נוכחי לכל אורך מסלול התוכן
    // של העמוד. בעבר 'rg' נפלט רק למילים צבועות ולא אופס לעולם ⇒ מילה
    // צבועה (הערת-שוליים אפורה) צבעה את כל הטקסט שאחריה בעמוד — הערות
    // שוליים, גיליון וכותרות (נמדד: #404040 מדביק עד סוף העמוד).
    let fillState = '0 0 0';
    const emitFill = (color) => {
      if (Array.isArray(color) && color.length === 3) {
        const cs = `${round2(color[0])} ${round2(color[1])} ${round2(color[2])} rg`;
        if (cs !== fillState) { ops.push(cs); fillState = cs; }
      } else if (fillState !== '0 0 0') {
        ops.push('0 0 0 rg'); fillState = '0 0 0';
      }
    };
    // **D-89 (צבע פר-מילה):** rgb 0..1 על המילה (כותרת עליונה בכחול-הייחוס
    // #0F1749, בלוקי השער האחורי) — ברירת מחדל שחור (0 0 0 rg מרומז ב-PDF).
    const emitWord = (text, xPx, yPx, sizePt, fontKey, color) => {
      // **S4.15:** מילת-חלון בגופן המשני (FrankReal-Bold) — כמו המקור;
      // **S4.26:** כותרות בגופן השלישי (DavidLibre-Bold — כמו הייחוס);
      // **S4.26 (פיצול גליפים):** תווים שחסרים בגוף הראשי (פיסוק בסיסי
      // בגוטמן רש"י: ' . ׳) מצוירים בגופן ה-fallback (/F4) — המשך אותה
      // פעולת טקסט, העט ממשיך מאליו אחרי כל Tj.
      // **S5.1 (תיקון C4 + הרחבת ה-fallback לכל הגופנים):** הרשת כעת
      // פר-תו לכל גופן (F1..F6): תו שחסר בגופן המילה נופל לגוף הטקסט (/F1)
      // ורק אז ל-/F4. בעבר תו חסר ב-/F2 או //F3 הושמט בשקט מה-PDF
      // (הדפדפן הציג אותו — תצוגה ≠ ייצוא). פורמט ה-bytes של המקרים
      // הקיימים נשמר בדיוק (מסלול יחיד = המסלול הפשוט הקודם;
      // מסלול מרובה = פורמט ה-F4 הקודם).
      // **S73 (תצוגה=ייצוא בגופנים):** משפחה דינמית — ה-fontKey של המילה הוא
      // שם המשפחה מההגדרות (למשל 'Lia Sgula' בכותרת השער); היא נמדדת
      // באותו גופן במקרן ומצוירת כאן בתת-הגופן הייעודי (/F7…) — כמו ה-DOM.
      // משפחה שלא סופקה ⇒ המשך לשרשרת הקיימת (window/heading/fnbody/margin/F1).
      const ex = fontKey != null ? extraByKeys.get(fontKey) : null;
      const useF2 = !ex && font2 && fontKey === 'window';
      const useF3 = !ex && font3 && fontKey === 'heading';
      const useF5 = !ex && font5 && fontKey === 'fnbody';
      const useF6 = !ex && font6 && fontKey === 'margin';
      const f = ex ? ex.font : (useF2 ? font2 : (useF3 ? font3 : (useF5 ? font5 : (useF6 ? font6 : font))));
      const fName = ex ? ex.name : (useF2 ? 'F2' : (useF3 ? 'F3' : (useF5 ? 'F5' : (useF6 ? 'F6' : 'F1'))));
      const chars = [...String(text)].filter(ch => {
        const cp = ch.codePointAt(0);
        return cp >= 0x20 && cp !== 0x7F;
      // **S6.0 (R7-M3 — NBSP נעלם ב-PDF):** גופני Frank אינם ממפים U+00A0
      // ⇒ התו הושמט בשקט מהייצוא והמילים הודבקו. כעת NBSP ממופה לרווח
      // רגיל (הדפדפן מציג רווח — עתה גם ה-PDF).
      }).map(ch => (ch === '\u00A0' ? ' ' : ch));
      const visual = visualOrderRtl(chars);
      if (!visual.length) return;
      // ריצות פר-תו: הגופן הראשי של המילה; חסר ⇒ /F1 (גוף); חסר גם שם
      // וקיים ב-/F4 ⇒ /F4. תו שאינו בשום גופן מושמט (כמו קודם — tofu).
      const runs = [];
      for (const ch of visual) {
        let rn = fName, rf = f;
        if (f.cidOf(ch) === 0) {
          if (font.cidOf(ch) !== 0) { rn = 'F1'; rf = font; }
          else if (font4 && font4.cidOf(ch) !== 0) { rn = 'F4'; rf = font4; }
          else continue;
        }
        if (runs.length && runs[runs.length - 1].name === rn) runs[runs.length - 1].chars.push(ch);
        else runs.push({ name: rn, font: rf, chars: [ch] });
      }
      if (!runs.length) return;
      // **S6.0 (R5-M2):** הצבע נפלט פעם אחת לפני המסלולים — עם איפוס
      // מפורש כשהמילה אינה צבועה והקודם היה צבוע (בעבר: הצבע נדבק).
      emitFill(color);
      if (runs.length === 1) {
        // מסלוק יחיד — פורמט ה-bytes של המסלול הפשוט הקודם (ללא שינוי)
        let out = '';
        for (const ch of runs[0].chars) {
          const g = runs[0].font.cidOf(ch);
          if (g) out += g.toString(16).padStart(4, '0');
        }
        if (!out) return;
        ops.push(`BT /${runs[0].name} ${round2(sizePt)} Tf ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td <${out}> Tj ET`);
        return;
      }
      // מסלוק מרובה — פורמט ה-F4 הקודם (BT x y Td; פר-ריצה /Fn sz Tf <hex> Tj; ET)
      ops.push(`BT ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td`);
      for (const run of runs) {
        let hex = '';
        for (const ch of run.chars) {
          const g = run.font.cidOf(ch);
          if (g) hex += g.toString(16).padStart(4, '0');
        }
        if (hex) ops.push(`/${run.name} ${round2(sizePt)} Tf <${hex}> Tj`);
      }
      ops.push('ET');
    };
    const emitImage = (fragment) => {
      const image = inlineImageByKey.get(imageKey(fragment));
      if (!image) throw new Error('pdf-writer: image resource was not registered');
      const x = round2(fragment.x * PX_TO_PT);
      const y = round2(hPt - (fragment.y + fragment.heightPx) * PX_TO_PT);
      const w = round2(fragment.widthPx * PX_TO_PT);
      const h = round2(fragment.heightPx * PX_TO_PT);
      ops.push('q ' + w + ' 0 0 ' + h + ' ' + x + ' ' + y + ' cm /' + image.name + ' Do Q');
    };
    const emitLines = (lines) => {
      for (const ln of lines) {
        // **S12 (parity):** בסיס השורה מהמקרן (מודל תיבת שורה CSS — half-leading+ascent)
        const baselineY = ln.baselineY != null ? ln.baselineY : ln.y + ln.h - ln.sizePt * (96 / 72) * 0.78;
        // **S4.9 (legacy IMUD):** מילים עם גודל/בסיס משלהן (מילת-חלון 1.5×, סמני הערות)
        if (Array.isArray(ln.fragments) && ln.fragments.length) {
          for (const fragment of ln.fragments) {
            if (fragment.kind === 'text') {
              const segments = Array.isArray(fragment.segments) && fragment.segments.length
                ? fragment.segments
                : [{ text: fragment.text, x: fragment.x, sizePt: fragment.sizePt, fontKey: fragment.fontKey }];
              for (const segment of segments) {
                emitWord(
                  segment.text,
                  Number.isFinite(segment.x) ? segment.x : fragment.x,
                  segment.baselineY != null ? segment.baselineY : baselineY,
                  segment.sizePt || fragment.sizePt || ln.sizePt,
                  segment.fontKey || fragment.fontKey,
                  fragment.color
                );
              }
            } else if (fragment.kind === 'image') {
              emitImage(fragment);
            } else {
              const renderer = pdfInlineItemRenderers.get(fragment.kind);
              if (!renderer) throw new Error('pdf-writer: no PDF renderer registered for inline item kind ' + fragment.kind);
              const customOps = renderer(fragment, { pxToPt: PX_TO_PT, pageHeightPt: hPt, round2 });
              if (!Array.isArray(customOps) || customOps.some(op => typeof op !== 'string')) {
                throw new TypeError('pdf-writer: custom inline renderer must return an array of PDF operator strings');
              }
              ops.push(...customOps);
            }
          }
        } else {
          for (const w of (ln.words || [])) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : baselineY, w.sizePt || ln.sizePt, w.fontKey, w.color);
        }
      }
    };
    if (pg.spanning) emitLines(pg.spanning.lines);
    emitLines(pg.lines);
    // מרזב הערות — סמן + מילות ההערה (מימין לשמאל); בסיס מהמקרן
    for (const fn of pg.footnotes) {
      if (fn.words && fn.words.length) {
        // **D-89 (דיווח משתמש: "בהערות השוליים יש מילים אחת על השניה"):**
        // בסיס פר-מילה מהמקרן (פר-שורה) — בעבר baselineY אחד לכל ההערה
        // וכל שורות הערה רבת-שורות נערמו זו על זו.
        for (const w of fn.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : fn.baselineY, w.sizePt || 8.5, w.fontKey, w.color);
        continue;
      }
      const fs = 11;
      const baseY = fn.baselineY != null ? fn.baselineY : fn.y + 9;
      let x = fn.x + fn.w - 4;
      // **S73:** צבע סמן ההערה — כצבע גוף ההערה מההגדרות (ברירת מחדל שחור)
      if (fn.marker) { emitWord(fn.marker, x - 14, baseY, fs, null, fn.color); x -= 18; }
      let cx = x;
      for (const w of fn.text.split(/\s+/).filter(Boolean)) {
        cx -= 8.2;
        emitWord(w, cx, baseY, fs);
      }
    }
    // גיליון — מקור יחיד (D-81): מיקום/רוחב מהקרן; נפילה לנוסחה הישנה רק אם חסר
    // **S73:** גופן/צבע הגיליון מההגדרות (page-num-font/page-num-color) —
    // כמו ה-DOM; fontKey של משפחה רשומה מצויר בגופן שלה, אחרת גוף הטקסט.
    if (pg.folio && pg.folio.text) {
      const fw = pg.folio.w != null ? pg.folio.w : pg.folio.text.length * 6;
      const fx = pg.folio.x != null ? pg.folio.x : pg.width / 2 - fw / 2;
      const fy = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      emitWord(pg.folio.text, fx, fy, pg.folio.sizePt || 10, pg.folio.fontKey || null, pg.folio.color);
    }
    // כותרת עליונה — סלוטים לפי מיקום פיזי מהקרן (D-81); נפילה מתועדת לנוסחה הישנה
    if (pg.header) {
      for (const s of pg.header.slots) {
        const sw = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - sw : s.pos === 'center' ? (pg.width - sw) / 2 : 60);
        const y = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        // **D-89:** סלוט legacy עם מילים ממוקמות מהמקרן — בסיס/צבע פר-מילה;
        // נפילה לנוסחה הישנה רק כשאין מילים (נתיב DP).
        if (s.words && s.words.length) {
          for (const w of s.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : y, w.sizePt || s.sizePt || 9, w.fontKey, w.color);
          continue;
        }
        emitWord(s.text, x, y, s.sizePt || 9, null, s.color);
      }
    }
    // **EXT-4 (ציור עיטורים):** פעולות הציור מגיעות מוכנות מהפרויקטור
    // (d.pdfOps — פוענחו שם מה-SVG במקור היחיד ornament-ink; הכותב עצמו
    // חף-תלויות ואוסף אובייקטים בלבד). תמונות רסטר אינן מצוירות כאן (מתועד).
    if (pg.decorations && pg.decorations.length) {
      for (const d of pg.decorations) {
        if (Array.isArray(d.pdfOps)) ops.push(...d.pdfOps);
      }
    }
    // סימני חיתוך (**S6.0 R5-M6** — בחוץ ל-TrimBox, כמו המסמך; בעבר צוירו
    // בפנים על העמוד החתוך עצמו): זוג קווים בכל פינה, מוסטים 0.5מ״מ משפת
    // החיתוך, באורך 5מ״מ — בתוך טבעת הבליד/ההרחבה של ה-MediaBox.
    if (cropMarks) {
      const g = 0.5 * MM_TO_PT, L = 5 * MM_TO_PT;
      const xl0 = -(g + L), xl1 = -g, xr0 = wPt + g, xr1 = wPt + g + L;
      const yb0 = -(g + L), yb1 = -g, yt0 = hPt + g, yt1 = hPt + g + L;
      ops.push('0.6 w 0 G');
      ops.push(`${round2(xl0)} 0 m ${round2(xl1)} 0 l S`);
      ops.push(`0 ${round2(yb0)} m 0 ${round2(yb1)} l S`);
      ops.push(`${round2(xr0)} 0 m ${round2(xr1)} 0 l S`);
      ops.push(`${round2(wPt)} ${round2(yb0)} m ${round2(wPt)} ${round2(yb1)} l S`);
      ops.push(`${round2(xl0)} ${round2(hPt)} m ${round2(xl1)} ${round2(hPt)} l S`);
      ops.push(`0 ${round2(yt0)} m 0 ${round2(yt1)} l S`);
      ops.push(`${round2(xr0)} ${round2(hPt)} m ${round2(xr1)} ${round2(hPt)} l S`);
      ops.push(`${round2(wPt)} ${round2(yt0)} m ${round2(wPt)} ${round2(yt1)} l S`);
    }
    return Buffer.from(ops.join('\n'), 'latin1');
  });

  // ---- הרכבה: קטלוג, דפים, גופן ----
  const catalogKids = pageIds.map(id => `${id} 0 R`).join(' ');
  const outlinesRef = (outlineItems.length) ? ` /Outlines ${ID.outlines} 0 R /PageMode /UseOutlines` : '';
  pdf.put(ID.catalog, `<< /Type /Catalog /Pages ${ID.pages} 0 R${outlinesRef} >>`);
  pdf.put(ID.pages, `<< /Type /Pages /Count ${pageCount} /Kids [${catalogKids}] >>`);

  // W: לפי חוזה PDF — צורה 1: `c [w1 w2 … wn]` (רצף רוחבים בסוגריים); יחידות פר 1000
  const wArray = [];
  let run = null;
  let prevGid = -10;
  for (const g of [...font.widthsUnits.keys()].sort((a, b) => a - b)) {
    const wv = Math.round((font.widthsUnits.get(g) / font.unitsPerEm) * 1000);
    if (g === prevGid + 1 && run) run.push(wv);
    else { if (run) wArray.push(run); run = [g, wv]; }
    prevGid = g;
  }
  if (run) wArray.push(run);
  const wStr = wArray.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');

  pdf.put(ID.type0, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraBook /Encoding /Identity-H /DescendantFonts [${ID.cidFont} 0 R] /ToUnicode ${ID.toUnicode} 0 R >>`);
  pdf.put(ID.cidFont, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraBook /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptor} 0 R /DW 1000 /W [${wStr}] >>`);
  pdf.put(ID.fontDescriptor, `<< /Type /FontDescriptor /FontName /ToraBook /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFile} 0 R >>`);
  const ffStream = Buffer.concat([
    Buffer.from(`<< /Length ${font.subsetBytes.length} /Length1 ${font.subsetBytes.length} >>\nstream\n`, 'latin1'),
    font.subsetBytes,
    Buffer.from('\nendstream', 'latin1')
  ]);
  pdf.put(ID.fontFile, ffStream); // 5
  const toUni = buildToUnicode(font);
  pdf.put(ID.toUnicode, `<< /Length ${toUni.length} >>\nstream\n${toUni}\nendstream`); // 6

  // **S4.15:** הגופן המשני (FrankReal-Bold — מילות-חלון) — אותם אובייקטים בשמות שונים
  if (font2) {
    const wArray2 = [];
    let run2 = null;
    let prevGid2 = -10;
    for (const g of [...font2.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font2.widthsUnits.get(g) / font2.unitsPerEm) * 1000);
      if (g === prevGid2 + 1 && run2) run2.push(wv);
      else { if (run2) wArray2.push(run2); run2 = [g, wv]; }
      prevGid2 = g;
    }
    if (run2) wArray2.push(run2);
    const wStr2 = wArray2.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0b, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraWin /Encoding /Identity-H /DescendantFonts [${ID.cidFontb} 0 R] /ToUnicode ${ID.toUnicodeb} 0 R >>`);
    pdf.put(ID.cidFontb, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraWin /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptorb} 0 R /DW 1000 /W [${wStr2}] >>`);
    pdf.put(ID.fontDescriptorb, `<< /Type /FontDescriptor /FontName /ToraWin /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 751 /Descent -135 /CapHeight 700 /StemV 120 /FontFile2 ${ID.fontFileb} 0 R >>`);
    const ff2 = Buffer.concat([
      Buffer.from(`<< /Length ${font2.subsetBytes.length} /Length1 ${font2.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font2.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFileb, ff2);
    const toUni2 = buildToUnicode(font2);
    pdf.put(ID.toUnicodeb, `<< /Length ${toUni2.length} >>\nstream\n${toUni2}\nendstream`);
  }

  // **S4.26:** הגופן הרביעי (Frank Ruhl Libre — fallback לפיסוק) — אותם
  // אובייקטים בשמות שונים (מטריקות: asc 1000/1000, desc −200/1000).
  if (font4) {
    const wArray4 = [];
    let run4 = null;
    let prevGid4 = -10;
    for (const g of [...font4.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font4.widthsUnits.get(g) / font4.unitsPerEm) * 1000);
      if (g === prevGid4 + 1 && run4) run4.push(wv);
      else { if (run4) wArray4.push(run4); run4 = [g, wv]; }
      prevGid4 = g;
    }
    if (run4) wArray4.push(run4);
    const wStr4 = wArray4.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0d, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraPunct /Encoding /Identity-H /DescendantFonts [${ID.cidFontd} 0 R] /ToUnicode ${ID.toUnicoded} 0 R >>`);
    pdf.put(ID.cidFontd, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraPunct /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptord} 0 R /DW 1000 /W [${wStr4}] >>`);
    pdf.put(ID.fontDescriptord, `<< /Type /FontDescriptor /FontName /ToraPunct /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 1000 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFiled} 0 R >>`);
    const ff4 = Buffer.concat([
      Buffer.from(`<< /Length ${font4.subsetBytes.length} /Length1 ${font4.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font4.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFiled, ff4);
    const toUni4 = buildToUnicode(font4);
    pdf.put(ID.toUnicoded, `<< /Length ${toUni4.length} >>\nstream\n${toUni4}\nendstream`);
  }

  // **S4.26:** הגופן השלישי (DavidLibre-Bold — כותרות/TOC) — אותם אובייקטים
  // בשמות שונים (מטריקות אמת: ascender 1599/2048=781, descender −449/2048=−219).
  if (font3) {
    const wArray3 = [];
    let run3 = null;
    let prevGid3 = -10;
    for (const g of [...font3.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font3.widthsUnits.get(g) / font3.unitsPerEm) * 1000);
      if (g === prevGid3 + 1 && run3) run3.push(wv);
      else { if (run3) wArray3.push(run3); run3 = [g, wv]; }
      prevGid3 = g;
    }
    if (run3) wArray3.push(run3);
    const wStr3 = wArray3.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0c, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraHead /Encoding /Identity-H /DescendantFonts [${ID.cidFontc} 0 R] /ToUnicode ${ID.toUnicodec} 0 R >>`);
    pdf.put(ID.cidFontc, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraHead /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptorc} 0 R /DW 1000 /W [${wStr3}] >>`);
    pdf.put(ID.fontDescriptorc, `<< /Type /FontDescriptor /FontName /ToraHead /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 781 /Descent -219 /CapHeight 700 /StemV 120 /FontFile2 ${ID.fontFilec} 0 R >>`);
    const ff3 = Buffer.concat([
      Buffer.from(`<< /Length ${font3.subsetBytes.length} /Length1 ${font3.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font3.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFilec, ff3);
    const toUni3 = buildToUnicode(font3);
    pdf.put(ID.toUnicodec, `<< /Length ${toUni3.length} >>\nstream\n${toUni3}\nendstream`);
  }

  // **S5.1:** הגופן החמישי (Frank Ruhl Libre — גוף ההערה, /F5) — אותם
  // אובייקטים בשמות שונים. מטריקות: asc 1000/1000, desc −200/1000 (כמו /F4,
  // אותו גופן קובץ).
  if (font5) {
    const wArray5 = [];
    let run5 = null;
    let prevGid5 = -10;
    for (const g of [...font5.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font5.widthsUnits.get(g) / font5.unitsPerEm) * 1000);
      if (g === prevGid5 + 1 && run5) run5.push(wv);
      else { if (run5) wArray5.push(run5); run5 = [g, wv]; }
      prevGid5 = g;
    }
    if (run5) wArray5.push(run5);
    const wStr5 = wArray5.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0e, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraFn /Encoding /Identity-H /DescendantFonts [${ID.cidFonte} 0 R] /ToUnicode ${ID.toUnicodee} 0 R >>`);
    pdf.put(ID.cidFonte, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraFn /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptore} 0 R /DW 1000 /W [${wStr5}] >>`);
    pdf.put(ID.fontDescriptore, `<< /Type /FontDescriptor /FontName /ToraFn /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 1000 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFilee} 0 R >>`);
    const ff5 = Buffer.concat([
      Buffer.from(`<< /Length ${font5.subsetBytes.length} /Length1 ${font5.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font5.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFilee, ff5);
    const toUni5 = buildToUnicode(font5);
    pdf.put(ID.toUnicodee, `<< /Length ${toUni5.length} >>\nstream\n${toUni5}\nendstream`);
  }

  // **S5.1:** הגופן השישי (Hadassah Friedlaender — הערות-צד, /F6).
  if (font6) {
    const wArray6 = [];
    let run6 = null;
    let prevGid6 = -10;
    for (const g of [...font6.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font6.widthsUnits.get(g) / font6.unitsPerEm) * 1000);
      if (g === prevGid6 + 1 && run6) run6.push(wv);
      else { if (run6) wArray6.push(run6); run6 = [g, wv]; }
      prevGid6 = g;
    }
    if (run6) wArray6.push(run6);
    const wStr6 = wArray6.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0f, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraMargin /Encoding /Identity-H /DescendantFonts [${ID.cidFontf} 0 R] /ToUnicode ${ID.toUnicodef} 0 R >>`);
    pdf.put(ID.cidFontf, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraMargin /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptorf} 0 R /DW 1000 /W [${wStr6}] >>`);
    pdf.put(ID.fontDescriptorf, `<< /Type /FontDescriptor /FontName /ToraMargin /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFilef} 0 R >>`);
    const ff6 = Buffer.concat([
      Buffer.from(`<< /Length ${font6.subsetBytes.length} /Length1 ${font6.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font6.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFilef, ff6);
    const toUni6 = buildToUnicode(font6);
    pdf.put(ID.toUnicodef, `<< /Length ${toUni6.length} >>\nstream\n${toUni6}\nendstream`);
  }

  // **S73 (גופנים דינמיים):** כתיבת אובייקטי המשפחות הנוספות — אותם חמישה
  // אובייקטים כמו שאר הגופנים (Type0/CIDFontType2/FontDescriptor/FontFile2/
  // ToUnicode). שם ה-BaseFont נגזר מהאינדקס (ToraEx1, ToraEx2, …) — שמות
  // משפחה עלולים להכיל רווחים/תווים בלתי-חוקיים בשם PDF. מטריקות ה-Ascent/
  // Descent מפרופיל הגופן הרשום (נפילה 800/−200 — כמו הגוף).
  extraFonts.forEach((ef, i) => {
    const wArrE = [];
    let runE = null;
    let prevGidE = -10;
    for (const g of [...ef.font.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((ef.font.widthsUnits.get(g) / ef.font.unitsPerEm) * 1000);
      if (g === prevGidE + 1 && runE) runE.push(wv);
      else { if (runE) wArrE.push(runE); runE = [g, wv]; }
      prevGidE = g;
    }
    if (runE) wArrE.push(runE);
    const wStrE = wArrE.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    const baseName = `ToraEx${i + 1}`;
    const ascE = Math.round(ef.ascentEm * 1000);
    const descE = -Math.round(Math.abs(ef.descentEm) * 1000);
    pdf.put(ef.ids.type0, `<< /Type /Font /Subtype /Type0 /BaseFont /${baseName} /Encoding /Identity-H /DescendantFonts [${ef.ids.cidFont} 0 R] /ToUnicode ${ef.ids.toUnicode} 0 R >>`);
    pdf.put(ef.ids.cidFont, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${baseName} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ef.ids.fontDescriptor} 0 R /DW 1000 /W [${wStrE}] >>`);
    pdf.put(ef.ids.fontDescriptor, `<< /Type /FontDescriptor /FontName /${baseName} /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent ${ascE} /Descent ${descE} /CapHeight ${Math.round(ef.ascentEm * 700)} /StemV 80 /FontFile2 ${ef.ids.fontFile} 0 R >>`);
    const ffE = Buffer.concat([
      Buffer.from(`<< /Length ${ef.font.subsetBytes.length} /Length1 ${ef.font.subsetBytes.length} >>\nstream\n`, 'latin1'),
      ef.font.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ef.ids.fontFile, ffE);
    const toUniE = buildToUnicode(ef.font);
    pdf.put(ef.ids.toUnicode, `<< /Length ${toUniE.length} >>\nstream\n${toUniE}\nendstream`);
  });

  for (const image of inlineImages) {
    const dictionary = image.filter === 'DCTDecode'
      ? '<< /Type /XObject /Subtype /Image /Width ' + image.width + ' /Height ' + image.height +
        ' /ColorSpace /' + image.colorSpace + ' /BitsPerComponent ' + image.bits +
        ' /Filter /DCTDecode /Length __LENGTH__ >>'
      : '<< /Type /XObject /Subtype /Image /Width ' + image.width + ' /Height ' + image.height +
        ' /ColorSpace /' + image.colorSpace + ' /BitsPerComponent ' + image.bits +
        ' /Filter /FlateDecode' + (image.smaskId ? ' /SMask ' + image.smaskId + ' 0 R' : '') +
        ' /Length __LENGTH__ >>';
    pdf.put(image.objectId, streamBuffer(dictionary, image.data));
    if (image.smaskId) {
      const smaskDictionary = '<< /Type /XObject /Subtype /Image /Width ' + image.width + ' /Height ' + image.height +
        ' /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length __LENGTH__ >>';
      pdf.put(image.smaskId, streamBuffer(smaskDictionary, image.alphaBytes));
    }
  }

  // ---- עמודים ----
  // **S6.0 (R5-M6 — תיבות עמוד חוקיות):** TrimBox = גודל העמוד; BleedBox
  // בתוך ה-MediaBox (בעבר ה-BleedBox חרג **מחוץ** ל-MediaBox — הפרה של
  // PDF 32000-1 §14.11.2 והבליד לא היה קיים כלל). עם בליד/סימני-חיתוך
  // ה-MediaBox מתרחב סביב ה-Trim; הקואורדינטות של התוכן לא משתנות
  // (הן יחסיות לראשית ה-Trim שנותרת 0,0).
  const markExtPt = cropMarks ? (0.5 + 5) * MM_TO_PT : 0;
  const extPt = Math.max(bleedPt, markExtPt);
  const trimbox = `[0 0 ${round2(wPt)} ${round2(hPt)}]`;
  const mediabox = extPt > 0.01
    ? `[${round2(-extPt)} ${round2(-extPt)} ${round2(wPt + extPt)} ${round2(hPt + extPt)}]`
    : trimbox;
  const bleedbox = bleedPt > 0.01
    ? `[${round2(-bleedPt)} ${round2(-bleedPt)} ${round2(wPt + bleedPt)} ${round2(hPt + bleedPt)}]`
    : trimbox;
  pages.forEach((pg, i) => {
    const annots = linkIds.get(i) || [];
    const annotsStr = annots.length ? ` /Annots [${annots.map(id => `${id} 0 R`).join(' ')}]` : '';
    // **S5.1:** רשימת גופנים דינמית — מחרוזת זהה בדיוק לצירופים הקיימים
    // (סדר F1,F2,F3,F4), ותוספת טבעית ל-/F5 (גוף הערה) ו-/F6 (הערות-צד).
    const fontPairs = [['/F1', ID.type0]];
    if (font2) fontPairs.push(['/F2', ID.type0b]);
    if (font3) fontPairs.push(['/F3', ID.type0c]);
    if (font4) fontPairs.push(['/F4', ID.type0d]);
    if (font5) fontPairs.push(['/F5', ID.type0e]);
    if (font6) fontPairs.push(['/F6', ID.type0f]);
    // **S73:** הגופנים הדינמיים באותם משאבים לכל עמוד — סדר קבוע (דטרמיניזם)
    extraFonts.forEach((ef, i) => fontPairs.push([`/F${7 + i}`, ef.ids.type0]));
    const fontRes = `/Font << ${fontPairs.map(([n, id]) => `${n} ${id} 0 R`).join(' ')} >>`;
    const xObjectRes = inlineImages.length
      ? ' /XObject << ' + inlineImages.map(image => '/' + image.name + ' ' + image.objectId + ' 0 R').join(' ') + ' >>'
      : '';
    pdf.put(pageIds[i], `<< /Type /Page /Parent ${ID.pages} 0 R /MediaBox ${mediabox} /TrimBox ${trimbox} /BleedBox ${bleedbox} /Resources << ${fontRes}${xObjectRes} >> /Contents ${contentIds[i]} 0 R${annotsStr} >>`);
    pdf.put(contentIds[i], Buffer.concat([
      Buffer.from(`<< /Length ${contents[i].length} >>\nstream\n`, 'latin1'),
      contents[i],
      Buffer.from('\nendstream', 'latin1')
    ]));
  });

  // ---- קישורי TOC ----
  let linkCursor = 0;
  for (const link of tocLinks || []) {
    const id = linkIds.get(link.page)[0] ? null : null;
    void id;
  }
  // סדר הקצאת הקישורים: לפי סדר tocLinks (אותו סדר בשמור המזהים)
  {
    const perPage = new Map();
    for (const link of tocLinks || []) {
      if (!perPage.has(link.page)) perPage.set(link.page, []);
      perPage.get(link.page).push(link);
    }
    for (const [pgIdx, links] of perPage) {
      const ids = linkIds.get(pgIdx);
      links.forEach((link, j) => {
        const x1 = link.x * PX_TO_PT, y1 = hPt - (link.y + link.h) * PX_TO_PT;
        const x2 = (link.x + link.w) * PX_TO_PT, y2 = hPt - link.y * PX_TO_PT;
        pdf.put(ids[j], `<< /Type /Annot /Subtype /Link /Rect [${round2(x1)} ${round2(y1)} ${round2(x2)} ${round2(y2)}] /Border [0 0 0] /Dest [${pageIds[link.targetPage]} 0 R /XYZ null null null] >>`);
      });
    }
    void linkCursor;
  }

  // ---- סימניות ----
  if (outlineItems.length) {
    pdf.put(ID.outlines, `<< /Type /Outlines /First ${roots[0].id} 0 R /Last ${roots[roots.length - 1].id} 0 R /Count ${flatOrder.length} >>`);
    for (const it of flatOrder) {
      const parts = [
        '<< /Title ' + pdfTitleHex(it.title),
        `/Parent ${it.parent ? it.parent.id : ID.outlines} 0 R`,
        `/Dest [${pageIds[it.page]} 0 R /XYZ null null null]`,
        `/Count ${it.children.length}`
      ];
      if (it.prev) parts.push(`/Prev ${it.prev.id} 0 R`);
      if (it.next) parts.push(`/Next ${it.next.id} 0 R`);
      if (it.children.length) parts.push(`/First ${it.children[0].id} 0 R /Last ${it.children[it.children.length - 1].id} 0 R`);
      pdf.put(it.id, parts.join(' ') + ' >>');
    }
  } else {
    pdf.put(ID.outlines, `<< /Type /Outlines /Count 0 >>`);
  }

  return pdf.build();
}

module.exports = { writePdf, PdfBuilder, PX_TO_PT, MM_TO_PT, visualOrderRtl, BRACKET_MIRROR, decodePngForPdf, encodeZlibStored, registerPdfInlineItemRenderer };
