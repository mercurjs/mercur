import {
  Action,
  Algoliasearch,
  BatchRequest,
  IndexSettings,
  algoliasearch,
} from "algoliasearch";
import { IndexType, AlgoliaEntity } from "@mercurjs/framework";

/**
 * *
 * @interface
 * 
 * The module options.
 * @property {string} appId - The app's ID.
 * @property {string} apiKey - The apikey of the module options

 */
type ModuleOptions = {
  /**
 * *
 * The app's ID.

 */
  appId: string;
  /**
 * *
 * The algolia apikey

 */
  apiKey: string;
};

export const defaultProductSettings: IndexSettings = {
  searchableAttributes: [
    "title",
    "subtitle",
    "brand.name",
    "tags.value",
    "type.value",
    "categories.name",
    "collection.title",
    "variants.title",
  ],
};

export const defaultReviewSettings: IndexSettings = {
  attributesForFaceting: ["filterOnly(reference_id)", "filterOnly(reference)"],
};

/**
 * *
 * The algolia module service.
 */
class AlgoliaModuleService {
  private options_: ModuleOptions;
  private algolia_: Algoliasearch;

  constructor(_, options: ModuleOptions) {
    this.options_ = options;
    this.algolia_ = algoliasearch(this.options_.appId, this.options_.apiKey);
  }

  /**
 * *
 * This method retrieves the application ID from options
 * 
 * @returns {string} Retrieves the unique identifier for the current application session.

 */
  getAppId() {
    return this.options_.appId;
  }

  /**
 * *
 * This method verifies the existence of an Algolia index
 * 
 * @param {IndexType} index - Verifies if the specified Algolia index exists.
 * @returns {Promise<boolean>} Represents the completion of an asynchronous operation

 */
  checkIndex(index: IndexType) {
    return this.algolia_.indexExists({
      indexName: index,
    });
  }

  /**
 * *
 * This method updates an existing setting.
 * 
 * @param {IndexType} index - The targeted Algolia index to update settings for.
 * @param {IndexSettings} settings - Index settings.
 * @returns {Promise<UpdatedAtResponse>} The updated setting.

 */
  updateSettings(index: IndexType, settings: IndexSettings) {
    return this.algolia_.setSettings({
      indexName: index,
      indexSettings: settings,
    });
  }

  /**
 * *
 * This method updates and removes entities in Algolia index based on provided lists
 * 
 * @param {IndexType} type - Scope of entities for indexing operations
 * @param {AlgoliaEntity[]} toAdd - The toadd
 * @param {string[]} toDelete - The todelete
 * @returns {Promise<BatchResponse>} Represents the completion of an asynchronous operation

 */
  batch(type: IndexType, toAdd: AlgoliaEntity[], toDelete: string[]) {
    const requests: BatchRequest[] = toAdd.map((entity) => {
      return {
        action: "addObject" as Action,
        objectID: entity.id,
        body: entity,
      };
    });

    requests.concat(
      toDelete.map((id) => {
        return {
          action: "deleteObject" as Action,
          objectID: id,
          body: {},
        };
      })
    );

    return this.algolia_.batch({
      indexName: type,
      batchWriteParams: {
        requests,
      },
    });
  }

  /**
 * *
 * This method updates multiple records in an Algolia index
 * 
 * @param {IndexType} type - Index within Algolia to update or insert entities into.
 * @param {AlgoliaEntity[]} entities - The entities
 * @returns {Promise<BatchResponse>} Represents the completion of an asynchronous operation

 */
  batchUpsert(type: IndexType, entities: AlgoliaEntity[]) {
    return this.algolia_.batch({
      indexName: type,
      batchWriteParams: {
        requests: entities.map((entity) => {
          return {
            action: "addObject",
            objectID: entity.id,
            body: entity,
          };
        }),
      },
    });
  }

  /**
 * *
 * This method "Deletes a batch of objects from the Algolia index."
 * 
 * @param {IndexType} type - The Algolia index to modify.
 * @param {string[]} ids - The IDs of the algolia.
 * @returns {Promise<BatchResponse>} Represents the completion of an asynchronous operation

 */
  batchDelete(type: IndexType, ids: string[]) {
    return this.algolia_.batch({
      indexName: type,
      batchWriteParams: {
        requests: ids.map((id) => {
          return {
            action: "deleteObject",
            objectID: id,
            body: {},
          };
        }),
      },
    });
  }

  /**
 * *
 * This method updates or creates a  if it doesn't exist.
 * 
 * @param {IndexType} type - The category of index to update or create.
 * @param {AlgoliaEntity} entity - The unique digital or physical item to index.
 * @returns {Promise<UpdatedAtWithObjectIdResponse>} The created or updated .

 */
  upsert(type: IndexType, entity: AlgoliaEntity) {
    return this.algolia_.addOrUpdateObject({
      indexName: type,
      objectID: entity.id,
      body: entity,
    });
  }

  /**
 * *
 * This method deletes a  by its ID.
 * 
 * @param {IndexType} type - Index to remove document from
 * @param {string} id - The ID of the algolia.
 * @returns {Promise<DeletedAtResponse>} Represents the completion of an asynchronous operation

 */
  delete(type: IndexType, id: string) {
    return this.algolia_.deleteObject({
      indexName: type,
      objectID: id,
    });
  }

  /**
 * *
 * This method updates a subset of attributes for an existing Algolia entity by ID
 * 
 * @param {IndexType} type - The index category for Algolia updates.
 * @param {Partial<AlgoliaEntity> & { id: string; }} entity - Modified Algolia record for indexing
 * @returns {Promise<UpdatedAtWithObjectIdResponse>} Represents the completion of an asynchronous operation

 */
  partialUpdate(
    type: IndexType,
    entity: Partial<AlgoliaEntity> & {
      id: string;
    }
  ) {
    return this.algolia_.partialUpdateObject({
      indexName: type,
      objectID: entity.id,
      attributesToUpdate: { ...entity },
    });
  }
}

export default AlgoliaModuleService;
