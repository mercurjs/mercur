/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminInviteMetadata } from './adminInviteMetadata';

/**
 * The invite's details.
 */
export interface AdminInvite {
  /** Whether the invite has been accepted. */
  accepted: boolean;
  /** The date the invite was created. */
  created_at?: string;
  /** The invite's email. */
  email: string;
  /** The invite's expiry date. */
  expires_at?: string;
  /** The invite's ID. */
  id: string;
  /** The invite's metadata, can hold custom key-value pairs. */
  metadata?: AdminInviteMetadata;
  /** The invite's token. */
  token: string;
  /** The date the invite was updated. */
  updated_at?: string;
}
