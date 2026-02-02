import React, { useState, useEffect, useCallback, useMemo } from 'react'
import GeneralInfoStep from '../../components/GeneralInfoStep'
import SetupAndGradesStep from '../../components/SetupAndGradesStep'
import AnalysisDashboard from '../../components/AnalysisDashboard'
import WelcomeModal from '../../components/WelcomeModal'
import { Button } from '../../components/ui/Button'
import { RotateCcw, ChevronLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    loadProfileMeta,
    loadProjectMeta,
    saveProfile,
    saveProjectState,
    clearProjectState,
    loadWelcomeFlag,
} from '../../storage'

// Varsayılan config
const DEFAULT_CONFIG = {
    city: '',
    district: '',
    schoolLevel: 'ortaokul',
    schoolName: '',
    principalName: '',
    courseName: '',
    teacherName: '',
    gradeLevel: '',
    classSection: '',
    examName: '',
    examDate: '',
    semester: '1. Dönem',
    examNumber: '1. Sınav',
    academicYear: '2025-2026',
    successThreshold: 50,
    outcomeCount: 0,
    outcomes: [],
    outcomeScores: [],
}

const PROFILE_DEFAULT = {
    il: '',
    ilce: '',
    okulAdi: '',
    sinifAdi: '',
    dersAdi: '',
    sinavAdi: '',
    examDate: '',
    ogretmenAdi: '',
    mudurAdi: '',
}

const toSafeString = (value) => (typeof value === 'string' ? value : '')

const normalizeProfile = (profile) => ({
    il: toSafeString(profile?.il),
    ilce: toSafeString(profile?.ilce),
    okulAdi: toSafeString(profile?.okulAdi),
    sinifAdi: toSafeString(profile?.sinifAdi),
    dersAdi: toSafeString(profile?.dersAdi),
    sinavAdi: toSafeString(profile?.sinavAdi),
    examDate: toSafeString(profile?.examDate),
    ogretmenAdi: toSafeString(profile?.ogretmenAdi),
    mudurAdi: toSafeString(profile?.mudurAdi),
})

const mapProfileToConfig = (profile) => ({
    city: profile.il,
    district: profile.ilce,
    schoolName: profile.okulAdi,
    gradeLevel: profile.sinifAdi,
    courseName: profile.dersAdi,
    examName: profile.sinavAdi,
    examDate: profile.examDate,
    teacherName: profile.ogretmenAdi,
    principalName: profile.mudurAdi,
})

