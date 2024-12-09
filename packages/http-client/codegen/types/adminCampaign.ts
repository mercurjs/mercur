/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCampaignBudget } from './adminCampaignBudget';

/**
 * The campaign's details.
 */
export interface AdminCampaign {
  /** The campaign's budget. */
  budget: AdminCampaignBudget;
  /** The campaign's identifier. */
  campaign_identifier: string;
  /** The date the campaign was created. */
  created_at: string;
  /** The campaign's currency. */
  currency: string;
  /** The date the campaign was deleted. */
  deleted_at: string;
  /** The campaign's description. */
  description: string;
  /** The date and time that the campaign ends. */
  ends_at: string;
  /** The campaign's ID. */
  id: string;
  /** The campaign's name. */
  name: string;
  /** The date and time that the campaign starts. */
  starts_at: string;
  /** The date the campaign was updated. */
  updated_at: string;
}
