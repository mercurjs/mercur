/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */
export var ContentType;
(function (ContentType) {
    ContentType["Json"] = "application/json";
    ContentType["FormData"] = "multipart/form-data";
    ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
    ContentType["Text"] = "text/plain";
})(ContentType || (ContentType = {}));
export class HttpClient {
    constructor(apiConfig = {}) {
        this.baseUrl = "";
        this.securityData = null;
        this.abortControllers = new Map();
        this.customFetch = (...fetchParams) => fetch(...fetchParams);
        this.baseApiParams = {
            credentials: "same-origin",
            headers: {},
            redirect: "follow",
            referrerPolicy: "no-referrer",
        };
        this.setSecurityData = (data) => {
            this.securityData = data;
        };
        this.contentFormatters = {
            [ContentType.Json]: (input) => input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
            [ContentType.Text]: (input) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
            [ContentType.FormData]: (input) => Object.keys(input || {}).reduce((formData, key) => {
                const property = input[key];
                formData.append(key, property instanceof Blob
                    ? property
                    : typeof property === "object" && property !== null
                        ? JSON.stringify(property)
                        : `${property}`);
                return formData;
            }, new FormData()),
            [ContentType.UrlEncoded]: (input) => this.toQueryString(input),
        };
        this.createAbortSignal = (cancelToken) => {
            if (this.abortControllers.has(cancelToken)) {
                const abortController = this.abortControllers.get(cancelToken);
                if (abortController) {
                    return abortController.signal;
                }
                return void 0;
            }
            const abortController = new AbortController();
            this.abortControllers.set(cancelToken, abortController);
            return abortController.signal;
        };
        this.abortRequest = (cancelToken) => {
            const abortController = this.abortControllers.get(cancelToken);
            if (abortController) {
                abortController.abort();
                this.abortControllers.delete(cancelToken);
            }
        };
        this.request = async ({ body, secure, path, type, query, format, baseUrl, cancelToken, ...params }) => {
            const secureParams = ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
                {};
            const requestParams = this.mergeRequestParams(params, secureParams);
            const queryString = query && this.toQueryString(query);
            const payloadFormatter = this.contentFormatters[type || ContentType.Json];
            const responseFormat = format || requestParams.format;
            return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
                ...requestParams,
                headers: {
                    ...(requestParams.headers || {}),
                    ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
                },
                signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
                body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
            }).then(async (response) => {
                const r = response.clone();
                r.data = null;
                r.error = null;
                const data = !responseFormat
                    ? r
                    : await response[responseFormat]()
                        .then((data) => {
                        if (r.ok) {
                            r.data = data;
                        }
                        else {
                            r.error = data;
                        }
                        return r;
                    })
                        .catch((e) => {
                        r.error = e;
                        return r;
                    });
                if (cancelToken) {
                    this.abortControllers.delete(cancelToken);
                }
                if (!response.ok)
                    throw data;
                return data;
            });
        };
        Object.assign(this, apiConfig);
    }
    encodeQueryParam(key, value) {
        const encodedKey = encodeURIComponent(key);
        return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
    }
    addQueryParam(query, key) {
        return this.encodeQueryParam(key, query[key]);
    }
    addArrayQueryParam(query, key) {
        const value = query[key];
        return value.map((v) => this.encodeQueryParam(key, v)).join("&");
    }
    toQueryString(rawQuery) {
        const query = rawQuery || {};
        const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
        return keys
            .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
            .join("&");
    }
    addQueryParams(rawQuery) {
        const queryString = this.toQueryString(rawQuery);
        return queryString ? `?${queryString}` : "";
    }
    mergeRequestParams(params1, params2) {
        return {
            ...this.baseApiParams,
            ...params1,
            ...(params2 || {}),
            headers: {
                ...(this.baseApiParams.headers || {}),
                ...(params1.headers || {}),
                ...((params2 && params2.headers) || {}),
            },
        };
    }
}
/**
 * @title Medusa API
 * @version 1.0.0
 */
