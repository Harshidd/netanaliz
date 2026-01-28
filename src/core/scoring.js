const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export const getMaxTotalScore = (outcomeScores = []) => {
  const total = outcomeScores.reduce((sum, score) => sum + toNumber(score), 0)
  return total > 0 ? total : 0
}

export const getPerformanceLabel = (percentage) => {
  const pct = clampPercent(percentage)
  if (pct <= 20) return 'Çok Düşük'
  if (pct <= 40) return 'Düşük'
  if (pct <= 60) return 'Orta'
  if (pct <= 80) return 'İyi'
  return 'Çok İyi'
}

export const buildStudentResults = ({ config, students, grades, maxTotalScore, generalPassingScore }) => {
  const safeMaxTotalScore = maxTotalScore > 0 ? maxTotalScore : 100
  const passingScore = Number.isFinite(generalPassingScore) ? generalPassingScore : 50
  const outcomes = Array.isArray(config.outcomes) ? config.outcomes : []

  return students.map((student) => {
    let total = 0
    const outcomeScores = outcomes.map((_, outcomeIndex) => {
      const score = toNumber(grades?.[student.id]?.[outcomeIndex])
      total += score
      return score
    })

    const percentage = safeMaxTotalScore > 0 ? (total / safeMaxTotalScore) * 100 : 0

    return {
      ...student,
      total,
      outcomeScores,
      isPassing: total >= passingScore,
      percentage,
      performanceLabel: getPerformanceLabel(percentage),
    }
  })
}

export const calculateClassStats = ({ studentResults, maxTotalScore }) => {
  const safeMaxTotalScore = maxTotalScore > 0 ? maxTotalScore : 100
  const totalStudents = studentResults.length
  const passingCount = studentResults.filter((s) => s.isPassing).length
  const failingCount = totalStudents - passingCount
  const passRate = totalStudents > 0 ? (passingCount / totalStudents) * 100 : 0
  const classAverage = totalStudents > 0
    ? studentResults.reduce((sum, s) => sum + toNumber(s.total), 0) / totalStudents
    : 0
  const classAveragePercentage = safeMaxTotalScore > 0
    ? (classAverage / safeMaxTotalScore) * 100
    : 0

  return {
    passingCount,
    failingCount,
    passRate,
    classAverage,
    classAveragePercentage,
  }
}

export const calculateOutcomeStats = ({ config, studentResults, outcomeMasteryThreshold }) => {
  const outcomes = Array.isArray(config.outcomes) ? config.outcomes : []
  const outcomeScores = Array.isArray(config.outcomeScores) ? config.outcomeScores : []
  const masteryThreshold = Number.isFinite(outcomeMasteryThreshold) ? outcomeMasteryThreshold : 50
  const totalStudents = studentResults.length

  return outcomes.map((outcome, index) => {
    const maxScore = toNumber(outcomeScores[index])
    const outcomeThreshold = maxScore * (masteryThreshold / 100)

    let successCount = 0
    let totalScore = 0

    studentResults.forEach((student) => {
      const score = toNumber(student.outcomeScores?.[index])
      totalScore += score
      if (score >= outcomeThreshold) {
        successCount += 1
      }
    })

    const successRate = totalStudents > 0 ? (successCount / totalStudents) * 100 : 0
    const avgScore = totalStudents > 0 ? totalScore / totalStudents : 0
    const avgPercentage = maxScore > 0 ? (avgScore / maxScore) * 100 : 0

    return {
      outcome,
      index,
      maxScore,
      successRate,
      avgScore,
      avgPercentage,
      successCount,
      failCount: totalStudents - successCount,
      failRate: 100 - successRate,
    }
  })
}

