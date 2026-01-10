import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, Zap, Calculator } from 'lucide-react'

const GradingTable = ({ config, students, grades: existingGrades, onGradesChange, onNext, onBack }) => {
  const [grades, setGrades] = useState({})
  const [warnings, setWarnings] = useState({})
  const [totalInputWarnings, setTotalInputWarnings] = useState({})
  
  // LOCAL STATE: Toplam input değerleri (onBlur'a kadar hesaplama yapmaz)
  const [totalInputValues, setTotalInputValues] = useState({})

  // Dinamik maksimum toplam puan (kazanımların toplamı)
  const maxTotalScore = config.outcomeScores?.reduce((sum, score) => sum + score, 0) || 100
  
  // YENİ: Genel geçme puanı (mutlak değer) kullan
  const generalPassingScore = config.generalPassingScore ?? 50

  useEffect(() => {
    // Initialize grades for all students and outcomes
    // Eğer mevcut notlar varsa onları kullan (State Preservation)
    if (existingGrades && Object.keys(existingGrades).length > 0) {
      setGrades(existingGrades)
      return
    }
    
    const initialGrades = {}
    students.forEach((student) => {
      if (!initialGrades[student.id]) {
        initialGrades[student.id] = {}
      }
      config.outcomes.forEach((_, index) => {
        if (initialGrades[student.id][index] === undefined) {
          initialGrades[student.id][index] = ''
        }
      })
    })
    setGrades(initialGrades)
  }, [students, config.outcomes, existingGrades])

  // Öğrencinin toplam puanını hesapla
  const calculateTotal = (studentId) => {
    if (!grades[studentId]) return 0
    let total = 0
    Object.entries(grades[studentId]).forEach(([outcomeIndex, score]) => {
      const numScore = parseFloat(score)
      if (!isNaN(numScore)) {
        total += numScore
      }
    })
    return total
  }

  // ================ PARÇADAN BÜTÜNE (K1, K2... -> Toplam) ================
  const handleGradeChange = (studentId, outcomeIndex, value) => {
    if (value === '' || value === null) {
      const newGrades = {
        ...grades,
        [studentId]: {
          ...grades[studentId],
          [outcomeIndex]: '',
        },
      }
      setGrades(newGrades)
      onGradesChange(newGrades)
      
      // Toplam input değerini temizle (sync için)
      setTotalInputValues(prev => {
        const newValues = { ...prev }
        delete newValues[studentId]
        return newValues
      })
      
      const newWarnings = { ...warnings }
      delete newWarnings[`${studentId}-${outcomeIndex}`]
      setWarnings(newWarnings)
      return
    }

    let numValue = parseFloat(value) || 0
    const maxScoreForOutcome = config.outcomeScores[outcomeIndex]
    
    if (numValue < 0) numValue = 0
    
    if (numValue > maxScoreForOutcome) {
      numValue = maxScoreForOutcome
      setWarnings({
        ...warnings,
        [`${studentId}-${outcomeIndex}`]: `Max ${maxScoreForOutcome}!`,
      })
    } else {
      const newWarnings = { ...warnings }
      delete newWarnings[`${studentId}-${outcomeIndex}`]
      setWarnings(newWarnings)
    }
    
    // TAM SAYIYA YUVARLA
    numValue = Math.round(numValue)
    
    const newGrades = {
      ...grades,
      [studentId]: {
        ...grades[studentId],
        [outcomeIndex]: numValue,
      },
    }
    setGrades(newGrades)
    onGradesChange(newGrades)
    
    // Toplam input değerini temizle (sync için)
    setTotalInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[studentId]
      return newValues
    })
  }

  // ================ TOPLAM INPUT: onChange - SADECE LOCAL STATE ================
  const handleTotalInputChange = (studentId, value) => {
    // Sadece local state güncelle, hesaplama YAPMA
    setTotalInputValues(prev => ({
      ...prev,
      [studentId]: value
    }))
    
    // Uyarıyı temizle
    setTotalInputWarnings(prev => {
      const newWarnings = { ...prev }
      delete newWarnings[studentId]
      return newWarnings
    })
  }

  // ================ TOPLAM INPUT: onBlur/Enter - DAĞITIM YAP ================
  const handleTotalDistribute = (studentId) => {
    const value = totalInputValues[studentId]
    
    // Boş değer kontrolü
    if (value === '' || value === null || value === undefined) {
      // Toplam boşaltıldığında tüm kazanımları temizle
      const newGrades = { ...grades }
      newGrades[studentId] = {}
      config.outcomes.forEach((_, index) => {
        newGrades[studentId][index] = ''
      })
      setGrades(newGrades)
      onGradesChange(newGrades)
      return
    }

    let numValue = parseFloat(value) || 0
    
    // Negatif değer engelle
    if (numValue < 0) numValue = 0
    
    // TAM SAYIYA YUVARLA
    numValue = Math.round(numValue)
    
    // CONSTRAINT: Max puanı aşarsa uyar ve işlemi yapma
    if (numValue > maxTotalScore) {
      setTotalInputWarnings({
        ...totalInputWarnings,
        [studentId]: `Max ${maxTotalScore} puan!`
      })
      
      // 3 saniye sonra uyarıyı kaldır
      setTimeout(() => {
        setTotalInputWarnings(prev => {
          const newWarnings = { ...prev }
          delete newWarnings[studentId]
          return newWarnings
        })
      }, 3000)
      return
    }
    
    // TERSTEN HESAPLAMA: Toplamı kazanım sayısına böl ve TAM SAYIYA YUVARLA
    const outcomeCount = config.outcomes.length
    const scorePerOutcome = numValue / outcomeCount
    
    // Tüm kazanımlara eşit dağıt (TAM SAYI olarak)
    const newGrades = { ...grades }
    newGrades[studentId] = {}
    
    let distributedSum = 0
    
    config.outcomes.forEach((_, index) => {
      const maxForThisOutcome = config.outcomeScores[index]
      let scoreForThis = Math.round(scorePerOutcome) // TAM SAYIYA YUVARLA
      
      // Eğer kazanımın max'ını aşıyorsa, max'a eşitle
      scoreForThis = Math.min(scoreForThis, maxForThisOutcome)
      scoreForThis = Math.max(0, scoreForThis)
      
      newGrades[studentId][index] = scoreForThis
      distributedSum += scoreForThis
    })
    
    // Yuvarlama farkını son kazanıma ekle/çıkar
    const diff = numValue - distributedSum
    if (diff !== 0 && outcomeCount > 0) {
      const lastIndex = outcomeCount - 1
      const lastMax = config.outcomeScores[lastIndex]
      const lastValue = newGrades[studentId][lastIndex]
      const adjustedLast = Math.min(Math.max(0, lastValue + diff), lastMax)
      newGrades[studentId][lastIndex] = adjustedLast
    }
    
    setGrades(newGrades)
    onGradesChange(newGrades)
    
    // Local state'i temizle
    setTotalInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[studentId]
      return newValues
    })
  }

  // Enter tuşu handler
  const handleTotalKeyDown = (studentId, e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTotalDistribute(studentId)
      e.target.blur() // Focus'u kaldır
    }
  }

  // ================ GLOBAL: TÜM ÖĞRENCİLERE TAM PUAN ================
  const handleFillAllWithMaxScore = () => {
    const newGrades = {}
    
    students.forEach((student) => {
      newGrades[student.id] = {}
      config.outcomes.forEach((_, index) => {
        // Her kazanıma o kazanımın maksimum puanını ver (TAM SAYI)
        newGrades[student.id][index] = Math.round(config.outcomeScores[index])
      })
    })
    
    setGrades(newGrades)
    onGradesChange(newGrades)
    setWarnings({})
    setTotalInputWarnings({})
    setTotalInputValues({})
  }

  const getStatus = (total) => {
    return total >= generalPassingScore
  }

  const getTotalColorClass = (total) => {
    if (total > maxTotalScore) {
      return 'text-red-600 bg-red-100 animate-pulse'
    } else if (total >= generalPassingScore) {
      return 'text-green-600 bg-green-50'
    } else if (total > 0) {
      return 'text-blue-600 bg-blue-50'
    }
    return 'text-gray-500 bg-gray-50'
  }

  const allGradesFilled = () => {
    return students.every((student) => {
      return config.outcomes.every((_, index) => {
        const grade = grades[student.id]?.[index]
        return grade !== '' && grade !== undefined
      })
    })
  }

  const hasOverflow = () => {
    return students.some((student) => {
      const total = calculateTotal(student.id)
      return total > maxTotalScore + 0.01
    })
  }

  const getEmptyInputCount = () => {
    let count = 0
    students.forEach((student) => {
      config.outcomes.forEach((_, index) => {
        const grade = grades[student.id]?.[index]
        if (grade === '' || grade === undefined) {
          count++
        }
      })
    })
    return count
  }

  const getFilledStudentCount = () => {
    return students.filter((student) => {
      return config.outcomes.every((_, index) => {
        const grade = grades[student.id]?.[index]
        return grade !== '' && grade !== undefined
      })
    }).length
  }

  // Toplam input için gösterilecek değer
  const getTotalDisplayValue = (studentId) => {
    // Eğer local state'te değer varsa onu göster
    if (totalInputValues[studentId] !== undefined) {
      return totalInputValues[studentId]
    }
    // Yoksa hesaplanmış toplamı göster
    const total = calculateTotal(studentId)
    return total > 0 ? total : ''
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Not Girişi</CardTitle>
              <CardDescription>
                Kazanım puanlarını tek tek girin veya toplam puandan otomatik dağıtın
              </CardDescription>
            </div>
            
            {/* GLOBAL BUTON: Tümüne Tam Puan Ver */}
            <Button
              onClick={handleFillAllWithMaxScore}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tüm Öğrencilere Tam Puan Ver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overflow Uyarısı */}
          {hasOverflow() && (
            <Alert variant="destructive" className="mb-4 animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">
                ⛔ HATA: Bazı öğrencilerin toplam puanı {maxTotalScore}'ü aşıyor!
              </AlertDescription>
            </Alert>
          )}

          {/* Bilgi Kutusu */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4" />
              <strong>Hibrit Giriş:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-6">
              <li>Kazanım kutularına (K1, K2...) tek tek puan girin → Toplam otomatik hesaplanır</li>
              <li><strong>Toplam</strong> kutusuna değer yazıp <strong>Enter</strong>'a basın veya kutudan çıkın → Puanlar eşit dağıtılır</li>
            </ul>
          </div>

          {/* Desktop Table View - Apple Card Style */}
          <div className="hidden lg:block w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Okul No</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">Ad Soyad</th>
                    {config.outcomes.map((outcome, index) => (
                      <th
                        key={index}
                        className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[80px]"
                        title={outcome}
                      >
                        <div>K{index + 1}</div>
                        <div className="text-[10px] font-normal text-gray-400 normal-case mt-0.5">({config.outcomeScores[index]})</div>
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center text-xs font-semibold text-amber-700 uppercase tracking-wider min-w-[120px] bg-amber-50">
                      <div>Toplam</div>
                      <div className="text-[10px] font-normal text-amber-600 normal-case mt-0.5">(max: {maxTotalScore})</div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => {
                  const total = calculateTotal(student.id)
                  const isPassing = getStatus(total)
                  const isOverMax = total > maxTotalScore
                  const hasTotalWarning = totalInputWarnings[student.id]
                  const displayTotal = getTotalDisplayValue(student.id)

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{student.siraNo}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{student.studentNumber || student.no || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                      {config.outcomes.map((_, outcomeIndex) => {
                        const hasWarning = warnings[`${student.id}-${outcomeIndex}`]
                        const maxScoreForOutcome = config.outcomeScores[outcomeIndex]
                        
                        return (
                          <td key={outcomeIndex} className="px-2 py-3 relative">
                            <Input
                              type="number"
                              min="0"
                              max={maxScoreForOutcome}
                              step="1"
                              value={grades[student.id]?.[outcomeIndex] ?? ''}
                              onChange={(e) =>
                                handleGradeChange(student.id, outcomeIndex, e.target.value)
                              }
                              className={`text-center text-sm py-2 ${
                                hasWarning ? 'border-red-500 bg-red-50' : 'border-gray-200'
                              }`}
                              title={`Max: ${maxScoreForOutcome}`}
                            />
                          </td>
                        )
                      })}
                      {/* TOPLAM INPUT - Editable with onBlur */}
                      <td className="px-2 py-3 relative bg-amber-50/50">
                        <Input
                          type="number"
                          min="0"
                          max={maxTotalScore}
                          step="1"
                          value={displayTotal}
                          onChange={(e) => handleTotalInputChange(student.id, e.target.value)}
                          onBlur={() => handleTotalDistribute(student.id)}
                          onKeyDown={(e) => handleTotalKeyDown(student.id, e)}
                          className={`text-center h-8 font-bold ${
                            hasTotalWarning 
                              ? 'border-red-500 bg-red-100 animate-pulse' 
                              : getTotalColorClass(total)
                          }`}
                          title="Değer yazıp Enter'a basın veya kutudan çıkın"
                        />
                        {hasTotalWarning && (
                          <div className="absolute -top-8 left-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap text-center">
                            {hasTotalWarning}
                          </div>
                        )}
                      </td>
                      <td className="border px-2 py-2">
                        <div className="flex items-center justify-center">
                          {isOverMax ? (
                            <span className="flex items-center text-red-600 font-semibold text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              HATA
                            </span>
                          ) : isPassing ? (
                            <span className="flex items-center text-green-600 font-semibold text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Geçti
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 font-semibold text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Kaldı
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {students.map((student) => {
              const total = calculateTotal(student.id)
              const isPassing = getStatus(total)
              const isOverMax = total > maxTotalScore
              const hasTotalWarning = totalInputWarnings[student.id]
              const displayTotal = getTotalDisplayValue(student.id)

              return (
                <Card key={student.id} className={`shadow-md ${isOverMax ? 'border-red-400 border-2' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {student.siraNo}. {student.name}
                        <span className="text-sm font-normal text-blue-600 ml-2">({student.studentNumber || student.no || '-'})</span>
                      </CardTitle>
                      {isPassing ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                          Geçti
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                          Kaldı
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Toplam Puan Input - Mobil */}
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-amber-800">Toplam Puan</span>
                        <span className="text-sm text-amber-600">max: {maxTotalScore}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={maxTotalScore}
                        step="1"
                        value={displayTotal}
                        onChange={(e) => handleTotalInputChange(student.id, e.target.value)}
                        onBlur={() => handleTotalDistribute(student.id)}
                        onKeyDown={(e) => handleTotalKeyDown(student.id, e)}
                        className={`text-center text-xl font-bold ${
                          hasTotalWarning ? 'border-red-500 bg-red-100' : ''
                        }`}
                        placeholder="Toplam girin"
                      />
                      {hasTotalWarning && (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {hasTotalWarning}
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-1">
                        💡 Değer yazıp Enter'a basın veya kutudan çıkın
                      </p>
                    </div>

                    {/* Kazanım Puanları */}
                    <div className="grid grid-cols-2 gap-2">
                      {config.outcomes.map((outcome, outcomeIndex) => {
                        const hasWarning = warnings[`${student.id}-${outcomeIndex}`]
                        const maxScoreForOutcome = config.outcomeScores[outcomeIndex]
                        
                        return (
                          <div key={outcomeIndex} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">K{outcomeIndex + 1}</span>
                              <span className="text-gray-400">({maxScoreForOutcome})</span>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              max={maxScoreForOutcome}
                              step="1"
                              value={grades[student.id]?.[outcomeIndex] ?? ''}
                              onChange={(e) =>
                                handleGradeChange(student.id, outcomeIndex, e.target.value)
                              }
                              className={`text-center h-9 ${
                                hasWarning ? 'border-red-500 bg-red-50' : ''
                              }`}
                              placeholder="0"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Durum Özeti */}
          <div className="mt-4 p-4 bg-slate-100 rounded-lg">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="text-sm text-gray-600">
                <strong>Geçme Puanı:</strong> {generalPassingScore} puan
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  ✓ {getFilledStudentCount()} öğrenci tamamlandı
                </span>
                {getEmptyInputCount() > 0 && (
                  <span className="text-amber-600 font-medium">
                    {getEmptyInputCount()} boş alan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boş input uyarısı */}
          {!allGradesFilled() && (
            <Alert className="mt-4 bg-blue-50 border-blue-300">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Lütfen tüm öğrenciler için puanları girin veya <strong>"Tüm Öğrencilere Tam Puan Ver"</strong> butonunu kullanın.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Geri
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          disabled={!allGradesFilled() || hasOverflow()}
          className={`min-w-[200px] ${(!allGradesFilled() || hasOverflow()) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {hasOverflow() ? (
            'Puan Hatası Var'
          ) : !allGradesFilled() ? (
            'Tüm Puanları Girin'
          ) : (
            'Analiz Sonuçlarını Gör'
          )}
        </Button>
      </div>
    </div>
  )
}

export default GradingTable
