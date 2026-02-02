/**
 * Generates pedagogical justification texts based on seating plan state.
 * Normalized strings to be PDF-safe without losing TR chars (Font handles TR)
 */
export const generateReportData = (plan, setup, rules, roster, violations) => {
    const texts = []
    const scenario = rules.scenario || 'daily'

    // 1. Context
    if (scenario === 'exam') {
        texts.push('Sınav güvenliği ve bireysel çalışma ortamı hedeflenmiştir.')
    } else if (scenario === 'group') {
        texts.push('Akran etkileşimi ve grup çalışması pedagojisi gözetilmiştir.')
    } else {
        texts.push('Sınıf içi dikkatin korunması ve fırsat eşitliği amaçlanmıştır.')
    }

    // 2. Special Needs
    const specialNeedsCount = roster.filter(s => s._profile?.specialNeeds).length
    if (specialNeedsCount > 0 && rules.hard.forceSpecialNeedsFront) {
        texts.push(`Özel durumu olan ${specialNeedsCount} öğrenci öncelikli olarak ön sıralara yerleştirilmiştir.`)
    }

    // 3. Conflicts
    if (violations.some(v => v.type === 'conflict')) {
        texts.push('Fiziki kısıtlar nedeniyle bazı öğrenci eşleşmeleri uyarı olarak işaretlenmiştir (Öğretmen takdirine bırakılmıştır).')
    } else {
        texts.push('Akran çatışması kayıtları dikkate alınarak ayrıştırma yapılmıştır.')
    }

    // 4. Manual Moves
    if (plan.manualMoves > 0) {
        texts.push(`Otomatik plan üzerinde öğretmen tarafından ${plan.manualMoves} adet pedagojik yer değişikliği yapılmıştır.`)
    } else {
        texts.push('Yerleşim, tanımlı kriterler doğrultusunda tamamen algoritmik olarak üretilmiştir.')
    }

    // Stats
    const placed = plan.stats?.placed || 0
    const capacity = setup.rows * setup.cols * (setup.deskType === 'double' ? 2 : 1)
    const occupancy = Math.round((placed / capacity) * 100)

    texts.push(`Sınıf doluluk oranı %${occupancy} seviyesindedir.`)

    // Metadata
    const planId = `PLAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const shortHash = Math.random().toString(16).substr(2, 6).toUpperCase()

    // Title needs to be pure unicode
    return {
        purpose: texts[0],
        criteria: texts.slice(1),
        // Use standard date string to avoid locale issues in some PDF parsers if any
        // But with embedded font, localeString is fine
        generatedAt: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: scenario === 'exam' ? 'SINAV OTURMA DUZENİ' : 'SINIF OTURMA DUZENI', // Fallback safe title
        displayTitle: scenario === 'exam' ? 'Sınav Oturma Düzeni' : 'Sınıf Oturma Düzeni',
        metadata: {
            planId,
            hash: shortHash,
            version: 'BiSınıf v2.5'
        }
    }
}
