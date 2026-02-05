// Single source of truth for ClassManagement storage keys
// This ensures we only export/import relevant data and avoid accidental pollution

export const CLASS_MANAGEMENT_KEYS = [
    // --- Seating Module ---
    'bisinif_class_seating_setup_v1',
    'bisinif_class_seating_rules_v1',
    'bisinif_class_seating_plan_v2',       // Active Plan
    'bisinif_class_seating_history_v1',    // Plan History
    'bisinif_class_analytics_map_v1',      // Manual Map Matches
    'bisinif_class_analytics_selected_exam_v1', // UI Preference

    // --- Class/Roster Module ---
    'bisinif_class_profiles_v1',           // Student Profiles (Behavior, etc)
    'bisinif_class_conflicts_v1',          // Student Conflicts
    'bisinif_class_meta_v1',               // General Meta
    'bisinif_class_roster_v1',             // Main Student List
    'bisinif_class_roster_meta_v1'         // Roster Meta
]

// KEY_MAP: Structured access to canonical keys (SSOT)
// Use this instead of hardcoding key strings
export const KEY_MAP = {
    // Seating Module
    SEATING_SETUP: 'bisinif_class_seating_setup_v1',
    SEATING_RULES: 'bisinif_class_seating_rules_v1',
    SEATING_PLAN: 'bisinif_class_seating_plan_v2',
    SEATING_HISTORY: 'bisinif_class_seating_history_v1',
    ANALYTICS_MAP: 'bisinif_class_analytics_map_v1',
    ANALYTICS_SELECTED_EXAM: 'bisinif_class_analytics_selected_exam_v1',

    // Roster Module
    ROSTER: 'bisinif_class_roster_v1',
    PROFILES: 'bisinif_class_profiles_v1',
    CONFLICTS: 'bisinif_class_conflicts_v1',
    META: 'bisinif_class_meta_v1',
    ROSTER_META: 'bisinif_class_roster_meta_v1'
}

// Groupings for logical operations
export const KEY_GROUPS = {
    ACTIVE_PLAN: [
        KEY_MAP.SEATING_PLAN,
        KEY_MAP.SEATING_SETUP,
        KEY_MAP.SEATING_RULES,
        KEY_MAP.ANALYTICS_MAP
    ],
    HISTORY: [
        KEY_MAP.SEATING_HISTORY
    ],
    ROSTER: [
        KEY_MAP.ROSTER,
        KEY_MAP.PROFILES,
        KEY_MAP.CONFLICTS,
        KEY_MAP.ROSTER_META
    ]
}
