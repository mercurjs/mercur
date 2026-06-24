export type MatchType = "exact" | "contains" | "regex"

export interface FilterRuleDTO {
  id: string
  match_type: MatchType
  pattern: string
  is_builtin: boolean
  is_enabled: boolean
  description: string | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

export interface BlockedMessageLogDTO {
  id: string
  sender_id: string
  sender_type: "customer" | "seller"
  conversation_id: string
  matched_rule_id: string
  message_body: string
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

export interface CompiledRuleset {
  exactWords: Set<string>
  exactRules: Map<string, string> // lowercased word -> rule id
  containsPatterns: Array<{ id: string; pattern: string }> // lowercased
  regexPatterns: Array<{ id: string; regex: RegExp }>
}

export interface FilterEvaluationResult {
  matched: boolean
  rule_id?: string
  match_type?: MatchType
  pattern?: string
}

export interface AdminFilterRuleResponse {
  filter: FilterRuleDTO
}

export type AdminFilterRuleListResponse = {
  filters: FilterRuleDTO[]
  next_cursor: string | null
}

export interface AdminBlockedMessageLogListResponse {
  blocked_messages: BlockedMessageLogDTO[]
  next_cursor: string | null
}