export class Api extends HttpClient {
    constructor() {
        super(...arguments);
        this.admin = {
            /**
             * @description Retrieve a list of API keys. The API keys can be filtered by fields such as `id`. The API keys can also be sorted or paginated.
             *
             * @tags Admin Api Keys
             * @name AdminGetApiKeys
             * @summary List API Keys
             * @request GET:/admin/api-keys
             * @secure
             */
            adminGetApiKeys: (query, params = {}) => this.request({
                path: `/admin/api-keys`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a secret or publishable API key. A secret API key is used for admin authentication. A publishable API key is used by client applications to set the scope of the request.
             *
             * @tags Admin Api Keys
             * @name AdminPostApiKeys
             * @summary Create Api Key
             * @request POST:/admin/api-keys
             * @secure
             */
            adminPostApiKeys: (data, params = {}) => this.request({
                path: `/admin/api-keys`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an API key by its ID. You can expand the API key's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Api Keys
             * @name AdminGetApiKeysId
             * @summary Get API Key
             * @request GET:/admin/api-keys/{id}
             * @secure
             */
            adminGetApiKeysId: (id, query, params = {}) => this.request({
                path: `/admin/api-keys/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an API key's details.
             *
             * @tags Admin Api Keys
             * @name AdminPostApiKeysId
             * @summary Update an API Key
             * @request POST:/admin/api-keys/{id}
             * @secure
             */
            adminPostApiKeysId: (id, data, query, params = {}) => this.request({
                path: `/admin/api-keys/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a publishable or secret API key.
             *
             * @tags Admin Api Keys
             * @name AdminDeleteApiKeysId
             * @summary Delete an Api Key
             * @request DELETE:/admin/api-keys/{id}
             * @secure
             */
            adminDeleteApiKeysId: (id, params = {}) => this.request({
                path: `/admin/api-keys/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Revokes an API key. If the API key is a secret, it can't be used for authentication anymore. If it's publishable, it can't be used by client applications.
             *
             * @tags Admin Api Keys
             * @name AdminPostApiKeysIdRevoke
             * @summary Revoke API Key
             * @request POST:/admin/api-keys/{id}/revoke
             * @secure
             */
            adminPostApiKeysIdRevoke: (id, data, query, params = {}) => this.request({
                path: `/admin/api-keys/${id}/revoke`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the sales channels of a publishable API key, either to associate them or remove them from the API key.
             *
             * @tags Admin Api Keys
             * @name AdminPostApiKeysIdSalesChannels
             * @summary Manage Sales Channels of a Publishable API Key
             * @request POST:/admin/api-keys/{id}/sales-channels
             * @secure
             */
            adminPostApiKeysIdSalesChannels: (id, data, query, params = {}) => this.request({
                path: `/admin/api-keys/${id}/sales-channels`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of campaigns. The campaigns can be filtered by fields such as `id`. The campaigns can also be sorted or paginated.
             *
             * @tags Admin Campaigns
             * @name AdminGetCampaigns
             * @summary List Campaigns
             * @request GET:/admin/campaigns
             * @secure
             */
            adminGetCampaigns: (query, params = {}) => this.request({
                path: `/admin/campaigns`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a campaign.
             *
             * @tags Admin Campaigns
             * @name AdminPostCampaigns
             * @summary Create Campaign
             * @request POST:/admin/campaigns
             * @secure
             */
            adminPostCampaigns: (data, query, params = {}) => this.request({
                path: `/admin/campaigns`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a campaign by its ID. You can expand the campaign's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Campaigns
             * @name AdminGetCampaignsId
             * @summary Get a Campaign
             * @request GET:/admin/campaigns/{id}
             * @secure
             */
            adminGetCampaignsId: (id, query, params = {}) => this.request({
                path: `/admin/campaigns/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a campaign's details.
             *
             * @tags Admin Campaigns
             * @name AdminPostCampaignsId
             * @summary Update a Campaign
             * @request POST:/admin/campaigns/{id}
             * @secure
             */
            adminPostCampaignsId: (id, data, query, params = {}) => this.request({
                path: `/admin/campaigns/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a campaign by its ID. This doesn't delete promotions that belong to this campaign.
             *
             * @tags Admin Campaigns
             * @name AdminDeleteCampaignsId
             * @summary Delete a Campaign
             * @request DELETE:/admin/campaigns/{id}
             * @secure
             */
            adminDeleteCampaignsId: (id, params = {}) => this.request({
                path: `/admin/campaigns/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the promotions of a campaign, either by adding them or removing them from the campaign.
             *
             * @tags Admin Campaigns
             * @name AdminPostCampaignsIdPromotions
             * @summary Manage the Promotions of a Campaign
             * @request POST:/admin/campaigns/{id}/promotions
             * @secure
             */
            adminPostCampaignsIdPromotions: (id, data, query, params = {}) => this.request({
                path: `/admin/campaigns/${id}/promotions`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of claims. The claims can be filtered by fields such as `id`. The claims can also be sorted or paginated.
             *
             * @tags Admin Claims
             * @name AdminGetClaims
             * @summary List Claims
             * @request GET:/admin/claims
             * @secure
             */
            adminGetClaims: (query, params = {}) => this.request({
                path: `/admin/claims`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a claim. The claim is still in the request state, and the changes are only applied on the order once the claim is confirmed.
             *
             * @tags Admin Claims
             * @name AdminPostClaims
             * @summary Create a Claim
             * @request POST:/admin/claims
             * @secure
             */
            adminPostClaims: (data, query, params = {}) => this.request({
                path: `/admin/claims`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a claim by its ID. You can expand the claim's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Claims
             * @name AdminGetClaimsId
             * @summary Get a Claim
             * @request GET:/admin/claims/{id}
             * @secure
             */
            adminGetClaimsId: (id, query, params = {}) => this.request({
                path: `/admin/claims/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a claim and its associated return.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdCancel
             * @summary Cancel a Claim
             * @request POST:/admin/claims/{id}/cancel
             * @secure
             */
            adminPostClaimsIdCancel: (id, data, params = {}) => this.request({
                path: `/admin/claims/${id}/cancel`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Add order items to a claim as claim items. These claim items will have the action `WRITE_OFF_ITEM`.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdClaimItems
             * @summary Add Claim Items to a Claim
             * @request POST:/admin/claims/{id}/claim-items
             * @secure
             */
            adminPostClaimsIdClaimItems: (id, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/claim-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an order item in a claim by the ID of the item's `WRITE_OFF_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdClaimItemsActionId
             * @summary Update a Claim Item
             * @request POST:/admin/claims/{id}/claim-items/{action_id}
             * @secure
             */
            adminPostClaimsIdClaimItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/claim-items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an order item from a claim by the ID of the item's `WRITE_OFF_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdClaimItemsActionId
             * @summary Remove a Claim Item from a Claim
             * @request DELETE:/admin/claims/{id}/claim-items/{action_id}
             * @secure
             */
            adminDeleteClaimsIdClaimItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/claims/${id}/claim-items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add inbound (or return) items to a claim. These inbound items will have a `RETURN_ITEM` action.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdInboundItems
             * @summary Add Inbound Items to a Claim
             * @request POST:/admin/claims/{id}/inbound/items
             * @secure
             */
            adminPostClaimsIdInboundItems: (id, data, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/items`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an inbound (or return) item of a claim using the `ID` of the item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdInboundItemsActionId
             * @summary Update Inbound Items of a Claim
             * @request POST:/admin/claims/{id}/inbound/items/{action_id}
             * @secure
             */
            adminPostClaimsIdInboundItemsActionId: (id, actionId, data, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/items/${actionId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an inbound (or return) item from a claim using the `ID` of the item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdInboundItemsActionId
             * @summary Remove an Inbound Item from Claim
             * @request DELETE:/admin/claims/{id}/inbound/items/{action_id}
             * @secure
             */
            adminDeleteClaimsIdInboundItemsActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/items/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add an inbound (or return) shipping method to a claim. The inbound shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdInboundShippingMethod
             * @summary Add an Inbound Shipping Method to a Claim
             * @request POST:/admin/claims/{id}/inbound/shipping-method
             * @secure
             */
            adminPostClaimsIdInboundShippingMethod: (id, data, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/shipping-method`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the shipping method for returning items in the claim using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdInboundShippingMethodActionId
             * @summary Update Inbound Shipping Method of a Claim
             * @request POST:/admin/claims/{id}/inbound/shipping-method/{action_id}
             * @secure
             */
            adminPostClaimsIdInboundShippingMethodActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/shipping-method/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the shipping method for returning items in the claim using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdInboundShippingMethodActionId
             * @summary Remove Inbound Shipping Method from Claim
             * @request DELETE:/admin/claims/{id}/inbound/shipping-method/{action_id}
             * @secure
             */
            adminDeleteClaimsIdInboundShippingMethodActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/claims/${id}/inbound/shipping-method/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add outbound (or new) items to a claim. These outbound items will have an `ITEM_ADD` action.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdOutboundItems
             * @summary Add Outbound Items to a Claim
             * @request POST:/admin/claims/{id}/outbound/items
             * @secure
             */
            adminPostClaimsIdOutboundItems: (id, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an outbound (or new) item of a claim using the `ID` of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdOutboundItemsActionId
             * @summary Update Outbound Item of a Claim
             * @request POST:/admin/claims/{id}/outbound/items/{action_id}
             * @secure
             */
            adminPostClaimsIdOutboundItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an outbound (or new) item from a claim using the `ID` of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdOutboundItemsActionId
             * @summary Remove an Outbound Item from Claim
             * @request DELETE:/admin/claims/{id}/outbound/items/{action_id}
             * @secure
             */
            adminDeleteClaimsIdOutboundItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add an outbound shipping method to a claim. The outbound shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdOutboundShippingMethod
             * @summary Add Outbound Shipping Methods to a Claim
             * @request POST:/admin/claims/{id}/outbound/shipping-method
             * @secure
             */
            adminPostClaimsIdOutboundShippingMethod: (id, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/shipping-method`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the shipping method for delivering outbound items in a claim using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdOutboundShippingMethodActionId
             * @summary Update Outbound Shipping Method of a Claim
             * @request POST:/admin/claims/{id}/outbound/shipping-method/{action_id}
             * @secure
             */
            adminPostClaimsIdOutboundShippingMethodActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/shipping-method/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the shipping method for delivering outbound items in the claim using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdOutboundShippingMethodActionId
             * @summary Remove Outbound Shipping Method from Claim
             * @request DELETE:/admin/claims/{id}/outbound/shipping-method/{action_id}
             * @secure
             */
            adminDeleteClaimsIdOutboundShippingMethodActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/claims/${id}/outbound/shipping-method/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm a claim request, applying its changes on the associated order.
             *
             * @tags Admin Claims
             * @name AdminPostClaimsIdRequest
             * @summary Confirm a Claim Request
             * @request POST:/admin/claims/{id}/request
             * @secure
             */
            adminPostClaimsIdRequest: (id, query, params = {}) => this.request({
                path: `/admin/claims/${id}/request`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a requested claim.
             *
             * @tags Admin Claims
             * @name AdminDeleteClaimsIdRequest
             * @summary Cancel Claim Request
             * @request DELETE:/admin/claims/{id}/request
             * @secure
             */
            adminDeleteClaimsIdRequest: (id, params = {}) => this.request({
                path: `/admin/claims/${id}/request`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of collections. The collections can be filtered by fields such as `id`. The collections can also be sorted or paginated.
             *
             * @tags Admin Collections
             * @name AdminGetCollections
             * @summary List Collections
             * @request GET:/admin/collections
             * @secure
             */
            adminGetCollections: (query, params = {}) => this.request({
                path: `/admin/collections`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a collection.
             *
             * @tags Admin Collections
             * @name AdminPostCollections
             * @summary Create Collection
             * @request POST:/admin/collections
             * @secure
             */
            adminPostCollections: (data, query, params = {}) => this.request({
                path: `/admin/collections`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a collection by its ID. You can expand the collection's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Collections
             * @name AdminGetCollectionsId
             * @summary Get a Collection
             * @request GET:/admin/collections/{id}
             * @secure
             */
            adminGetCollectionsId: (id, query, params = {}) => this.request({
                path: `/admin/collections/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a collection's details.
             *
             * @tags Admin Collections
             * @name AdminPostCollectionsId
             * @summary Update a Collection
             * @request POST:/admin/collections/{id}
             * @secure
             */
            adminPostCollectionsId: (id, data, query, params = {}) => this.request({
                path: `/admin/collections/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a product collection.
             *
             * @tags Admin Collections
             * @name AdminDeleteCollectionsId
             * @summary Delete a Collection
             * @request DELETE:/admin/collections/{id}
             * @secure
             */
            adminDeleteCollectionsId: (id, params = {}) => this.request({
                path: `/admin/collections/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the products of a collection by adding or removing them from the collection.
             *
             * @tags Admin Collections
             * @name AdminPostCollectionsIdProducts
             * @summary Manage Products of a Collection
             * @request POST:/admin/collections/{id}/products
             * @secure
             */
            adminPostCollectionsIdProducts: (id, data, query, params = {}) => this.request({
                path: `/admin/collections/${id}/products`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of currencies. The currencies can be filtered by fields such as `id`. The currencies can also be sorted or paginated.
             *
             * @tags Admin Currencies
             * @name AdminGetCurrencies
             * @summary List Currencies
             * @request GET:/admin/currencies
             * @secure
             */
            adminGetCurrencies: (query, params = {}) => this.request({
                path: `/admin/currencies`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a currency by its code. You can expand the currency's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Currencies
             * @name AdminGetCurrenciesCode
             * @summary Get a Currency
             * @request GET:/admin/currencies/{code}
             * @secure
             */
            adminGetCurrenciesCode: (code, query, params = {}) => this.request({
                path: `/admin/currencies/${code}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of customer groups. The customer groups can be filtered by fields such as `id`. The customer groups can also be sorted or paginated.
             *
             * @tags Admin Customer Groups
             * @name AdminGetCustomerGroups
             * @summary List Customer Groups
             * @request GET:/admin/customer-groups
             * @secure
             */
            adminGetCustomerGroups: (query, params = {}) => this.request({
                path: `/admin/customer-groups`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a customer group.
             *
             * @tags Admin Customer Groups
             * @name AdminPostCustomerGroups
             * @summary Create Customer Group
             * @request POST:/admin/customer-groups
             * @secure
             */
            adminPostCustomerGroups: (data, query, params = {}) => this.request({
                path: `/admin/customer-groups`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a customer group by its ID. You can expand the customer group's relations or select the fields that should be returned.
             *
             * @tags Admin Customer Groups
             * @name AdminGetCustomerGroupsId
             * @summary Get a Customer Group
             * @request GET:/admin/customer-groups/{id}
             * @secure
             */
            adminGetCustomerGroupsId: (id, query, params = {}) => this.request({
                path: `/admin/customer-groups/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a customer group's details.
             *
             * @tags Admin Customer Groups
             * @name AdminPostCustomerGroupsId
             * @summary Update a Customer Group
             * @request POST:/admin/customer-groups/{id}
             * @secure
             */
            adminPostCustomerGroupsId: (id, data, query, params = {}) => this.request({
                path: `/admin/customer-groups/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a customer group. Customers in the group aren't deleted.
             *
             * @tags Admin Customer Groups
             * @name AdminDeleteCustomerGroupsId
             * @summary Delete a Customer Group
             * @request DELETE:/admin/customer-groups/{id}
             * @secure
             */
            adminDeleteCustomerGroupsId: (id, params = {}) => this.request({
                path: `/admin/customer-groups/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the customers of a group to add or remove them from the group.
             *
             * @tags Admin Customer Groups
             * @name AdminPostCustomerGroupsIdCustomers
             * @summary Manage Customers of a Customer Group
             * @request POST:/admin/customer-groups/{id}/customers
             * @secure
             */
            adminPostCustomerGroupsIdCustomers: (id, data, query, params = {}) => this.request({
                path: `/admin/customer-groups/${id}/customers`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of customers. The customers can be filtered by fields such as `id`. The customers can also be sorted or paginated.
             *
             * @tags Admin Customers
             * @name AdminGetCustomers
             * @summary List Customers
             * @request GET:/admin/customers
             * @secure
             */
            adminGetCustomers: (query, params = {}) => this.request({
                path: `/admin/customers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a customer.
             *
             * @tags Admin Customers
             * @name AdminPostCustomers
             * @summary Create Customer
             * @request POST:/admin/customers
             * @secure
             */
            adminPostCustomers: (data, query, params = {}) => this.request({
                path: `/admin/customers`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a customer by its ID. You can expand the customer's relations or select the fields that should be returned.
             *
             * @tags Admin Customers
             * @name AdminGetCustomersId
             * @summary Get a Customer
             * @request GET:/admin/customers/{id}
             * @secure
             */
            adminGetCustomersId: (id, query, params = {}) => this.request({
                path: `/admin/customers/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a customer's details.
             *
             * @tags Admin Customers
             * @name AdminPostCustomersId
             * @summary Update a Customer
             * @request POST:/admin/customers/{id}
             * @secure
             */
            adminPostCustomersId: (id, data, query, params = {}) => this.request({
                path: `/admin/customers/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a customer.
             *
             * @tags Admin Customers
             * @name AdminDeleteCustomersId
             * @summary Delete a Customer
             * @request DELETE:/admin/customers/{id}
             * @secure
             */
            adminDeleteCustomersId: (id, params = {}) => this.request({
                path: `/admin/customers/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of addresses in a customer. The addresses can be filtered by fields like `query`. The addresses can also be paginated.
             *
             * @tags Admin Customers
             * @name AdminGetCustomersIdAddresses
             * @summary List Addresses
             * @request GET:/admin/customers/{id}/addresses
             * @secure
             */
            adminGetCustomersIdAddresses: (id, query, params = {}) => this.request({
                path: `/admin/customers/${id}/addresses`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add an address to a customer.
             *
             * @tags Admin Customers
             * @name AdminPostCustomersIdAddresses
             * @summary Add a Customer Address
             * @request POST:/admin/customers/{id}/addresses
             * @secure
             */
            adminPostCustomersIdAddresses: (id, data, query, params = {}) => this.request({
                path: `/admin/customers/${id}/addresses`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of a customer's addresses. The addresses can be filtered by fields like `company`. The addresses can also be paginated.
             *
             * @tags Admin Customers
             * @name AdminGetCustomersIdAddressesAddressId
             * @summary List Addresses
             * @request GET:/admin/customers/{id}/addresses/{address_id}
             * @secure
             */
            adminGetCustomersIdAddressesAddressId: (id, addressId, query, params = {}) => this.request({
                path: `/admin/customers/${id}/addresses/${addressId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a customer address's details.
             *
             * @tags Admin Customers
             * @name AdminPostCustomersIdAddressesAddressId
             * @summary Update a Customer's Address
             * @request POST:/admin/customers/{id}/addresses/{address_id}
             * @secure
             */
            adminPostCustomersIdAddressesAddressId: (id, addressId, data, query, params = {}) => this.request({
                path: `/admin/customers/${id}/addresses/${addressId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a customer's address.
             *
             * @tags Admin Customers
             * @name AdminDeleteCustomersIdAddressesAddressId
             * @summary Remove an Address from Customer
             * @request DELETE:/admin/customers/{id}/addresses/{address_id}
             * @secure
             */
            adminDeleteCustomersIdAddressesAddressId: (id, addressId, query, params = {}) => this.request({
                path: `/admin/customers/${id}/addresses/${addressId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the customer groups of a customer, adding or removing the customer from those groups.
             *
             * @tags Admin Customers
             * @name AdminPostCustomersIdCustomerGroups
             * @summary Manage Customer Groups of Customer
             * @request POST:/admin/customers/{id}/customer-groups
             * @secure
             */
            adminPostCustomersIdCustomerGroups: (id, data, query, params = {}) => this.request({
                path: `/admin/customers/${id}/customer-groups`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of draft orders. The draft orders can be filtered by fields such as `id`. The draft orders can also be sorted or paginated.
             *
             * @tags Admin Draft Orders
             * @name AdminGetDraftOrders
             * @summary List Draft Orders
             * @request GET:/admin/draft-orders
             * @secure
             */
            adminGetDraftOrders: (query, params = {}) => this.request({
                path: `/admin/draft-orders`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a draft order. This creates an order with the `is_draft_order` property enabled.
             *
             * @tags Admin Draft Orders
             * @name AdminPostDraftOrders
             * @summary Create Draft Order
             * @request POST:/admin/draft-orders
             * @secure
             */
            adminPostDraftOrders: (data, query, params = {}) => this.request({
                path: `/admin/draft-orders`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a draft order by its ID. You can expand the draft order's relations or select the fields that should be returned using the query parameters.
             *
             * @tags Admin Draft Orders
             * @name AdminGetDraftOrdersId
             * @summary Get a Draft Order
             * @request GET:/admin/draft-orders/{id}
             * @secure
             */
            adminGetDraftOrdersId: (id, query, params = {}) => this.request({
                path: `/admin/draft-orders/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a draft order's details.
             *
             * @tags Admin Draft Orders
             * @name AdminPostDraftOrdersId
             * @summary Update a Draft Order
             * @request POST:/admin/draft-orders/{id}
             * @secure
             */
            adminPostDraftOrdersId: (id, data, query, params = {}) => this.request({
                path: `/admin/draft-orders/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of exchanges. The exchanges can be filtered by fields such as `id`. The exchanges can also be sorted or paginated.
             *
             * @tags Admin Exchanges
             * @name AdminGetExchanges
             * @summary List Exchanges
             * @request GET:/admin/exchanges
             * @secure
             */
            adminGetExchanges: (query, params = {}) => this.request({
                path: `/admin/exchanges`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an exchange request. Its changes aren't applied on the order until the exchange is confirmed.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchanges
             * @summary Create Exchange
             * @request POST:/admin/exchanges
             * @secure
             */
            adminPostExchanges: (data, query, params = {}) => this.request({
                path: `/admin/exchanges`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an exchange by its ID. You can expand the exchange's relations or select the fields that should be returned using query parameters.
             *
             * @tags Admin Exchanges
             * @name AdminGetExchangesId
             * @summary Get an Exchange
             * @request GET:/admin/exchanges/{id}
             * @secure
             */
            adminGetExchangesId: (id, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel an exchange and its associated return.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdCancel
             * @summary Cancel an Exchange
             * @request POST:/admin/exchanges/{id}/cancel
             * @secure
             */
            adminPostExchangesIdCancel: (id, data, params = {}) => this.request({
                path: `/admin/exchanges/${id}/cancel`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Add inbound (or return) items to an exchange. These inbound items will have the action `RETURN_ITEM`.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdInboundItems
             * @summary Add Inbound Items to an Exchange
             * @request POST:/admin/exchanges/{id}/inbound/items
             * @secure
             */
            adminPostExchangesIdInboundItems: (id, data, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/items`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an inbound (or return) item from an exchange using the `ID` of the item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdInboundItemsActionId
             * @summary Update an Inbount Item of an Exchange
             * @request POST:/admin/exchanges/{id}/inbound/items/{action_id}
             * @secure
             */
            adminPostExchangesIdInboundItemsActionId: (id, actionId, data, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/items/${actionId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an inbound (or return) item from an exchange using the `ID` of the item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminDeleteExchangesIdInboundItemsActionId
             * @summary Remove Inbound Item from Exchange
             * @request DELETE:/admin/exchanges/{id}/inbound/items/{action_id}
             * @secure
             */
            adminDeleteExchangesIdInboundItemsActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/items/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add an inbound (or return) shipping method to an exchange. The inbound shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdInboundShippingMethod
             * @summary Add an Inbound Shipping Method to an Exchange
             * @request POST:/admin/exchanges/{id}/inbound/shipping-method
             * @secure
             */
            adminPostExchangesIdInboundShippingMethod: (id, data, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/shipping-method`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the shipping method for returning items in the exchange using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdInboundShippingMethodActionId
             * @summary Update Inbound Shipping Method of an Exchange
             * @request POST:/admin/exchanges/{id}/inbound/shipping-method/{action_id}
             * @secure
             */
            adminPostExchangesIdInboundShippingMethodActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/shipping-method/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the shipping method for returning items in the exchange using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminDeleteExchangesIdInboundShippingMethodActionId
             * @summary Remove Inbound Shipping Method from Exchange
             * @request DELETE:/admin/exchanges/{id}/inbound/shipping-method/{action_id}
             * @secure
             */
            adminDeleteExchangesIdInboundShippingMethodActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/exchanges/${id}/inbound/shipping-method/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add outbound (or new) items to an exchange. These outbound items will have the action `ITEM_ADD`.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdOutboundItems
             * @summary Add Outbound Items to Exchange
             * @request POST:/admin/exchanges/{id}/outbound/items
             * @secure
             */
            adminPostExchangesIdOutboundItems: (id, data, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an outbound (or new) item from an exchange using the `ID` of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdOutboundItemsActionId
             * @summary Update Outbound Item of an Exchange
             * @request POST:/admin/exchanges/{id}/outbound/items/{action_id}
             * @secure
             */
            adminPostExchangesIdOutboundItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an outbound (or new) item from an exchange using the `ID` of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminDeleteExchangesIdOutboundItemsActionId
             * @summary Remove Outbound Item from Exchange
             * @request DELETE:/admin/exchanges/{id}/outbound/items/{action_id}
             * @secure
             */
            adminDeleteExchangesIdOutboundItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add an outbound shipping method to an exchange. The outbound shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdOutboundShippingMethod
             * @summary Add Outbound Shipping Method to Exchange
             * @request POST:/admin/exchanges/{id}/outbound/shipping-method
             * @secure
             */
            adminPostExchangesIdOutboundShippingMethod: (id, data, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/shipping-method`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the shipping method for delivering outbound items in the exchange using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdOutboundShippingMethodActionId
             * @summary Update Outbound Shipping Method of Exchange
             * @request POST:/admin/exchanges/{id}/outbound/shipping-method/{action_id}
             * @secure
             */
            adminPostExchangesIdOutboundShippingMethodActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/shipping-method/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the shipping method for delivering outbound items in the exchange using the `ID` of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Exchanges
             * @name AdminDeleteExchangesIdOutboundShippingMethodActionId
             * @summary Remove Outbound Shipping Method from Exchange
             * @request DELETE:/admin/exchanges/{id}/outbound/shipping-method/{action_id}
             * @secure
             */
            adminDeleteExchangesIdOutboundShippingMethodActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/outbound/shipping-method/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm an exchange request, applying its changes on the associated order.
             *
             * @tags Admin Exchanges
             * @name AdminPostExchangesIdRequest
             * @summary Confirm an Exchange
             * @request POST:/admin/exchanges/{id}/request
             * @secure
             */
            adminPostExchangesIdRequest: (id, query, params = {}) => this.request({
                path: `/admin/exchanges/${id}/request`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a requested exchange.
             *
             * @tags Admin Exchanges
             * @name AdminDeleteExchangesIdRequest
             * @summary Cancel Exchange Request
             * @request DELETE:/admin/exchanges/{id}/request
             * @secure
             */
            adminDeleteExchangesIdRequest: (id, params = {}) => this.request({
                path: `/admin/exchanges/${id}/request`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of fulfillment providers. The fulfillment providers can be filtered by fields such as `id`. The fulfillment providers can also be sorted or paginated.
             *
             * @tags Admin Fulfillment Providers
             * @name AdminGetFulfillmentProviders
             * @summary List Fulfillment Providers
             * @request GET:/admin/fulfillment-providers
             * @secure
             */
            adminGetFulfillmentProviders: (query, params = {}) => this.request({
                path: `/admin/fulfillment-providers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve the list of fulfillment options of a fulfillment provider. These options may be retrieved from an integrated third-party service.
             *
             * @tags Admin Fulfillment Providers
             * @name AdminGetFulfillmentProvidersIdOptions
             * @summary List Fulfillment Options
             * @request GET:/admin/fulfillment-providers/{id}/options
             * @secure
             */
            adminGetFulfillmentProvidersIdOptions: (id, params = {}) => this.request({
                path: `/admin/fulfillment-providers/${id}/options`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a fulfillment set.
             *
             * @tags Admin Fulfillment Sets
             * @name AdminDeleteFulfillmentSetsId
             * @summary Delete Fulfillment Set
             * @request DELETE:/admin/fulfillment-sets/{id}
             * @secure
             */
            adminDeleteFulfillmentSetsId: (id, params = {}) => this.request({
                path: `/admin/fulfillment-sets/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a service zone to a fulfillment set.
             *
             * @tags Admin Fulfillment Sets
             * @name AdminPostFulfillmentSetsIdServiceZones
             * @summary Add a Service Zone to a Fulfillment Set
             * @request POST:/admin/fulfillment-sets/{id}/service-zones
             * @secure
             */
            adminPostFulfillmentSetsIdServiceZones: (id, data, query, params = {}) => this.request({
                path: `/admin/fulfillment-sets/${id}/service-zones`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a service zone that belongs to a fulfillment set. be paginated.
             *
             * @tags Admin Fulfillment Sets
             * @name AdminGetFulfillmentSetsIdServiceZonesZoneId
             * @summary Get a Service Zone in a Fulfillment Set
             * @request GET:/admin/fulfillment-sets/{id}/service-zones/{zone_id}
             * @secure
             */
            adminGetFulfillmentSetsIdServiceZonesZoneId: (id, zoneId, query, params = {}) => this.request({
                path: `/admin/fulfillment-sets/${id}/service-zones/${zoneId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the details of a service zone in a fulfillment set.
             *
             * @tags Admin Fulfillment Sets
             * @name AdminPostFulfillmentSetsIdServiceZonesZoneId
             * @summary Update the Service Zone of a Fulfillment Set
             * @request POST:/admin/fulfillment-sets/{id}/service-zones/{zone_id}
             * @secure
             */
            adminPostFulfillmentSetsIdServiceZonesZoneId: (id, zoneId, data, query, params = {}) => this.request({
                path: `/admin/fulfillment-sets/${id}/service-zones/${zoneId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a service zone that belongs to a fulfillment set.
             *
             * @tags Admin Fulfillment Sets
             * @name AdminDeleteFulfillmentSetsIdServiceZonesZoneId
             * @summary Remove a Service Zone from Fulfillment Set
             * @request DELETE:/admin/fulfillment-sets/{id}/service-zones/{zone_id}
             * @secure
             */
            adminDeleteFulfillmentSetsIdServiceZonesZoneId: (id, zoneId, params = {}) => this.request({
                path: `/admin/fulfillment-sets/${id}/service-zones/${zoneId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a fulfillment for an order, return, exchange, and more.
             *
             * @tags Admin Fulfillments
             * @name AdminPostFulfillments
             * @summary Create Fulfillment
             * @request POST:/admin/fulfillments
             * @secure
             */
            adminPostFulfillments: (data, query, params = {}) => this.request({
                path: `/admin/fulfillments`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a fulfillment. The fulfillment can't be shipped or delivered. To cancel the fulfillment, the `cancelFulfillment` method of the associated fulfillment provider is used.
             *
             * @tags Admin Fulfillments
             * @name AdminPostFulfillmentsIdCancel
             * @summary Cancel a Fulfillment
             * @request POST:/admin/fulfillments/{id}/cancel
             * @secure
             */
            adminPostFulfillmentsIdCancel: (id, query, params = {}) => this.request({
                path: `/admin/fulfillments/${id}/cancel`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a shipment for a fulfillment. The fulfillment must not be shipped or canceled.
             *
             * @tags Admin Fulfillments
             * @name AdminPostFulfillmentsIdShipment
             * @summary Create a Shipment for a Fulfillment
             * @request POST:/admin/fulfillments/{id}/shipment
             * @secure
             */
            adminPostFulfillmentsIdShipment: (id, data, query, params = {}) => this.request({
                path: `/admin/fulfillments/${id}/shipment`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of inventory items. The inventory items can be filtered by fields such as `id`. The inventory items can also be sorted or paginated.
             *
             * @tags Admin Inventory Items
             * @name AdminGetInventoryItems
             * @summary List Inventory Items
             * @request GET:/admin/inventory-items
             * @secure
             */
            adminGetInventoryItems: (query, params = {}) => this.request({
                path: `/admin/inventory-items`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an inventory item.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItems
             * @summary Create Inventory Item
             * @request POST:/admin/inventory-items
             * @secure
             */
            adminPostInventoryItems: (data, query, params = {}) => this.request({
                path: `/admin/inventory-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage inventory levels to create, update, or delete them.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItemsLocationLevelsBatch
             * @summary Manage Inventory Levels
             * @request POST:/admin/inventory-items/location-levels/batch
             * @secure
             */
            adminPostInventoryItemsLocationLevelsBatch: (data, params = {}) => this.request({
                path: `/admin/inventory-items/location-levels/batch`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a inventory item by its ID. You can expand the inventory item's relations or select the fields that should be returned.
             *
             * @tags Admin Inventory Items
             * @name AdminGetInventoryItemsId
             * @summary Get a Inventory Item
             * @request GET:/admin/inventory-items/{id}
             * @secure
             */
            adminGetInventoryItemsId: (id, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an inventory item's details.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItemsId
             * @summary Update an Inventory Item
             * @request POST:/admin/inventory-items/{id}
             * @secure
             */
            adminPostInventoryItemsId: (id, data, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete an inventory item.
             *
             * @tags Admin Inventory Items
             * @name AdminDeleteInventoryItemsId
             * @summary Delete Inventory Item
             * @request DELETE:/admin/inventory-items/{id}
             * @secure
             */
            adminDeleteInventoryItemsId: (id, params = {}) => this.request({
                path: `/admin/inventory-items/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of inventory levels associated with an inventory item. The inventory levels can be filtered by fields like `location_id`. The inventory levels can also be paginated.
             *
             * @tags Admin Inventory Items
             * @name AdminGetInventoryItemsIdLocationLevels
             * @summary List Inventory Levels
             * @request GET:/admin/inventory-items/{id}/location-levels
             * @secure
             */
            adminGetInventoryItemsIdLocationLevels: (id, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}/location-levels`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an inventory level for an inventory item.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItemsIdLocationLevels
             * @summary Create Inventory Level for Inventory Item
             * @request POST:/admin/inventory-items/{id}/location-levels
             * @secure
             */
            adminPostInventoryItemsIdLocationLevels: (id, data, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}/location-levels`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the inventory levels of an inventory item to create or delete them.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItemsIdLocationLevelsBatch
             * @summary Manage Inventory Levels of Inventory Item
             * @request POST:/admin/inventory-items/{id}/location-levels/batch
             * @secure
             */
            adminPostInventoryItemsIdLocationLevelsBatch: (id, data, params = {}) => this.request({
                path: `/admin/inventory-items/${id}/location-levels/batch`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Updates the details of an inventory item's inventory level using its associated location ID.
             *
             * @tags Admin Inventory Items
             * @name AdminPostInventoryItemsIdLocationLevelsLocationId
             * @summary Update an Inventory Level of an Inventory Item
             * @request POST:/admin/inventory-items/{id}/location-levels/{location_id}
             * @secure
             */
            adminPostInventoryItemsIdLocationLevelsLocationId: (id, locationId, data, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}/location-levels/${locationId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the inventory level of an inventory item. If the inventory level has reserved quantity greater than `0`, an error is thrown.
             *
             * @tags Admin Inventory Items
             * @name AdminDeleteInventoryItemsIdLocationLevelsLocationId
             * @summary Remove Inventory Level of Inventory Item
             * @request DELETE:/admin/inventory-items/{id}/location-levels/{location_id}
             * @secure
             */
            adminDeleteInventoryItemsIdLocationLevelsLocationId: (id, locationId, query, params = {}) => this.request({
                path: `/admin/inventory-items/${id}/location-levels/${locationId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of invites. The invites can be filtered by fields such as `id`. The invites can also be sorted or paginated.
             *
             * @tags Admin Invites
             * @name AdminGetInvites
             * @summary List Invites
             * @request GET:/admin/invites
             * @secure
             */
            adminGetInvites: (query, params = {}) => this.request({
                path: `/admin/invites`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a invite.
             *
             * @tags Admin Invites
             * @name AdminPostInvites
             * @summary Create Invite
             * @request POST:/admin/invites
             * @secure
             */
            adminPostInvites: (data, query, params = {}) => this.request({
                path: `/admin/invites`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Accept an invite and create a new user. Since the user isn't created yet, the JWT token used in the authorization header is retrieved from the `/auth/user/emailpass/register` API route (or a provider other than `emailpass`). The user can then authenticate using the `/auth/user/emailpass` API route.
             *
             * @tags Admin Invites
             * @name AdminPostInvitesAccept
             * @summary Accept Invite
             * @request POST:/admin/invites/accept
             * @secure
             */
            adminPostInvitesAccept: (data, params = {}) => this.request({
                path: `/admin/invites/accept`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an invite by its ID. You can expand the invite's relations or select the fields that should be returned.
             *
             * @tags Admin Invites
             * @name AdminGetInvitesId
             * @summary Get an Invite
             * @request GET:/admin/invites/{id}
             * @secure
             */
            adminGetInvitesId: (id, query, params = {}) => this.request({
                path: `/admin/invites/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete an invite.
             *
             * @tags Admin Invites
             * @name AdminDeleteInvitesId
             * @summary Delete Invite
             * @request DELETE:/admin/invites/{id}
             * @secure
             */
            adminDeleteInvitesId: (id, params = {}) => this.request({
                path: `/admin/invites/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Refresh the token of an invite.
             *
             * @tags Admin Invites
             * @name AdminPostInvitesIdResend
             * @summary Refresh Invite Token
             * @request POST:/admin/invites/{id}/resend
             * @secure
             */
            adminPostInvitesIdResend: (id, query, params = {}) => this.request({
                path: `/admin/invites/${id}/resend`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of notifications. The notifications can be filtered by fields such as `id`. The notifications can also be sorted or paginated.
             *
             * @tags Admin Notifications
             * @name AdminGetNotifications
             * @summary List Notifications
             * @request GET:/admin/notifications
             * @secure
             */
            adminGetNotifications: (query, params = {}) => this.request({
                path: `/admin/notifications`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a notification by its ID. You can expand the notification's relations or select the fields that should be returned.
             *
             * @tags Admin Notifications
             * @name AdminGetNotificationsId
             * @summary Get a Notification
             * @request GET:/admin/notifications/{id}
             * @secure
             */
            adminGetNotificationsId: (id, query, params = {}) => this.request({
                path: `/admin/notifications/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an order edit.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEdits
             * @summary Create Order Edit
             * @request POST:/admin/order-edits
             * @secure
             */
            adminPostOrderEdits: (data, params = {}) => this.request({
                path: `/admin/order-edits`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel an order edit.
             *
             * @tags Admin Order Edits
             * @name AdminDeleteOrderEditsId
             * @summary Cancel Order Edit
             * @request DELETE:/admin/order-edits/{id}
             * @secure
             */
            adminDeleteOrderEditsId: (id, params = {}) => this.request({
                path: `/admin/order-edits/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm an order edit request and apply the changes on the order.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdConfirm
             * @summary Confirm Order Edit
             * @request POST:/admin/order-edits/{id}/confirm
             * @secure
             */
            adminPostOrderEditsIdConfirm: (id, params = {}) => this.request({
                path: `/admin/order-edits/${id}/confirm`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add new items to an order edit. These items will have the action `ITEM_ADD`.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdItems
             * @summary Add Items to Order Edit
             * @request POST:/admin/order-edits/{id}/items
             * @secure
             */
            adminPostOrderEditsIdItems: (id, data, params = {}) => this.request({
                path: `/admin/order-edits/${id}/items`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an existing order item's quantity of an order edit.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdItemsItemItemId
             * @summary Update Order Item Quantity of Order Edit
             * @request POST:/admin/order-edits/{id}/items/item/{item_id}
             * @secure
             */
            adminPostOrderEditsIdItemsItemItemId: (id, itemId, data, params = {}) => this.request({
                path: `/admin/order-edits/${id}/items/item/${itemId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an added item in the order edit by the ID of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdItemsActionId
             * @summary Update an Item in an Order Edit
             * @request POST:/admin/order-edits/{id}/items/{action_id}
             * @secure
             */
            adminPostOrderEditsIdItemsActionId: (id, actionId, data, params = {}) => this.request({
                path: `/admin/order-edits/${id}/items/${actionId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an added item in the order edit by the ID of the item's `ITEM_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Order Edits
             * @name AdminDeleteOrderEditsIdItemsActionId
             * @summary Remove Item from Order Edit
             * @request DELETE:/admin/order-edits/{id}/items/{action_id}
             * @secure
             */
            adminDeleteOrderEditsIdItemsActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/order-edits/${id}/items/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Change the status of an active order edit to requested.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdRequest
             * @summary Request Order Edit
             * @request POST:/admin/order-edits/{id}/request
             * @secure
             */
            adminPostOrderEditsIdRequest: (id, params = {}) => this.request({
                path: `/admin/order-edits/${id}/request`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a shipping method to an exchange. The shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdShippingMethod
             * @summary Add Shipping Method to Order Edit
             * @request POST:/admin/order-edits/{id}/shipping-method
             * @secure
             */
            adminPostOrderEditsIdShippingMethod: (id, data, params = {}) => this.request({
                path: `/admin/order-edits/${id}/shipping-method`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a shipping method in the order edit by the ID of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Order Edits
             * @name AdminPostOrderEditsIdShippingMethodActionId
             * @summary Update Shipping Method of an Order Edit
             * @request POST:/admin/order-edits/{id}/shipping-method/{action_id}
             * @secure
             */
            adminPostOrderEditsIdShippingMethodActionId: (id, actionId, data, params = {}) => this.request({
                path: `/admin/order-edits/${id}/shipping-method/${actionId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a shipping method in the order edit by the ID of the method's `SHIPPING_ADD` action. Every shipping method has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Order Edits
             * @name AdminDeleteOrderEditsIdShippingMethodActionId
             * @summary Remove Shipping Method from Order Edit
             * @request DELETE:/admin/order-edits/{id}/shipping-method/{action_id}
             * @secure
             */
            adminDeleteOrderEditsIdShippingMethodActionId: (id, actionId, params = {}) => this.request({
                path: `/admin/order-edits/${id}/shipping-method/${actionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of orders. The orders can be filtered by fields such as `id`. The orders can also be sorted or paginated.
             *
             * @tags Admin Orders
             * @name AdminGetOrders
             * @summary List Orders
             * @request GET:/admin/orders
             * @secure
             */
            adminGetOrders: (query, params = {}) => this.request({
                path: `/admin/orders`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an order by its ID. You can expand the order's relations or select the fields that should be returned.
             *
             * @tags Admin Orders
             * @name AdminGetOrdersId
             * @summary Get an Order
             * @request GET:/admin/orders/{id}
             * @secure
             */
            adminGetOrdersId: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update an order's details.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersId
             * @summary Update Order
             * @request POST:/admin/orders/{id}
             * @secure
             */
            adminPostOrdersId: (id, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Change the status of an order to archived.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdArchive
             * @summary Archive an Order
             * @request POST:/admin/orders/{id}/archive
             * @secure
             */
            adminPostOrdersIdArchive: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}/archive`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel an order. The cancelation fails if: - The order has captured payments. - The order has refund payments. - The order has fulfillments that aren't canceled.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdCancel
             * @summary Cancel Order
             * @request POST:/admin/orders/{id}/cancel
             * @secure
             */
            adminPostOrdersIdCancel: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}/cancel`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of changes made on an order, including returns, exchanges, etc... The changes can be filtered by fields like FILTER FIELDS. The changes can also be paginated.
             *
             * @tags Admin Orders
             * @name AdminGetOrdersIdChanges
             * @summary List Changes on an Order
             * @request GET:/admin/orders/{id}/changes
             * @secure
             */
            adminGetOrdersIdChanges: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}/changes`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Mark an order as completed.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdComplete
             * @summary Complete Order
             * @request POST:/admin/orders/{id}/complete
             * @secure
             */
            adminPostOrdersIdComplete: (id, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}/complete`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a fulfillment for an order. The creation fails if the order is canceled.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdFulfillments
             * @summary Create an Order Fulfillment
             * @request POST:/admin/orders/{id}/fulfillments
             * @secure
             */
            adminPostOrdersIdFulfillments: (id, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}/fulfillments`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel an order's fulfillment. The fulfillment can't be canceled if it's shipped.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdFulfillmentsFulfillmentIdCancel
             * @summary Cancel Fulfillment
             * @request POST:/admin/orders/{id}/fulfillments/{fulfillment_id}/cancel
             * @secure
             */
            adminPostOrdersIdFulfillmentsFulfillmentIdCancel: (id, fulfillmentId, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}/fulfillments/${fulfillmentId}/cancel`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Mark an order's fulfillment as delivered.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdFulfillmentsFulfillmentIdMarkAsDelivered
             * @summary Mark a Fulfillment as Delivered.
             * @request POST:/admin/orders/{id}/fulfillments/{fulfillment_id}/mark-as-delivered
             * @secure
             */
            adminPostOrdersIdFulfillmentsFulfillmentIdMarkAsDelivered: (id, fulfillmentId, query, params = {}) => this.request({
                path: `/admin/orders/${id}/fulfillments/${fulfillmentId}/mark-as-delivered`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a shipment for an order's fulfillment.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdFulfillmentsFulfillmentIdShipments
             * @summary Create Shipment for an Order's Fulfillment
             * @request POST:/admin/orders/{id}/fulfillments/{fulfillment_id}/shipments
             * @secure
             */
            adminPostOrdersIdFulfillmentsFulfillmentIdShipments: (id, fulfillmentId, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}/fulfillments/${fulfillmentId}/shipments`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of line items in a order. The line items can be filtered by fields like FILTER FIELDS. The line items can also be paginated.
             *
             * @tags Admin Orders
             * @name AdminGetOrdersIdLineItems
             * @summary List Line Items
             * @request GET:/admin/orders/{id}/line-items
             * @secure
             */
            adminGetOrdersIdLineItems: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}/line-items`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a preview of an order using its associated change, such as an edit.
             *
             * @tags Admin Orders
             * @name AdminGetOrdersIdPreview
             * @summary Get Preview
             * @request GET:/admin/orders/{id}/preview
             * @secure
             */
            adminGetOrdersIdPreview: (id, params = {}) => this.request({
                path: `/admin/orders/${id}/preview`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Request an order to be transfered to another customer. The transfer is confirmed by sending a request to the [Accept Order Transfer](https://docs.medusajs.com/api/store#orders_postordersidtransferaccept) Store API route.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdTransfer
             * @summary Request Order Transfer
             * @request POST:/admin/orders/{id}/transfer
             * @secure
             */
            adminPostOrdersIdTransfer: (id, data, query, params = {}) => this.request({
                path: `/admin/orders/${id}/transfer`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a request to transfer an order to another customer.
             *
             * @tags Admin Orders
             * @name AdminPostOrdersIdTransferCancel
             * @summary Cancel Transfer Request
             * @request POST:/admin/orders/{id}/transfer/cancel
             * @secure
             */
            adminPostOrdersIdTransferCancel: (id, query, params = {}) => this.request({
                path: `/admin/orders/${id}/transfer/cancel`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a payment collection.
             *
             * @tags Admin Payment Collections
             * @name AdminPostPaymentCollections
             * @summary Create Payment Collection
             * @request POST:/admin/payment-collections
             * @secure
             */
            adminPostPaymentCollections: (data, query, params = {}) => this.request({
                path: `/admin/payment-collections`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a payment collection.
             *
             * @tags Admin Payment Collections
             * @name AdminDeletePaymentCollectionsId
             * @summary Delete a Payment Collection
             * @request DELETE:/admin/payment-collections/{id}
             * @secure
             */
            adminDeletePaymentCollectionsId: (id, params = {}) => this.request({
                path: `/admin/payment-collections/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Mark a payment collection as paid. This creates and authorizes a payment session, then capture its payment, using the manual payment provider.
             *
             * @tags Admin Payment Collections
             * @name AdminPostPaymentCollectionsIdMarkAsPaid
             * @summary Mark a Payment Collection as Paid
             * @request POST:/admin/payment-collections/{id}/mark-as-paid
             * @secure
             */
            adminPostPaymentCollectionsIdMarkAsPaid: (id, data, query, params = {}) => this.request({
                path: `/admin/payment-collections/${id}/mark-as-paid`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of payments. The payments can be filtered by fields such as `id`. The payments can also be sorted or paginated.
             *
             * @tags Admin Payments
             * @name AdminGetPayments
             * @summary List Payments
             * @request GET:/admin/payments
             * @secure
             */
            adminGetPayments: (query, params = {}) => this.request({
                path: `/admin/payments`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of payment providers. The payment providers can be filtered by fields such as `id`. The payment providers can also be sorted or paginated.
             *
             * @tags Admin Payments
             * @name AdminGetPaymentsPaymentProviders
             * @summary List Payment Providers
             * @request GET:/admin/payments/payment-providers
             * @secure
             */
            adminGetPaymentsPaymentProviders: (query, params = {}) => this.request({
                path: `/admin/payments/payment-providers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a payment by its ID. You can expand the payment's relations or select the fields that should be returned.
             *
             * @tags Admin Payments
             * @name AdminGetPaymentsId
             * @summary Get a Payment
             * @request GET:/admin/payments/{id}
             * @secure
             */
            adminGetPaymentsId: (id, query, params = {}) => this.request({
                path: `/admin/payments/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Capture an amount of a payment. This uses the `capturePayment` method of the payment provider associated with the payment's collection.
             *
             * @tags Admin Payments
             * @name AdminPostPaymentsIdCapture
             * @summary Capture Payment
             * @request POST:/admin/payments/{id}/capture
             * @secure
             */
            adminPostPaymentsIdCapture: (id, data, query, params = {}) => this.request({
                path: `/admin/payments/${id}/capture`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Refund an amount of a payment. This uses the `refundPayment` method of the payment provider associated with the payment's collection.
             *
             * @tags Admin Payments
             * @name AdminPostPaymentsIdRefund
             * @summary Refund Payment
             * @request POST:/admin/payments/{id}/refund
             * @secure
             */
            adminPostPaymentsIdRefund: (id, data, query, params = {}) => this.request({
                path: `/admin/payments/${id}/refund`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of price lists. The price lists can be filtered by fields such as `id`. The price lists can also be sorted or paginated.
             *
             * @tags Admin Price Lists
             * @name AdminGetPriceLists
             * @summary List Price Lists
             * @request GET:/admin/price-lists
             * @secure
             */
            adminGetPriceLists: (query, params = {}) => this.request({
                path: `/admin/price-lists`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a price list.
             *
             * @tags Admin Price Lists
             * @name AdminPostPriceLists
             * @summary Create Price List
             * @request POST:/admin/price-lists
             * @secure
             */
            adminPostPriceLists: (data, query, params = {}) => this.request({
                path: `/admin/price-lists`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a price list by its ID. You can expand the price list's relations or select the fields that should be returned.
             *
             * @tags Admin Price Lists
             * @name AdminGetPriceListsId
             * @summary Get a Price List
             * @request GET:/admin/price-lists/{id}
             * @secure
             */
            adminGetPriceListsId: (id, query, params = {}) => this.request({
                path: `/admin/price-lists/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a price list's details.
             *
             * @tags Admin Price Lists
             * @name AdminPostPriceListsId
             * @summary Update a Price List
             * @request POST:/admin/price-lists/{id}
             * @secure
             */
            adminPostPriceListsId: (id, data, query, params = {}) => this.request({
                path: `/admin/price-lists/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a price list.
             *
             * @tags Admin Price Lists
             * @name AdminDeletePriceListsId
             * @summary Delete a Price List
             * @request DELETE:/admin/price-lists/{id}
             * @secure
             */
            adminDeletePriceListsId: (id, params = {}) => this.request({
                path: `/admin/price-lists/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the prices of a price list to create, update, or delete them.
             *
             * @tags Admin Price Lists
             * @name AdminPostPriceListsIdPricesBatch
             * @summary Manage Prices in Price List
             * @request POST:/admin/price-lists/{id}/prices/batch
             * @secure
             */
            adminPostPriceListsIdPricesBatch: (id, data, params = {}) => this.request({
                path: `/admin/price-lists/${id}/prices/batch`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove products from a price list.
             *
             * @tags Admin Price Lists
             * @name AdminPostPriceListsIdProducts
             * @summary Remove Products from Price List
             * @request POST:/admin/price-lists/{id}/products
             * @secure
             */
            adminPostPriceListsIdProducts: (id, data, query, params = {}) => this.request({
                path: `/admin/price-lists/${id}/products`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of price preferences. The price preferences can be filtered by fields such as `id`. The price preferences can also be sorted or paginated.
             *
             * @tags Admin Price Preferences
             * @name AdminGetPricePreferences
             * @summary List Price Preferences
             * @request GET:/admin/price-preferences
             * @secure
             */
            adminGetPricePreferences: (query, params = {}) => this.request({
                path: `/admin/price-preferences`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a price preference.
             *
             * @tags Admin Price Preferences
             * @name AdminPostPricePreferences
             * @summary Create Price Preference
             * @request POST:/admin/price-preferences
             * @secure
             */
            adminPostPricePreferences: (data, query, params = {}) => this.request({
                path: `/admin/price-preferences`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a price preference by its ID. You can expand the price preference's relations or select the fields that should be returned.
             *
             * @tags Admin Price Preferences
             * @name AdminGetPricePreferencesId
             * @summary Get a Price Preference
             * @request GET:/admin/price-preferences/{id}
             * @secure
             */
            adminGetPricePreferencesId: (id, query, params = {}) => this.request({
                path: `/admin/price-preferences/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a price preference's details.
             *
             * @tags Admin Price Preferences
             * @name AdminPostPricePreferencesId
             * @summary Update a Price Preference
             * @request POST:/admin/price-preferences/{id}
             * @secure
             */
            adminPostPricePreferencesId: (id, data, query, params = {}) => this.request({
                path: `/admin/price-preferences/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a price preference.
             *
             * @tags Admin Price Preferences
             * @name AdminDeletePricePreferencesId
             * @summary Delete a Price Preference
             * @request DELETE:/admin/price-preferences/{id}
             * @secure
             */
            adminDeletePricePreferencesId: (id, params = {}) => this.request({
                path: `/admin/price-preferences/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product categories. The product categories can be filtered by fields such as `id`. The product categories can also be sorted or paginated.
             *
             * @tags Admin Product Categories
             * @name AdminGetProductCategories
             * @summary List Product Categories
             * @request GET:/admin/product-categories
             * @secure
             */
            adminGetProductCategories: (query, params = {}) => this.request({
                path: `/admin/product-categories`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a product category.
             *
             * @tags Admin Product Categories
             * @name AdminPostProductCategories
             * @summary Create Product Category
             * @request POST:/admin/product-categories
             * @secure
             */
            adminPostProductCategories: (data, query, params = {}) => this.request({
                path: `/admin/product-categories`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product category by its ID. You can expand the product category's relations or select the fields that should be returned.
             *
             * @tags Admin Product Categories
             * @name AdminGetProductCategoriesId
             * @summary Get a Product Category
             * @request GET:/admin/product-categories/{id}
             * @secure
             */
            adminGetProductCategoriesId: (id, query, params = {}) => this.request({
                path: `/admin/product-categories/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a product category's details.
             *
             * @tags Admin Product Categories
             * @name AdminPostProductCategoriesId
             * @summary Update a Product Category
             * @request POST:/admin/product-categories/{id}
             * @secure
             */
            adminPostProductCategoriesId: (id, data, query, params = {}) => this.request({
                path: `/admin/product-categories/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a product category. This doesn't deleted products in that category.
             *
             * @tags Admin Product Categories
             * @name AdminDeleteProductCategoriesId
             * @summary Delete a Product Category
             * @request DELETE:/admin/product-categories/{id}
             * @secure
             */
            adminDeleteProductCategoriesId: (id, params = {}) => this.request({
                path: `/admin/product-categories/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage products of a category to add or remove them.
             *
             * @tags Admin Product Categories
             * @name AdminPostProductCategoriesIdProducts
             * @summary Manage Products in Product Category
             * @request POST:/admin/product-categories/{id}/products
             * @secure
             */
            adminPostProductCategoriesIdProducts: (id, data, query, params = {}) => this.request({
                path: `/admin/product-categories/${id}/products`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product tags. The product tags can be filtered by fields such as `id`. The product tags can also be sorted or paginated.
             *
             * @tags Admin Product Tags
             * @name AdminGetProductTags
             * @summary List Product Tags
             * @request GET:/admin/product-tags
             * @secure
             */
            adminGetProductTags: (query, params = {}) => this.request({
                path: `/admin/product-tags`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a product tag.
             *
             * @tags Admin Product Tags
             * @name AdminPostProductTags
             * @summary Create Product Tag
             * @request POST:/admin/product-tags
             * @secure
             */
            adminPostProductTags: (data, query, params = {}) => this.request({
                path: `/admin/product-tags`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product tag by its ID. You can expand the product tag's relations or select the fields that should be returned.
             *
             * @tags Admin Product Tags
             * @name AdminGetProductTagsId
             * @summary Get a Product Tag
             * @request GET:/admin/product-tags/{id}
             * @secure
             */
            adminGetProductTagsId: (id, query, params = {}) => this.request({
                path: `/admin/product-tags/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a product tag's details.
             *
             * @tags Admin Product Tags
             * @name AdminPostProductTagsId
             * @summary Update a Product Tag
             * @request POST:/admin/product-tags/{id}
             * @secure
             */
            adminPostProductTagsId: (id, data, query, params = {}) => this.request({
                path: `/admin/product-tags/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a product tag. This doesn't delete products using the tag.
             *
             * @tags Admin Product Tags
             * @name AdminDeleteProductTagsId
             * @summary Delete a Product Tag
             * @request DELETE:/admin/product-tags/{id}
             * @secure
             */
            adminDeleteProductTagsId: (id, params = {}) => this.request({
                path: `/admin/product-tags/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product types. The product types can be filtered by fields such as `id`. The product types can also be sorted or paginated.
             *
             * @tags Admin Product Types
             * @name AdminGetProductTypes
             * @summary List Product Types
             * @request GET:/admin/product-types
             * @secure
             */
            adminGetProductTypes: (query, params = {}) => this.request({
                path: `/admin/product-types`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a product type.
             *
             * @tags Admin Product Types
             * @name AdminPostProductTypes
             * @summary Create Product Type
             * @request POST:/admin/product-types
             * @secure
             */
            adminPostProductTypes: (data, query, params = {}) => this.request({
                path: `/admin/product-types`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product type by its ID. You can expand the product type's relations or select the fields that should be returned.
             *
             * @tags Admin Product Types
             * @name AdminGetProductTypesId
             * @summary Get a Product Type
             * @request GET:/admin/product-types/{id}
             * @secure
             */
            adminGetProductTypesId: (id, query, params = {}) => this.request({
                path: `/admin/product-types/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a product type's details.
             *
             * @tags Admin Product Types
             * @name AdminPostProductTypesId
             * @summary Update a Product Type
             * @request POST:/admin/product-types/{id}
             * @secure
             */
            adminPostProductTypesId: (id, data, query, params = {}) => this.request({
                path: `/admin/product-types/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a product type. This doesn't delete products of this type.
             *
             * @tags Admin Product Types
             * @name AdminDeleteProductTypesId
             * @summary Delete a Product Type
             * @request DELETE:/admin/product-types/{id}
             * @secure
             */
            adminDeleteProductTypesId: (id, params = {}) => this.request({
                path: `/admin/product-types/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product variants. The product variants can be filtered by fields such as `id`. The product variants can also be sorted or paginated.
             *
             * @tags Admin Product Variants
             * @name AdminGetProductVariants
             * @summary List Product Variants
             * @request GET:/admin/product-variants
             * @secure
             */
            adminGetProductVariants: (query, params = {}) => this.request({
                path: `/admin/product-variants`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of products. The products can be filtered by fields such as `id`. The products can also be sorted or paginated.
             *
             * @tags Admin Products
             * @name AdminGetProducts
             * @summary List Products
             * @request GET:/admin/products
             * @secure
             */
            adminGetProducts: (query, params = {}) => this.request({
                path: `/admin/products`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a product.
             *
             * @tags Admin Products
             * @name AdminPostProducts
             * @summary Create Product
             * @request POST:/admin/products
             * @secure
             */
            adminPostProducts: (data, query, params = {}) => this.request({
                path: `/admin/products`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage products to create, update, or delete them.
             *
             * @tags Admin Products
             * @name AdminPostProductsBatch
             * @summary Manage Products
             * @request POST:/admin/products/batch
             * @secure
             */
            adminPostProductsBatch: (data, query, params = {}) => this.request({
                path: `/admin/products/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Start a product export process to retrieve a CSV of exported products. You'll receive in the response the transaction ID of the workflow generating the CSV file. To check the status of the execution, send a GET request to `/admin/workflows-executions/export-products/:transaction-id`. Once the execution finishes successfully, a notification is created for the export. You can retrieve the notifications using the `/admin/notification` API route to retrieve the file's download URL.
             *
             * @tags Admin Products
             * @name AdminPostProductsExport
             * @summary Export Products
             * @request POST:/admin/products/export
             * @secure
             */
            adminPostProductsExport: (query, params = {}) => this.request({
                path: `/admin/products/export`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a new product import process. The products aren't imported until the import is confirmed with the `/admin/products/:transaction-id/import` API route.
             *
             * @tags Admin Products
             * @name AdminPostProductsImport
             * @summary Create Product Import
             * @request POST:/admin/products/import
             * @secure
             */
            adminPostProductsImport: (data, params = {}) => this.request({
                path: `/admin/products/import`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm that a created product import should start importing the products into Medusa.
             *
             * @tags Admin Products
             * @name AdminPostProductsImportTransactionIdConfirm
             * @summary Confirm Product Import
             * @request POST:/admin/products/import/{transaction_id}/confirm
             * @secure
             */
            adminPostProductsImportTransactionIdConfirm: (transactionId, params = {}) => this.request({
                path: `/admin/products/import/${transactionId}/confirm`,
                method: "POST",
                secure: true,
                ...params,
            }),
            /**
             * @description Retrieve a product by its ID. You can expand the product's relations or select the fields that should be returned.
             *
             * @tags Admin Products
             * @name AdminGetProductsId
             * @summary Get a Product
             * @request GET:/admin/products/{id}
             * @secure
             */
            adminGetProductsId: (id, query, params = {}) => this.request({
                path: `/admin/products/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a product's details.
             *
             * @tags Admin Products
             * @name AdminPostProductsId
             * @summary Update a Product
             * @request POST:/admin/products/{id}
             * @secure
             */
            adminPostProductsId: (id, data, query, params = {}) => this.request({
                path: `/admin/products/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a product.
             *
             * @tags Admin Products
             * @name AdminDeleteProductsId
             * @summary Delete a Product
             * @request DELETE:/admin/products/{id}
             * @secure
             */
            adminDeleteProductsId: (id, params = {}) => this.request({
                path: `/admin/products/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of options of a product. The options can be filtered by fields like `id`. The options can also be paginated.
             *
             * @tags Admin Products
             * @name AdminGetProductsIdOptions
             * @summary List a Product's Options
             * @request GET:/admin/products/{id}/options
             * @secure
             */
            adminGetProductsIdOptions: (id, query, params = {}) => this.request({
                path: `/admin/products/${id}/options`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an option for a product.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdOptions
             * @summary Create a Product Option
             * @request POST:/admin/products/{id}/options
             * @secure
             */
            adminPostProductsIdOptions: (id, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/options`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product's option by its ID.
             *
             * @tags Admin Products
             * @name AdminGetProductsIdOptionsOptionId
             * @summary Get a Product's Option
             * @request GET:/admin/products/{id}/options/{option_id}
             * @secure
             */
            adminGetProductsIdOptionsOptionId: (id, optionId, query, params = {}) => this.request({
                path: `/admin/products/${id}/options/${optionId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the details of a product option.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdOptionsOptionId
             * @summary Update a Product's Option
             * @request POST:/admin/products/{id}/options/{option_id}
             * @secure
             */
            adminPostProductsIdOptionsOptionId: (id, optionId, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/options/${optionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete an option from a product. Values of this option in the product's variants are removed.
             *
             * @tags Admin Products
             * @name AdminDeleteProductsIdOptionsOptionId
             * @summary Delete an Option from Product
             * @request DELETE:/admin/products/{id}/options/{option_id}
             * @secure
             */
            adminDeleteProductsIdOptionsOptionId: (id, optionId, query, params = {}) => this.request({
                path: `/admin/products/${id}/options/${optionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of variants in a product. The variants can be filtered by fields like FILTER FIELDS. The variants can also be paginated.
             *
             * @tags Admin Products
             * @name AdminGetProductsIdVariants
             * @summary List Variants of a Product
             * @request GET:/admin/products/{id}/variants
             * @secure
             */
            adminGetProductsIdVariants: (id, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a variant for a product.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariants
             * @summary Create a Product Variant
             * @request POST:/admin/products/{id}/variants
             * @secure
             */
            adminPostProductsIdVariants: (id, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage variants in a product to create, update, or delete them.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariantsBatch
             * @summary Manage Variants in a Product
             * @request POST:/admin/products/{id}/variants/batch
             * @secure
             */
            adminPostProductsIdVariantsBatch: (id, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage a product's variant's inventoris to associate them with inventory items, update their inventory items, or delete their association with inventory items.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariantsInventoryItemsBatch
             * @summary Manage Variants Inventory in a Product
             * @request POST:/admin/products/{id}/variants/inventory-items/batch
             * @secure
             */
            adminPostProductsIdVariantsInventoryItemsBatch: (id, data, params = {}) => this.request({
                path: `/admin/products/${id}/variants/inventory-items/batch`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product's variant by its ID.
             *
             * @tags Admin Products
             * @name AdminGetProductsIdVariantsVariantId
             * @summary Get Variant of a Product
             * @request GET:/admin/products/{id}/variants/{variant_id}
             * @secure
             */
            adminGetProductsIdVariantsVariantId: (id, variantId, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a variant's details.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariantsVariantId
             * @summary Update a Product Variant
             * @request POST:/admin/products/{id}/variants/{variant_id}
             * @secure
             */
            adminPostProductsIdVariantsVariantId: (id, variantId, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a variant of a product.
             *
             * @tags Admin Products
             * @name AdminDeleteProductsIdVariantsVariantId
             * @summary Delete Product Variant
             * @request DELETE:/admin/products/{id}/variants/{variant_id}
             * @secure
             */
            adminDeleteProductsIdVariantsVariantId: (id, variantId, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Associate with a product variant an inventory item that manages its inventory details.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariantsVariantIdInventoryItems
             * @summary Associate Variant with Inventory Item
             * @request POST:/admin/products/{id}/variants/{variant_id}/inventory-items
             * @secure
             */
            adminPostProductsIdVariantsVariantIdInventoryItems: (id, variantId, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}/inventory-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the inventory item that manages the inventory details of a product variant.
             *
             * @tags Admin Products
             * @name AdminPostProductsIdVariantsVariantIdInventoryItemsInventoryItemId
             * @summary Update Product Variant's Inventory Details
             * @request POST:/admin/products/{id}/variants/{variant_id}/inventory-items/{inventory_item_id}
             * @secure
             */
            adminPostProductsIdVariantsVariantIdInventoryItemsInventoryItemId: (id, variantId, inventoryItemId, data, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}/inventory-items/${inventoryItemId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove the association between an inventory item and its product variant.
             *
             * @tags Admin Products
             * @name AdminDeleteProductsIdVariantsVariantIdInventoryItemsInventoryItemId
             * @summary Remove Inventory Item Association with Product Variant
             * @request DELETE:/admin/products/{id}/variants/{variant_id}/inventory-items/{inventory_item_id}
             * @secure
             */
            adminDeleteProductsIdVariantsVariantIdInventoryItemsInventoryItemId: (id, variantId, inventoryItemId, query, params = {}) => this.request({
                path: `/admin/products/${id}/variants/${variantId}/inventory-items/${inventoryItemId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of promotions. The promotions can be filtered by fields such as `id`. The promotions can also be sorted or paginated.
             *
             * @tags Admin Promotions
             * @name AdminGetPromotions
             * @summary List Promotions
             * @request GET:/admin/promotions
             * @secure
             */
            adminGetPromotions: (query, params = {}) => this.request({
                path: `/admin/promotions`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a promotion.
             *
             * @tags Admin Promotions
             * @name AdminPostPromotions
             * @summary Create Promotion
             * @request POST:/admin/promotions
             * @secure
             */
            adminPostPromotions: (data, query, params = {}) => this.request({
                path: `/admin/promotions`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of potential rule attributes for the promotion and application method types specified in the query parameters. Only the attributes of the rule type specified in the path parameter are retrieved: - If `rule_type` is `rules`, the attributes of the promotion's type are retrieved. - If `rule_type` is `target-rules`, the target rules' attributes of the application method's type are retrieved. - If `rule_type` is `buy-rules`, the buy rules' attributes of the application method's type are retrieved.
             *
             * @tags Admin Promotions
             * @name AdminGetPromotionsRuleAttributeOptionsRuleType
             * @summary List Rule Attribute Options of a Rule Type
             * @request GET:/admin/promotions/rule-attribute-options/{rule_type}
             * @secure
             */
            adminGetPromotionsRuleAttributeOptionsRuleType: (ruleType, query, params = {}) => this.request({
                path: `/admin/promotions/rule-attribute-options/${ruleType}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve all potential values for promotion rules and target and buy rules based on the specified rule attribute and type. For example, if you provide the ID of the `currency_code` rule attribute, and set `rule_type` to `rules`, a list of currencies are retrieved in label-value pairs.
             *
             * @tags Admin Promotions
             * @name AdminGetPromotionsRuleValueOptionsRuleTypeRuleAttributeId
             * @summary List Rule Values Given a Rule Attribute
             * @request GET:/admin/promotions/rule-value-options/{rule_type}/{rule_attribute_id}
             * @secure
             */
            adminGetPromotionsRuleValueOptionsRuleTypeRuleAttributeId: (ruleType, ruleAttributeId, query, params = {}) => this.request({
                path: `/admin/promotions/rule-value-options/${ruleType}/${ruleAttributeId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a promotion by its ID. You can expand the promotion's relations or select the fields that should be returned.
             *
             * @tags Admin Promotions
             * @name AdminGetPromotionsId
             * @summary Get a Promotion
             * @request GET:/admin/promotions/{id}
             * @secure
             */
            adminGetPromotionsId: (id, query, params = {}) => this.request({
                path: `/admin/promotions/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a promotion's details.
             *
             * @tags Admin Promotions
             * @name AdminPostPromotionsId
             * @summary Update a Promotion
             * @request POST:/admin/promotions/{id}
             * @secure
             */
            adminPostPromotionsId: (id, data, query, params = {}) => this.request({
                path: `/admin/promotions/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a promotion.
             *
             * @tags Admin Promotions
             * @name AdminDeletePromotionsId
             * @summary Delete a Promotion
             * @request DELETE:/admin/promotions/{id}
             * @secure
             */
            adminDeletePromotionsId: (id, params = {}) => this.request({
                path: `/admin/promotions/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the buy rules of a `buyget` promotion to create, update, or delete them.
             *
             * @tags Admin Promotions
             * @name AdminPostPromotionsIdBuyRulesBatch
             * @summary Manage the Buy Rules of a Promotion
             * @request POST:/admin/promotions/{id}/buy-rules/batch
             * @secure
             */
            adminPostPromotionsIdBuyRulesBatch: (id, data, query, params = {}) => this.request({
                path: `/admin/promotions/${id}/buy-rules/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the rules of a promotion to create, update, or delete them.
             *
             * @tags Admin Promotions
             * @name AdminPostPromotionsIdRulesBatch
             * @summary Manage a Promotion's Rules
             * @request POST:/admin/promotions/{id}/rules/batch
             * @secure
             */
            adminPostPromotionsIdRulesBatch: (id, data, query, params = {}) => this.request({
                path: `/admin/promotions/${id}/rules/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the target rules of a promotion to create, update, or delete them.
             *
             * @tags Admin Promotions
             * @name AdminPostPromotionsIdTargetRulesBatch
             * @summary Manage Target Rules of a Promotion
             * @request POST:/admin/promotions/{id}/target-rules/batch
             * @secure
             */
            adminPostPromotionsIdTargetRulesBatch: (id, data, query, params = {}) => this.request({
                path: `/admin/promotions/${id}/target-rules/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of rules in a promotion. The type of rules retrieved depend on the value of the `rule_type` path parameter: - If `rule_type` is `rules`, the promotion's rules are retrivied. - If `rule_type` is `target-rules`, the target rules of the promotion's application method are retrieved. - If `rule_type` is `buy-rules`, the buy rules of the promotion's application method are retrieved.
             *
             * @tags Admin Promotions
             * @name AdminGetPromotionsIdRuleType
             * @summary List Rules of a Promotion
             * @request GET:/admin/promotions/{id}/{rule_type}
             * @secure
             */
            adminGetPromotionsIdRuleType: (id, ruleType, query, params = {}) => this.request({
                path: `/admin/promotions/${id}/${ruleType}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of refund reasons. The refund reasons can be filtered by fields such as `id`. The refund reasons can also be sorted or paginated.
             *
             * @tags Admin Refund Reasons
             * @name AdminGetRefundReasons
             * @summary List Refund Reasons
             * @request GET:/admin/refund-reasons
             * @secure
             */
            adminGetRefundReasons: (query, params = {}) => this.request({
                path: `/admin/refund-reasons`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a refund reason.
             *
             * @tags Admin Refund Reasons
             * @name AdminPostRefundReasons
             * @summary Create Refund Reason
             * @request POST:/admin/refund-reasons
             * @secure
             */
            adminPostRefundReasons: (data, query, params = {}) => this.request({
                path: `/admin/refund-reasons`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a refund reason by its ID. You can expand the refund reason's relations or select the fields that should be returned.
             *
             * @tags Admin Refund Reasons
             * @name AdminGetRefundReasonsId
             * @summary Get a Refund Reason
             * @request GET:/admin/refund-reasons/{id}
             * @secure
             */
            adminGetRefundReasonsId: (id, query, params = {}) => this.request({
                path: `/admin/refund-reasons/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a refund reason's details.
             *
             * @tags Admin Refund Reasons
             * @name AdminPostRefundReasonsId
             * @summary Update a Refund Reason
             * @request POST:/admin/refund-reasons/{id}
             * @secure
             */
            adminPostRefundReasonsId: (id, data, query, params = {}) => this.request({
                path: `/admin/refund-reasons/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a refund reason.
             *
             * @tags Admin Refund Reasons
             * @name AdminDeleteRefundReasonsId
             * @summary Delete a Refund Reason
             * @request DELETE:/admin/refund-reasons/{id}
             * @secure
             */
            adminDeleteRefundReasonsId: (id, params = {}) => this.request({
                path: `/admin/refund-reasons/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of regions. The regions can be filtered by fields such as `id`. The regions can also be sorted or paginated.
             *
             * @tags Admin Regions
             * @name AdminGetRegions
             * @summary List Regions
             * @request GET:/admin/regions
             * @secure
             */
            adminGetRegions: (query, params = {}) => this.request({
                path: `/admin/regions`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a region.
             *
             * @tags Admin Regions
             * @name AdminPostRegions
             * @summary Create Region
             * @request POST:/admin/regions
             * @secure
             */
            adminPostRegions: (data, query, params = {}) => this.request({
                path: `/admin/regions`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a region by its ID. You can expand the region's relations or select the fields that should be returned.
             *
             * @tags Admin Regions
             * @name AdminGetRegionsId
             * @summary Get a Region
             * @request GET:/admin/regions/{id}
             * @secure
             */
            adminGetRegionsId: (id, query, params = {}) => this.request({
                path: `/admin/regions/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a region's details.
             *
             * @tags Admin Regions
             * @name AdminPostRegionsId
             * @summary Update a Region
             * @request POST:/admin/regions/{id}
             * @secure
             */
            adminPostRegionsId: (id, data, query, params = {}) => this.request({
                path: `/admin/regions/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a region.
             *
             * @tags Admin Regions
             * @name AdminDeleteRegionsId
             * @summary Delete a Region
             * @request DELETE:/admin/regions/{id}
             * @secure
             */
            adminDeleteRegionsId: (id, params = {}) => this.request({
                path: `/admin/regions/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of reservations. The reservations can be filtered by fields such as `id`. The reservations can also be sorted or paginated.
             *
             * @tags Admin Reservations
             * @name AdminGetReservations
             * @summary List Reservations
             * @request GET:/admin/reservations
             * @secure
             */
            adminGetReservations: (query, params = {}) => this.request({
                path: `/admin/reservations`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a reservation.
             *
             * @tags Admin Reservations
             * @name AdminPostReservations
             * @summary Create Reservation
             * @request POST:/admin/reservations
             * @secure
             */
            adminPostReservations: (data, query, params = {}) => this.request({
                path: `/admin/reservations`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a reservation by its ID. You can expand the reservation's relations or select the fields that should be returned.
             *
             * @tags Admin Reservations
             * @name AdminGetReservationsId
             * @summary Get a Reservation
             * @request GET:/admin/reservations/{id}
             * @secure
             */
            adminGetReservationsId: (id, query, params = {}) => this.request({
                path: `/admin/reservations/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a reservation's details.
             *
             * @tags Admin Reservations
             * @name AdminPostReservationsId
             * @summary Update a Reservation
             * @request POST:/admin/reservations/{id}
             * @secure
             */
            adminPostReservationsId: (id, data, query, params = {}) => this.request({
                path: `/admin/reservations/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a reservation.
             *
             * @tags Admin Reservations
             * @name AdminDeleteReservationsId
             * @summary Delete a Reservation
             * @request DELETE:/admin/reservations/{id}
             * @secure
             */
            adminDeleteReservationsId: (id, params = {}) => this.request({
                path: `/admin/reservations/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of return reasons. The return reasons can be filtered by fields such as `id`. The return reasons can also be sorted or paginated.
             *
             * @tags Admin Return Reasons
             * @name AdminGetReturnReasons
             * @summary List Return Reasons
             * @request GET:/admin/return-reasons
             * @secure
             */
            adminGetReturnReasons: (query, params = {}) => this.request({
                path: `/admin/return-reasons`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a return reason.
             *
             * @tags Admin Return Reasons
             * @name AdminPostReturnReasons
             * @summary Create Return Reason
             * @request POST:/admin/return-reasons
             * @secure
             */
            adminPostReturnReasons: (data, query, params = {}) => this.request({
                path: `/admin/return-reasons`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a return reason by its ID. You can expand the return reason's relations or select the fields that should be returned.
             *
             * @tags Admin Return Reasons
             * @name AdminGetReturnReasonsId
             * @summary Get a Return Reason
             * @request GET:/admin/return-reasons/{id}
             * @secure
             */
            adminGetReturnReasonsId: (id, query, params = {}) => this.request({
                path: `/admin/return-reasons/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a return reason's details.
             *
             * @tags Admin Return Reasons
             * @name AdminPostReturnReasonsId
             * @summary Update a Return Reason
             * @request POST:/admin/return-reasons/{id}
             * @secure
             */
            adminPostReturnReasonsId: (id, data, query, params = {}) => this.request({
                path: `/admin/return-reasons/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a return reason.
             *
             * @tags Admin Return Reasons
             * @name AdminDeleteReturnReasonsId
             * @summary Delete a Return Reason
             * @request DELETE:/admin/return-reasons/{id}
             * @secure
             */
            adminDeleteReturnReasonsId: (id, params = {}) => this.request({
                path: `/admin/return-reasons/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of returns. The returns can be filtered by fields such as `id`. The returns can also be sorted or paginated.
             *
             * @tags Admin Returns
             * @name AdminGetReturns
             * @summary List Returns
             * @request GET:/admin/returns
             * @secure
             */
            adminGetReturns: (query, params = {}) => this.request({
                path: `/admin/returns`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a return. The return can later be requested or confirmed.
             *
             * @tags Admin Returns
             * @name AdminPostReturns
             * @summary Create Return
             * @request POST:/admin/returns
             * @secure
             */
            adminPostReturns: (data, query, params = {}) => this.request({
                path: `/admin/returns`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a return by its ID. You can expand the return's relations or select the fields that should be returned.
             *
             * @tags Admin Returns
             * @name AdminGetReturnsId
             * @summary Get a Return
             * @request GET:/admin/returns/{id}
             * @secure
             */
            adminGetReturnsId: (id, query, params = {}) => this.request({
                path: `/admin/returns/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a return's details.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsId
             * @summary Update a Return
             * @request POST:/admin/returns/{id}
             * @secure
             */
            adminPostReturnsId: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a return.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdCancel
             * @summary Cancel a return.
             * @request POST:/admin/returns/{id}/cancel
             * @secure
             */
            adminPostReturnsIdCancel: (id, data, params = {}) => this.request({
                path: `/admin/returns/${id}/cancel`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Add damaged items, whose quantity is to be dismissed, to a return. These items will have the action `RECEIVE_DAMAGED_RETURN_ITEM`.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdDismissItems
             * @summary Add Damaged Items to Return
             * @request POST:/admin/returns/{id}/dismiss-items
             * @secure
             */
            adminPostReturnsIdDismissItems: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/dismiss-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a damaged item, whose quantity is to be dismissed, in the return by the ID of the  item's `RECEIVE_DAMAGED_RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdDismissItemsActionId
             * @summary Update Damaged Item of Return
             * @request POST:/admin/returns/{id}/dismiss-items/{action_id}
             * @secure
             */
            adminPostReturnsIdDismissItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/dismiss-items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a damaged item, whose quantity is to be dismissed, in the return by the ID of the  item's `RECEIVE_DAMAGED_RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdDismissItemsActionId
             * @summary Remove Damaged Item from Return
             * @request DELETE:/admin/returns/{id}/dismiss-items/{action_id}
             * @secure
             */
            adminDeleteReturnsIdDismissItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/returns/${id}/dismiss-items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Start a return receival process to be later confirmed using the `/admin/returns/:id/receive/confirm` API route.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdReceive
             * @summary Start Return Receival
             * @request POST:/admin/returns/{id}/receive
             * @secure
             */
            adminPostReturnsIdReceive: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/receive`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel the receival process previously started, and hasn't been confirmed, of a return.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdReceive
             * @summary Cancel Return Receival
             * @request DELETE:/admin/returns/{id}/receive
             * @secure
             */
            adminDeleteReturnsIdReceive: (id, params = {}) => this.request({
                path: `/admin/returns/${id}/receive`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add received items in a return. These items will have the action `RECEIVE_RETURN_ITEM`.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdReceiveItems
             * @summary Add Received Items to Return
             * @request POST:/admin/returns/{id}/receive-items
             * @secure
             */
            adminPostReturnsIdReceiveItems: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/receive-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a received item in the return by the ID of the  item's `RECEIVE_RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdReceiveItemsActionId
             * @summary Update a Received Item in a Return
             * @request POST:/admin/returns/{id}/receive-items/{action_id}
             * @secure
             */
            adminPostReturnsIdReceiveItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/receive-items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a received item in the return by the ID of the  item's `RECEIVE_RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdReceiveItemsActionId
             * @summary Remove a Received Item from Return
             * @request DELETE:/admin/returns/{id}/receive-items/{action_id}
             * @secure
             */
            adminDeleteReturnsIdReceiveItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/returns/${id}/receive-items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm that a return has been received. This updates the quantity of the items received, if not damaged, and  reflects the changes on the order.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdReceiveConfirm
             * @summary Confirm Return Receival
             * @request POST:/admin/returns/{id}/receive/confirm
             * @secure
             */
            adminPostReturnsIdReceiveConfirm: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/receive/confirm`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Confirm a requested return. The changes are applied on the inventory quantity and the order only after the return has been confirmed as received using the `/admin/returns/:id/received/confirm`.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdRequest
             * @summary Confirm Return Request
             * @request POST:/admin/returns/{id}/request
             * @secure
             */
            adminPostReturnsIdRequest: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/request`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel a requested return.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdRequest
             * @summary Cancel Return Request
             * @request DELETE:/admin/returns/{id}/request
             * @secure
             */
            adminDeleteReturnsIdRequest: (id, params = {}) => this.request({
                path: `/admin/returns/${id}/request`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add items that are requested to be returned. These items will have the action `RETURN_ITEM`.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdRequestItems
             * @summary Add Requested Items to Return
             * @request POST:/admin/returns/{id}/request-items
             * @secure
             */
            adminPostReturnsIdRequestItems: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/request-items`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a requested item to be returned by the ID of the  item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdRequestItemsActionId
             * @summary Update Requested Item in Return
             * @request POST:/admin/returns/{id}/request-items/{action_id}
             * @secure
             */
            adminPostReturnsIdRequestItemsActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/request-items/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a requested item to be returned by the ID of the item's `RETURN_ITEM` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property. return.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdRequestItemsActionId
             * @summary Remove Item from Return
             * @request DELETE:/admin/returns/{id}/request-items/{action_id}
             * @secure
             */
            adminDeleteReturnsIdRequestItemsActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/returns/${id}/request-items/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a shipping method to a return. The shipping method will have a `SHIPPING_ADD` action.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdShippingMethod
             * @summary Add a Shipping Method to a Return
             * @request POST:/admin/returns/{id}/shipping-method
             * @secure
             */
            adminPostReturnsIdShippingMethod: (id, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/shipping-method`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a shipping method of the return by the ID of the item's `SHIPPING_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Returns
             * @name AdminPostReturnsIdShippingMethodActionId
             * @summary Update a Shipping Method of a Return
             * @request POST:/admin/returns/{id}/shipping-method/{action_id}
             * @secure
             */
            adminPostReturnsIdShippingMethodActionId: (id, actionId, data, query, params = {}) => this.request({
                path: `/admin/returns/${id}/shipping-method/${actionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a shipping method of the return by the ID of the item's `SHIPPING_ADD` action. Every item has an `actions` property, whose value is an array of actions. You can check the action's name using its `action` property, and use the value of the `id` property.
             *
             * @tags Admin Returns
             * @name AdminDeleteReturnsIdShippingMethodActionId
             * @summary Remove Shipping Method from Return
             * @request DELETE:/admin/returns/{id}/shipping-method/{action_id}
             * @secure
             */
            adminDeleteReturnsIdShippingMethodActionId: (id, actionId, query, params = {}) => this.request({
                path: `/admin/returns/${id}/shipping-method/${actionId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of sales channels. The sales channels can be filtered by fields such as `id`. The sales channels can also be sorted or paginated.
             *
             * @tags Admin Sales Channels
             * @name AdminGetSalesChannels
             * @summary List Sales Channels
             * @request GET:/admin/sales-channels
             * @secure
             */
            adminGetSalesChannels: (query, params = {}) => this.request({
                path: `/admin/sales-channels`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a sales channel.
             *
             * @tags Admin Sales Channels
             * @name AdminPostSalesChannels
             * @summary Create Sales Channel
             * @request POST:/admin/sales-channels
             * @secure
             */
            adminPostSalesChannels: (data, query, params = {}) => this.request({
                path: `/admin/sales-channels`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a sales channel by its ID. You can expand the sales channel's relations or select the fields that should be returned.
             *
             * @tags Admin Sales Channels
             * @name AdminGetSalesChannelsId
             * @summary Get a Sales Channel
             * @request GET:/admin/sales-channels/{id}
             * @secure
             */
            adminGetSalesChannelsId: (id, query, params = {}) => this.request({
                path: `/admin/sales-channels/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a sales channel's details.
             *
             * @tags Admin Sales Channels
             * @name AdminPostSalesChannelsId
             * @summary Update a Sales Channel
             * @request POST:/admin/sales-channels/{id}
             * @secure
             */
            adminPostSalesChannelsId: (id, data, query, params = {}) => this.request({
                path: `/admin/sales-channels/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a sales channel.
             *
             * @tags Admin Sales Channels
             * @name AdminDeleteSalesChannelsId
             * @summary Delete a Sales Channel
             * @request DELETE:/admin/sales-channels/{id}
             * @secure
             */
            adminDeleteSalesChannelsId: (id, params = {}) => this.request({
                path: `/admin/sales-channels/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage products in a sales channel to add or remove them from the channel.
             *
             * @tags Admin Sales Channels
             * @name AdminPostSalesChannelsIdProducts
             * @summary Manage Products in Sales Channel
             * @request POST:/admin/sales-channels/{id}/products
             * @secure
             */
            adminPostSalesChannelsIdProducts: (id, data, query, params = {}) => this.request({
                path: `/admin/sales-channels/${id}/products`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of shipping options. The shipping options can be filtered by fields such as `id`. The shipping options can also be sorted or paginated.
             *
             * @tags Admin Shipping Options
             * @name AdminGetShippingOptions
             * @summary List Shipping Options
             * @request GET:/admin/shipping-options
             * @secure
             */
            adminGetShippingOptions: (query, params = {}) => this.request({
                path: `/admin/shipping-options`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a shipping option.
             *
             * @tags Admin Shipping Options
             * @name AdminPostShippingOptions
             * @summary Create Shipping Option
             * @request POST:/admin/shipping-options
             * @secure
             */
            adminPostShippingOptions: (data, query, params = {}) => this.request({
                path: `/admin/shipping-options`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a shipping option by its ID. You can expand the shipping option's relations or select the fields that should be returned.
             *
             * @tags Admin Shipping Options
             * @name AdminGetShippingOptionsId
             * @summary Get a Shipping Option
             * @request GET:/admin/shipping-options/{id}
             * @secure
             */
            adminGetShippingOptionsId: (id, query, params = {}) => this.request({
                path: `/admin/shipping-options/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a shipping option's details.
             *
             * @tags Admin Shipping Options
             * @name AdminPostShippingOptionsId
             * @summary Update a Shipping Option
             * @request POST:/admin/shipping-options/{id}
             * @secure
             */
            adminPostShippingOptionsId: (id, data, query, params = {}) => this.request({
                path: `/admin/shipping-options/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a shipping option.
             *
             * @tags Admin Shipping Options
             * @name AdminDeleteShippingOptionsId
             * @summary Delete a Shipping Option
             * @request DELETE:/admin/shipping-options/{id}
             * @secure
             */
            adminDeleteShippingOptionsId: (id, params = {}) => this.request({
                path: `/admin/shipping-options/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the rules of a shipping option to create, update, or delete them.
             *
             * @tags Admin Shipping Options
             * @name AdminPostShippingOptionsIdRulesBatch
             * @summary Manage the Rules of a Shipping Option
             * @request POST:/admin/shipping-options/{id}/rules/batch
             * @secure
             */
            adminPostShippingOptionsIdRulesBatch: (id, data, query, params = {}) => this.request({
                path: `/admin/shipping-options/${id}/rules/batch`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of shipping profiles. The shipping profiles can be filtered by fields such as `id`. The shipping profiles can also be sorted or paginated.
             *
             * @tags Admin Shipping Profiles
             * @name AdminGetShippingProfiles
             * @summary List Shipping Profiles
             * @request GET:/admin/shipping-profiles
             * @secure
             */
            adminGetShippingProfiles: (query, params = {}) => this.request({
                path: `/admin/shipping-profiles`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a shipping profile.
             *
             * @tags Admin Shipping Profiles
             * @name AdminPostShippingProfiles
             * @summary Create Shipping Profile
             * @request POST:/admin/shipping-profiles
             * @secure
             */
            adminPostShippingProfiles: (data, query, params = {}) => this.request({
                path: `/admin/shipping-profiles`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a shipping profile by its ID. You can expand the shipping profile's relations or select the fields that should be returned.
             *
             * @tags Admin Shipping Profiles
             * @name AdminGetShippingProfilesId
             * @summary Get a Shipping Profile
             * @request GET:/admin/shipping-profiles/{id}
             * @secure
             */
            adminGetShippingProfilesId: (id, query, params = {}) => this.request({
                path: `/admin/shipping-profiles/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a shipping profile's details.
             *
             * @tags Admin Shipping Profiles
             * @name AdminPostShippingProfilesId
             * @summary Update a Shipping Profile
             * @request POST:/admin/shipping-profiles/{id}
             * @secure
             */
            adminPostShippingProfilesId: (id, data, query, params = {}) => this.request({
                path: `/admin/shipping-profiles/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a shipping profile.
             *
             * @tags Admin Shipping Profiles
             * @name AdminDeleteShippingProfilesId
             * @summary Delete a Shipping Profile
             * @request DELETE:/admin/shipping-profiles/{id}
             * @secure
             */
            adminDeleteShippingProfilesId: (id, params = {}) => this.request({
                path: `/admin/shipping-profiles/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of stock locations. The stock locations can be filtered by fields such as `id`. The stock locations can also be sorted or paginated.
             *
             * @tags Admin Stock Locations
             * @name AdminGetStockLocations
             * @summary List Stock Locations
             * @request GET:/admin/stock-locations
             * @secure
             */
            adminGetStockLocations: (query, params = {}) => this.request({
                path: `/admin/stock-locations`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a stock location.
             *
             * @tags Admin Stock Locations
             * @name AdminPostStockLocations
             * @summary Create Stock Location
             * @request POST:/admin/stock-locations
             * @secure
             */
            adminPostStockLocations: (data, query, params = {}) => this.request({
                path: `/admin/stock-locations`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a stock location by its ID. You can expand the stock location's relations or select the fields that should be returned.
             *
             * @tags Admin Stock Locations
             * @name AdminGetStockLocationsId
             * @summary Get a Stock Location
             * @request GET:/admin/stock-locations/{id}
             * @secure
             */
            adminGetStockLocationsId: (id, query, params = {}) => this.request({
                path: `/admin/stock-locations/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a stock location's details.
             *
             * @tags Admin Stock Locations
             * @name AdminPostStockLocationsId
             * @summary Update a Stock Location
             * @request POST:/admin/stock-locations/{id}
             * @secure
             */
            adminPostStockLocationsId: (id, data, query, params = {}) => this.request({
                path: `/admin/stock-locations/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a stock location.
             *
             * @tags Admin Stock Locations
             * @name AdminDeleteStockLocationsId
             * @summary Delete a Stock Location
             * @request DELETE:/admin/stock-locations/{id}
             * @secure
             */
            adminDeleteStockLocationsId: (id, params = {}) => this.request({
                path: `/admin/stock-locations/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the fulfillment providers to add or remove them from a stock location.
             *
             * @tags Admin Stock Locations
             * @name AdminPostStockLocationsIdFulfillmentProviders
             * @summary Manage Fulfillment Providers of a Stock Location
             * @request POST:/admin/stock-locations/{id}/fulfillment-providers
             * @secure
             */
            adminPostStockLocationsIdFulfillmentProviders: (id, data, query, params = {}) => this.request({
                path: `/admin/stock-locations/${id}/fulfillment-providers`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Create and add a fulfillment set to a stock location.
             *
             * @tags Admin Stock Locations
             * @name AdminPostStockLocationsIdFulfillmentSets
             * @summary Add Fulfillment Set to Stock Location
             * @request POST:/admin/stock-locations/{id}/fulfillment-sets
             * @secure
             */
            adminPostStockLocationsIdFulfillmentSets: (id, data, query, params = {}) => this.request({
                path: `/admin/stock-locations/${id}/fulfillment-sets`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Manage the sales channels in a stock location by adding or removing them.
             *
             * @tags Admin Stock Locations
             * @name AdminPostStockLocationsIdSalesChannels
             * @summary Manage Sales Channels of a Stock Location
             * @request POST:/admin/stock-locations/{id}/sales-channels
             * @secure
             */
            adminPostStockLocationsIdSalesChannels: (id, data, query, params = {}) => this.request({
                path: `/admin/stock-locations/${id}/sales-channels`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of stores. The stores can be filtered by fields such as `id`. The stores can also be sorted or paginated.
             *
             * @tags Admin Stores
             * @name AdminGetStores
             * @summary List Stores
             * @request GET:/admin/stores
             * @secure
             */
            adminGetStores: (query, params = {}) => this.request({
                path: `/admin/stores`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a store by its ID. You can expand the store's relations or select the fields that should be returned.
             *
             * @tags Admin Stores
             * @name AdminGetStoresId
             * @summary Get a Store
             * @request GET:/admin/stores/{id}
             * @secure
             */
            adminGetStoresId: (id, query, params = {}) => this.request({
                path: `/admin/stores/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a store's details.
             *
             * @tags Admin Stores
             * @name AdminPostStoresId
             * @summary Update a Store
             * @request POST:/admin/stores/{id}
             * @secure
             */
            adminPostStoresId: (id, data, query, params = {}) => this.request({
                path: `/admin/stores/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of tax rates. The tax rates can be filtered by fields such as `id`. The tax rates can also be sorted or paginated.
             *
             * @tags Admin Tax Rates
             * @name AdminGetTaxRates
             * @summary List Tax Rates
             * @request GET:/admin/tax-rates
             * @secure
             */
            adminGetTaxRates: (query, params = {}) => this.request({
                path: `/admin/tax-rates`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a tax rate.
             *
             * @tags Admin Tax Rates
             * @name AdminPostTaxRates
             * @summary Create Tax Rate
             * @request POST:/admin/tax-rates
             * @secure
             */
            adminPostTaxRates: (data, query, params = {}) => this.request({
                path: `/admin/tax-rates`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a tax rate by its ID. You can expand the tax rate's relations or select the fields that should be returned.
             *
             * @tags Admin Tax Rates
             * @name AdminGetTaxRatesId
             * @summary Get a Tax Rate
             * @request GET:/admin/tax-rates/{id}
             * @secure
             */
            adminGetTaxRatesId: (id, query, params = {}) => this.request({
                path: `/admin/tax-rates/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a tax rate's details.
             *
             * @tags Admin Tax Rates
             * @name AdminPostTaxRatesId
             * @summary Update a Tax Rate
             * @request POST:/admin/tax-rates/{id}
             * @secure
             */
            adminPostTaxRatesId: (id, data, query, params = {}) => this.request({
                path: `/admin/tax-rates/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a tax rate.
             *
             * @tags Admin Tax Rates
             * @name AdminDeleteTaxRatesId
             * @summary Delete a Tax Rate
             * @request DELETE:/admin/tax-rates/{id}
             * @secure
             */
            adminDeleteTaxRatesId: (id, params = {}) => this.request({
                path: `/admin/tax-rates/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a tax rule for a rate.
             *
             * @tags Admin Tax Rates
             * @name AdminPostTaxRatesIdRules
             * @summary Create Tax Rule for a Rate
             * @request POST:/admin/tax-rates/{id}/rules
             * @secure
             */
            adminPostTaxRatesIdRules: (id, data, query, params = {}) => this.request({
                path: `/admin/tax-rates/${id}/rules`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a tax rate's rule.
             *
             * @tags Admin Tax Rates
             * @name AdminDeleteTaxRatesIdRulesRuleId
             * @summary Remove Rule of Tax Rate
             * @request DELETE:/admin/tax-rates/{id}/rules/{rule_id}
             * @secure
             */
            adminDeleteTaxRatesIdRulesRuleId: (id, ruleId, query, params = {}) => this.request({
                path: `/admin/tax-rates/${id}/rules/${ruleId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of tax regions. The tax regions can be filtered by fields such as `id`. The tax regions can also be sorted or paginated.
             *
             * @tags Admin Tax Regions
             * @name AdminGetTaxRegions
             * @summary List Tax Regions
             * @request GET:/admin/tax-regions
             * @secure
             */
            adminGetTaxRegions: (query, params = {}) => this.request({
                path: `/admin/tax-regions`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a tax region.
             *
             * @tags Admin Tax Regions
             * @name AdminPostTaxRegions
             * @summary Create Tax Region
             * @request POST:/admin/tax-regions
             * @secure
             */
            adminPostTaxRegions: (data, query, params = {}) => this.request({
                path: `/admin/tax-regions`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a tax region by its ID. You can expand the tax region's relations or select the fields that should be returned.
             *
             * @tags Admin Tax Regions
             * @name AdminGetTaxRegionsId
             * @summary Get a Tax Region
             * @request GET:/admin/tax-regions/{id}
             * @secure
             */
            adminGetTaxRegionsId: (id, query, params = {}) => this.request({
                path: `/admin/tax-regions/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a tax region's details.
             *
             * @tags Admin Tax Regions
             * @name AdminPostTaxRegionsId
             * @summary Update a Tax Region
             * @request POST:/admin/tax-regions/{id}
             * @secure
             */
            adminPostTaxRegionsId: (id, data, query, params = {}) => this.request({
                path: `/admin/tax-regions/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a tax region.
             *
             * @tags Admin Tax Regions
             * @name AdminDeleteTaxRegionsId
             * @summary Delete a Tax Region
             * @request DELETE:/admin/tax-regions/{id}
             * @secure
             */
            adminDeleteTaxRegionsId: (id, params = {}) => this.request({
                path: `/admin/tax-regions/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Upload files to the configured File Module Provider.
             *
             * @tags Admin Uploads
             * @name AdminPostUploads
             * @summary Upload Files
             * @request POST:/admin/uploads
             * @secure
             */
            adminPostUploads: (data, params = {}) => this.request({
                path: `/admin/uploads`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an uploaded file by its ID. You can expand the file's relations or select the fields that should be returned.
             *
             * @tags Admin Uploads
             * @name AdminGetUploadsId
             * @summary Get a File
             * @request GET:/admin/uploads/{id}
             * @secure
             */
            adminGetUploadsId: (id, query, params = {}) => this.request({
                path: `/admin/uploads/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a file. Uses the installed file module provider to delete the file.
             *
             * @tags Admin Uploads
             * @name AdminDeleteUploadsId
             * @summary Delete a File
             * @request DELETE:/admin/uploads/{id}
             * @secure
             */
            adminDeleteUploadsId: (id, params = {}) => this.request({
                path: `/admin/uploads/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of users. The users can be filtered by fields such as `id`. The users can also be sorted or paginated.
             *
             * @tags Admin Users
             * @name AdminGetUsers
             * @summary List Users
             * @request GET:/admin/users
             * @secure
             */
            adminGetUsers: (query, params = {}) => this.request({
                path: `/admin/users`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve the logged-in user's details.
             *
             * @tags Admin Users
             * @name AdminGetUsersMe
             * @summary Get Logged-In User
             * @request GET:/admin/users/me
             * @secure
             */
            adminGetUsersMe: (query, params = {}) => this.request({
                path: `/admin/users/me`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a user by its ID. You can expand the user's relations or select the fields that should be returned.
             *
             * @tags Admin Users
             * @name AdminGetUsersId
             * @summary Get a User
             * @request GET:/admin/users/{id}
             * @secure
             */
            adminGetUsersId: (id, query, params = {}) => this.request({
                path: `/admin/users/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a user's details.
             *
             * @tags Admin Users
             * @name AdminPostUsersId
             * @summary Update a User
             * @request POST:/admin/users/{id}
             * @secure
             */
            adminPostUsersId: (id, data, query, params = {}) => this.request({
                path: `/admin/users/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a user.
             *
             * @tags Admin Users
             * @name AdminDeleteUsersId
             * @summary Delete a User
             * @request DELETE:/admin/users/{id}
             * @secure
             */
            adminDeleteUsersId: (id, params = {}) => this.request({
                path: `/admin/users/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of workflows executions. The workflows executions can be filtered by fields such as `id`. The workflows executions can also be sorted or paginated.
             *
             * @tags Admin Workflows Executions
             * @name AdminGetWorkflowsExecutions
             * @summary List Workflows Executions
             * @request GET:/admin/workflows-executions
             * @secure
             */
            adminGetWorkflowsExecutions: (query, params = {}) => this.request({
                path: `/admin/workflows-executions`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a workflows execution by its ID. You can expand the workflows execution's relations or select the fields that should be returned.
             *
             * @tags Admin Workflows Executions
             * @name AdminGetWorkflowsExecutionsId
             * @summary Get a Workflows Execution
             * @request GET:/admin/workflows-executions/{id}
             * @secure
             */
            adminGetWorkflowsExecutionsId: (id, query, params = {}) => this.request({
                path: `/admin/workflows-executions/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Execute a workflow by its ID.
             *
             * @tags Admin Workflows Executions
             * @name AdminPostWorkflowsExecutionsWorkflowIdRun
             * @summary Execute a Workflow
             * @request POST:/admin/workflows-executions/{workflow_id}/run
             * @secure
             */
            adminPostWorkflowsExecutionsWorkflowIdRun: (workflowId, data, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/run`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Set the status of a step in a workflow's execution as failed. This is useful for long-running workflows.
             *
             * @tags Admin Workflows Executions
             * @name AdminPostWorkflowsExecutionsWorkflowIdStepsFailure
             * @summary Fail a Step in a Workflow's Execution
             * @request POST:/admin/workflows-executions/{workflow_id}/steps/failure
             * @secure
             */
            adminPostWorkflowsExecutionsWorkflowIdStepsFailure: (workflowId, data, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/steps/failure`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Set the status of a step in a workflow's execution as successful. This is useful for long-running workflows.
             *
             * @tags Admin Workflows Executions
             * @name AdminPostWorkflowsExecutionsWorkflowIdStepsSuccess
             * @summary Succeed a Step in a Workflow's Execution
             * @request POST:/admin/workflows-executions/{workflow_id}/steps/success
             * @secure
             */
            adminPostWorkflowsExecutionsWorkflowIdStepsSuccess: (workflowId, data, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/steps/success`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Subscribe to a workflow's execution to receive real-time information about its steps, status, and data. This route returns an event stream that you can consume using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).
             *
             * @tags Admin Workflows Executions
             * @name AdminGetWorkflowsExecutionsWorkflowIdSubscribe
             * @summary Subscribe to a Workflow's Execution
             * @request GET:/admin/workflows-executions/{workflow_id}/subscribe
             * @secure
             */
            adminGetWorkflowsExecutionsWorkflowIdSubscribe: (workflowId, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/subscribe`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Get the details of the workflow's execution.
             *
             * @tags Admin Workflows Executions
             * @name AdminGetWorkflowsExecutionsWorkflowIdTransactionId
             * @summary Get Workflow Execution's Details
             * @request GET:/admin/workflows-executions/{workflow_id}/{transaction_id}
             * @secure
             */
            adminGetWorkflowsExecutionsWorkflowIdTransactionId: (workflowId, transactionId, query, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/${transactionId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Subscribe to a step in a workflow's execution to receive real-time information about its status and data. This route returns an event stream that you can consume using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).
             *
             * @tags Admin Workflows Executions
             * @name AdminGetWorkflowsExecutionsWorkflowIdTransactionIdStepIdSubscribe
             * @summary Subscribe to Step of a Workflow's Execution
             * @request GET:/admin/workflows-executions/{workflow_id}/{transaction_id}/{step_id}/subscribe
             * @secure
             */
            adminGetWorkflowsExecutionsWorkflowIdTransactionIdStepIdSubscribe: (workflowId, transactionId, stepId, params = {}) => this.request({
                path: `/admin/workflows-executions/${workflowId}/${transactionId}/${stepId}/subscribe`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Retrieves a commission rule with 'site' reference type.
             *
             * @tags Admin
             * @name AdminGetDefaultCommissionRule
             * @summary Get default commission rule
             * @request GET:/admin/commission/default
             * @secure
             */
            adminGetDefaultCommissionRule: (params = {}) => this.request({
                path: `/admin/commission/default`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates or updates default commission rule.
             *
             * @tags Admin
             * @name AdminUpsertDefaultCommissionRule
             * @summary Upsert default CommissionRule
             * @request POST:/admin/commission/default
             * @secure
             */
            adminUpsertDefaultCommissionRule: (data, params = {}) => this.request({
                path: `/admin/commission/default`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of commission rules.
             *
             * @tags Admin
             * @name AdminListCommissionRules
             * @summary List Commission rules
             * @request GET:/admin/commission/rules
             * @secure
             */
            adminListCommissionRules: (query, params = {}) => this.request({
                path: `/admin/commission/rules`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new commission rule.
             *
             * @tags Admin
             * @name AdminCreateCommissionRule
             * @summary Create a CommissionRule
             * @request POST:/admin/commission/rules
             * @secure
             */
            adminCreateCommissionRule: (data, params = {}) => this.request({
                path: `/admin/commission/rules`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a commission rule by id.
             *
             * @tags Admin
             * @name AdminGetCommissionRuleById
             * @summary Get commission rule by id
             * @request GET:/admin/commission/rules/{id}
             * @secure
             */
            adminGetCommissionRuleById: (id, params = {}) => this.request({
                path: `/admin/commission/rules/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates commission rule by id.
             *
             * @tags Admin
             * @name AdminUpdateCommissionRuleById
             * @summary Update CommissionRule
             * @request POST:/admin/commission/rules/{id}
             * @secure
             */
            adminUpdateCommissionRuleById: (id, data, params = {}) => this.request({
                path: `/admin/commission/rules/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a commission rule by id.
             *
             * @tags Admin
             * @name AdminDeleteCommissionRuleById
             * @summary Delete a Commission Rule
             * @request DELETE:/admin/commission/rules/{id}
             * @secure
             */
            adminDeleteCommissionRuleById: (id, params = {}) => this.request({
                path: `/admin/commission/rules/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves rules list
             *
             * @tags Admin
             * @name AdminListRules
             * @summary List rules
             * @request GET:/admin/configuration
             * @secure
             */
            adminListRules: (query, params = {}) => this.request({
                path: `/admin/configuration`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a request to admin to accept new resource
             *
             * @tags Admin
             * @name AdminCreateRule
             * @summary Create a configuration rule
             * @request POST:/admin/configuration
             * @secure
             */
            adminCreateRule: (data, params = {}) => this.request({
                path: `/admin/configuration`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a rule
             *
             * @tags Admin
             * @name AdminUpdateRule
             * @summary Update a configuration rule
             * @request POST:/admin/configuration/{id}
             * @secure
             */
            adminUpdateRule: (id, data, params = {}) => this.request({
                path: `/admin/configuration/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves requests list
             *
             * @tags Admin
             * @name AdminListRequests
             * @summary List requests
             * @request GET:/admin/requests
             * @secure
             */
            adminListRequests: (query, params = {}) => this.request({
                path: `/admin/requests`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id.
             *
             * @tags Admin
             * @name AdminGetRequestById
             * @summary Get return request by id
             * @request GET:/admin/requests/{id}
             * @secure
             */
            adminGetRequestById: (id, query, params = {}) => this.request({
                path: `/admin/requests/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id.
             *
             * @tags Admin
             * @name AdminReviewRequestById
             * @summary Get return request by id
             * @request POST:/admin/requests/{id}
             * @secure
             */
            adminReviewRequestById: (id, data, params = {}) => this.request({
                path: `/admin/requests/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves requests list
             *
             * @tags OrderReturnRequest
             * @name AdminListOrderReturnRequests
             * @summary List return requests
             * @request GET:/admin/return-request
             * @secure
             */
            adminListOrderReturnRequests: (query, params = {}) => this.request({
                path: `/admin/return-request`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id.
             *
             * @tags OrderReturnRequest
             * @name AdminGetOrderReturnRequestById
             * @summary Get return request by id
             * @request GET:/admin/return-request/{id}
             * @secure
             */
            adminGetOrderReturnRequestById: (id, query, params = {}) => this.request({
                path: `/admin/return-request/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a request by id.
             *
             * @tags OrderReturnRequest
             * @name AdminUpdateOrderReturnRequestById
             * @summary Update return request by id
             * @request POST:/admin/return-request/{id}
             * @secure
             */
            adminUpdateOrderReturnRequestById: (id, data, params = {}) => this.request({
                path: `/admin/return-request/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves review list
             *
             * @tags Admin
             * @name AdminListReviews
             * @summary List reviews
             * @request GET:/admin/reviews
             * @secure
             */
            adminListReviews: (query, params = {}) => this.request({
                path: `/admin/reviews`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a review by id.
             *
             * @tags Admin
             * @name AdminGetReviewById
             * @summary Get review by id
             * @request GET:/admin/reviews/{id}
             * @secure
             */
            adminGetReviewById: (id, query, params = {}) => this.request({
                path: `/admin/reviews/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of sellers.
             *
             * @tags Admin
             * @name AdminListSellers
             * @summary List Sellers
             * @request GET:/admin/sellers
             * @secure
             */
            adminListSellers: (query, params = {}) => this.request({
                path: `/admin/sellers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
        };
        this.auth = {
            /**
             * @description Set the cookie session ID of a customer. The customer must be previously authenticated with the `/auth/customer/{provider}` API route first, as the JWT token is required in the header of the request.
             *
             * @tags Store Auth
             * @name StorePostSession
             * @summary Set Authentication Session
             * @request POST:/auth/session
             */
            storePostSession: (params = {}) => this.request({
                path: `/auth/session`,
                method: "POST",
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes the cookie session ID previously set for authentication.
             *
             * @tags Store Auth
             * @name StoreDeleteSession
             * @summary Delete Authentication Session
             * @request DELETE:/auth/session
             */
            storeDeleteSession: (params = {}) => this.request({
                path: `/auth/session`,
                method: "DELETE",
                format: "json",
                ...params,
            }),
            /**
             * @description Refresh the authentication token of a customer. This is useful after authenticating a customer with a third-party service to ensure the token holds the new user's details, or when you don't want customers to re-login every day.
             *
             * @tags Store Auth
             * @name StorePostAdminAuthTokenRefresh
             * @summary Refresh Authentication Token
             * @request POST:/auth/token/refresh
             */
            storePostAdminAuthTokenRefresh: (params = {}) => this.request({
                path: `/auth/token/refresh`,
                method: "POST",
                format: "json",
                ...params,
            }),
            /**
             * @description Authenticate a user and receive the JWT token to be used in the header of subsequent requests. When used with a third-party provider, such as Google, the request returns a `location` property. You redirect to the specified URL in your frontend to continue authentication with the third-party service.
             *
             * @tags Admin Auth
             * @name AdminPostActorTypeAuthProvider
             * @summary Authenticate User
             * @request POST:/auth/user/{auth_provider}
             */
            adminPostActorTypeAuthProvider: (authProvider, data, params = {}) => this.request({
                path: `/auth/user/${authProvider}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description This API route is used by your dashboard or frontend application when a third-party provider redirects to it after authentication. It validates the authentication with the third-party provider and, if successful, returns an authentication token. All query parameters received from the third-party provider, such as `code`, `state`, and `error`, must be passed as query parameters to this route. You can decode the JWT token using libraries like [react-jwt](https://www.npmjs.com/package/react-jwt) in the frontend. If the decoded data doesn't  have an `actor_id` property, then you must create a user, typically using the Accept Invite route passing the token in the request's Authorization header.
             *
             * @tags Admin Auth
             * @name AdminPostActorTypeAuthProviderCallback
             * @summary Validate Authentication Callback
             * @request POST:/auth/user/{auth_provider}/callback
             */
            adminPostActorTypeAuthProviderCallback: (authProvider, params = {}) => this.request({
                path: `/auth/user/${authProvider}/callback`,
                method: "POST",
                format: "json",
                ...params,
            }),
            /**
             * @description This API route retrieves a registration JWT token of a user that hasn't been registered yet. The token is used in the header of requests that create a user, such as the Accept Invite API route.
             *
             * @tags Admin Auth
             * @name AdminPostActorTypeAuthProviderRegister
             * @summary Retrieve Registration JWT Token
             * @request POST:/auth/user/{auth_provider}/register
             */
            adminPostActorTypeAuthProviderRegister: (authProvider, data, params = {}) => this.request({
                path: `/auth/user/${authProvider}/register`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Generate a reset password token for an admin user. This API route doesn't reset the admin's password or send them the reset instructions in a notification. Instead, This API route emits the `auth.password_reset` event, passing it the token as a payload. You can listen to that event in a subscriber as explained in [this guide](https://docs.medusajs.com/resources/commerce-modules/auth/reset-password), then send the user a notification. The notification is sent using a [Notification Module Provider](https://docs.medusajs.com/resources/architectural-modules/notification), and it should have the URL to reset the password in the Medusa Admin dashboard, such as `http://localhost:9000/app/reset-password?token=123`. Use the generated token to update the user's password using the [Reset Password API route](https://docs.medusajs.com/api/admin#auth_postactor_typeauth_providerupdate).
             *
             * @tags Admin Auth
             * @name AdminPostActorTypeAuthProviderResetPassword
             * @summary Generate Reset Password Token for Admin User
             * @request POST:/auth/user/{auth_provider}/reset-password
             */
            adminPostActorTypeAuthProviderResetPassword: (authProvider, data, params = {}) => this.request({
                path: `/auth/user/${authProvider}/reset-password`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Reset an admin user's password using a reset-password token generated with the [Generate Reset Password Token API route](https://docs.medusajs.com/api/admin#auth_postactor_typeauth_providerresetpassword). You pass the token as a bearer token in the request's Authorization header.
             *
             * @tags Admin Auth
             * @name AdminPostActorTypeAuthProviderUpdate
             * @summary Reset an Admin User's Password
             * @request POST:/auth/user/{auth_provider}/update
             * @secure
             */
            adminPostActorTypeAuthProviderUpdate: (authProvider, data, params = {}) => this.request({
                path: `/auth/user/${authProvider}/update`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Authenticate a customer and receive the JWT token to be used in the header of subsequent requests. When used with a third-party provider, such as Google, the request returns a `location` property. You redirect to the specified URL in your storefront to continue authentication with the third-party service.
             *
             * @tags Store Auth
             * @name StorePostActorTypeAuthProvider
             * @summary Authenticate Customer
             * @request POST:/auth/customer/{auth_provider}
             */
            storePostActorTypeAuthProvider: (authProvider, data, params = {}) => this.request({
                path: `/auth/customer/${authProvider}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description This API route is used by your storefront or frontend application when a third-party provider redirects to it after authentication. It validates the authentication with the third-party provider and, if successful, returns an authentication token. All query parameters received from the third-party provider, such as `code`, `state`, and `error`, must be passed as query parameters to this route. You can decode the JWT token using libraries like [react-jwt](https://www.npmjs.com/package/react-jwt) in the storefront. If the decoded data doesn't  have an `actor_id` property, then you must register the customer using the Create Customer API route passing the token in the request's Authorization header.
             *
             * @tags Store Auth
             * @name StorePostActorTypeAuthProviderCallback
             * @summary Validate Authentication Callback
             * @request POST:/auth/customer/{auth_provider}/callback
             */
            storePostActorTypeAuthProviderCallback: (authProvider, params = {}) => this.request({
                path: `/auth/customer/${authProvider}/callback`,
                method: "POST",
                format: "json",
                ...params,
            }),
            /**
             * @description This API route retrieves a registration JWT token of a customer that hasn't been registered yet. The token is used in the header of requests that create a customer.
             *
             * @tags Store Auth
             * @name StorePostActorTypeAuthProviderRegister
             * @summary Retrieve Registration JWT Token
             * @request POST:/auth/customer/{auth_provider}/register
             */
            storePostActorTypeAuthProviderRegister: (authProvider, data, params = {}) => this.request({
                path: `/auth/customer/${authProvider}/register`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Generate a reset password token for a customer. This API route doesn't reset the customer password or send them the reset instructions in a notification. Instead, This API route emits the `auth.password_reset` event, passing it the token as a payload. You can listen to that event in a subscriber as explained in [this guide](https://docs.medusajs.com/resources/commerce-modules/auth/reset-password), then send the customer a notification. The notification is sent using a [Notification Module Provider](https://docs.medusajs.com/resources/architectural-modules/notification), and it should have a URL that accepts a `token` query parameter, allowing the customer to reset their password from the storefront. Use the generated token to update the customer's password using the [Reset Password API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerupdate).
             *
             * @tags Store Auth
             * @name StorePostActorTypeAuthProviderResetPassword
             * @summary Generate Reset Password Token for Customer
             * @request POST:/auth/customer/{auth_provider}/reset-password
             */
            storePostActorTypeAuthProviderResetPassword: (authProvider, data, params = {}) => this.request({
                path: `/auth/customer/${authProvider}/reset-password`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Reset a customer's password using a reset-password token generated with the [Generate Reset Password Token API route](https://docs.medusajs.com/api/store#auth_postactor_typeauth_providerresetpassword). You pass the token as a bearer token in the request's Authorization header.
             *
             * @tags Store Auth
             * @name StorePostActorTypeAuthProviderUpdate
             * @summary Reset a Customer's Password
             * @request POST:/auth/customer/{auth_provider}/update
             * @secure
             */
            storePostActorTypeAuthProviderUpdate: (authProvider, data, params = {}) => this.request({
                path: `/auth/customer/${authProvider}/update`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Authenticate a seller and receive the JWT token to be used in the header of subsequent requests. When used with a third-party provider, such as Google, the request returns a `location` property. You redirect to the specified URL in your frontend to continue authentication with the third-party service.
             *
             * @tags Auth
             * @name PostSellerTypeAuthProvider
             * @summary Authenticate Seller
             * @request POST:/auth/seller/{auth_provider}
             */
            postSellerTypeAuthProvider: (authProvider, data, params = {}) => this.request({
                path: `/auth/seller/${authProvider}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description This API route retrieves a registration JWT token of a seller that hasn't been registered yet. The token is used in the header of requests that create a seller, such as the Accept Invite API route.
             *
             * @tags Auth
             * @name PostSellerTypeAuthProviderRegister
             * @summary Retrieve Registration JWT Token
             * @request POST:/auth/seller/{auth_provider}/register
             */
            postSellerTypeAuthProviderRegister: (authProvider, data, params = {}) => this.request({
                path: `/auth/seller/${authProvider}/register`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
        };
        this.store = {
            /**
             * @description Create a cart.
             *
             * @tags Store Carts
             * @name StorePostCarts
             * @summary Create Cart
             * @request POST:/store/carts
             */
            storePostCarts: (data, query, params = {}) => this.request({
                path: `/store/carts`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a cart by its ID. You can expand the cart's relations or select the fields that should be returned.
             *
             * @tags Store Carts
             * @name StoreGetCartsId
             * @summary Get a Cart
             * @request GET:/store/carts/{id}
             */
            storeGetCartsId: (id, query, params = {}) => this.request({
                path: `/store/carts/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a cart's details. This unsets the payment methods chosen before, and the customer would have to choose them again. Also, if the customer has chosen a shipping method whose option isn't valid for the cart's shipping address anymore, the shipping method will be unset. For example, if the shipping option is valid only in the US geo zone, and the shipping address's country code is `DE`, the shipping method will be unset.
             *
             * @tags Store Carts
             * @name StorePostCartsId
             * @summary Update a Cart
             * @request POST:/store/carts/{id}
             */
            storePostCartsId: (id, data, query, params = {}) => this.request({
                path: `/store/carts/${id}`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Complete a cart and place an order.
             *
             * @tags Store Carts
             * @name StorePostCartsIdComplete
             * @summary Complete Cart
             * @request POST:/store/carts/{id}/complete
             */
            storePostCartsIdComplete: (id, query, params = {}) => this.request({
                path: `/store/carts/${id}/complete`,
                method: "POST",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Set the customer of the cart. This is useful when you create the cart for a guest customer, then they log in with their account.
             *
             * @tags Store Carts
             * @name StorePostCartsIdCustomer
             * @summary Set Cart's Customer
             * @request POST:/store/carts/{id}/customer
             */
            storePostCartsIdCustomer: (id, query, params = {}) => this.request({
                path: `/store/carts/${id}/customer`,
                method: "POST",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a product variant as a line item in the cart.
             *
             * @tags Store Carts
             * @name StorePostCartsIdLineItems
             * @summary Add Line Item to Cart
             * @request POST:/store/carts/{id}/line-items
             */
            storePostCartsIdLineItems: (id, data, query, params = {}) => this.request({
                path: `/store/carts/${id}/line-items`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Update a line item's details in the cart.
             *
             * @tags Store Carts
             * @name StorePostCartsIdLineItemsLineId
             * @summary Update a Line Item in a Cart
             * @request POST:/store/carts/{id}/line-items/{line_id}
             */
            storePostCartsIdLineItemsLineId: (id, lineId, data, query, params = {}) => this.request({
                path: `/store/carts/${id}/line-items/${lineId}`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a line item from a cart.
             *
             * @tags Store Carts
             * @name StoreDeleteCartsIdLineItemsLineId
             * @summary Remove Line Item from Cart
             * @request DELETE:/store/carts/{id}/line-items/{line_id}
             */
            storeDeleteCartsIdLineItemsLineId: (id, lineId, query, params = {}) => this.request({
                path: `/store/carts/${id}/line-items/${lineId}`,
                method: "DELETE",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a list of promotions to a cart.
             *
             * @tags Store Carts
             * @name StorePostCartsIdPromotions
             * @summary Add Promotions to Cart
             * @request POST:/store/carts/{id}/promotions
             */
            storePostCartsIdPromotions: (id, data, query, params = {}) => this.request({
                path: `/store/carts/${id}/promotions`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove a list of promotions from a cart.
             *
             * @tags Store Carts
             * @name StoreDeleteCartsIdPromotions
             * @summary Remove Promotions from Cart
             * @request DELETE:/store/carts/{id}/promotions
             */
            storeDeleteCartsIdPromotions: (id, query, params = {}) => this.request({
                path: `/store/carts/${id}/promotions`,
                method: "DELETE",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Add a shipping method to a cart. Use this API route when the customer chooses their preferred shipping option.
             *
             * @tags Store Carts
             * @name StorePostCartsIdShippingMethods
             * @summary Add Shipping Method to Cart
             * @request POST:/store/carts/{id}/shipping-methods
             */
            storePostCartsIdShippingMethods: (id, data, query, params = {}) => this.request({
                path: `/store/carts/${id}/shipping-methods`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Calculate the cart's tax lines and amounts.
             *
             * @tags Store Carts
             * @name StorePostCartsIdTaxes
             * @summary Calculate Cart Taxes
             * @request POST:/store/carts/{id}/taxes
             */
            storePostCartsIdTaxes: (id, query, params = {}) => this.request({
                path: `/store/carts/${id}/taxes`,
                method: "POST",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of collections. The collections can be filtered by fields such as `handle`. The collections can also be sorted or paginated.
             *
             * @tags Store Collections
             * @name StoreGetCollections
             * @summary List Collections
             * @request GET:/store/collections
             */
            storeGetCollections: (query, params = {}) => this.request({
                path: `/store/collections`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a collection by its ID. You can expand the collection's relations or select the fields that should be returned.
             *
             * @tags Store Collections
             * @name StoreGetCollectionsId
             * @summary Get a Collection
             * @request GET:/store/collections/{id}
             */
            storeGetCollectionsId: (id, query, params = {}) => this.request({
                path: `/store/collections/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of currencies. The currencies can be filtered by fields such as `code`. The currencies can also be sorted or paginated.
             *
             * @tags Store Currencies
             * @name StoreGetCurrencies
             * @summary List Currencies
             * @request GET:/store/currencies
             */
            storeGetCurrencies: (query, params = {}) => this.request({
                path: `/store/currencies`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a currency by its code. You can expand the currency's relations or select the fields that should be returned.
             *
             * @tags Store Currencies
             * @name StoreGetCurrenciesCode
             * @summary Get a Currency
             * @request GET:/store/currencies/{code}
             */
            storeGetCurrenciesCode: (code, query, params = {}) => this.request({
                path: `/store/currencies/${code}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Register a customer. Use the `/auth/customer/emailpass/register` API route first to retrieve the registration token and pass it in the header of the request.
             *
             * @tags Store Customers
             * @name StorePostCustomers
             * @summary Register Customer
             * @request POST:/store/customers
             * @secure
             */
            storePostCustomers: (data, query, params = {}) => this.request({
                path: `/store/customers`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve the logged-in customer. You can expand the customer's relations or select the fields that should be returned.
             *
             * @tags Store Customers
             * @name StoreGetCustomersMe
             * @summary Get Logged-in Customer
             * @request GET:/store/customers/me
             * @secure
             */
            storeGetCustomersMe: (query, params = {}) => this.request({
                path: `/store/customers/me`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the logged-in customer's details.
             *
             * @tags Store Customers
             * @name StorePostCustomersMe
             * @summary Update Customer
             * @request POST:/store/customers/me
             * @secure
             */
            storePostCustomersMe: (data, query, params = {}) => this.request({
                path: `/store/customers/me`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve the addresses of the logged-in customer. The addresses can be filtered by fields such as `country_code`. The addresses can also be sorted or paginated.
             *
             * @tags Store Customers
             * @name StoreGetCustomersMeAddresses
             * @summary List Customer's Addresses
             * @request GET:/store/customers/me/addresses
             * @secure
             */
            storeGetCustomersMeAddresses: (query, params = {}) => this.request({
                path: `/store/customers/me/addresses`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Create an address for the logged-in customer.
             *
             * @tags Store Customers
             * @name StorePostCustomersMeAddresses
             * @summary Create Address for Logged-In Customer
             * @request POST:/store/customers/me/addresses
             * @secure
             */
            storePostCustomersMeAddresses: (data, query, params = {}) => this.request({
                path: `/store/customers/me/addresses`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an address of the logged-in customer. You can expand the address's relations or select the fields that should be returned.
             *
             * @tags Store Customers
             * @name StoreGetCustomersMeAddressesAddressId
             * @summary Get Customer's Address
             * @request GET:/store/customers/me/addresses/{address_id}
             * @secure
             */
            storeGetCustomersMeAddressesAddressId: (addressId, query, params = {}) => this.request({
                path: `/store/customers/me/addresses/${addressId}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Update the logged-in customer's address.
             *
             * @tags Store Customers
             * @name StorePostCustomersMeAddressesAddressId
             * @summary Update Customer's Address
             * @request POST:/store/customers/me/addresses/{address_id}
             * @secure
             */
            storePostCustomersMeAddressesAddressId: (addressId, data, query, params = {}) => this.request({
                path: `/store/customers/me/addresses/${addressId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Remove an address of the logged-in customer.
             *
             * @tags Store Customers
             * @name StoreDeleteCustomersMeAddressesAddressId
             * @summary Remove Customer's Address
             * @request DELETE:/store/customers/me/addresses/{address_id}
             * @secure
             */
            storeDeleteCustomersMeAddressesAddressId: (addressId, query, params = {}) => this.request({
                path: `/store/customers/me/addresses/${addressId}`,
                method: "DELETE",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve the orders of the logged-in customer. The orders can be filtered by fields such as `id`. The orders can also be sorted or paginated.
             *
             * @tags Store Orders
             * @name StoreGetOrders
             * @summary List Logged-in Customer's Orders
             * @request GET:/store/orders
             * @secure
             */
            storeGetOrders: (query, params = {}) => this.request({
                path: `/store/orders`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve an order by its ID. You can expand the order's relations or select the fields that should be returned.
             *
             * @tags Store Orders
             * @name StoreGetOrdersId
             * @summary Get an Order
             * @request GET:/store/orders/{id}
             */
            storeGetOrdersId: (id, query, params = {}) => this.request({
                path: `/store/orders/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Accept an order to be transfered to a customer's account, which was specified when the transfer request was created. The transfer is requested previously either by the customer using the [Request Order Transfer Store API route](https://docs.medusajs.com/api/store#orders_postordersidtransferrequest), or by the admin using the [Request Order Transfer Admin API route](https://docs.medusajs.com/api/admin#orders_postordersidtransferrequest).
             *
             * @tags Store Orders
             * @name StorePostOrdersIdTransferAccept
             * @summary Accept Order Transfer
             * @request POST:/store/orders/{id}/transfer/accept
             */
            storePostOrdersIdTransferAccept: (id, data, query, params = {}) => this.request({
                path: `/store/orders/${id}/transfer/accept`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Cancel an order transfer that the logged-in customer previously requested using the [Request Order Transfer](https://docs.medusajs.com/api/store#orders_postordersidtransferrequest) API route.
             *
             * @tags Store Orders
             * @name StorePostOrdersIdTransferCancel
             * @summary Cancel Order Transfer
             * @request POST:/store/orders/{id}/transfer/cancel
             * @secure
             */
            storePostOrdersIdTransferCancel: (id, query, params = {}) => this.request({
                path: `/store/orders/${id}/transfer/cancel`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Decline an order transfer previously requested, typically by the admin user using the [Request Order Transfer Admin API route](https://docs.medusajs.com/api/admin#orders_postordersidtransferrequest).
             *
             * @tags Store Orders
             * @name StorePostOrdersIdTransferDecline
             * @summary Decline Order Transfer
             * @request POST:/store/orders/{id}/transfer/decline
             */
            storePostOrdersIdTransferDecline: (id, data, query, params = {}) => this.request({
                path: `/store/orders/${id}/transfer/decline`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Request an order to be transfered to the logged-in customer's account. The transfer is confirmed using the [Accept Order Transfer](https://docs.medusajs.com/api/store#orders_postordersidtransferaccept) API route.
             *
             * @tags Store Orders
             * @name StorePostOrdersIdTransferRequest
             * @summary Request Order Transfer
             * @request POST:/store/orders/{id}/transfer/request
             * @secure
             */
            storePostOrdersIdTransferRequest: (id, data, query, params = {}) => this.request({
                path: `/store/orders/${id}/transfer/request`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a payment collection for a cart. This is used during checkout, where the payment collection holds the cart's payment sessions.
             *
             * @tags Store Payment Collections
             * @name StorePostPaymentCollections
             * @summary Create Payment Collection
             * @request POST:/store/payment-collections
             */
            storePostPaymentCollections: (data, query, params = {}) => this.request({
                path: `/store/payment-collections`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Initialize and add a payment session to a payment collection. This is used during checkout, where you create a payment collection for the cart, then initialize a payment session for the payment provider that the customer chooses.
             *
             * @tags Store Payment Collections
             * @name StorePostPaymentCollectionsIdPaymentSessions
             * @summary Initialize Payment Session of a Payment Collection
             * @request POST:/store/payment-collections/{id}/payment-sessions
             */
            storePostPaymentCollectionsIdPaymentSessions: (id, data, query, params = {}) => this.request({
                path: `/store/payment-collections/${id}/payment-sessions`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of payment providers. You must provide the `region_id` query parameter to retrieve the payment providers enabled in that region.
             *
             * @tags Store Payment Providers
             * @name StoreGetPaymentProviders
             * @summary List Payment Providers
             * @request GET:/store/payment-providers
             */
            storeGetPaymentProviders: (query, params = {}) => this.request({
                path: `/store/payment-providers`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product categories. The product categories can be filtered by fields such as `id`. The product categories can also be sorted or paginated.
             *
             * @tags Store Product Categories
             * @name StoreGetProductCategories
             * @summary List Product Categories
             * @request GET:/store/product-categories
             */
            storeGetProductCategories: (query, params = {}) => this.request({
                path: `/store/product-categories`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product category by its ID. You can expand the product category's relations or select the fields that should be returned.
             *
             * @tags Store Product Categories
             * @name StoreGetProductCategoriesId
             * @summary Get a Product Category
             * @request GET:/store/product-categories/{id}
             */
            storeGetProductCategoriesId: (id, query, params = {}) => this.request({
                path: `/store/product-categories/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product tags. The product tags can be filtered by fields such as `id`. The product tags can also be sorted or paginated.
             *
             * @tags Store Product Tags
             * @name StoreGetProductTags
             * @summary List Product Tags
             * @request GET:/store/product-tags
             */
            storeGetProductTags: (query, params = {}) => this.request({
                path: `/store/product-tags`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product tag by its ID. You can expand the product tag's relations or select the fields that should be returned.
             *
             * @tags Store Product Tags
             * @name StoreGetProductTagsId
             * @summary Get a Product Tag
             * @request GET:/store/product-tags/{id}
             */
            storeGetProductTagsId: (id, query, params = {}) => this.request({
                path: `/store/product-tags/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of product types. The product types can be filtered by fields such as `id`. The product types can also be sorted or paginated.
             *
             * @tags Store Product Types
             * @name StoreGetProductTypes
             * @summary List Product Types
             * @request GET:/store/product-types
             */
            storeGetProductTypes: (query, params = {}) => this.request({
                path: `/store/product-types`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product type by its ID. You can expand the product type's relations or select the fields that should be returned.
             *
             * @tags Store Product Types
             * @name StoreGetProductTypesId
             * @summary Get a Product Type
             * @request GET:/store/product-types/{id}
             */
            storeGetProductTypesId: (id, query, params = {}) => this.request({
                path: `/store/product-types/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of products. The products can be filtered by fields such as `id`. The products can also be sorted or paginated.
             *
             * @tags Store Products
             * @name StoreGetProducts
             * @summary List Products
             * @request GET:/store/products
             */
            storeGetProducts: (query, params = {}) => this.request({
                path: `/store/products`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a product by its ID. You can expand the product's relations or select the fields that should be returned.
             *
             * @tags Store Products
             * @name StoreGetProductsId
             * @summary Get a Product
             * @request GET:/store/products/{id}
             */
            storeGetProductsId: (id, query, params = {}) => this.request({
                path: `/store/products/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of regions. The regions can be filtered by fields such as `id`. The regions can also be sorted or paginated.
             *
             * @tags Store Regions
             * @name StoreGetRegions
             * @summary List Regions
             * @request GET:/store/regions
             */
            storeGetRegions: (query, params = {}) => this.request({
                path: `/store/regions`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a region by its ID. You can expand the region's relations or select the fields that should be returned.
             *
             * @tags Store Regions
             * @name StoreGetRegionsId
             * @summary Get a Region
             * @request GET:/store/regions/{id}
             */
            storeGetRegionsId: (id, query, params = {}) => this.request({
                path: `/store/regions/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Create a return for an order's items. The admin receives the return and process it from their side.
             *
             * @tags Store Return
             * @name StorePostReturn
             * @summary Create Return
             * @request POST:/store/return
             */
            storePostReturn: (data, params = {}) => this.request({
                path: `/store/return`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of return reasons. The return reasons can be sorted or paginated.
             *
             * @tags Store Return Reasons
             * @name StoreGetReturnReasons
             * @summary List Return Reasons
             * @request GET:/store/return-reasons
             */
            storeGetReturnReasons: (query, params = {}) => this.request({
                path: `/store/return-reasons`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a return reason by its ID. You can expand the return reason's relations or select the fields that should be returned.
             *
             * @tags Store Return Reasons
             * @name StoreGetReturnReasonsId
             * @summary Get a Return Reason
             * @request GET:/store/return-reasons/{id}
             */
            storeGetReturnReasonsId: (id, query, params = {}) => this.request({
                path: `/store/return-reasons/${id}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieve a list of shipping options for a cart. The cart's ID is set in the required `cart_id` query parameter. The shipping options also be sorted or paginated.
             *
             * @tags Store Shipping Options
             * @name StoreGetShippingOptions
             * @summary List Shipping Options for Cart
             * @request GET:/store/shipping-options
             */
            storeGetShippingOptions: (query, params = {}) => this.request({
                path: `/store/shipping-options`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
            /**
             * @description Calculate the price of a shipping option in a cart.
             *
             * @tags Store Shipping Options
             * @name StorePostShippingOptionsIdCalculate
             * @summary Calculate Shipping Option Price
             * @request POST:/store/shipping-options/{id}/calculate
             */
            storePostShippingOptionsIdCalculate: (id, data, query, params = {}) => this.request({
                path: `/store/shipping-options/${id}/calculate`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves requests list
             *
             * @tags OrderReturnRequest
             * @name StoreListOrderReturnRequests
             * @summary List return requests
             * @request GET:/store/return-request
             * @secure
             */
            storeListOrderReturnRequests: (query, params = {}) => this.request({
                path: `/store/return-request`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new order return request for the authenticated customer.
             *
             * @tags OrderReturnRequest
             * @name StoreCreateOrderReturnRequest
             * @summary Create an order return request
             * @request POST:/store/return-request
             * @secure
             */
            storeCreateOrderReturnRequest: (data, params = {}) => this.request({
                path: `/store/return-request`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id for the authenticated customer.
             *
             * @tags OrderReturnRequest
             * @name StoreGetOrderReturnRequestById
             * @summary Get return request by id
             * @request GET:/store/return-request/{id}
             * @secure
             */
            storeGetOrderReturnRequestById: (id, query, params = {}) => this.request({
                path: `/store/return-request/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the reviews created by the authenticated user.
             *
             * @tags Review
             * @name StoreGetMyReviews
             * @summary Get reviews of the current user
             * @request GET:/store/reviews
             * @secure
             */
            storeGetMyReviews: (query, params = {}) => this.request({
                path: `/store/reviews`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates new review with rating and comment
             *
             * @tags Review
             * @name StoreCreateNewReview
             * @summary Create new review
             * @request POST:/store/reviews
             * @secure
             */
            storeCreateNewReview: (data, query, params = {}) => this.request({
                path: `/store/reviews`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a review of specified id
             *
             * @tags Review
             * @name StoreGetReviewById
             * @summary Get Review
             * @request GET:/store/reviews/{id}
             * @secure
             */
            storeGetReviewById: (id, query, params = {}) => this.request({
                path: `/store/reviews/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates customer_note and rating for the review of specified id
             *
             * @tags Review
             * @name StoreUpdateReviewById
             * @summary Update a Review
             * @request POST:/store/reviews/{id}
             * @secure
             */
            storeUpdateReviewById: (id, data, query, params = {}) => this.request({
                path: `/store/reviews/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a review by id.
             *
             * @tags Review
             * @name StoreDeleteReviewById
             * @summary Delete a Review
             * @request DELETE:/store/reviews/{id}
             * @secure
             */
            storeDeleteReviewById: (id, params = {}) => this.request({
                path: `/store/reviews/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
        };
        this.vendor = {
            /**
             * @description Retrieves a list of campaigns for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorListCampaigns
             * @summary List Campaigns
             * @request GET:/vendor/campaigns
             * @secure
             */
            vendorListCampaigns: (query, params = {}) => this.request({
                path: `/vendor/campaigns`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new campaign for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorCreateCampaign
             * @summary Create campaign
             * @request POST:/vendor/campaigns
             * @secure
             */
            vendorCreateCampaign: (data, query, params = {}) => this.request({
                path: `/vendor/campaigns`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves campaign by id for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorGetCampaignById
             * @summary Get campaign
             * @request GET:/vendor/campaigns/{id}
             * @secure
             */
            vendorGetCampaignById: (id, query, params = {}) => this.request({
                path: `/vendor/campaigns/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates campaign by id for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorUpdateCampaignById
             * @summary Update campaign
             * @request POST:/vendor/campaigns/{id}
             * @secure
             */
            vendorUpdateCampaignById: (id, data, query, params = {}) => this.request({
                path: `/vendor/campaigns/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes campaign by id for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorDeleteCampaignById
             * @summary Delete campaign
             * @request DELETE:/vendor/campaigns/{id}
             * @secure
             */
            vendorDeleteCampaignById: (id, params = {}) => this.request({
                path: `/vendor/campaigns/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of customer groups.
             *
             * @tags Seller
             * @name VendorListCustomerGroups
             * @summary List Customer Groups
             * @request GET:/vendor/customer-groups
             * @secure
             */
            vendorListCustomerGroups: (query, params = {}) => this.request({
                path: `/vendor/customer-groups`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of customers who placed an order in sellers store.
             *
             * @tags Seller
             * @name VendorListSellerCustomers
             * @summary List Customers
             * @request GET:/vendor/customers
             * @secure
             */
            vendorListSellerCustomers: (query, params = {}) => this.request({
                path: `/vendor/customers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the details of specified customer.
             *
             * @tags Seller
             * @name VendorGetCustomer
             * @summary Get Customer details
             * @request GET:/vendor/customers/{id}
             * @secure
             */
            vendorGetCustomer: (id, params = {}) => this.request({
                path: `/vendor/customers/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of orders for the specified customer.
             *
             * @tags Order
             * @name VendorListOrdersByCustomerId
             * @summary List Orders by customer id
             * @request GET:/vendor/customers/{id}/orders
             * @secure
             */
            vendorListOrdersByCustomerId: (id, query, params = {}) => this.request({
                path: `/vendor/customers/${id}/orders`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of Fulfillment Providers.
             *
             * @tags Stock Location
             * @name VendorListFulfillmentProviders
             * @summary List Fulfillment Providers
             * @request GET:/vendor/fulfillment-providers
             * @secure
             */
            vendorListFulfillmentProviders: (query, params = {}) => this.request({
                path: `/vendor/fulfillment-providers`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a Fulfillment Set.
             *
             * @tags Fulfillment Set
             * @name VendorDeleteFulfillmentSet
             * @summary Delete a Fulfillment Set
             * @request DELETE:/vendor/fulfillment-sets/{id}
             * @secure
             */
            vendorDeleteFulfillmentSet: (id, params = {}) => this.request({
                path: `/vendor/fulfillment-sets/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a Service Zone.
             *
             * @tags Fulfillment Set
             * @name VendorCreateServiceZone
             * @summary Create a Service Zone
             * @request POST:/vendor/fulfillment-sets/{id}/service-zones
             * @secure
             */
            vendorCreateServiceZone: (id, data, params = {}) => this.request({
                path: `/vendor/fulfillment-sets/${id}/service-zones`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a Service Zone.
             *
             * @tags Fulfillment Set
             * @name VendorUpdateServiceZoneById
             * @summary Update a Service Zone
             * @request POST:/vendor/fulfillment-sets/{id}/service-zones/{zone_id}
             * @secure
             */
            vendorUpdateServiceZoneById: (id, zoneId, data, params = {}) => this.request({
                path: `/vendor/fulfillment-sets/${id}/service-zones/${zoneId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a Service Zone.
             *
             * @tags Service Zone
             * @name VendorDeleteServiceZoneById
             * @summary Delete a Service Zone
             * @request DELETE:/vendor/fulfillment-sets/{id}/service-zones/{zone_id}
             * @secure
             */
            vendorDeleteServiceZoneById: (id, zoneId, params = {}) => this.request({
                path: `/vendor/fulfillment-sets/${id}/service-zones/${zoneId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves list of InventoryItems
             *
             * @tags Product
             * @name VendorListInventoryItem
             * @summary List InventoryItems
             * @request GET:/vendor/inventory-items
             * @secure
             */
            vendorListInventoryItem: (params = {}) => this.request({
                path: `/vendor/inventory-items`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Retrieves InventoryItem of specified id
             *
             * @tags Product
             * @name VendorGetInventoryItem
             * @summary Get inventory item
             * @request GET:/vendor/inventory-items/{id}
             * @secure
             */
            vendorGetInventoryItem: (id, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Updates InventoryItem of specified id
             *
             * @tags Product
             * @name VendorUpdateInventoryItem
             * @summary Update inventory item
             * @request POST:/vendor/inventory-items/{id}
             * @secure
             */
            vendorUpdateInventoryItem: (id, data, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Retrieves inventory levels of the InventoryItem
             *
             * @tags Product
             * @name VendorGetItemInventoryLevel
             * @summary Get InventoryLevels of specified InventoryItem
             * @request GET:/vendor/inventory-items/{id}/location-levels
             * @secure
             */
            vendorGetItemInventoryLevel: (id, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}/location-levels`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Creates inventory level of the InventoryItem in the specified location
             *
             * @tags Product
             * @name VendorCreateInventoryLevel
             * @summary Create inventory level
             * @request POST:/vendor/inventory-items/{id}/location-levels
             * @secure
             */
            vendorCreateInventoryLevel: (id, data, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}/location-levels`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Retrieves inventory level of the InventoryItem in the specified location
             *
             * @tags Product
             * @name VendorGetInventoryLevel
             * @summary Get inventory level
             * @request GET:/vendor/inventory-items/{id}/location-levels/{location_id}
             * @secure
             */
            vendorGetInventoryLevel: (id, locationId, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}/location-levels/${locationId}`,
                method: "GET",
                secure: true,
                ...params,
            }),
            /**
             * @description Updates inventory level of the InventoryItem in the specified location
             *
             * @tags Product
             * @name VendorUpdateInventoryLevel
             * @summary Update inventory level
             * @request POST:/vendor/inventory-items/{id}/location-levels/{location_id}
             * @secure
             */
            vendorUpdateInventoryLevel: (id, locationId, data, params = {}) => this.request({
                path: `/vendor/inventory-items/${id}/location-levels/${locationId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
            /**
             * @description Retrieves a list of member invites for the authenticated vendor.
             *
             * @tags Member
             * @name VendorListInvites
             * @summary List Member Invites
             * @request GET:/vendor/invites
             * @secure
             */
            vendorListInvites: (query, params = {}) => this.request({
                path: `/vendor/invites`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new member invite for the authenticated vendor.
             *
             * @tags Member
             * @name VendorCreateInvite
             * @summary Create a Member Invite
             * @request POST:/vendor/invites
             * @secure
             */
            vendorCreateInvite: (data, params = {}) => this.request({
                path: `/vendor/invites`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Accepts a member invite using the provided token and creates a new member.
             *
             * @tags Member
             * @name VendorAcceptInvite
             * @summary Accept a Member Invite
             * @request POST:/vendor/invites/{id}/accept
             * @secure
             */
            vendorAcceptInvite: (id, data, params = {}) => this.request({
                path: `/vendor/invites/${id}/accept`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the member associated with the authenticated user.
             *
             * @tags Member
             * @name VendorGetMemberMe
             * @summary Get Current Member
             * @request GET:/vendor/me
             * @secure
             */
            vendorGetMemberMe: (params = {}) => this.request({
                path: `/vendor/me`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of members.
             *
             * @tags Member
             * @name VendorListMembers
             * @summary List Members
             * @request GET:/vendor/members
             * @secure
             */
            vendorListMembers: (query, params = {}) => this.request({
                path: `/vendor/members`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a member by id.
             *
             * @tags Member
             * @name VendorGetMemberById
             * @summary Get a Member
             * @request GET:/vendor/members/{id}
             * @secure
             */
            vendorGetMemberById: (id, params = {}) => this.request({
                path: `/vendor/members/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a member by id for the authenticated vendor.
             *
             * @tags Member
             * @name VendorUpdateMemberById
             * @summary Update a Member
             * @request POST:/vendor/members/{id}
             * @secure
             */
            vendorUpdateMemberById: (id, data, params = {}) => this.request({
                path: `/vendor/members/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a member by id.
             *
             * @tags Member
             * @name VendorDeleteMemberById
             * @summary Delete a Member
             * @request DELETE:/vendor/members/{id}
             * @secure
             */
            vendorDeleteMemberById: (id, params = {}) => this.request({
                path: `/vendor/members/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of orders for the authenticated vendor.
             *
             * @tags Order
             * @name VendorListOrders
             * @summary List Orders
             * @request GET:/vendor/orders
             * @secure
             */
            vendorListOrders: (query, params = {}) => this.request({
                path: `/vendor/orders`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the details of specified order.
             *
             * @tags Order
             * @name VendorGetOrder
             * @summary Get Order details
             * @request GET:/vendor/orders/{id}
             * @secure
             */
            vendorGetOrder: (id, params = {}) => this.request({
                path: `/vendor/orders/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Mark order as cancelled.
             *
             * @tags Order
             * @name VendorCancelOrder
             * @summary Mark order as cancelled
             * @request POST:/vendor/orders/{id}/cancel
             * @secure
             */
            vendorCancelOrder: (id, params = {}) => this.request({
                path: `/vendor/orders/${id}/cancel`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Mark order as complete.
             *
             * @tags Order
             * @name VendorCompleteOrder
             * @summary Mark order as complete
             * @request POST:/vendor/orders/{id}/complete
             * @secure
             */
            vendorCompleteOrder: (id, params = {}) => this.request({
                path: `/vendor/orders/${id}/complete`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the payout account for the authenticated vendor.
             *
             * @tags Payment Account
             * @name VendorGetPayoutAccount
             * @summary Get Payout Account
             * @request GET:/vendor/payout-account
             * @secure
             */
            vendorGetPayoutAccount: (query, params = {}) => this.request({
                path: `/vendor/payout-account`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a payout account for the authenticated vendor.
             *
             * @tags Payment Account
             * @name VendorCreatePayoutAccount
             * @summary Create Payout Account
             * @request POST:/vendor/payout-account
             * @secure
             */
            vendorCreatePayoutAccount: (data, params = {}) => this.request({
                path: `/vendor/payout-account`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates an onboarding for the authenticated vendor's payout account.
             *
             * @tags Payment Account
             * @name VendorCreateOnboarding
             * @summary Create Onboarding
             * @request POST:/vendor/payout-account/onboarding
             * @secure
             */
            vendorCreateOnboarding: (data, params = {}) => this.request({
                path: `/vendor/payout-account/onboarding`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of price lists.
             *
             * @tags Price Lists
             * @name VendorListPriceLists
             * @summary List Price lists
             * @request GET:/vendor/price-lists
             * @secure
             */
            vendorListPriceLists: (query, params = {}) => this.request({
                path: `/vendor/price-lists`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates new price list
             *
             * @tags Price Lists
             * @name VendorCreatePriceList
             * @summary Create price list
             * @request POST:/vendor/price-lists
             * @secure
             */
            vendorCreatePriceList: (data, query, params = {}) => this.request({
                path: `/vendor/price-lists`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the details of specified price list.
             *
             * @tags Price Lists
             * @name VendorGetPriceListById
             * @summary Get price list details
             * @request GET:/vendor/price-lists/{id}
             * @secure
             */
            vendorGetPriceListById: (id, params = {}) => this.request({
                path: `/vendor/price-lists/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates price list price
             *
             * @tags Price Lists
             * @name VendorUpdatePriceList
             * @summary Update price list
             * @request POST:/vendor/price-lists/{id}
             * @secure
             */
            vendorUpdatePriceList: (id, data, query, params = {}) => this.request({
                path: `/vendor/price-lists/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Delete a price list.
             *
             * @tags Price Lists
             * @name VendorDeletePriceListsId
             * @summary Delete a Price List
             * @request DELETE:/vendor/price-lists/{id}
             * @secure
             */
            vendorDeletePriceListsId: (id, params = {}) => this.request({
                path: `/vendor/price-lists/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates new price list price
             *
             * @tags Price Lists
             * @name VendorCreatePriceListPrice
             * @summary Create price list
             * @request POST:/vendor/price-lists/{id}/prices
             * @secure
             */
            vendorCreatePriceListPrice: (id, data, query, params = {}) => this.request({
                path: `/vendor/price-lists/${id}/prices`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes price list price by id.
             *
             * @tags Price Lists
             * @name VendorDeletePriceListPriceById
             * @summary Deletes price list price
             * @request DELETE:/vendor/price-lists/{id}/prices/{price_id}
             * @secure
             */
            vendorDeletePriceListPriceById: (id, priceId, params = {}) => this.request({
                path: `/vendor/price-lists/${id}/prices/${priceId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of product tags.
             *
             * @tags Product
             * @name VendorListProductTags
             * @summary List product tags
             * @request GET:/vendor/product-tags
             * @secure
             */
            vendorListProductTags: (query, params = {}) => this.request({
                path: `/vendor/product-tags`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates new product tag
             *
             * @tags Product
             * @name VendorCreateProductTag
             * @summary Create product tag
             * @request POST:/vendor/product-tags
             * @secure
             */
            vendorCreateProductTag: (data, query, params = {}) => this.request({
                path: `/vendor/product-tags`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves product tag by id.
             *
             * @tags Product
             * @name VendorGetProductTagById
             * @summary Get product tag
             * @request GET:/vendor/product-tags/{id}
             * @secure
             */
            vendorGetProductTagById: (id, query, params = {}) => this.request({
                path: `/vendor/product-tags/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of product types.
             *
             * @tags Product
             * @name VendorListProductTypes
             * @summary List product types
             * @request GET:/vendor/product-types
             * @secure
             */
            vendorListProductTypes: (query, params = {}) => this.request({
                path: `/vendor/product-types`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves product type by id.
             *
             * @tags Product
             * @name VendorGetProductTypeById
             * @summary Get product type
             * @request GET:/vendor/product-types/{id}
             * @secure
             */
            vendorGetProductTypeById: (id, query, params = {}) => this.request({
                path: `/vendor/product-types/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of products for the authenticated vendor.
             *
             * @tags Product
             * @name VendorListProducts
             * @summary List Products
             * @request GET:/vendor/products
             * @secure
             */
            vendorListProducts: (query, params = {}) => this.request({
                path: `/vendor/products`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new product for the authenticated vendor.
             *
             * @tags Product
             * @name VendorCreateProduct
             * @summary Create a Product
             * @request POST:/vendor/products
             * @secure
             */
            vendorCreateProduct: (data, params = {}) => this.request({
                path: `/vendor/products`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a product by id for the authenticated vendor.
             *
             * @tags Product
             * @name VendorGetProductById
             * @summary Get a Product
             * @request GET:/vendor/products/{id}
             * @secure
             */
            vendorGetProductById: (id, query, params = {}) => this.request({
                path: `/vendor/products/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates an existing product for the authenticated vendor.
             *
             * @tags Product
             * @name VendorUpdateProductById
             * @summary Update a Product
             * @request POST:/vendor/products/{id}
             * @secure
             */
            vendorUpdateProductById: (id, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a product by id for the authenticated vendor.
             *
             * @tags Product
             * @name VendorDeleteProductById
             * @summary Delete a Product
             * @request DELETE:/vendor/products/{id}
             * @secure
             */
            vendorDeleteProductById: (id, params = {}) => this.request({
                path: `/vendor/products/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Upserts brand and links to the product
             *
             * @tags Product
             * @name VendorAssignBrandToProduct
             * @summary Assign brand to the Product
             * @request POST:/vendor/products/{id}/brand
             * @secure
             */
            vendorAssignBrandToProduct: (id, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}/brand`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates an existing product for the authenticated vendor.
             *
             * @tags Order
             * @name VendorCreateFulfillment
             * @summary Update a Product
             * @request POST:/vendor/products/{id}/fulfillment
             * @secure
             */
            vendorCreateFulfillment: (id, data, params = {}) => this.request({
                path: `/vendor/products/${id}/fulfillment`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates option for product.
             *
             * @tags Product
             * @name VendorCreateOptionForProductById
             * @summary Create option for product
             * @request POST:/vendor/products/{id}/options
             * @secure
             */
            vendorCreateOptionForProductById: (id, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}/options`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates an existing product option for the authenticated vendor.
             *
             * @tags Product
             * @name VendorUpdateProductOptionById
             * @summary Update a Product option
             * @request POST:/vendor/products/{id}/options/{option_id}
             * @secure
             */
            vendorUpdateProductOptionById: (id, optionId, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}/options/${optionId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a product option by id for the authenticated vendor.
             *
             * @tags Product
             * @name VendorDeleteProductOptionById
             * @summary Delete a Product option
             * @request DELETE:/vendor/products/{id}/options/{option_id}
             * @secure
             */
            vendorDeleteProductOptionById: (id, optionId, params = {}) => this.request({
                path: `/vendor/products/${id}/options/${optionId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates variant for product.
             *
             * @tags Product
             * @name VendorCreateVariantForProductById
             * @summary Create variant for product
             * @request POST:/vendor/products/{id}/variants
             * @secure
             */
            vendorCreateVariantForProductById: (id, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}/variants`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates an existing product variant for the authenticated vendor.
             *
             * @tags Product
             * @name VendorUpdateProductVariantById
             * @summary Update a Product variant
             * @request POST:/vendor/products/{id}/variants/{variant_id}
             * @secure
             */
            vendorUpdateProductVariantById: (id, variantId, data, query, params = {}) => this.request({
                path: `/vendor/products/${id}/variants/${variantId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a product variant by id for the authenticated vendor.
             *
             * @tags Product
             * @name VendorDeleteProductVariantById
             * @summary Delete a Product variant
             * @request DELETE:/vendor/products/{id}/variants/{variant_id}
             * @secure
             */
            vendorDeleteProductVariantById: (id, variantId, params = {}) => this.request({
                path: `/vendor/products/${id}/variants/${variantId}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of promotions for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorListPromotions
             * @summary List Promotions
             * @request GET:/vendor/promotions
             * @secure
             */
            vendorListPromotions: (query, params = {}) => this.request({
                path: `/vendor/promotions`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a new promotion for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorCreatePromotion
             * @summary Create promotion
             * @request POST:/vendor/promotions
             * @secure
             */
            vendorCreatePromotion: (data, params = {}) => this.request({
                path: `/vendor/promotions`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves promotion by id for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorGetPromotionById
             * @summary Get promotion
             * @request GET:/vendor/promotions/{id}
             * @secure
             */
            vendorGetPromotionById: (id, query, params = {}) => this.request({
                path: `/vendor/promotions/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes promotion by id for the authenticated vendor.
             *
             * @tags Promotion
             * @name VendorDeletePromotionById
             * @summary Delete promotion
             * @request DELETE:/vendor/promotions/{id}
             * @secure
             */
            vendorDeletePromotionById: (id, params = {}) => this.request({
                path: `/vendor/promotions/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves submited requests list
             *
             * @tags Requests
             * @name VendorListRequests
             * @summary List requests
             * @request GET:/vendor/requests
             * @secure
             */
            vendorListRequests: (query, params = {}) => this.request({
                path: `/vendor/requests`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a request to admin to accept new resource
             *
             * @tags Requests
             * @name VendorCreateRequest
             * @summary Create a request to admin
             * @request POST:/vendor/requests
             * @secure
             */
            vendorCreateRequest: (data, params = {}) => this.request({
                path: `/vendor/requests`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id for the authenticated vendor.
             *
             * @tags Requests
             * @name VendorGetRequestById
             * @summary Get request by id
             * @request GET:/vendor/requests/{id}
             * @secure
             */
            vendorGetRequestById: (id, query, params = {}) => this.request({
                path: `/vendor/requests/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of reservations for the authenticated vendor.
             *
             * @tags Reservations
             * @name VendorListReservations
             * @summary List Reservations
             * @request GET:/vendor/reservations
             * @secure
             */
            vendorListReservations: (query, params = {}) => this.request({
                path: `/vendor/reservations`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves reservation by id for the authenticated vendor.
             *
             * @tags Reservations
             * @name VendorGetReservationById
             * @summary Get reservation
             * @request GET:/vendor/reservations/{id}
             * @secure
             */
            vendorGetReservationById: (id, query, params = {}) => this.request({
                path: `/vendor/reservations/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates an existing reservation for the authenticated vendor.
             *
             * @tags Reservations
             * @name VendorUpdateReservationById
             * @summary Update reservation
             * @request POST:/vendor/reservations/{id}
             * @secure
             */
            vendorUpdateReservationById: (id, data, query, params = {}) => this.request({
                path: `/vendor/reservations/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes reservation by id for the authenticated vendor.
             *
             * @tags Reservations
             * @name VendorDeleteReservationById
             * @summary Delete reservation
             * @request DELETE:/vendor/reservations/{id}
             * @secure
             */
            vendorDeleteReservationById: (id, params = {}) => this.request({
                path: `/vendor/reservations/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves requests list
             *
             * @tags OrderReturnRequest
             * @name VendorListOrderReturnRequests
             * @summary List return requests
             * @request GET:/vendor/return-request
             * @secure
             */
            vendorListOrderReturnRequests: (query, params = {}) => this.request({
                path: `/vendor/return-request`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a request by id for the authenticated vendor.
             *
             * @tags OrderReturnRequest
             * @name VendorGetOrderReturnRequestById
             * @summary Get return request by id
             * @request GET:/vendor/return-request/{id}
             * @secure
             */
            vendorGetOrderReturnRequestById: (id, query, params = {}) => this.request({
                path: `/vendor/return-request/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a request by id for the authenticated vendor.
             *
             * @tags OrderReturnRequest
             * @name VendorUpdateOrderReturnRequestById
             * @summary Update return request by id
             * @request POST:/vendor/return-request/{id}
             * @secure
             */
            vendorUpdateOrderReturnRequestById: (id, data, params = {}) => this.request({
                path: `/vendor/return-request/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of Sales Channels for authenticated vendor.
             *
             * @tags Seller, Sales-channel
             * @name VendorListSalesChannels
             * @summary List Sales Channels
             * @request GET:/vendor/sales-channels
             * @secure
             */
            vendorListSalesChannels: (params = {}) => this.request({
                path: `/vendor/sales-channels`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a request to create a new seller with an initial owner member.
             *
             * @tags Seller
             * @name VendorCreateSeller
             * @summary Create a Seller
             * @request POST:/vendor/sellers
             * @secure
             */
            vendorCreateSeller: (data, params = {}) => this.request({
                path: `/vendor/sellers`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the seller associated with the authenticated user.
             *
             * @tags Seller
             * @name VendorGetSellerMe
             * @summary Get Current Seller
             * @request GET:/vendor/sellers/me
             * @secure
             */
            vendorGetSellerMe: (params = {}) => this.request({
                path: `/vendor/sellers/me`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates the seller associated with the authenticated user.
             *
             * @tags Seller
             * @name VendorUpdateSellerMe
             * @summary Update Current Seller
             * @request POST:/vendor/sellers/me
             * @secure
             */
            vendorUpdateSellerMe: (data, params = {}) => this.request({
                path: `/vendor/sellers/me`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the onboarding details of the current authenticated seller.
             *
             * @tags Seller, Onboarding
             * @name VendorGetOnboardingStatus
             * @summary Get onboarding status of the current seller
             * @request GET:/vendor/sellers/me/onboarding
             * @secure
             */
            vendorGetOnboardingStatus: (params = {}) => this.request({
                path: `/vendor/sellers/me/onboarding`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Triggers onboarding status recalculation and retrieves the onboarding details of the current authenticated seller.
             *
             * @tags Seller, Onboarding
             * @name VendorRecalculateOnboardingStatus
             * @summary Recalculates onboarding status
             * @request POST:/vendor/sellers/me/onboarding
             * @secure
             */
            vendorRecalculateOnboardingStatus: (params = {}) => this.request({
                path: `/vendor/sellers/me/onboarding`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves the reviews about the seller associated with the authenticated user.
             *
             * @tags Seller, Review
             * @name VendorGetSellerMyReviews
             * @summary Get reviews of the current seller
             * @request GET:/vendor/sellers/me/reviews
             * @secure
             */
            vendorGetSellerMyReviews: (params = {}) => this.request({
                path: `/vendor/sellers/me/reviews`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a review by id for the authenticated vendor.
             *
             * @tags Seller, Review
             * @name VendorGetSellerReviewById
             * @summary Get a review by id
             * @request GET:/vendor/sellers/me/reviews/{id}
             * @secure
             */
            vendorGetSellerReviewById: (id, query, params = {}) => this.request({
                path: `/vendor/sellers/me/reviews/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates seller_note for the review of specified id
             *
             * @tags Seller, Review
             * @name VendorUpdateReviewById
             * @summary Update a Review
             * @request POST:/vendor/sellers/me/reviews/{id}
             * @secure
             */
            vendorUpdateReviewById: (id, data, query, params = {}) => this.request({
                path: `/vendor/sellers/me/reviews/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of Shipping Options for authenticated vendor.
             *
             * @tags Shipping Option
             * @name VendorListShippingOptions
             * @summary List Shipping Options
             * @request GET:/vendor/shipping-options
             * @secure
             */
            vendorListShippingOptions: (params = {}) => this.request({
                path: `/vendor/shipping-options`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a Shipping Option for authenticated vendor.
             *
             * @tags Shipping Option
             * @name VendorCreateShippingOption
             * @summary Create a Shipping Option
             * @request POST:/vendor/shipping-options
             * @secure
             */
            vendorCreateShippingOption: (data, params = {}) => this.request({
                path: `/vendor/shipping-options`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a Shipping Option by its ID.
             *
             * @tags Shipping Option
             * @name VendorGetShippingOptionById
             * @summary Get a Shipping Option
             * @request GET:/vendor/shipping-options/{id}
             * @secure
             */
            vendorGetShippingOptionById: (id, params = {}) => this.request({
                path: `/vendor/shipping-options/${id}`,
                method: "GET",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a Shipping Option.
             *
             * @tags Shipping Option
             * @name VendorUpdateShippingOptionById
             * @summary Update a Shipping Option
             * @request POST:/vendor/shipping-options/{id}
             * @secure
             */
            vendorUpdateShippingOptionById: (id, data, params = {}) => this.request({
                path: `/vendor/shipping-options/${id}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Deletes a Shipping Option.
             *
             * @tags Shipping Option
             * @name VendorDeleteShippingOptionById
             * @summary Delete a Shipping Option
             * @request DELETE:/vendor/shipping-options/{id}
             * @secure
             */
            vendorDeleteShippingOptionById: (id, params = {}) => this.request({
                path: `/vendor/shipping-options/${id}`,
                method: "DELETE",
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves store statistics.
             *
             * @tags Seller
             * @name VendorGetStoreStatistics
             * @summary GetStoreStatistics
             * @request GET:/vendor/statistics
             * @secure
             */
            vendorGetStoreStatistics: (query, params = {}) => this.request({
                path: `/vendor/statistics`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of Stock Locations.
             *
             * @tags Stock Location
             * @name VendorListStockLocations
             * @summary List Stock Locations
             * @request GET:/vendor/stock-locations
             * @secure
             */
            vendorListStockLocations: (query, params = {}) => this.request({
                path: `/vendor/stock-locations`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a Stock Location.
             *
             * @tags Stock Location
             * @name VendorCreateStockLocation
             * @summary Create a Stock Location
             * @request POST:/vendor/stock-locations
             * @secure
             */
            vendorCreateStockLocation: (data, query, params = {}) => this.request({
                path: `/vendor/stock-locations`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a Stock Location by id.
             *
             * @tags Stock Location
             * @name VendorGetStockLocation
             * @summary Get Stock Location
             * @request GET:/vendor/stock-locations/{id}
             * @secure
             */
            vendorGetStockLocation: (id, query, params = {}) => this.request({
                path: `/vendor/stock-locations/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates a Stock Location.
             *
             * @tags Stock Location
             * @name VendorUpdateStockLocation
             * @summary Update Stock Location
             * @request POST:/vendor/stock-locations/{id}
             * @secure
             */
            vendorUpdateStockLocation: (id, data, query, params = {}) => this.request({
                path: `/vendor/stock-locations/${id}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates the fulfillment providers of a Stock Location.
             *
             * @tags Stock Location
             * @name VendorUpdateStockLocationFulfillmentProviders
             * @summary Update Stock Location Fulfillment Providers
             * @request POST:/vendor/stock-locations/{id}/fulfillment-providers
             * @secure
             */
            vendorUpdateStockLocationFulfillmentProviders: (id, data, query, params = {}) => this.request({
                path: `/vendor/stock-locations/${id}/fulfillment-providers`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Creates a Fulfillment Set for a Stock Location.
             *
             * @tags Stock Location
             * @name VendorCreateStockLocationFulfillmentSet
             * @summary Create a Fulfillment Set
             * @request POST:/vendor/stock-locations/{id}/fulfillment-sets
             * @secure
             */
            vendorCreateStockLocationFulfillmentSet: (id, data, query, params = {}) => this.request({
                path: `/vendor/stock-locations/${id}/fulfillment-sets`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Updates the sales channels of a Stock Location.
             *
             * @tags Stock Location
             * @name VendorUpdateStockLocationSalesChannels
             * @summary Update Stock Location Sales Channels
             * @request POST:/vendor/stock-locations/{id}/sales-channels
             * @secure
             */
            vendorUpdateStockLocationSalesChannels: (id, data, query, params = {}) => this.request({
                path: `/vendor/stock-locations/${id}/sales-channels`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a list of stores.
             *
             * @tags Store
             * @name VendorListStores
             * @summary List Stores
             * @request GET:/vendor/stores
             * @secure
             */
            vendorListStores: (query, params = {}) => this.request({
                path: `/vendor/stores`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
            /**
             * @description Retrieves a Store by id.
             *
             * @tags Store
             * @name VendorGetStoreById
             * @summary Get store
             * @request GET:/vendor/stores/{id}
             * @secure
             */
            vendorGetStoreById: (id, query, params = {}) => this.request({
                path: `/vendor/stores/${id}`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
        };
    }
}
//# sourceMappingURL=index.js.map