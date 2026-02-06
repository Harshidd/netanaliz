/**
 * DenemeOkut Module - Scan Page
 * PR-4: Implements QR Code Detection via File Upload (No live camera yet)
 */

import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2, QrCode, FileWarning, Search, Image as ImageIcon } from 'lucide-react'
import { detectQRCodeFromImage } from '../services/qr'
import { templateRegistry } from '../services/templateRegistry'
import { logger } from '../../../core/observability/logger'
import { FatalModuleError } from '../components/FatalModuleError'
import { db } from '../db'
import type { DenemeOkutExamOutput } from '../schemas'

export default function ScanPage() {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State
    const [processing, setProcessing] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [selectedExam, setSelectedExam] = useState<DenemeOkutExamOutput | null>(null)
    const [manualExams, setManualExams] = useState<DenemeOkutExamOutput[]>([])
    const [showManualSelect, setShowManualSelect] = useState(false)
    const [fatalError, setFatalError] = useState<{ message: string, details: string[] } | null>(null)

    // Check Fatal State on Mount
    useEffect(() => {
        const fatal = templateRegistry.getFatalError()
        if (fatal) {
            setFatalError(fatal)
        }
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setProcessing(true)
        setStatusMessage('QR kod aranıyor...')
        setShowManualSelect(false)

        const startTime = performance.now()

        try {
            // 1. Detect QR
            const qrPayload = await detectQRCodeFromImage(file)

            if (qrPayload) {
                logger.info('ScanPage', 'QR Found', { examId: qrPayload.examId })

                // 2. Check if exam exists locally
                const exam = await db.getExam(qrPayload.examId)
                if (exam) {
                    setSelectedExam(exam)
                    setStatusMessage(`Deneme bulundu: ${exam.title}`)
                    logger.info('ScanPage', 'Exam Auto-Selected via QR', { title: exam.title })
                } else {
                    setStatusMessage('QR okundu ancak bu deneme cihazda bulunamadı.')
                    // Fallback to manual
                    loadManualExams()
                }
            } else {
                logger.warn('ScanPage', 'No QR Code Detected')
                setStatusMessage('Görselde QR kod bulunamadı. Lütfen elle seçim yapın.')
                loadManualExams()
            }
        } catch (err: any) {
            logger.error('ScanPage', 'Processing Failed', { error: err })
            setStatusMessage('İşlem sırasında bir hata oluştu: ' + err.message)
            loadManualExams()
        } finally {
            setProcessing(false)
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const loadManualExams = async () => {
        setShowManualSelect(true)
        try {
            const exams = await db.getAllExams()
            setManualExams(exams)
        } catch (err) {
            console.error('Failed to load manual exams', err)
        }
    }

    if (fatalError) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <FatalModuleError title={fatalError.message} message="Sistem güvenliği için modül devre dışı bırakıldı." details={fatalError.details} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6 text-white">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={() => navigate('/deneme-okut')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Ana Menüye Dön
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Deneme Tara (Beta)</h1>
                    <p className="text-gray-400">QR kodlu kağıtları yükleyerek otomatik eşleştirme yapın.</p>
                </div>

                {/* Status Card */}
                {selectedExam ? (
                    <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-6 mb-8 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode className="w-8 h-8 text-green-200" />
                        </div>
                        <h3 className="text-lg font-bold text-green-100 mb-1">{selectedExam.title}</h3>
                        <p className="text-green-300/80 text-sm mb-4">
                            {selectedExam.questionCount} Soru • {selectedExam.templateName}
                        </p>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg w-full transition-colors font-medium"
                            onClick={() => alert(`Başlatılıyor: ${selectedExam.id}`)} // Placeholder for next PR
                        >
                            Taramayı Başlat
                        </button>
                        <button
                            className="mt-3 text-sm text-green-400 hover:text-green-300"
                            onClick={() => { setSelectedExam(null); setStatusMessage(null); }}
                        >
                            Farklı Seçim Yap
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 p-8 text-center">
                        {processing ? (
                            <div className="py-8">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                                <p className="text-gray-300">{statusMessage}</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />

                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ImageIcon className="w-10 h-10 text-gray-400" />
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2">Kağıt Fotoğrafı Yükle</h3>
                                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                                    Galeriden bir fotoğraf seçin. Sistem otomatik olarak QR kodu tarayacak ve doğru denemeyi bulacaktır.
                                </p>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg w-full font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Upload className="w-5 h-5" />
                                    Fotoğraf Seç
                                </button>

                                {statusMessage && (
                                    <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 justify-center text-red-300 text-sm">
                                        <FileWarning className="w-4 h-4" />
                                        {statusMessage}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Manual Selection Fallback */}
                {showManualSelect && !selectedExam && (
                    <div className="mt-8 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Veya Listeden Seçin</h3>
                        </div>

                        <div className="space-y-3">
                            {manualExams.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Kayıtlı deneme bulunamadı.</p>
                            ) : (
                                manualExams.map(exam => (
                                    <button
                                        key={exam.id}
                                        onClick={() => setSelectedExam(exam)}
                                        className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center justify-between transition-colors border border-gray-700 hover:border-gray-500 text-left group"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-200 group-hover:text-white mb-1">{exam.title}</div>
                                            <div className="text-xs text-gray-500">{exam.templateName} • {exam.questionCount} Soru</div>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-400 rotate-180 transition-colors" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
