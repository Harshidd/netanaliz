import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Label } from './ui/Label'
import { Switch } from './ui/Switch'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertCircle, AlertTriangle, Divide, Calculator, ArrowRight } from 'lucide-react'

const ConfigurationStep = ({ config, onConfigChange, onNext }) => {
  const [errors, setErrors] = useState({})
  const [outcomeTexts, setOutcomeTexts] = useState(config.outcomes || [])
  const [outcomeScores, setOutcomeScores] = useState(config.outcomeScores || [])
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [targetScore, setTargetScore] = useState(100)

  useEffect(() => {
    // Varsayılan değerleri ayarla
    const updates = {}
    if (config.generalPassingScore === undefined) {
      updates.generalPassingScore = 50
    }
    if (config.outcomeMasteryThreshold === undefined) {
      updates.outcomeMasteryThreshold = 50
    }
    // Geriye uyumluluk: eski successThreshold varsa outcomeMasteryThreshold'a aktar
    if (config.successThreshold && !config.outcomeMasteryThreshold) {
      updates.outcomeMasteryThreshold = config.successThreshold
    }
    if (Object.keys(updates).length > 0) {
      onConfigChange(updates)
    }
  }, [])

  useEffect(() => {
    if (config.outcomeCount && outcomeTexts.length !== config.outcomeCount) {
      const newTexts = Array(config.outcomeCount).fill('').map((_, i) => outcomeTexts[i] || '')
      const newScores = Array(config.outcomeCount).fill(0).map((_, i) => outcomeScores[i] || 0)
      setOutcomeTexts(newTexts)
      setOutcomeScores(newScores)
    }
  }, [config.outcomeCount])

  const handleOutcomeCountChange = (e) => {
    const count = parseInt(e.target.value) || 0
    onConfigChange({ outcomeCount: count })
  }

  const handleOutcomeTextChange = (index, value) => {
    const newTexts = [...outcomeTexts]
    newTexts[index] = value
    setOutcomeTexts(newTexts)
    onConfigChange({ outcomes: newTexts })
  }

  const handleOutcomeScoreChange = (index, value) => {
    let score = parseFloat(value) || 0
    if (score < 0) score = 0
    
    const newScores = [...outcomeScores]
    newScores[index] = score
    setOutcomeScores(newScores)
    onConfigChange({ outcomeScores: newScores })
  }

  const handleAutoDistribute = () => {
    setShowDistributeModal(true)
  }

  const confirmDistribute = () => {
    if (config.outcomeCount > 0 && targetScore > 0) {
      const scorePerOutcome = targetScore / config.outcomeCount
      const newScores = Array(config.outcomeCount).fill(0).map((_, i) => {
        if (i === config.outcomeCount - 1) {
          const sumSoFar = Math.round(scorePerOutcome * 100) / 100 * (config.outcomeCount - 1)
          return Math.round((targetScore - sumSoFar) * 100) / 100
        }
        return Math.round(scorePerOutcome * 100) / 100
      })
      setOutcomeScores(newScores)
      onConfigChange({ outcomeScores: newScores })
    }
    setShowDistributeModal(false)
  }

  const totalScore = outcomeScores.reduce((sum, score) => sum + (score || 0), 0)

  useEffect(() => {
    onConfigChange({ totalScore })
  }, [totalScore])

  const validateForm = () => {
    const newErrors = {}

    if (!config.schoolName?.trim()) newErrors.schoolName = 'Okul adı gereklidir'
    if (!config.principalName?.trim()) newErrors.principalName = 'Müdür adı gereklidir'
    if (!config.courseName?.trim()) newErrors.courseName = 'Ders adı gereklidir'
    if (!config.teacherName?.trim()) newErrors.teacherName = 'Öğretmen adı gereklidir'
    if (!config.gradeLevel) newErrors.gradeLevel = 'Sınıf düzeyi seçiniz'
    if (!config.outcomeCount || config.outcomeCount < 1) {
      newErrors.outcomeCount = 'En az 1 kazanım olmalıdır'
    }
    
    if (totalScore <= 0) {
      newErrors.totalScore = 'Toplam puan 0\'dan büyük olmalıdır'
    }

    outcomeTexts.forEach((text, i) => {
      if (!text?.trim()) {
        newErrors[`outcome${i}`] = 'Kazanım açıklaması gereklidir'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const isSubmitDisabled = totalScore <= 0

  const gradeLevels = config.schoolLevel === 'lise' 
    ? ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf']
    : ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf']

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-apple-xl animate-scale-in">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">
              Puanları Eşit Dağıt
            </h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="targetScore" className="text-gray-600">Hedef Toplam Puan</Label>
                <Input
                  id="targetScore"
                  type="number"
                  min="1"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value) || 100)}
                  className="mt-2"
                />
              </div>
              
              {config.outcomeCount > 0 && targetScore > 0 && (
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{targetScore}</span> puan → <span className="font-semibold text-gray-900">{config.outcomeCount}</span> kazanım
                  </p>
                  <p className="text-2xl font-semibold text-primary mt-2">
                    {(targetScore / config.outcomeCount).toFixed(2)} puan/kazanım
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDistributeModal(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={confirmDistribute}
                  disabled={!config.outcomeCount || targetScore <= 0}
                  className="flex-1"
                >
                  Dağıt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-12 animate-slide-up">
        <h1 className="hero-title mb-4">
          Sınav Analizinde<br />
          <span className="text-gradient">Net Görüş.</span>
        </h1>
        <p className="hero-subtitle">
          Sınav bilgilerinizi girin, öğrenci başarısını analiz edin.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-apple-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-8 md:p-10 space-y-8">
          {/* School Level Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <span className={`text-sm font-medium ${config.schoolLevel === 'ortaokul' ? 'text-gray-900' : 'text-gray-400'}`}>
              Ortaokul
            </span>
            <Switch
              checked={config.schoolLevel === 'lise'}
              onCheckedChange={(checked) => 
                onConfigChange({ 
                  schoolLevel: checked ? 'lise' : 'ortaokul',
                  gradeLevel: ''
                })
              }
            />
            <span className={`text-sm font-medium ${config.schoolLevel === 'lise' ? 'text-gray-900' : 'text-gray-400'}`}>
              Lise
            </span>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-gray-600">Okul Adı</Label>
              <Input
                id="schoolName"
                value={config.schoolName || ''}
                onChange={(e) => onConfigChange({ schoolName: e.target.value })}
                placeholder="Okul adını girin"
                className={errors.schoolName ? 'border-red-300 focus:border-red-400' : ''}
              />
              {errors.schoolName && (
                <p className="text-xs text-red-500">{errors.schoolName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="principalName" className="text-gray-600">Okul Müdürü</Label>
              <Input
                id="principalName"
                value={config.principalName || ''}
                onChange={(e) => onConfigChange({ principalName: e.target.value })}
                placeholder="Müdür adını girin"
                className={errors.principalName ? 'border-red-300 focus:border-red-400' : ''}
              />
              {errors.principalName && (
                <p className="text-xs text-red-500">{errors.principalName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-gray-600">Ders Adı</Label>
              <Input
                id="courseName"
                value={config.courseName || ''}
                onChange={(e) => onConfigChange({ courseName: e.target.value })}
                placeholder="Ders adını girin"
                className={errors.courseName ? 'border-red-300 focus:border-red-400' : ''}
              />
              {errors.courseName && (
                <p className="text-xs text-red-500">{errors.courseName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherName" className="text-gray-600">Öğretmen Adı</Label>
              <Input
                id="teacherName"
                value={config.teacherName || ''}
                onChange={(e) => onConfigChange({ teacherName: e.target.value })}
                placeholder="Öğretmen adını girin"
                className={errors.teacherName ? 'border-red-300 focus:border-red-400' : ''}
              />
              {errors.teacherName && (
                <p className="text-xs text-red-500">{errors.teacherName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel" className="text-gray-600">Sınıf Düzeyi</Label>
              <Select
                id="gradeLevel"
                value={config.gradeLevel || ''}
                onChange={(e) => onConfigChange({ gradeLevel: e.target.value })}
                className={errors.gradeLevel ? 'border-red-300 focus:border-red-400' : ''}
              >
                <option value="">Seçiniz...</option>
                {gradeLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </Select>
              {errors.gradeLevel && (
                <p className="text-xs text-red-500">{errors.gradeLevel}</p>
              )}
            </div>

            {/* YENİ: Şube Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="classSection" className="text-gray-600">Şube</Label>
              <Select
                id="classSection"
                value={config.classSection || ''}
                onChange={(e) => onConfigChange({ classSection: e.target.value })}
              >
                <option value="">Seçiniz...</option>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                  <option key={section} value={section}>{section} Şubesi</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalPassingScore" className="text-gray-600">
                Genel Geçme Puanı
                <span className="text-xs text-gray-400 ml-1">(Mutlak Puan)</span>
              </Label>
              <Input
                id="generalPassingScore"
                type="number"
                min="0"
                max="100"
                value={config.generalPassingScore ?? 50}
                onChange={(e) => onConfigChange({ generalPassingScore: parseInt(e.target.value) || 0 })}
                placeholder="50"
              />
              <p className="text-xs text-gray-400">Öğrencinin dersi geçmesi için gereken minimum puan</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomeMasteryThreshold" className="text-gray-600">
                Kazanım Ustalık Barajı
                <span className="text-xs text-gray-400 ml-1">(%)</span>
              </Label>
              <Select
                id="outcomeMasteryThreshold"
                value={config.outcomeMasteryThreshold || 50}
                onChange={(e) => onConfigChange({ outcomeMasteryThreshold: parseInt(e.target.value) })}
              >
                <option value={30}>%30</option>
                <option value={40}>%40</option>
                <option value={50}>%50 (Varsayılan)</option>
                <option value={60}>%60</option>
                <option value={70}>%70</option>
              </Select>
              <p className="text-xs text-gray-400">Kazanım bazlı telafi listesi için başarısızlık eşiği</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear" className="text-gray-600">Eğitim Yılı</Label>
              <Select
                id="academicYear"
                value={config.academicYear || '2025-2026'}
                onChange={(e) => onConfigChange({ academicYear: e.target.value })}
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="text-gray-600">Dönem</Label>
              <Select
                id="semester"
                value={config.semester || '1. Dönem'}
                onChange={(e) => onConfigChange({ semester: e.target.value })}
              >
                <option value="1. Dönem">1. Dönem</option>
                <option value="2. Dönem">2. Dönem</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examNumber" className="text-gray-600">Sınav Numarası</Label>
              <Select
                id="examNumber"
                value={config.examNumber || '1. Sınav'}
                onChange={(e) => onConfigChange({ examNumber: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={`${num}. Sınav`}>{num}. Sınav</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Outcomes Section */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Kazanımlar</h3>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="outcomeCount" className="text-gray-600">Kazanım Sayısı</Label>
                <Input
                  id="outcomeCount"
                  type="number"
                  min="1"
                  max="30"
                  value={config.outcomeCount || ''}
                  onChange={handleOutcomeCountChange}
                  placeholder="Örn: 10"
                  className={`w-32 ${errors.outcomeCount ? 'border-red-300' : ''}`}
                />
              </div>
              
              {config.outcomeCount > 0 && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAutoDistribute}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Puanları Dağıt
                  </Button>
                </div>
              )}
            </div>

            {config.outcomeCount > 0 && (
              <>
                {/* Total Score Display */}
                <div className={`p-6 rounded-2xl mb-6 ${
                  totalScore === 100 
                    ? 'bg-green-50 border border-green-200' 
                    : totalScore > 0 
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Toplam Puan</p>
                      <p className={`text-4xl font-semibold ${
                        totalScore === 100 ? 'text-green-600' : totalScore > 0 ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {totalScore.toFixed(0)}
                      </p>
                    </div>
                    {totalScore === 100 && (
                      <span className="text-green-600 text-sm">Standart</span>
                    )}
                  </div>
                </div>

                {/* Outcomes List */}
                <div className="space-y-3">
                  {Array.from({ length: config.outcomeCount }).map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-gray-500">Kazanım {index + 1}</Label>
                        <Input
                          value={outcomeTexts[index] || ''}
                          onChange={(e) => handleOutcomeTextChange(index, e.target.value)}
                          placeholder={`Kazanım ${index + 1} açıklaması`}
                          className={`bg-white ${errors[`outcome${index}`] ? 'border-red-300' : ''}`}
                        />
                      </div>
                      <div className="w-full md:w-24 space-y-1">
                        <Label className="text-xs text-gray-500">Puan</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={outcomeScores[index] || 0}
                          onChange={(e) => handleOutcomeScoreChange(index, e.target.value)}
                          className="text-center font-semibold bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {totalScore > 0 && totalScore !== 100 && (
                  <Alert className="mt-6 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-700 text-sm">
                      Sınav toplam <strong>{totalScore.toFixed(0)}</strong> puan üzerinden değerlendirilecek.
                    </AlertDescription>
                  </Alert>
                )}

                {errors.totalScore && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.totalScore}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button - Apple Style */}
      <div className="flex justify-center mt-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Button 
          onClick={handleSubmit} 
          size="xl"
          disabled={isSubmitDisabled}
          className="min-w-[240px]"
        >
          Devam Et
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default ConfigurationStep
