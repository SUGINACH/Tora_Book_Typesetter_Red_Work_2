'use strict';

/**
 * Page-level allocator for anchored margin items.
 *
 * Column layout determines each note's preferred anchor. This pass runs only
 * after every column has been projected, so notes from both columns share one
 * vertical lane per physical margin. It preserves note order and text lines;
 * only the y coordinates may move to prevent collisions.
 */
function packMarginNotes(notes = [], options = {}) {
  const top = Number.isFinite(options.top) ? options.top : 0;
  const bottom = Number.isFinite(options.bottom) ? options.bottom : Infinity;
  const pitch = Number.isFinite(options.pitch) && options.pitch > 0 ? options.pitch : 1;
  const gap = Number.isFinite(options.gap) && options.gap >= 0 ? options.gap : 1;
  if (bottom <= top) throw new RangeError('margin-flow: bottom must be greater than top');

  const output = (Array.isArray(notes) ? notes : []).map((note, index) => ({
    ...note,
    lines: Array.isArray(note && note.lines) ? note.lines.map(line => ({ ...line })) : [],
    _marginOrder: index
  }));
  const diagnostics = [];
  const groups = new Map([['right', []], ['left', []]]);

  for (const note of output) {
    if (!note || !groups.has(note.side)) {
      diagnostics.push({ code: 'MARGIN_NOTE_INVALID_SIDE', index: note?._marginOrder ?? -1 });
      continue;
    }
    if (!note.lines.length) continue;
    const desiredTop = Number.isFinite(note.anchorY)
      ? note.anchorY
      : (Number.isFinite(note.lines[0].y) ? note.lines[0].y : top);
    const lineYs = note.lines.map(line => line.y).filter(Number.isFinite);
    if (lineYs.length !== note.lines.length) {
      diagnostics.push({ code: 'MARGIN_NOTE_INVALID_GEOMETRY', index: note._marginOrder });
      continue;
    }
    const oldTop = Math.min(...lineYs);
    const height = (Math.max(...lineYs) - oldTop) + pitch;
    if (!(height > 0) || !Number.isFinite(height)) {
      diagnostics.push({ code: 'MARGIN_NOTE_INVALID_GEOMETRY', index: note._marginOrder });
      continue;
    }
    groups.get(note.side).push({ note, desiredTop, oldTop, height, y: desiredTop });
  }

  for (const [side, entries] of groups) {
    entries.sort((a, b) => a.desiredTop - b.desiredTop || a.note._marginOrder - b.note._marginOrder);
    // Forward pass: honor every preferred anchor unless it collides with the
    // preceding item in this same physical margin.
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      item.y = Math.max(top, item.desiredTop);
      if (i > 0) {
        const prev = entries[i - 1];
        item.y = Math.max(item.y, prev.y + prev.height + gap);
      }
    }

    // If the lane overflows below the page, compact the entire ordered run
    // upward from the bottom. This moves notes only as far as necessary.
    if (entries.length) {
      const last = entries[entries.length - 1];
      if (last.y + last.height > bottom) {
        last.y = bottom - last.height;
        for (let i = entries.length - 2; i >= 0; i--) {
          const next = entries[i + 1];
          entries[i].y = Math.min(entries[i].y, next.y - gap - entries[i].height);
        }
      }
    }

    const totalHeight = entries.reduce((sum, item) => sum + item.height, 0)
      + Math.max(0, entries.length - 1) * gap;
    const capacity = bottom - top;
    const overflow = totalHeight > capacity + 1e-7 || (entries[0] && entries[0].y < top - 1e-7);

    // If the notes cannot physically fit, keep every line in order and
    // non-overlapping, and report the page overflow instead of clipping text.
    if (overflow && entries.length) {
      let y = top;
      for (const item of entries) {
        item.y = y;
        y += item.height + gap;
      }
      diagnostics.push({
        code: 'MARGIN_NOTES_EXCEED_LANE',
        side,
        requiredHeight: totalHeight,
        availableHeight: capacity,
        overflowPx: Math.max(0, totalHeight - capacity)
      });
    }

    for (const item of entries) {
      const delta = item.y - item.oldTop;
      item.note.anchorY = item.y;
      item.note.lines = item.note.lines.map(line => ({
        ...line,
        y: Number.isFinite(line.y) ? line.y + delta : line.y
      }));
    }
  }

  for (const note of output) delete note._marginOrder;
  return { notes: output, diagnostics };
}

module.exports = { packMarginNotes };
