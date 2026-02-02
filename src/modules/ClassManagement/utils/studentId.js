/**
 * BiSınıf ID Strategy v1.0
 * 
 * Goals:
 * 1. Deterministic: Same student data always produces same ID.
 * 2. Stable: Re-importing same class should map to existing profiles.
 * 3. Fallback Chain: Handle missing data gracefully.
 */

const normalizeText = (text) => {
    if (!text) return ''
    return text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        // Remove all non-alphanumeric except simple separators
        .replace(/[^a-z0-9]/g, '')
}

export const generateStudentId = (student) => {
    // 1. Existing ID (If already processed or coming from future backend)
    if (student.id && typeof student.id === 'string' && student.id.length > 5) {
        // Assume valid if it looks like a generated ID (not just "1", "2")
        // But for safety in local-only, we might re-generate to ensure consistency if data changed slightly.
        // For now, let's trust if it matches our pattern, otherwise regenerate.
        if (student.id.includes('-')) return student.id
    }

    const no = normalizeText(student.no || student.studentNumber || student.number)
    const name = normalizeText(student.name || student.fullName || student.adSoyad)

    // 2. Primary Strategy: Number + NameHash
    if (no && name) {
        return `${no}-${name}`
    }

    // 3. Name Only (Risk of collision in same class, but better than random)
    if (name) {
        return `nonum-${name}`
    }

    // 4. Number Only (Rare but possible)
    if (no) {
        return `${no}-unknown`
    }

    // 5. Last Resort (Unstable)
    // We intentionally prefix with 'unsafe' to flag that this might be lost on refresh
    return `unsafe-${Math.random().toString(36).substr(2, 9)}`
}
