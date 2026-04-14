//! NAPI wrapper for SzEngine trait — all entity resolution operations.

use std::collections::HashSet;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_rust_sdk::traits::SzEngine;
use sz_rust_sdk::types::EntityRef;

use crate::error::sz_error_to_napi;
use crate::flags::bigint_to_sz_flags;

/// A record key identifying a specific record by data source and record ID.
/// Used by `getVirtualEntity` to specify which records to combine.
#[napi(object)]
pub struct RecordKey {
    pub data_source_code: String,
    pub record_id: String,
}

#[napi(js_name = "SzEngine")]
pub struct SzEngineWrapper {
    inner: Box<dyn SzEngine>,
}

impl SzEngineWrapper {
    /// Creates a new SzEngineWrapper from a boxed SzEngine trait object.
    /// Called internally by SzEnvironmentWrapper::get_engine().
    pub fn from_inner(inner: Box<dyn SzEngine>) -> Self {
        Self { inner }
    }
}

#[napi]
impl SzEngineWrapper {
    /// Primes the engine for optimal performance by loading internal caches.
    #[napi]
    pub fn prime_engine(&self) -> napi::Result<()> {
        self.inner.prime_engine().map_err(sz_error_to_napi)
    }

    /// Gets engine performance statistics as a JSON string.
    #[napi]
    pub fn get_stats(&self) -> napi::Result<String> {
        self.inner.get_stats().map_err(sz_error_to_napi)
    }

