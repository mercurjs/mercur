/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminApiKeyType } from './adminApiKeyType';

/**
 * The API key's details.
 */
export interface AdminApiKey {
  /** The date and time the API key was created. */
  created_at: string;
  /** The ID of the user that created the API key, if available. */
  created_by: string;
  /** The date the API key was deleted. */
  deleted_at: string;
  /** The api key's ID. */
  id: string;
  /** The date and time the API key was last used. */
  last_used_at: string;
  /** The redacted form of the API key's token. This is useful when showing portion of the token. */
  redacted: string;
  /** The date and time the API key was revoked. The API key is considered revoked when this property is set. */
  revoked_at: string;
  /** The ID of the user that revoked the API key, if available. */
  revoked_by: string;
  /** The api key's title. */
  title: string;
  /** The api key's token. */
  token: string;
  /** The api key's type. `secret` is used for a user's API key, whereas `publishable` is used for Publishable API keys. */
  type: AdminApiKeyType;
  /** The date the API key was updated. */
  updated_at: string;
}