function ExamAnalysis() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [config, setConfig] = useState(() => ({
        ...DEFAULT_CONFIG,
        ...mapProfileToConfig(PROFILE_DEFAULT),
    }))
    const [questions, setQuestions] = useState([])
    const [students, setStudents] = useState([])
    const [grades, setGrades] = useState({})
    const [bannerMessage, setBannerMessage] = useState('')

    // Welcome Modal - sadece ilk açılışta göster
    const [showWelcome, setShowWelcome] = useState(() => {
        return !loadWelcomeFlag()
    })

    useEffect(() => {
        const profileMeta = loadProfileMeta()
        const projectMeta = loadProjectMeta()

        console.log('storage meta', {
            profileError: profileMeta.hadError,
            projectError: projectMeta.hadError,
        })

        if (profileMeta.hadError || projectMeta.hadError) {
            setBannerMessage('Kayıt geri yüklenemedi, yeni oturum başlatıldı.')
            const timer = setTimeout(() => setBannerMessage(''), 5000)
            return () => clearTimeout(timer)
        }

        const safeProfile = normalizeProfile(profileMeta.data || PROFILE_DEFAULT)
        const projectState = projectMeta.data || null

        if (projectState && projectState.config) {
            setConfig({
                ...DEFAULT_CONFIG,
                ...mapProfileToConfig(safeProfile),
                ...projectState.config,
            })
            setQuestions(projectState.questions || [])
            setStudents(projectState.students || [])
            setGrades(projectState.grades || {})
            setCurrentStep(projectState.currentStep || 1)
            return undefined
        }

        setConfig({
            ...DEFAULT_CONFIG,
            ...mapProfileToConfig(safeProfile),
        })
        setQuestions([])
        setStudents([])
        setGrades({})
        setCurrentStep(1)

        return undefined
    }, [])

    // Sayfa kapatıldığında tüm verileri temizle
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Not: Artık router içindeyiz, bu logic sayfa yenilemede çalışır
            clearProjectState()
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [])

    const profileData = useMemo(() => ({
        il: toSafeString(config.city),
        ilce: toSafeString(config.district),
        okulAdi: toSafeString(config.schoolName),
        sinifAdi: toSafeString(config.gradeLevel),
        dersAdi: toSafeString(config.courseName),
        sinavAdi: toSafeString(config.examName),
        examDate: toSafeString(config.examDate),
        ogretmenAdi: toSafeString(config.teacherName),
        mudurAdi: toSafeString(config.principalName),
    }), [
        config.city,
        config.district,
        config.schoolName,
        config.gradeLevel,
        config.courseName,
        config.examName,
        config.examDate,
        config.teacherName,
        config.principalName,
    ])

    // localStorage'a kaydet (500ms debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            const projectSaved = saveProjectState({
                currentStep,
                config,
                questions,
                students,
                grades,
            })
            if (!projectSaved) {
                setBannerMessage((prev) => prev || 'Tarayıcı kaydetmeye izin vermedi.')
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [currentStep, config, questions, students, grades])

    useEffect(() => {
        const timer = setTimeout(() => {
            const profileSaved = saveProfile(profileData)
            if (!profileSaved) {
                setBannerMessage((prev) => prev || 'Tarayıcı kaydetmeye izin vermedi.')
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [profileData])

    const handleConfigChange = useCallback((updates) => {
        setConfig((prev) => ({ ...prev, ...updates }))
    }, [])

    const handleGradesChange = useCallback((newGrades) => {
        setGrades(newGrades)
    }, [])

    const handleEditGrades = useCallback(() => {
        setCurrentStep(2)
    }, [])

    // Yeni analiz - tüm veriyi sıfırla
    const handleNewAnalysis = useCallback(() => {
        const latestProfileMeta = loadProfileMeta()
        const latestProfile = normalizeProfile(latestProfileMeta.data || PROFILE_DEFAULT)
        setConfig({ ...DEFAULT_CONFIG, ...mapProfileToConfig(latestProfile) })
        setQuestions([])
        setStudents([])
        setGrades({})
        setCurrentStep(1)
        clearProjectState()
    }, [])

    // Geri gitme fonksiyonu
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }, [currentStep])

    const steps = [
        { number: 1, title: 'Genel Bilgiler' },
        { number: 2, title: 'Sınav Kurulumu & Not Girişi' },
        { number: 3, title: 'Analiz & Rapor' },
    ]

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {bannerMessage && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 flex items-center justify-between">
                    <span>{bannerMessage}</span>
                    <button
                        type="button"
                        onClick={() => setBannerMessage('')}
                        className="text-amber-700 hover:text-amber-900 text-xs font-medium"
                    >
                        Kapat
                    </button>
                </div>
            )}

            {/* Welcome Modal - Sadece ilk açılışta ve sınav modülünde */}
            {showWelcome && (
                <WelcomeModal onClose={() => setShowWelcome(false)} />
            )}

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 no-print sticky top-0 z-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14">

                        {/* Sol: Geri Butonu + Logo */}
                        <div className="flex items-center gap-3">
                            {/* Ana Sayfaya Dönüş */}
                            <Button
                                onClick={() => navigate('/')}
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
                                title="Ana Sayfaya Dön"
                            >
                                <Home className="w-5 h-5" />
                            </Button>

                            {/* Step Geri Butonu */}
                            {currentStep > 1 && (
                                <Button
                                    onClick={handleBack}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="hidden sm:inline ml-1">Geri</span>
                                </Button>
                            )}

                            {/* Logo */}
                            <h1
                                className="text-lg font-bold text-gray-900 tracking-tight cursor-pointer"
                                onClick={() => currentStep > 1 && setCurrentStep(1)}
                            >
                                Sınav Analiz
                            </h1>
                        </div>

                        {/* Orta: Step Indicator */}
                        <nav className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1">
                            {steps.map((step) => (
                                <button
                                    key={step.number}
                                    onClick={() => step.number <= currentStep && setCurrentStep(step.number)}
                                    disabled={step.number > currentStep}
                                    className={`px-4 py-1.5 text-sm rounded-full transition-all ${currentStep === step.number
                                        ? 'bg-white text-gray-900 font-medium shadow-sm'
                                        : step.number < currentStep
                                            ? 'text-gray-600 hover:text-gray-900'
                                            : 'text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {step.title}
                                </button>
                            ))}
                        </nav>

                        {/* Sağ: Yeni Analiz */}
                        {currentStep > 1 ? (
                            <Button
                                onClick={() => {
                                    if (window.confirm('Tüm veriler silinecek ve yeni bir sınav başlatılacak. Devam etmek istiyor musunuz?')) {
                                        handleNewAnalysis()
                                    }
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50"
                            >
                                <RotateCcw className="w-4 h-4 mr-1.5" />
                                <span className="hidden sm:inline">Yeni Sınav</span>
                            </Button>
                        ) : (
                            <div className="w-24" /> // Placeholder for alignment
                        )}
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 no-print">
                <div
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
            </div>

            {/* Mobile Step Info */}
            <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 no-print">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Adım {currentStep} / {steps.length}</span>
                    <span className="font-medium text-gray-900">{steps[currentStep - 1].title}</span>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1">
                <div className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
                    {currentStep === 1 && (
                        <GeneralInfoStep
                            config={config}
                            onConfigChange={handleConfigChange}
                            onNext={() => setCurrentStep(2)}
                        />
                    )}

                    {currentStep === 2 && (
                        <SetupAndGradesStep
                            config={config}
                            questions={questions}
                            onQuestionsChange={setQuestions}
                            students={students}
                            onStudentsChange={setStudents}
                            grades={grades}
                            onBack={handleBack}
                            onConfigChange={handleConfigChange}
                            onGradesChange={handleGradesChange}
                            onNext={() => setCurrentStep(3)}
                        />
                    )}

                    {currentStep === 3 && (
                        <AnalysisDashboard
                            config={config}
                            questions={questions}
                            students={students}
                            grades={grades}
                            onBack={handleBack}
                            onEditGrades={handleEditGrades}
                            onNewAnalysis={handleNewAnalysis}
                        />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 no-print">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-gray-400">
                            © 2026 BiSınıf · Tüm hakları saklıdır
                        </p>
                        <p className="text-[10px] text-gray-300">
                            Designed by MRK Design
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default ExamAnalysis
