import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertTriangle } from 'lucide-react'
import StudentImporter from './StudentImporter'
import GradingTable from './GradingTable'

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeQuestions = (count, existingQuestions, outcomes) => {
  const outcomeIds = new Set(outcomes.map((_, index) => String(index)))
  if (count <= 0) return []
  return Array.from({ length: count }).map((_, index) => {
    const existing = existingQuestions[index]
    let outcomeId = existing?.outcomeId ?? null
    if (outcomeId !== null && outcomeId !== '' && !outcomeIds.has(String(outcomeId))) {
      outcomeId = null
    }
    return {
      qNo: index + 1,
      maxScore: Math.max(0, Math.floor(Number.isFinite(toNumber(existing?.maxScore)) ? toNumber(existing?.maxScore) : 1)),
      outcomeId,
    }
  })
}

const areQuestionsEqual = (a, b) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].qNo !== b[i].qNo) return false
    if (toNumber(a[i].maxScore) !== toNumber(b[i].maxScore)) return false
    const aOutcome = a[i].outcomeId ?? null
    const bOutcome = b[i].outcomeId ?? null
    if (String(aOutcome) !== String(bOutcome)) return false
  }
  return true
}

const SetupAndGradesStep = ({
  config,
  questions = [],
  onQuestionsChange,
  students,
  onStudentsChange,
  grades,
  onGradesChange,
  onConfigChange,
  onBack,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState('setup')
  const [outcomeTexts, setOutcomeTexts] = useState(config.outcomes || [])
  const [outcomeCount, setOutcomeCount] = useState((config.outcomes || []).length)
  const [questionCount, setQuestionCount] = useState(questions.length || 0)
  const [scoringMode, setScoringMode] = useState('auto') // 'auto' or 'manual'
  const [showGradeResetWarning, setShowGradeResetWarning] = useState(false)
  const [showOutcomesPanel, setShowOutcomesPanel] = useState(false) // Mobile accordion
  const lastQuestionCountRef = useRef(questions.length || 0)

  // Sync outcomeTexts with config.outcomes
  useEffect(() => {
    const outcomeList = config.outcomes || []
    if (JSON.stringify(outcomeTexts) !== JSON.stringify(outcomeList)) {
      setOutcomeTexts(outcomeList)
      setOutcomeCount(outcomeList.length)
    }
  }, [config.outcomes])

  // Sync questionCount with questions.length
  useEffect(() => {
    if (questions.length !== questionCount) {
      setQuestionCount(questions.length)
    }
  }, [questions.length])

  // Normalize questions when count or outcomes change
  useEffect(() => {
    const normalized = normalizeQuestions(questionCount, questions, outcomeTexts)
    if (!areQuestionsEqual(normalized, questions)) {
      onQuestionsChange(normalized)
    }
  }, [questionCount, outcomeTexts])

  // Grade reset warning when question count changes
  useEffect(() => {
    const prev = lastQuestionCountRef.current
    if (prev !== questionCount && questionCount > 0) {
      const hasAnyGrade = students.some((student) => {
        const studentGrades = grades?.[student.id]
        if (!studentGrades) return false
        return Object.values(studentGrades).some((value) => value !== '' && value !== null && value !== undefined)
      })
      if (hasAnyGrade) {
        setShowGradeResetWarning(true)
      }
      lastQuestionCountRef.current = questionCount
    }
  }, [questionCount, students, grades])

  const handleOutcomeCountChange = (value) => {
    const count = parseInt(value, 10) || 0
    setOutcomeCount(count)
    const next = Array(count).fill('').map((_, i) => outcomeTexts[i] || '')
    setOutcomeTexts(next)
    onConfigChange({ outcomeCount: count, outcomes: next })
  }

  const handleOutcomeTextChange = (index, value) => {
    const next = [...outcomeTexts]
    next[index] = value
    setOutcomeTexts(next)
    onConfigChange({ outcomes: next })
  }

  const handleQuestionCountChange = (value) => {
    const parsed = parseInt(value, 10)
    const newCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    setQuestionCount(newCount)
  }

  const handleQuestionScoreChange = (qNo, value) => {
    const next = [...questions]
    const question = next.find((item) => item.qNo === qNo)
    if (!question) return
    question.maxScore = Math.max(0, Math.floor(toNumber(value)))
    onQuestionsChange(next)
  }

  const handleOutcomeChange = (qNo, selectedValue) => {
    const next = [...questions]
    const question = next.find((item) => item.qNo === qNo)
    if (!question) return
    question.outcomeId = selectedValue === '' ? null : selectedValue
    onQuestionsChange(next)
  }

  const handleAutoDistribute = () => {
    if (questionCount <= 0) return
    const baseQuestions = normalizeQuestions(questionCount, questions, outcomeTexts)

    const n = questionCount
    const base = Math.floor(100 / n)
    const remainder = 100 - (base * n)

    const next = baseQuestions.map((question, index) => {
      // Distribute 100 points: base for everyone, remainder to the last one
      // Guarantees Sum = 100 and Integers
      const add = (index === n - 1) ? remainder : 0
      const score = base + add

      return {
        ...question,
        maxScore: score,
      }
    })
    onQuestionsChange(next)
  }

  const hasAnyGrade = useMemo(() => {
    return students.some((student) => {
      const studentGrades = grades?.[student.id]
      if (!studentGrades) return false
      return Object.values(studentGrades).some((value) => value !== '' && value !== null && value !== undefined)
    })
  }, [students, grades])

  const canAnalyze = students.length > 0 && questions.length > 0 && hasAnyGrade

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar: Back Button */}
      <div className="flex justify-end">
        <Button onClick={onBack} variant="outline">
          Geri
        </Button>
      </div>

      {/* Header Grid: Title/Tabs + Student Import Toolbar (only on grades tab) */}
      {activeTab === 'grades' ? (
        <Card className="shadow-apple-lg border border-gray-100 bg-white rounded-2xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_680px] gap-6 items-start">
            {/* Left: Title, Description, Tabs */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Sınav Kurulumu & Not Girişi</h1>
                <p className="text-sm text-gray-500">Sınavı kurun, öğrencileri yükleyin ve notları girin.</p>
              </div>
              <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${activeTab === 'setup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Sınav Kurulumu
                </button>
                <button
                  onClick={() => setActiveTab('grades')}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${activeTab === 'grades'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Öğrenci & Notlar
                </button>
              </div>
            </div>

            {/* Right: Student Import Toolbar */}
            <div className="h-full">
              <StudentImporter
                onImport={onStudentsChange} // Pass raw update to Exam State
                existingStudents={students}
                compact={true}
                target="exam" // Updates Roster automatically too
              />
            </div>
          </div>
        </Card>
      ) : (
        /* Setup tab: Simple header */
        <Card className="shadow-apple-lg border border-gray-100 bg-white rounded-2xl p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Sınav Kurulumu & Not Girişi</h1>
              <p className="text-sm text-gray-500">Sınavı kurun, öğrencileri yükleyin ve notları girin.</p>
            </div>
            <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-4 py-2 text-sm rounded-full transition-all ${activeTab === 'setup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Sınav Kurulumu
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`px-4 py-2 text-sm rounded-full transition-all ${activeTab === 'grades'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Öğrenci & Notlar
              </button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Policy Settings at Top */}
          <Card className="shadow-apple-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="generalPassingScore" className="text-gray-600">Genel Geçme Puanı</Label>
                  <Input
                    id="generalPassingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={config.generalPassingScore ?? 50}
                    onChange={(e) => onConfigChange({ generalPassingScore: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcomeMasteryThreshold" className="text-gray-600">Kazanım Ustalık Barajı (%)</Label>
                  <Input
                    id="outcomeMasteryThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={config.outcomeMasteryThreshold ?? 50}
                    onChange={(e) => onConfigChange({ outcomeMasteryThreshold: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Setup Area: Left Panel + Right Table */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left Panel: Kazanımlar (Desktop) */}
            <div className="hidden lg:block">
              <Card className="shadow-apple-lg h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Kazanımlar</CardTitle>
                  <CardDescription className="text-xs">Kazanım listesi tanımlayın</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="outcomeCount" className="text-sm text-gray-600">Kazanım Sayısı (K)</Label>
                    <Input
                      id="outcomeCount"
                      type="number"
                      min="0"
                      value={outcomeCount}
                      onChange={(e) => handleOutcomeCountChange(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {outcomeCount > 0 && (
                    <div className="space-y-2">
                      {Array.from({ length: outcomeCount }).map((_, index) => (
                        <div key={index} className="space-y-1">
                          <Label className="text-xs text-gray-500">K{index + 1}</Label>
                          <Input
                            value={outcomeTexts[index] || ''}
                            onChange={(e) => handleOutcomeTextChange(index, e.target.value)}
                            placeholder={`Kazanım ${index + 1}`}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mobile: Kazanımlar Accordion */}
            <div className="lg:hidden">
              <Card className="shadow-apple-lg">
                <CardHeader className="pb-3">
                  <button
                    onClick={() => setShowOutcomesPanel(!showOutcomesPanel)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div>
                      <CardTitle className="text-lg">Kazanımlar</CardTitle>
                      <CardDescription className="text-xs">Kazanım listesi tanımlayın</CardDescription>
                    </div>
                    <span className="text-gray-400">{showOutcomesPanel ? '▼' : '▶'}</span>
                  </button>
                </CardHeader>
                {showOutcomesPanel && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="outcomeCountMobile" className="text-sm text-gray-600">Kazanım Sayısı (K)</Label>
                      <Input
                        id="outcomeCountMobile"
                        type="number"
                        min="0"
                        value={outcomeCount}
                        onChange={(e) => handleOutcomeCountChange(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    {outcomeCount > 0 && (
                      <div className="space-y-2">
                        {Array.from({ length: outcomeCount }).map((_, index) => (
                          <div key={index} className="space-y-1">
                            <Label className="text-xs text-gray-500">K{index + 1}</Label>
                            <Input
                              value={outcomeTexts[index] || ''}
                              onChange={(e) => handleOutcomeTextChange(index, e.target.value)}
                              placeholder={`Kazanım ${index + 1}`}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Panel: Question Setup */}
            <Card className="shadow-apple-lg">
              <CardHeader>
                <CardTitle>Soru Kurulumu</CardTitle>
                <CardDescription>Soru sayısı, puanlama ve kazanım eşleştirmesi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount" className="text-gray-600">Toplam Soru (N)</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="0"
                      value={questionCount}
                      onChange={(e) => handleQuestionCountChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Puanlama Modu</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScoringMode('auto')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${scoringMode === 'auto'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                      >
                        Otomatik
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoringMode('manual')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${scoringMode === 'manual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                      >
                        Manuel
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Toplam Puan</Label>
                    <div className="h-10 flex items-center justify-between px-3 rounded-lg bg-gray-50 text-gray-700 font-semibold">
                      <span>100</span>
                      {scoringMode === 'auto' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAutoDistribute}
                          disabled={questionCount <= 0}
                          className="h-7 text-xs"
                        >
                          Dağıt (100/N)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {showGradeResetWarning && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <span>Soru sayısı değişti. Mevcut notlar yeni düzene uymayabilir.</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onGradesChange({})
                          setShowGradeResetWarning(false)
                        }}
                      >
                        Notları Sıfırla
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Question-Outcome Table */}
                {questionCount > 0 && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Soru–Kazanım Eşleştirme</h3>
                      <p className="text-xs text-gray-500">Her soru için puan ve kazanım seçin.</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-16">Soru</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Puan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kazanım</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {questions.map((question) => (
                            <tr key={question.qNo} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                Q{question.qNo}
                              </td>
                              <td className="px-4 py-3">
                                {scoringMode === 'auto' ? (
                                  <div className="text-sm text-gray-700 font-medium">
                                    {Math.round(question.maxScore ?? 0)}
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={question.maxScore ?? 0}
                                    onChange={(e) => handleQuestionScoreChange(question.qNo, e.target.value)}
                                    className="w-20 text-right text-sm"
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={question.outcomeId ?? ''}
                                  onChange={(e) => handleOutcomeChange(question.qNo, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Seçilmedi</option>
                                  {outcomeTexts.map((outcome, index) => (
                                    <option key={index} value={String(index)}>
                                      {outcome || `Kazanım ${index + 1}`}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-4 mt-2">
          {/* Note: ExcelUploader is now in the header row above */}

          {/* Full-Width Grading Table or Empty State */}
          {students.length === 0 ? (
            <Card className="shadow-apple-lg">
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <div className="text-gray-400">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Henüz öğrenci yok</h3>
                  <p className="text-sm text-gray-500">Yukarıdaki araç çubuğundan öğrenci listesi yükleyin</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GradingTable
              config={config}
              questions={questions}
              students={students}
              grades={grades}
              onGradesChange={onGradesChange}
              onStudentUpdate={(studentId, patch) => {
                const nextStudents = students.map(s =>
                  s.id === studentId ? { ...s, ...patch } : s
                )
                onStudentsChange(nextStudents)
              }}
              onDeleteStudent={(studentId) => {
                if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) return
                const nextStudents = students.filter(s => s.id !== studentId)
                onStudentsChange(nextStudents)
                // grades'ten de sil
                const nextGrades = { ...grades }
                delete nextGrades[studentId]
                onGradesChange(nextGrades)
              }}
              onAddStudent={() => {
                const newStudent = {
                  id: Date.now(),
                  siraNo: students.length + 1,
                  no: '',
                  studentNumber: '',
                  name: ''
                }
                onStudentsChange([...students, newStudent])
              }}
              showNavigation={false}
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {canAnalyze ? 'Hazır: Analize geçebilirsiniz.' : 'Analiz için soru, öğrenci ve not girin.'}
        </div>
        <Button onClick={onNext} disabled={!canAnalyze} size="lg" className="min-w-[200px]">
          Analize Git
        </Button>
      </div>
    </div>
  )
}

export default SetupAndGradesStep