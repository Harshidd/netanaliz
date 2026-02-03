
import { loadProjectState } from '../../../../storage'

// Helper: Normalize name for matching
const normalizeName = (name) => {
    if (!name) return ''
    return name
        .toLocaleLowerCase('tr-TR')
        .replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

// Helper: Text Similarity (Levenshtein based for 0-1 confidence)
const getSimilarity = (s1, s2) => {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    // Levenshtein
    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) != shorter.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longerLength - costs[shorter.length]) / parseFloat(longerLength);
}

// Helper: Calculate Standard Deviation
const getStandardDeviation = (array) => {
    const n = array.length
    if (n < 2) return 0
    const mean = array.reduce((a, b) => a + b, 0) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (n - 1))
}

const getCovariance = (x, y) => {
    const n = x.length
    if (n < 2) return 0
    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n
    let sum = 0
    for (let i = 0; i < n; i++) {
        sum += (x[i] - meanX) * (y[i] - meanY)
    }
    return sum / (n - 1)
}


/**
 * Retrieves available exams from the read-only project state.
 * Currently supports extracting the single active exam.
 */
export const getAvailableExams = () => {
    const projectState = loadProjectState()
    if (!projectState || !projectState.config) return []

    // Construct a stable ID from saved timestamp or fallback
    const id = projectState.savedAt
        ? `exam_${new Date(projectState.savedAt).getTime()}`
        : 'exam_active_default'

    return [{
        id,
        title: projectState.config.examName || 'İsimsiz Sınav',
        date: projectState.config.examDate,
        createdAt: projectState.savedAt,
        data: projectState
    }]
}

/**
 * Calculates analytics by correlating Seating Plan with Exam Results.
 * Pure Read-Only logic (respects manual map pass-through).
 * 
 * @param {Object} currentLayout 
 * @param {Array} roster 
 * @param {Object} setup 
 * @param {Object} manualMap
 * @param {Boolean} includeSuspicious
 * @param {Object} selectedExamData - Optional specific exam data
 */
