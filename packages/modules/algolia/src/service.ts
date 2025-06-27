import {
  Action,
  Algoliasearch,
  BatchRequest,
  IndexSettings,
  algoliasearch,
} from "algoliasearch";
import { IndexType, AlgoliaEntity } from "@mercurjs/framework";

type ModuleOptions = {
  appId: string;
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

class AlgoliaModuleService {
  private options_: ModuleOptions;
  private algolia_: Algoliasearch;

  constructor(_, options: ModuleOptions) {
    this.options_ = options;
    this.algolia_ = algoliasearch(this.options_.appId, this.options_.apiKey);
  }

  getAppId() {
    return this.options_.appId;
  }

  checkIndex(index: IndexType) {
    return this.algolia_.indexExists({
      indexName: index,
    });
  }

  updateSettings(index: IndexType, settings: IndexSettings) {
    return this.algolia_.setSettings({
      indexName: index,
      indexSettings: settings,
    });
  }

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

  upsert(type: IndexType, entity: AlgoliaEntity) {
    return this.algolia_.addOrUpdateObject({
      indexName: type,
      objectID: entity.id,
      body: entity,
    });
  }

  delete(type: IndexType, id: string) {
    return this.algolia_.deleteObject({
      indexName: type,
      objectID: id,
    });
  }

  partialUpdate(
    type: IndexType,
    entity: Partial<AlgoliaEntity> & { id: string }
  ) {
    return this.algolia_.partialUpdateObject({
      indexName: type,
      objectID: entity.id,
      attributesToUpdate: { ...entity },
    });
  }
}

export default AlgoliaModuleService;