export const calculateFailureMatrix = ({ config, studentResults, outcomeMasteryThreshold }) => {
  const outcomes = Array.isArray(config.outcomes) ? config.outcomes : []
  const outcomeScores = Array.isArray(config.outcomeScores) ? config.outcomeScores : []
  const masteryThreshold = Number.isFinite(outcomeMasteryThreshold) ? outcomeMasteryThreshold : 50
  const totalStudents = studentResults.length

  return outcomes.map((outcome, index) => {
    const maxScore = toNumber(outcomeScores[index])
    const failThreshold = maxScore * (masteryThreshold / 100)

    const failedStudents = studentResults
      .filter((student) => toNumber(student.outcomeScores?.[index]) < failThreshold)
      .map((student) => ({
        id: student.id,
        name: student.name,
        score: toNumber(student.outcomeScores?.[index]),
        maxScore,
        percentage: maxScore > 0 ? (toNumber(student.outcomeScores?.[index]) / maxScore) * 100 : 0,
        isPassingOverall: student.isPassing,
      }))

    const failRate = totalStudents > 0 ? (failedStudents.length / totalStudents) * 100 : 0

    return {
      outcome,
      index,
      maxScore,
      failedStudents,
      failedCount: failedStudents.length,
      totalStudents,
      failRate,
      isAllSuccess: failedStudents.length === 0,
    }
  })
}

export const calculateScoreDistribution = (studentResults) => {
  const distribution = [
    { range: '0-20', label: '0-20', count: 0 },
    { range: '21-40', label: '21-40', count: 0 },
    { range: '41-60', label: '41-60', count: 0 },
    { range: '61-80', label: '61-80', count: 0 },
    { range: '81-100', label: '81-100', count: 0 },
  ]

  studentResults.forEach((student) => {
    const pct = clampPercent(student.percentage)
    if (pct <= 20) distribution[0].count += 1
    else if (pct <= 40) distribution[1].count += 1
    else if (pct <= 60) distribution[2].count += 1
    else if (pct <= 80) distribution[3].count += 1
    else distribution[4].count += 1
  })

  return distribution
}

export const getTroubledOutcomes = (outcomeAnalysis) => {
  return [...outcomeAnalysis]
    .sort((a, b) => b.failRate - a.failRate)
    .slice(0, 3)
    .filter((outcome) => outcome.failRate > 30)
}

export const buildStudentComment = ({ student, classAverage, outcomes, outcomeScores }) => {
  if (!student) return ''

  const isAboveAverage = student.total > classAverage
  const weakOutcomes = outcomes.filter((_, i) => {
    const score = toNumber(student.outcomeScores?.[i])
    const maxScore = toNumber(outcomeScores[i])
    if (maxScore <= 0) return false
    return (score / maxScore) < 0.5
  })

  let comment = `${student.name}, `

  if (isAboveAverage) {
    comment += `sınıf ortalamasının ${(student.total - classAverage).toFixed(1)} puan üzerinde performans göstermiştir`
  } else {
    comment += `sınıf ortalamasının ${(classAverage - student.total).toFixed(1)} puan altında performans göstermiştir`
  }

  if (weakOutcomes.length > 0 && weakOutcomes.length <= 2) {
    const weakNames = weakOutcomes
      .map((outcome) => `"Kazanım ${outcomes.indexOf(outcome) + 1}"`)
      .join(' ve ')
    comment += `. ${weakNames} konusunda ek çalışma önerilmektedir.`
  } else if (weakOutcomes.length > 2) {
    comment += `. Genel bir tekrar çalışması önerilmektedir.`
  } else {
    comment += `. Tüm kazanımlarda başarılı bir performans sergilemiştir.`
  }

  return comment
}

export const buildAnalysis = ({ config, students, grades }) => {
  const rawMaxTotalScore = getMaxTotalScore(config.outcomeScores || [])
  const maxTotalScore = rawMaxTotalScore > 0 ? rawMaxTotalScore : 100
  const generalPassingScore = Number.isFinite(config.generalPassingScore) ? config.generalPassingScore : 50
  const outcomeMasteryThreshold = Number.isFinite(config.outcomeMasteryThreshold)
    ? config.outcomeMasteryThreshold
    : 50

  const studentResults = buildStudentResults({
    config,
    students,
    grades,
    maxTotalScore,
    generalPassingScore,
  })

  const classStats = calculateClassStats({ studentResults, maxTotalScore })
  const outcomeAnalysis = calculateOutcomeStats({
    config,
    studentResults,
    outcomeMasteryThreshold,
  })

  return {
    studentResults,
    ...classStats,
    outcomeAnalysis,
    troubledOutcomes: getTroubledOutcomes(outcomeAnalysis),
    scoreDistribution: calculateScoreDistribution(studentResults),
    failureMatrix: calculateFailureMatrix({
      config,
      studentResults,
      outcomeMasteryThreshold,
    }),
    maxTotalScore,
    generalPassingScore,
    outcomeMasteryThreshold,
  }
}
