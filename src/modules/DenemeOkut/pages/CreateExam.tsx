/**
 * DenemeOkut Module - Create Exam Page
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Check, QrCode, Download, ExternalLink } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { templateRegistry } from '../services/templateRegistry'
import { db } from '../db'
import { DenemeOkutExamSchema } from '../schemas'
import { logger } from '../../../core/observability/logger'
import { FatalModuleError } from '../components/FatalModuleError'
import { generateExamQRCode } from '../services/qr'
import type { Template } from '../schemas/templateSchema'

export default function CreateExam() {
    const navigate = useNavigate()

    // State
    const [title, setTitle] = useState('')
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fatalError, setFatalError] = useState<{ message: string, details: string[] } | null>(null)

    // PR-4 Success State
    const [createdExamId, setCreatedExamId] = useState<string | null>(null)
    const [qrValue, setQrValue] = useState<string | null>(null)

    // Load templates on mount
    useEffect(() => {
        try {
            // Check fatal first
            const fatal = templateRegistry.getFatalError()
            if (fatal) {
                setFatalError(fatal)
                return
            }

            const all = templateRegistry.getAllTemplates()
            setTemplates(all)
        } catch (err) {
            console.error('Failed to load templates:', err)
            // If getFatalError didn't catch it but getAll throws, treat as fatal
            setFatalError({ message: 'Şablon sistemi başlatılamadı.', details: [(err as Error).message] })
        }
    }, [])

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Lütfen bir deneme adı girin.')
            return
        }
        if (!selectedTemplateId) {
            setError('Lütfen bir optik form şablonu seçin.')
            return
        }

        const template = templates.find(t => t.templateId === selectedTemplateId)
        if (!template) {
            setError('Seçilen şablon geçersiz.')
            return
        }

        setLoading(true)
        setError(null)
        const startTime = performance.now()

        try {
            const newExamId = uuidv4()
            const now = new Date().toISOString()

            const examData = {
                id: newExamId,
                title: title.trim(),
                templateId: template.templateId,
                templateVersion: template.version,
                templateName: template.name,
                questionCount: template.questionCount,
                answerKey: {}, // Empty for now
                createdAt: now,
                updatedAt: now
            }

            // Runtime Validation before DB
            const validation = DenemeOkutExamSchema.safeParse(examData)
            if (!validation.success) {
                throw new Error('Veri doğrulama hatası: ' + validation.error.issues[0].message)
            }

            await db.addExam(examData)

            logger.info('CreateExam', 'Exam Created', {
                examId: newExamId,
                template: template.templateId,
                durationMs: performance.now() - startTime
            })

            // UX: Generate QR and show success instead of redirect
            try {
                const qr = await generateExamQRCode(newExamId, template.templateId, template.version)
                setQrValue(qr)
                setCreatedExamId(newExamId)
            } catch (qrErr) {
                // QR fail shouldn't block the flow, but let's log it
                logger.warn('CreateExam', 'QR Generation Failed silently', { error: qrErr })
                navigate('/deneme-okut/denemeler')
            }

        } catch (err: any) {
            logger.error('CreateExam', 'Failed to create exam', { error: err })
            setError(err.message || 'Deneme oluşturulurken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    if (fatalError) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <FatalModuleError title={fatalError.message} message="Sistem güvenliği için modül devre dışı bırakıldı." details={fatalError.details} />
            </div>
        )
    }

    // Success View with QR
    if (createdExamId && qrValue) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Deneme Oluşturuldu!</h2>
                    <p className="text-gray-500 mb-8">Öğrencilerin bu sınava katılması için aşağıdaki QR kodunu kullanabilirsiniz.</p>

                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-8">
                        <img src={qrValue} alt="Sınav QR Kodu" className="w-48 h-48" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            href={qrValue}
                            download={`exam-qr-${createdExamId}.png`}
                            className="flex items-center justify-center gap-2 bg-gray-900 text-white w-full py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                        >
                            <Download className="w-5 h-5" />
                            QR Kodunu İndir
                        </a>

                        <button
                            onClick={() => navigate('/deneme-okut/denemeler')}
                            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 w-full py-3 font-medium"
                        >
                            Listeye Dön
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => navigate('/deneme-okut/denemeler')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Geri
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Deneme Oluştur</h1>
                    <p className="text-gray-600">Deneme sınavı oluşturun ve optik form şablonunu seçin.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="space-y-6">

                        {/* Error Banner */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Deneme Adı</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Örn: 8. Sınıf LGS Deneme 1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        {/* Template Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Optik Form Şablonu</label>

                            {templates.length === 0 ? (
                                <div className="text-gray-500 italic text-sm">Şablonlar yükleniyor...</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {templates.map(t => (
                                        <div
                                            key={t.templateId}
                                            onClick={() => setSelectedTemplateId(t.templateId)}
                                            className={`
                                                relative cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-1
                                                ${selectedTemplateId === t.templateId
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="font-bold text-gray-900">{t.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">{t.questionCount} Soru</span>
                                                <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">{t.layout.columns} Sütun</span>
                                                <span>{t.choices.length} Seçenek</span>
                                            </div>

                                            {selectedTemplateId === t.templateId && (
                                                <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Actions */}
                        <div className="flex gap-4 pt-6 border-t border-gray-100 mt-6">
                            <button
                                onClick={() => navigate('/deneme-okut/denemeler')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <QrCode className="w-4 h-4 animate-pulse" />}
                                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
