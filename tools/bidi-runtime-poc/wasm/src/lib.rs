use core::ptr;
use core::slice;

use unicode_bidi::utf16::BidiInfo;
use unicode_bidi::{Level, UNICODE_VERSION};

fn base_level(value: u32) -> Option<Option<Level>> {
    match value {
        0 => Some(Some(Level::ltr())),
        1 => Some(Some(Level::rtl())),
        2 => Some(None),
        _ => None,
    }
}

fn boxed_u32(values: Vec<u32>) -> *mut u32 {
    Box::into_raw(values.into_boxed_slice()) as *mut u32
}

fn is_utf16_boundary(text: &[u16], index: usize) -> bool {
    if index == 0 || index >= text.len() {
        return true;
    }
    let previous = text[index - 1];
    let current = text[index];
    !(0xD800..=0xDBFF).contains(&previous) || !(0xDC00..=0xDFFF).contains(&current)
}

#[no_mangle]
pub extern "C" fn bidi_unicode_version_major() -> u32 {
    UNICODE_VERSION.0 as u32
}

#[no_mangle]
pub extern "C" fn bidi_unicode_version_minor() -> u32 {
    UNICODE_VERSION.1 as u32
}

#[no_mangle]
pub extern "C" fn bidi_unicode_version_patch() -> u32 {
    UNICODE_VERSION.2 as u32
}

#[no_mangle]
pub extern "C" fn bidi_alloc_u16(length: usize) -> *mut u16 {
    if length == 0 || length > 16_000_000 {
        return ptr::null_mut();
    }
    Box::into_raw(vec![0u16; length].into_boxed_slice()) as *mut u16
}

#[no_mangle]
pub unsafe extern "C" fn bidi_free_u16(pointer: *mut u16, length: usize) {
    if pointer.is_null() || length == 0 {
        return;
    }
    let slice_pointer = ptr::slice_from_raw_parts_mut(pointer, length);
    drop(Box::from_raw(slice_pointer));
}

#[no_mangle]
pub unsafe extern "C" fn bidi_free_u32(pointer: *mut u32, length: usize) {
    if pointer.is_null() || length == 0 {
        return;
    }
    let slice_pointer = ptr::slice_from_raw_parts_mut(pointer, length);
    drop(Box::from_raw(slice_pointer));
}

// Layout: [utf16_length, paragraph_count, levels..., (start,end,base_level)...].
// All offsets and ranges are absolute UTF-16 code-unit offsets.
#[no_mangle]
pub unsafe extern "C" fn bidi_resolve(
    pointer: *const u16,
    length: usize,
    base_direction: u32,
) -> *mut u32 {
    if pointer.is_null() || length == 0 || length > 16_000_000 {
        return ptr::null_mut();
    }
    let Some(default_level) = base_level(base_direction) else {
        return ptr::null_mut();
    };
    let text = slice::from_raw_parts(pointer, length);
    let info = BidiInfo::new(text, default_level);

    let mut result = Vec::<u32>::with_capacity(2 + length + info.paragraphs.len() * 3);
    result.push(length as u32);
    result.push(info.paragraphs.len() as u32);
    result.extend(info.levels.iter().map(|level| level.number() as u32));
    for paragraph in &info.paragraphs {
        result.push(paragraph.range.start as u32);
        result.push(paragraph.range.end as u32);
        result.push(paragraph.level.number() as u32);
    }
    boxed_u32(result)
}

// Layout: [line_length, visual_run_count, line_levels..., (start,end,level)...].
// Visual runs are returned in UAX #9 L2 visual order. Their source ranges remain
// absolute UTF-16 code-unit offsets; levels include line-specific L1 adjustment.
#[no_mangle]
pub unsafe extern "C" fn bidi_line_visual_runs(
    pointer: *const u16,
    length: usize,
    base_direction: u32,
    line_start: usize,
    line_end: usize,
) -> *mut u32 {
    if pointer.is_null()
        || length == 0
        || length > 16_000_000
        || line_start >= line_end
        || line_end > length
    {
        return ptr::null_mut();
    }
    let Some(default_level) = base_level(base_direction) else {
        return ptr::null_mut();
    };
    let text = slice::from_raw_parts(pointer, length);
    if !is_utf16_boundary(text, line_start) || !is_utf16_boundary(text, line_end) {
        return ptr::null_mut();
    }

    let info = BidiInfo::new(text, default_level);
    let Some(paragraph) = info.paragraphs.iter().find(|paragraph| {
        line_start >= paragraph.range.start && line_end <= paragraph.range.end
    }) else {
        return ptr::null_mut();
    };

    let (line_levels, visual_runs) = info.visual_runs(paragraph, line_start..line_end);
    let mut result = Vec::<u32>::with_capacity(2 + (line_end - line_start) + visual_runs.len() * 3);
    result.push((line_end - line_start) as u32);
    result.push(visual_runs.len() as u32);
    result.extend(
        line_levels[line_start..line_end]
            .iter()
            .map(|level| level.number() as u32),
    );
    for run in visual_runs {
        if run.start >= run.end || run.start < line_start || run.end > line_end {
            return ptr::null_mut();
        }
        result.push(run.start as u32);
        result.push(run.end as u32);
        result.push(line_levels[run.start].number() as u32);
    }
    boxed_u32(result)
}
