// src/components/report/pdfExport.js
// PDF export fonksiyonları: blob üret + download

import React from "react";
import { pdf, Document } from "@react-pdf/renderer";
import FullReportDocument, { ClassListPages, OutcomeSuccessPage, RemedialPage, SummaryAndAnalysisPage, ItemAnalysisPage } from "./FullReportDocument";
import StudentCardsDocument from "./StudentCardsDocument";

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

const getDateStamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

// ============================================
// EXPORT FONKSİYONLARI
// ============================================

/**
 * TAM ANALİZ RAPORU
 * Sayfa 1: Özet + Analiz
 * Sayfa 2-3: Tam Öğrenci Listesi
 * Sayfa 4: Telafi Listesi
 * Sayfa 5+: Öğrenci Karneleri (2/sayfa)
 */
export const exportFullReportPDF = async ({ analysis, config, questions }) => {
    const doc = React.createElement(FullReportDocument, { analysis, config, questions });
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_TamRapor_${getDateStamp()}.pdf`);
};

/**
 * SADECE ÖĞRENCİ KARNELERİ
 * Her öğrenci 1 tam sayfa (detaylı)
 */
export const exportStudentCardsPDF = async ({ analysis, config, students }) => {
    const doc = React.createElement(StudentCardsDocument, { analysis, config, students });
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_Karneler_${getDateStamp()}.pdf`);
};

/**
 * TEK ÖĞRENCİ KARNESİ
 * 1 öğrenci için detaylı karne
 */
export const exportSingleStudentPDF = async ({ analysis, config, student }) => {
    const doc = React.createElement(StudentCardsDocument, {
        analysis,
        config,
        students: [student]
    });
    const blob = await pdf(doc).toBlob();
    const studentName = student?.name || student?.fullName || 'Ogrenci';
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
    downloadBlob(blob, `BiSınıf_Karne_${safeName}_${getDateStamp()}.pdf`);
};

// ============================================
// BÖLÜM BAZLI EXPORT FONKSİYONLARI
// ============================================

/**
 * SINIF LİSTESİ PDF
 */
export const exportClassListPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Sınıf Listesi - ${config?.className}`}>
            <ClassListPages analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_SinifListesi_${getDateStamp()}.pdf`);
};

/**
 * KAZANIM ANALİZİ PDF (Grafik + Liste)
 */
export const exportOutcomeAnalysisPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Kazanım Analizi - ${config?.className}`}>
            <OutcomeSuccessPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_KazanimAnalizi_${getDateStamp()}.pdf`);
};

/**
 * SADECE TELAFİ LİSTESİ PDF
 */
export const exportRemedialListPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Telafi Listesi - ${config?.className}`}>
            <RemedialPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_TelafiListesi_${getDateStamp()}.pdf`);
};

/**
 * SORU ANALİZİ PDF (Detaylı Liste)
 */
export const exportItemAnalysisPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Soru Analizi - ${config?.className}`}>
            <ItemAnalysisPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_SoruAnalizi_${getDateStamp()}.pdf`);
};

/**
 * ÖZET DURUM PDF (Soru Analizi Dahil)
 */
export const exportSummaryPDF = async ({ analysis, config, questions }) => {
    const doc = (
        <Document title={`Özet Rapor - ${config?.className}`}>
            <SummaryAndAnalysisPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, `BiSınıf_OzetRapor_${getDateStamp()}.pdf`);
};