export const calculateSeatingAnalytics = (currentLayout, roster, setup, manualMap = {}, includeSuspicious = false, selectedExamData = null) => {
    // 1. Load Data
    let projectState = selectedExamData
    if (!projectState) {
        projectState = loadProjectState()
    }
    if (!projectState || !projectState.grades || !projectState.students || projectState.students.length === 0) {
        return {
            error: 'Henüz kayıtlı bir sınav verisi bulunamadı. "Sınav Analiz" modülünden sınav oluşturup notları giriniz.',
            zones: [],
            matchStats: { high: 0, suspicious: 0, unmatched: 0, total: 0 }
        }
    }

    const { grades: rawGrades, students: examStudents } = projectState

    // 2. Advanced Matching Logic Hierarchy
    const scoreMap = new Map() // studentId -> { score, type, confidence }
    const matchStats = { high: 0, suspicious: 0, unmatched: 0, total: roster.length }
    const suspiciousMatches = []

    roster.forEach(student => {
        let bestMatch = null
        let matchType = 'unmatched'
        let confidence = 0

        // 1) Manual Override (Highest Priority)
        if (manualMap[student.id]) {
            const override = manualMap[student.id]
            const examStudent = examStudents.find(s => String(s.id) === String(override.examStudentId))
            if (examStudent) {
                bestMatch = examStudent
                matchType = 'manual'
                confidence = 1.0
            }
        }

        // 2) ID Match (100%)
        if (!bestMatch) {
            const idMatch = examStudents.find(s => String(s.id) === String(student.id))
            if (idMatch) {
                bestMatch = idMatch
                matchType = 'id'
                confidence = 1.0
            }
        }

        // 3) Fuzzy Name Analysis
        if (!bestMatch) {
            const normStudent = normalizeName(student.name)

            // Generate similarities
            const potientials = examStudents.map(s => {
                const normExam = normalizeName(s.name)
                return {
                    student: s,
                    score: getSimilarity(normStudent, normExam)
                }
            }).sort((a, b) => b.score - a.score) // Best first

            const top = potientials[0]
            if (top) {
                confidence = top.score
                if (confidence >= 0.95) {
                    bestMatch = top.student
                    matchType = 'name_high'
                } else if (confidence >= 0.85) {
                    bestMatch = top.student // Eligible but suspicious
                    matchType = 'name_suspicious'
                    // We add to suspicious list regardless of include flag, strictly for UI reporting
                    suspiciousMatches.push({
                        roster: student,
                        exam: top.student,
                        confidence
                    })
                }
            }
        }

        // Decision logic
        let accepted = false
        if (bestMatch) {
            if (matchType === 'manual' || matchType === 'id' || matchType === 'name_high') {
                accepted = true
                matchStats.high++
            } else if (matchType === 'name_suspicious') {
                matchStats.suspicious++
                if (includeSuspicious) accepted = true
            }
        } else {
            matchStats.unmatched++
        }

        if (accepted && bestMatch) {
            const studentGrades = rawGrades[bestMatch.id]
            if (studentGrades) {
                const total = Object.values(studentGrades).reduce((acc, val) => {
                    const num = parseFloat(val)
                    return acc + (Number.isFinite(num) ? num : 0)
                }, 0)
                scoreMap.set(student.id, {
                    score: total,
                    type: matchType,
                    confidence
                })
            }
        }
    })

    if (matchStats.high === 0 && (matchStats.suspicious === 0 || !includeSuspicious)) {
        return {
            error: 'Sınıf listesi ile Sınav listesi arasında yeterli ve güvenilir eşleşme sağlanamadı.',
            zones: [],
            matchStats,
            suspiciousMatches
        }
    }

    // 3. Zone Analysis (Same Logic, Neutral Colors planned for UI)
    const rowCount = setup.rows || 1
    const zones = {
        front: { name: 'Ön Bölge', total: 0, count: 0, scores: [] },
        middle: { name: 'Orta Bölge', total: 0, count: 0, scores: [] },
        back: { name: 'Arka Bölge', total: 0, count: 0, scores: [] }
    }

    const rowData = [] // { r, score }

    // Iterate Setup
    for (let r = 1; r <= rowCount; r++) {
        for (let c = 1; c <= setup.cols; c++) {
            const seats = setup.deskType === 'double' ? [`R${r}-C${c}-L`, `R${r}-C${c}-R`] : [`R${r}-C${c}`]
            seats.forEach(seatId => {
                const studentId = currentLayout[seatId]
                if (studentId && scoreMap.has(studentId)) {
                    const { score } = scoreMap.get(studentId)

                    let zoneKey = 'middle'
                    if (r <= Math.ceil(rowCount / 3)) zoneKey = 'front'
                    else if (r > rowCount - Math.ceil(rowCount / 3)) zoneKey = 'back'

                    zones[zoneKey].total += score
                    zones[zoneKey].count++
                    zones[zoneKey].scores.push(score)
                    rowData.push({ r, score })
                }
            })
        }
    }

    const zoneResults = Object.keys(zones).map(k => {
        const z = zones[k]
        return {
            name: z.name,
            avg: z.count > 0 ? Math.round(z.total / z.count) : 0,
            count: z.count,
            min: z.scores.length ? Math.min(...z.scores) : 0,
            max: z.scores.length ? Math.max(...z.scores) : 0,
            key: k
        }
    })

    // 4. Pearson Correlation (Correct Formula)
    // r = Cov(X,Y) / (StdX * StdY)
    let correlation = null
    let correlationConfidence = 'low'
    const N = rowData.length

    if (N >= 3) { // Min 3 points for barely meaningful data
        const rows = rowData.map(d => d.r)
        const scores = rowData.map(d => d.score)

        const cov = getCovariance(rows, scores)
        const stdRows = getStandardDeviation(rows)
        const stdScores = getStandardDeviation(scores)

        if (stdRows > 0 && stdScores > 0) {
            correlation = cov / (stdRows * stdScores)
        }

        if (N >= 10) correlationConfidence = 'high'
        else correlationConfidence = 'uncertant'
    }

    // 5. Safe Comments
    const comments = []

    if (includeSuspicious && matchStats.suspicious > 0) {
        comments.push("Analiz bazı şüpheli eşleşmeleri içerdiğinden sonuçlar kesinlik taşımayabilir.")
    }

    if (N < 10 && N > 0) {
        comments.push("Örneklem büyüklüğü (N<10) istatistiksel açıdan kesin bir yargı için yetersizdir.")
    }

    // Zone Diff
    const validZones = zoneResults.filter(z => z.count > 0)
    if (validZones.length > 0) {
        const best = validZones.reduce((p, c) => p.avg > c.avg ? p : c)
        const worst = validZones.reduce((p, c) => p.avg < c.avg ? p : c)
        if ((best.avg - worst.avg) > 5) {
            comments.push(`${best.name} genelinde not ortalamasının diğer bölgelere nazaran daha yüksek olduğu gözlenmiştir.`)
        } else {
            comments.push(`Sınıf genelinde oturma pozisyonuna bağlı anlamlı bir başarı farkı tespit edilmemiştir.`)
        }
    }

    // Correlation with Magnitude Labels
    if (correlation !== null && correlationConfidence === 'high') {
        const absR = Math.abs(correlation)
        let strength = absR < 0.2 ? "zayıf" : (absR < 0.5 ? "orta düzey" : "güçlü")

        if (correlation < -0.2) comments.push(`Sıra numarası arttıkça (arkaya gidildikçe) başarı puanlarında ${strength} bir azalma eğilimi mevcuttur.`)
        else if (correlation > 0.2) comments.push(`Arka sıralarda ${strength} bir başarı yoğunlaşması gözlenmiştir.`)
    }

    return {
        zones: zoneResults,
        correlation: correlation !== null ? correlation.toFixed(2) : '---',
        correlationRaw: correlation,
        correlationN: N,
        comments,
        matchStats,
        suspiciousMatches
    }
}
