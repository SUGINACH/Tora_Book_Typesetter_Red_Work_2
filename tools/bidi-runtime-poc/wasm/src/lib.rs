use core::ptr;
use core::slice;

use icu_properties::props::{GeneralCategory, Script};
use icu_properties::CodePointMapData;
use icu_properties::script::ScriptWithExtensions;
use icu_properties::PropertyNamesShort;
use icu_segmenter::GraphemeClusterSegmenter;
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

fn icu_unicode_18_is_pinned() -> bool {
    icu_segmenter_data::unicode_tag!() == "18.0.0"
        && icu_properties_data::unicode_tag!() == "18.0.0"
        && icu_segmenter_data::unicode_tag!() == icu_properties_data::unicode_tag!()
}

fn script_tag(script: Script) -> u32 {
    let short_name = PropertyNamesShort::<Script>::new()
        .get(script)
        .unwrap_or("Zzzz");
    let bytes = short_name.as_bytes();
    if bytes.len() != 4 {
        return u32::from_be_bytes(*b"Zzzz");
    }
    u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
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
pub extern "C" fn bidi_itemizer_unicode_version_major() -> u32 {
    if icu_unicode_18_is_pinned() { 18 } else { 0 }
}

#[no_mangle]
pub extern "C" fn bidi_itemizer_unicode_version_minor() -> u32 {
    if icu_unicode_18_is_pinned() { 0 } else { 0 }
}

#[no_mangle]
pub extern "C" fn bidi_itemizer_unicode_version_patch() -> u32 {
    if icu_unicode_18_is_pinned() { 0 } else { 0 }
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
        || line_start > line_end
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
    if line_start == line_end {
        return boxed_u32(vec![0, 0]);
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

// Itemization ABI layout:
// [utf16_len, grapheme_count, scalar_count, extension_count,
//  graphemes: (start,end,scalar_start,scalar_end)*,
//  scalars: (start,end,script_tag,is_mark,extension_start,extension_count)*,
//  extension_script_tags...]
//
// Script tags are packed ISO 15924 four-byte ASCII values (e.g. Hebr, Latn,
// Zyyy, Zinh). Grapheme and scalar offsets are UTF-16 code-unit offsets.
// The data is Unicode Script, General_Category mark membership (Mn/Me/Mc),
// and Script_Extensions; contextual assignment
// of Common/Inherited clusters is performed by the JS adapter and is never
// allowed to move or split a grapheme boundary.
#[no_mangle]
pub unsafe extern "C" fn bidi_grapheme_script_map(
    pointer: *const u16,
    length: usize,
) -> *mut u32 {
    if length > 16_000_000 || (length > 0 && pointer.is_null()) {
        return ptr::null_mut();
    }
    if length == 0 {
        return boxed_u32(vec![0, 0, 0, 0]);
    }

    let utf16 = slice::from_raw_parts(pointer, length);
    let Ok(text) = String::from_utf16(utf16) else {
        return ptr::null_mut();
    };

    // ICU4X V2 state-machine data is generated for Unicode 18.0.0 and
    // implements the full extended-grapheme rules, including GB9 and GB9c.
    // Use V2 directly rather than stacking local rule patches over V1.
    let grapheme_segmenter = GraphemeClusterSegmenter::new_neo();
    let boundaries: Vec<usize> = grapheme_segmenter.segment_utf16(utf16).collect();
    if boundaries.first().copied() != Some(0)
        || boundaries.last().copied() != Some(length)
        || boundaries.windows(2).any(|pair| pair[0] >= pair[1])
        || boundaries.iter().any(|&offset| !is_utf16_boundary(utf16, offset))
    {
        return ptr::null_mut();
    }

    struct ScalarRecord {
        start: usize,
        end: usize,
        script: u32,
        is_mark: bool,
        extensions: Vec<u32>,
    }

    let script_data = ScriptWithExtensions::new();
    let general_category_data = CodePointMapData::<GeneralCategory>::new();
    let mut scalars = Vec::<ScalarRecord>::new();
    let mut utf16_offset = 0usize;
    for ch in text.chars() {
        let width = ch.len_utf16();
        let script = script_tag(script_data.get_script_val(ch));
        let general_category = general_category_data.get(ch);
        let is_mark = matches!(
            general_category,
            GeneralCategory::NonspacingMark
                | GeneralCategory::EnclosingMark
                | GeneralCategory::SpacingMark
        );
        let extensions = script_data
            .get_script_extensions_val(ch)
            .iter()
            .map(script_tag)
            .collect::<Vec<_>>();
        scalars.push(ScalarRecord {
            start: utf16_offset,
            end: utf16_offset + width,
            script,
            is_mark,
            extensions,
        });
        utf16_offset += width;
    }
    if utf16_offset != length {
        return ptr::null_mut();
    }

    let mut grapheme_table = Vec::<u32>::with_capacity((boundaries.len() - 1) * 4);
    let mut scalar_index = 0usize;
    for pair in boundaries.windows(2) {
        let start = pair[0];
        let end = pair[1];
        let scalar_start = scalar_index;
        while scalar_index < scalars.len() && scalars[scalar_index].end <= end {
            scalar_index += 1;
        }
        if scalar_start == scalar_index
            || scalars[scalar_start].start != start
            || scalars[scalar_index - 1].end != end
        {
            return ptr::null_mut();
        }
        grapheme_table.extend([
            start as u32,
            end as u32,
            scalar_start as u32,
            scalar_index as u32,
        ]);
    }
    if scalar_index != scalars.len() {
        return ptr::null_mut();
    }

    let extension_count: usize = scalars.iter().map(|scalar| scalar.extensions.len()).sum();
    let mut scalar_table = Vec::<u32>::with_capacity(scalars.len() * 6);
    let mut extension_values = Vec::<u32>::with_capacity(extension_count);
    for scalar in &scalars {
        let extension_start = extension_values.len();
        scalar_table.extend([
            scalar.start as u32,
            scalar.end as u32,
            scalar.script,
            u32::from(scalar.is_mark),
            extension_start as u32,
            scalar.extensions.len() as u32,
        ]);
        extension_values.extend_from_slice(&scalar.extensions);
    }

    let grapheme_count = boundaries.len().saturating_sub(1);
    let mut result = Vec::<u32>::with_capacity(
        4 + grapheme_table.len() + scalar_table.len() + extension_values.len(),
    );
    result.extend([
        length as u32,
        grapheme_count as u32,
        scalars.len() as u32,
        extension_values.len() as u32,
    ]);
    result.extend(grapheme_table);
    result.extend(scalar_table);
    result.extend(extension_values);
    boxed_u32(result)
}
