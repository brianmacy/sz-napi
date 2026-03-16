//! SzFlags export as BigInt values for JavaScript consumption.
//!
//! All flags are exported via a helper function that returns flag name-value pairs.
//! The JS wrapper builds a frozen `SzFlags` object from these values.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_rust_sdk::flags::SzFlags;

/// A single flag entry with name and u64 value.
#[allow(dead_code)] // Used via NAPI FFI exports
#[napi(object)]
pub struct FlagEntry {
    pub name: String,
    pub value: BigInt,
}

/// Returns all SzFlags as name-value pairs.
///
/// The JS wrapper uses this to build the frozen `SzFlags` export object.
/// Values are BigInt to correctly represent all 64-bit flag values including
/// WITH_INFO at bit 62.
#[allow(dead_code)] // Used via NAPI FFI exports
#[napi]
pub fn get_all_flags() -> Vec<FlagEntry> {
    let mut flags = Vec::with_capacity(80);

    macro_rules! flag {
        ($name:expr, $value:expr) => {
            flags.push(FlagEntry {
                name: $name.to_string(),
                value: BigInt::from($value.bits()),
            });
        };
    }

    // Individual flags
    flag!(
        "EXPORT_INCLUDE_MULTI_RECORD_ENTITIES",
        SzFlags::EXPORT_INCLUDE_MULTI_RECORD_ENTITIES
    );
    flag!(
        "EXPORT_INCLUDE_POSSIBLY_SAME",
        SzFlags::EXPORT_INCLUDE_POSSIBLY_SAME
    );
    flag!(
        "EXPORT_INCLUDE_POSSIBLY_RELATED",
        SzFlags::EXPORT_INCLUDE_POSSIBLY_RELATED
    );
    flag!(
        "EXPORT_INCLUDE_NAME_ONLY",
        SzFlags::EXPORT_INCLUDE_NAME_ONLY
    );
    flag!(
        "EXPORT_INCLUDE_DISCLOSED",
        SzFlags::EXPORT_INCLUDE_DISCLOSED
    );
    flag!(
        "EXPORT_INCLUDE_SINGLE_RECORD_ENTITIES",
        SzFlags::EXPORT_INCLUDE_SINGLE_RECORD_ENTITIES
    );

    flag!(
        "ENTITY_INCLUDE_POSSIBLY_SAME_RELATIONS",
        SzFlags::ENTITY_INCLUDE_POSSIBLY_SAME_RELATIONS
    );
    flag!(
        "ENTITY_INCLUDE_POSSIBLY_RELATED_RELATIONS",
        SzFlags::ENTITY_INCLUDE_POSSIBLY_RELATED_RELATIONS
    );
    flag!(
        "ENTITY_INCLUDE_NAME_ONLY_RELATIONS",
        SzFlags::ENTITY_INCLUDE_NAME_ONLY_RELATIONS
    );
    flag!(
        "ENTITY_INCLUDE_DISCLOSED_RELATIONS",
        SzFlags::ENTITY_INCLUDE_DISCLOSED_RELATIONS
    );

    flag!(
        "ENTITY_INCLUDE_ALL_FEATURES",
        SzFlags::ENTITY_INCLUDE_ALL_FEATURES
    );
    flag!(
        "ENTITY_INCLUDE_REPRESENTATIVE_FEATURES",
        SzFlags::ENTITY_INCLUDE_REPRESENTATIVE_FEATURES
    );

    flag!(
        "ENTITY_INCLUDE_ENTITY_NAME",
        SzFlags::ENTITY_INCLUDE_ENTITY_NAME
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_SUMMARY",
        SzFlags::ENTITY_INCLUDE_RECORD_SUMMARY
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_DATA",
        SzFlags::ENTITY_INCLUDE_RECORD_DATA
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_MATCHING_INFO",
        SzFlags::ENTITY_INCLUDE_RECORD_MATCHING_INFO
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_JSON_DATA",
        SzFlags::ENTITY_INCLUDE_RECORD_JSON_DATA
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_FEATURES",
        SzFlags::ENTITY_INCLUDE_RECORD_FEATURES
    );

    flag!(
        "ENTITY_INCLUDE_RELATED_ENTITY_NAME",
        SzFlags::ENTITY_INCLUDE_RELATED_ENTITY_NAME
    );
    flag!(
        "ENTITY_INCLUDE_RELATED_MATCHING_INFO",
        SzFlags::ENTITY_INCLUDE_RELATED_MATCHING_INFO
    );
    flag!(
        "ENTITY_INCLUDE_RELATED_RECORD_SUMMARY",
        SzFlags::ENTITY_INCLUDE_RELATED_RECORD_SUMMARY
    );
    flag!(
        "ENTITY_INCLUDE_RELATED_RECORD_DATA",
        SzFlags::ENTITY_INCLUDE_RELATED_RECORD_DATA
    );

    flag!(
        "ENTITY_INCLUDE_INTERNAL_FEATURES",
        SzFlags::ENTITY_INCLUDE_INTERNAL_FEATURES
    );
    flag!(
        "ENTITY_INCLUDE_FEATURE_STATS",
        SzFlags::ENTITY_INCLUDE_FEATURE_STATS
    );

    flag!("FIND_PATH_STRICT_AVOID", SzFlags::FIND_PATH_STRICT_AVOID);
    flag!(
        "FIND_PATH_INCLUDE_MATCHING_INFO",
        SzFlags::FIND_PATH_INCLUDE_MATCHING_INFO
    );

    flag!("INCLUDE_FEATURE_SCORES", SzFlags::INCLUDE_FEATURE_SCORES);
    flag!("SEARCH_INCLUDE_STATS", SzFlags::SEARCH_INCLUDE_STATS);

    flag!(
        "ENTITY_INCLUDE_RECORD_TYPES",
        SzFlags::ENTITY_INCLUDE_RECORD_TYPES
    );
    flag!(
        "ENTITY_INCLUDE_RELATED_RECORD_TYPES",
        SzFlags::ENTITY_INCLUDE_RELATED_RECORD_TYPES
    );

    flag!(
        "ENTITY_INCLUDE_RECORD_UNMAPPED_DATA",
        SzFlags::ENTITY_INCLUDE_RECORD_UNMAPPED_DATA
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_FEATURE_DETAILS",
        SzFlags::ENTITY_INCLUDE_RECORD_FEATURE_DETAILS
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_FEATURE_STATS",
        SzFlags::ENTITY_INCLUDE_RECORD_FEATURE_STATS
    );
    flag!(
        "ENTITY_INCLUDE_RECORD_DATES",
        SzFlags::ENTITY_INCLUDE_RECORD_DATES
    );

    flag!(
        "SEARCH_INCLUDE_ALL_CANDIDATES",
        SzFlags::SEARCH_INCLUDE_ALL_CANDIDATES
    );
    flag!(
        "FIND_NETWORK_INCLUDE_MATCHING_INFO",
        SzFlags::FIND_NETWORK_INCLUDE_MATCHING_INFO
    );
    flag!(
        "INCLUDE_MATCH_KEY_DETAILS",
        SzFlags::INCLUDE_MATCH_KEY_DETAILS
    );
    flag!("SEARCH_INCLUDE_REQUEST", SzFlags::SEARCH_INCLUDE_REQUEST);
    flag!(
        "SEARCH_INCLUDE_REQUEST_DETAILS",
        SzFlags::SEARCH_INCLUDE_REQUEST_DETAILS
    );

    flag!("WITH_INFO", SzFlags::WITH_INFO);

    // Search alias flags (same bit values as corresponding export flags)
    flag!("SEARCH_INCLUDE_RESOLVED", SzFlags::SEARCH_INCLUDE_RESOLVED);
    flag!(
        "SEARCH_INCLUDE_POSSIBLY_SAME",
        SzFlags::SEARCH_INCLUDE_POSSIBLY_SAME
    );
    flag!(
        "SEARCH_INCLUDE_POSSIBLY_RELATED",
        SzFlags::SEARCH_INCLUDE_POSSIBLY_RELATED
    );
    flag!(
        "SEARCH_INCLUDE_NAME_ONLY",
        SzFlags::SEARCH_INCLUDE_NAME_ONLY
    );

    // Composite flags
    flag!("NO_FLAGS", SzFlags::NO_FLAGS);
    flag!(
        "EXPORT_INCLUDE_ALL_ENTITIES",
        SzFlags::EXPORT_INCLUDE_ALL_ENTITIES
    );
    flag!(
        "EXPORT_INCLUDE_ALL_HAVING_RELATIONSHIPS",
        SzFlags::EXPORT_INCLUDE_ALL_HAVING_RELATIONSHIPS
    );
    flag!(
        "ENTITY_INCLUDE_ALL_RELATIONS",
        SzFlags::ENTITY_INCLUDE_ALL_RELATIONS
    );
    flag!(
        "SEARCH_INCLUDE_ALL_ENTITIES",
        SzFlags::SEARCH_INCLUDE_ALL_ENTITIES
    );
    flag!("ENTITY_CORE_FLAGS", SzFlags::ENTITY_CORE_FLAGS);
    flag!("RECORD_ALL_FLAGS", SzFlags::RECORD_ALL_FLAGS);
    flag!(
        "RECORD_PREVIEW_ALL_FLAGS",
        SzFlags::RECORD_PREVIEW_ALL_FLAGS
    );

    // Default/preset flags
    flag!("RECORD_DEFAULT_FLAGS", SzFlags::RECORD_DEFAULT_FLAGS);
    flag!(
        "RECORD_PREVIEW_DEFAULT_FLAGS",
        SzFlags::RECORD_PREVIEW_DEFAULT_FLAGS
    );
    flag!("ENTITY_DEFAULT_FLAGS", SzFlags::ENTITY_DEFAULT_FLAGS);
    flag!(
        "ENTITY_BRIEF_DEFAULT_FLAGS",
        SzFlags::ENTITY_BRIEF_DEFAULT_FLAGS
    );
    flag!("EXPORT_DEFAULT_FLAGS", SzFlags::EXPORT_DEFAULT_FLAGS);
    flag!("FIND_PATH_DEFAULT_FLAGS", SzFlags::FIND_PATH_DEFAULT_FLAGS);
    flag!(
        "FIND_NETWORK_DEFAULT_FLAGS",
        SzFlags::FIND_NETWORK_DEFAULT_FLAGS
    );
    flag!(
        "SEARCH_BY_ATTRIBUTES_ALL",
        SzFlags::SEARCH_BY_ATTRIBUTES_ALL
    );
    flag!(
        "SEARCH_BY_ATTRIBUTES_STRONG",
        SzFlags::SEARCH_BY_ATTRIBUTES_STRONG
    );
    flag!(
        "SEARCH_BY_ATTRIBUTES_MINIMAL_ALL",
        SzFlags::SEARCH_BY_ATTRIBUTES_MINIMAL_ALL
    );
    flag!(
        "SEARCH_BY_ATTRIBUTES_MINIMAL_STRONG",
        SzFlags::SEARCH_BY_ATTRIBUTES_MINIMAL_STRONG
    );
    flag!(
        "SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS",
        SzFlags::SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS
    );
    flag!(
        "WHY_ENTITIES_DEFAULT_FLAGS",
        SzFlags::WHY_ENTITIES_DEFAULT_FLAGS
    );
    flag!(
        "WHY_RECORDS_DEFAULT_FLAGS",
        SzFlags::WHY_RECORDS_DEFAULT_FLAGS
    );
    flag!(
        "WHY_RECORD_IN_ENTITY_DEFAULT_FLAGS",
        SzFlags::WHY_RECORD_IN_ENTITY_DEFAULT_FLAGS
    );
    flag!(
        "WHY_SEARCH_DEFAULT_FLAGS",
        SzFlags::WHY_SEARCH_DEFAULT_FLAGS
    );
    flag!(
        "HOW_ENTITY_DEFAULT_FLAGS",
        SzFlags::HOW_ENTITY_DEFAULT_FLAGS
    );
    flag!("HOW_ALL_FLAGS", SzFlags::HOW_ALL_FLAGS);
    flag!(
        "VIRTUAL_ENTITY_DEFAULT_FLAGS",
        SzFlags::VIRTUAL_ENTITY_DEFAULT_FLAGS
    );
    flag!(
        "VIRTUAL_ENTITY_ALL_FLAGS",
        SzFlags::VIRTUAL_ENTITY_ALL_FLAGS
    );
    flag!(
        "ADD_RECORD_DEFAULT_FLAGS",
        SzFlags::ADD_RECORD_DEFAULT_FLAGS
    );
    flag!("ADD_RECORD_ALL_FLAGS", SzFlags::ADD_RECORD_ALL_FLAGS);
    flag!(
        "DELETE_RECORD_DEFAULT_FLAGS",
        SzFlags::DELETE_RECORD_DEFAULT_FLAGS
    );
    flag!("DELETE_RECORD_ALL_FLAGS", SzFlags::DELETE_RECORD_ALL_FLAGS);
    flag!(
        "REEVALUATE_RECORD_DEFAULT_FLAGS",
        SzFlags::REEVALUATE_RECORD_DEFAULT_FLAGS
    );
    flag!(
        "REEVALUATE_RECORD_ALL_FLAGS",
        SzFlags::REEVALUATE_RECORD_ALL_FLAGS
    );
    flag!(
        "REEVALUATE_ENTITY_DEFAULT_FLAGS",
        SzFlags::REEVALUATE_ENTITY_DEFAULT_FLAGS
    );
    flag!(
        "REEVALUATE_ENTITY_ALL_FLAGS",
        SzFlags::REEVALUATE_ENTITY_ALL_FLAGS
    );
    flag!("REDO_DEFAULT_FLAGS", SzFlags::REDO_DEFAULT_FLAGS);
    flag!("REDO_ALL_FLAGS", SzFlags::REDO_ALL_FLAGS);
    flag!(
        "FIND_INTERESTING_ENTITIES_DEFAULT_FLAGS",
        SzFlags::FIND_INTERESTING_ENTITIES_DEFAULT_FLAGS
    );
    flag!(
        "FIND_INTERESTING_ENTITIES_ALL_FLAGS",
        SzFlags::FIND_INTERESTING_ENTITIES_ALL_FLAGS
    );

    flags
}

/// Helper to convert an optional BigInt flags parameter from JS to SzFlags.
///
/// Used by all NAPI method wrappers that accept an optional flags argument.
pub fn bigint_to_sz_flags(flags: Option<BigInt>) -> Option<SzFlags> {
    flags.map(|f| {
        let (_, value, _) = f.get_u64();
        SzFlags::from_bits_truncate(value)
    })
}