    /// Adds a record for entity resolution.
    ///
    /// Inserts or updates a record in the entity repository.
    #[napi]
    pub fn add_record(
        &self,
        data_source_code: String,
        record_id: String,
        record_definition: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .add_record(&data_source_code, &record_id, &record_definition, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Deletes a record from the entity repository.
    #[napi]
    pub fn delete_record(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .delete_record(&data_source_code, &record_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Reevaluates a specific record against current resolution rules.
    #[napi]
    pub fn reevaluate_record(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .reevaluate_record(&data_source_code, &record_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Reevaluates all records for a specific entity.
    #[napi]
    pub fn reevaluate_entity(&self, entity_id: i64, flags: Option<BigInt>) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .reevaluate_entity(entity_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Gets record information by data source and record ID.
    #[napi]
    pub fn get_record(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .get_record(&data_source_code, &record_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Gets a preview of how a record would be processed without persisting it.
    #[napi]
    pub fn get_record_preview(
        &self,
        record_definition: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .get_record_preview(&record_definition, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Gets entity information by entity ID.
    #[napi]
    pub fn get_entity_by_id(&self, entity_id: i64, flags: Option<BigInt>) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .get_entity(EntityRef::Id(entity_id), sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Gets entity information by record key (data source + record ID).
    #[napi]
    pub fn get_entity_by_record(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .get_entity(
                EntityRef::Record {
                    data_source: &data_source_code,
                    record_id: &record_id,
                },
                sz_flags,
            )
            .map_err(sz_error_to_napi)
    }

    /// Searches for entities by attributes.
    #[napi]
    pub fn search_by_attributes(
        &self,
        attributes: String,
        search_profile: Option<String>,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .search_by_attributes(&attributes, search_profile.as_deref(), sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Analyzes why a search result was returned for an entity.
    #[napi]
    pub fn why_search(
        &self,
        attributes: String,
        entity_id: i64,
        search_profile: Option<String>,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .why_search(&attributes, entity_id, search_profile.as_deref(), sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Analyzes why two entities are related.
    #[napi]
    pub fn why_entities(
        &self,
        entity_id1: i64,
        entity_id2: i64,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .why_entities(entity_id1, entity_id2, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Analyzes why two records resolved together.
    #[napi]
    pub fn why_records(
        &self,
        ds_code1: String,
        rec_id1: String,
        ds_code2: String,
        rec_id2: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .why_records(&ds_code1, &rec_id1, &ds_code2, &rec_id2, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Analyzes why a record belongs to its current entity.
    #[napi]
    pub fn why_record_in_entity(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .why_record_in_entity(&data_source_code, &record_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Analyzes how an entity was constructed step by step.
    #[napi]
    pub fn how_entity(&self, entity_id: i64, flags: Option<BigInt>) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .how_entity(entity_id, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Creates a virtual entity from record keys without persisting.
    #[napi]
    pub fn get_virtual_entity(
        &self,
        record_keys: Vec<RecordKey>,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        let keys: Vec<(String, String)> = record_keys
            .into_iter()
            .map(|rk| (rk.data_source_code, rk.record_id))
            .collect();
        self.inner
            .get_virtual_entity(&keys, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Finds interesting entities related to a given entity by entity ID.
    #[napi]
    pub fn find_interesting_entities_by_id(
        &self,
        entity_id: i64,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .find_interesting_entities(EntityRef::Id(entity_id), sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Finds interesting entities related to a given entity by record key.
    #[napi]
    pub fn find_interesting_entities_by_record(
        &self,
        data_source_code: String,
        record_id: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .find_interesting_entities(
                EntityRef::Record {
                    data_source: &data_source_code,
                    record_id: &record_id,
                },
                sz_flags,
            )
            .map_err(sz_error_to_napi)
    }

    /// Finds a relationship path between two entities.
    #[napi]
    pub fn find_path(
        &self,
        start_entity_id: i64,
        end_entity_id: i64,
        max_degrees: i64,
        avoid_entity_ids: Option<Vec<i64>>,
        required_data_sources: Option<Vec<String>>,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        let avoid_set: Option<HashSet<i64>> = avoid_entity_ids.map(|ids| ids.into_iter().collect());
        let required_set: Option<HashSet<String>> =
            required_data_sources.map(|ds| ds.into_iter().collect());
        self.inner
            .find_path_by_entity_id(
                start_entity_id,
                end_entity_id,
                max_degrees,
                avoid_set.as_ref(),
                required_set.as_ref(),
                sz_flags,
            )
            .map_err(sz_error_to_napi)
    }

    /// Finds a network of related entities starting from seed entity IDs.
    #[napi]
    pub fn find_network(
        &self,
        entity_ids: Vec<i64>,
        max_degrees: i64,
        build_out_degree: i64,
        max_entities: i64,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .find_network_by_entity_id(
                &entity_ids,
                max_degrees,
                build_out_degree,
                max_entities,
                sz_flags,
            )
            .map_err(sz_error_to_napi)
    }

    /// Gets the next pending redo record from the queue.
    #[napi]
    pub fn get_redo_record(&self) -> napi::Result<String> {
        self.inner.get_redo_record().map_err(sz_error_to_napi)
    }

    /// Counts pending redo records in the queue.
    #[napi]
    pub fn count_redo_records(&self) -> napi::Result<i64> {
        self.inner.count_redo_records().map_err(sz_error_to_napi)
    }

    /// Processes a redo record for deferred resolution.
    #[napi]
    pub fn process_redo_record(
        &self,
        redo_record: String,
        flags: Option<BigInt>,
    ) -> napi::Result<String> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .process_redo_record(&redo_record, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Starts a JSON entity export. Returns an export handle.
    #[napi]
    pub fn export_json_entity_report(&self, flags: Option<BigInt>) -> napi::Result<i64> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .export_json_entity_report(sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Starts a CSV entity export. Returns an export handle.
    #[napi]
    pub fn export_csv_entity_report(
        &self,
        csv_column_list: String,
        flags: Option<BigInt>,
    ) -> napi::Result<i64> {
        let sz_flags = bigint_to_sz_flags(flags);
        self.inner
            .export_csv_entity_report(&csv_column_list, sz_flags)
            .map_err(sz_error_to_napi)
    }

    /// Fetches the next batch of export data. Returns empty string when complete.
    #[napi]
    pub fn fetch_next(&self, export_handle: i64) -> napi::Result<String> {
        self.inner
            .fetch_next(export_handle)
            .map_err(sz_error_to_napi)
    }

    /// Closes an export operation and releases resources.
    #[napi]
    pub fn close_export(&self, export_handle: i64) -> napi::Result<()> {
        self.inner
            .close_export_report(export_handle)
            .map_err(sz_error_to_napi)
    }
}
