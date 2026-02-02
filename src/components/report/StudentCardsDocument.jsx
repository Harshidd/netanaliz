// src/components/report/StudentCardsDocument.jsx
// Öğrenci karneleri - Sitedeki tasarıma uygun kompakt versiyon

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import './fonts'; // Roboto font kaydı
import {
    sortStudentsByNo,
    toNum,
    safeText,
    getStudentNo,
    getStudentName,
    statusText,
    statusColor,
    formatDate
} from "./pdfUtils";

// ============================================
// STİLLER - Kompakt ve Şık
// ============================================

const colors = {
    primary: "#2563EB",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#F59E0B",
    muted: "#4B5563",
    border: "#E5E7EB",
    bg: "#F9FAFB",
    bgAlt: "#F3F4F6",
    text: "#111827"
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Roboto",
        color: colors.text,
        backgroundColor: "#FFFFFF"
    },

    // Header Banner
    headerBanner: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    studentName: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
    studentNo: { fontSize: 10, color: "#FFFFFF", opacity: 0.9, marginTop: 4 },
    durumBadge: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6
    },
    durumText: { fontSize: 11, fontWeight: "bold" },

    // Stats Row
    statBox: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        justifyContent: "center"
    },
    statLabel: { fontSize: 8, color: colors.muted, marginTop: 4 },
    statValue: { fontSize: 16, fontWeight: "bold", color: colors.text },

    // Section
    section: { marginBottom: 16 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.border
    },

    // Table
    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    th: { fontSize: 9, fontWeight: "bold", padding: 6, color: colors.text },
    tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.border },
    tableRowAlt: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.border, backgroundColor: colors.bgAlt },
    td: { fontSize: 9, padding: 6 },

    // Question Grid
    questionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    questionBox: {
        width: "9%",
        padding: 6,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        alignItems: "center",
        backgroundColor: "#FFFFFF"
    },
    questionNo: { fontSize: 7, color: colors.muted },
    questionScore: { fontSize: 10, fontWeight: "bold" },

    // Comment Box
    commentBox: {
        marginTop: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.success,
        borderRadius: 6,
        backgroundColor: colors.success + "10"
    },

    // Footer
    footer: {
        position: "absolute",
        left: 30,
        right: 30,
        bottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: colors.border
    },
    footerText: { fontSize: 8, color: colors.muted }
});

// ============================================
// DİKEY BAR CHART BİLEŞENİ (Sitedeki gibi)
// ============================================
const VerticalBarChart = ({ data, threshold }) => {
    // Max 100 puan üzerinden
    const height = 100;
    const barWidth = 12;
    const gap = 8;
    // Her grup için genişlik: (2 bar + 1 boşluk)
    const groupWidth = (barWidth * 2) + gap + 15;

    return (
        <View style={{ height: height + 30, flexDirection: "row", alignItems: "flex-end", paddingBottom: 20 }}>
            {/* Y Ekseni Çizgisi */}
            <View style={{ position: "absolute", left: 0, top: 0, bottom: 20, width: 1, backgroundColor: colors.border }} />
            {/* Alt Çizgi */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 20, height: 1, backgroundColor: colors.border }} />

            {/* Kılavuz Çizgileri (0, 50, 100) */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 20, height: 1, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: "dashed" }} />
            <Text style={{ position: "absolute", left: -15, bottom: 16, fontSize: 6, color: colors.muted }}>0</Text>

            <View style={{ position: "absolute", left: 0, right: 0, bottom: 20 + (height / 2), height: 1, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: "dashed", opacity: 0.5 }} />
            <Text style={{ position: "absolute", left: -15, bottom: 16 + (height / 2), fontSize: 6, color: colors.muted }}>50</Text>

            <View style={{ position: "absolute", left: 0, right: 0, bottom: 20 + height, height: 1, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: "dashed", opacity: 0.5 }} />
            <Text style={{ position: "absolute", left: -15, bottom: 16 + height, fontSize: 6, color: colors.muted }}>100</Text>

            {data.slice(0, 8).map((d, i) => {
                const studentH = (d.studentScore / 100) * height; // Yüzdelik bazda
                const classH = (d.classScore / 100) * height;

                const studentColor = d.studentScore >= threshold ? colors.success : colors.danger;
                const classColor = colors.success; // Sınıf ortalaması genelde yeşil tonu (sitedeki gibi)

                return (
                    <View key={i} style={{ width: groupWidth, alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                        {/* Barlar Yan Yana */}
                        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
                            {/* Öğrenci Barı */}
                            <View style={{ width: barWidth, height: studentH, backgroundColor: studentColor, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                            {/* Sınıf Barı */}
                            <View style={{ width: barWidth, height: classH, backgroundColor: "#10B981", opacity: 0.8, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                        </View>
                        {/* Etiket */}
                        <Text style={{ fontSize: 7, color: colors.muted, marginTop: 4 }}>K{i + 1}</Text>
                    </View>
                );
            })}
        </View>
    );
};

// ============================================
// TEK ÖĞRENCİ KARNESİ - Kompakt (Sitedeki gibi)
// ============================================

const StudentCardPage = ({ student, config, analysis, index, total }) => {
    const threshold = toNum(config?.generalPassingScore ?? config?.passScore ?? 50);
    const outcomeMasteryThreshold = toNum(config?.outcomeMasteryThreshold, 50);
    const configOutcomes = Array.isArray(config?.outcomes) ? config.outcomes : [];

    const studentTotal = toNum(student?.total ?? student?.score ?? student?.puan, 0);
    const durum = statusText(studentTotal, threshold);
    const durumColor = statusColor(studentTotal, threshold);

    // Outcome data
    const outcomeData = Array.isArray(student?.outcomeData) ? student.outcomeData : [];

    // Question scores
    const questionScores = Array.isArray(student?.questionScores) ? student.questionScores : [];

    // Sınıf ortalaması ve sıralama
    const allStudents = analysis?.studentResults ?? [];
    const sortedByScore = [...allStudents].sort((a, b) => toNum(b?.total, 0) - toNum(a?.total, 0));
    const rank = sortedByScore.findIndex(s => getStudentNo(s) === getStudentNo(student)) + 1;

    // Grafik Verisi Hazırla (İlk 8 kazanım/soru için)
    const chartData = outcomeData.map((o, i) => ({
        studentScore: toNum(o?.pct, 0),
        classScore: toNum(analysis?.outcomes?.[i]?.avgPct ?? 50, 0),
        label: `K${i + 1}`
    }));

    return (
        <Page size="A4" style={styles.page}>
            {/* Header Banner */}
            <View style={styles.headerBanner}>
                <View>
                    <Text style={styles.studentName}>{getStudentName(student)}</Text>
                    <Text style={styles.studentNo}>No: {getStudentNo(student)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 9, color: "#FFFFFF", opacity: 0.9, marginBottom: 2 }}>DURUM</Text>
                    <View style={[styles.durumBadge, { backgroundColor: durumColor }]}>
                        <Text style={[styles.durumText, { color: "#FFFFFF" }]}>{durum}</Text>
                    </View>
                </View>
            </View>

            {/* Puan Durumu + Chart - Yan yana */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
                {/* Sol: Puan & Yorum */}
                <View style={{ width: "35%" }}>
                    <Text style={styles.sectionTitle}>Puan Durumu</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: durumColor, fontSize: 24 }]}>{studentTotal.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Toplam Puan</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { fontSize: 20 }]}>{rank}.</Text>
                            <Text style={styles.statLabel}>Sınıf Sırası ({allStudents.length})</Text>
                        </View>
                    </View>

                    {/* Öğretmen Görüşü */}
                    <View style={[styles.commentBox, { marginTop: 12, borderColor: durumColor, backgroundColor: durumColor + "10" }]}>
                        <Text style={{ fontSize: 9, color: colors.text, fontStyle: "italic", lineHeight: 1.4 }}>
                            {studentTotal >= threshold
                                ? "\"Başarılı bir performans sergilenmiştir. Çalışmalarına devam etmesi önerilir.\""
                                : "\"Genel başarınızı artırmanız önerilir. Eksik kazanımlar için telafi çalışması yapılmalıdır.\""
                            }
                        </Text>
                    </View>
                </View>

                {/* Sağ: Chart */}
                <View style={{ flex: 1, paddingLeft: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <Text style={styles.sectionTitle}>Kazanım Karşılaştırması</Text>
                        {/* Legend */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <View style={{ width: 8, height: 8, backgroundColor: durumColor, borderRadius: 2 }} />
                                <Text style={{ fontSize: 8, color: colors.muted }}>Öğrenci</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <View style={{ width: 8, height: 8, backgroundColor: "#10B981", borderRadius: 2 }} />
                                <Text style={{ fontSize: 8, color: colors.muted }}>Sınıf Ort.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Vertical Bar Chart */}
                    <VerticalBarChart data={chartData} threshold={threshold} />
                </View>
            </View>

            {/* Detaylı Kazanım Performansı Tablosu */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detaylı Kazanım Performansı</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { width: "40%" }]}>Kazanım</Text>
                        <Text style={[styles.th, { width: "20%", textAlign: "center" }]}>Puan</Text>
                        <Text style={[styles.th, { width: "20%", textAlign: "center" }]}>Başarı %</Text>
                        <Text style={[styles.th, { width: "20%", textAlign: "center" }]}>Durum</Text>
                    </View>
                    {outcomeData.slice(0, 10).map((o, i) => {
                        const title = configOutcomes[i] || o?.title || `Kazanım ${i + 1}`;
                        const pct = toNum(o?.pct, 0);
                        const myScore = toNum(o?.myScore, 0);
                        const outcomeMax = toNum(o?.outcomeMax, 1);
                        const barColor = pct >= outcomeMasteryThreshold ? colors.success : colors.danger;
                        const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt;

                        return (
                            <View key={`oc-${i}`} style={rowStyle}>
                                <Text style={[styles.td, { width: "40%" }]}>
                                    <Text style={{ color: colors.muted }}>K{i + 1} </Text>
                                    {title.length > 35 ? title.slice(0, 35) + "..." : title}
                                </Text>
                                <Text style={[styles.td, { width: "20%", textAlign: "center" }]}>
                                    {myScore.toFixed(1)} / {outcomeMax}
                                </Text>
                                <Text style={[styles.td, { width: "20%", textAlign: "center", fontWeight: "bold", color: barColor }]}>
                                    %{pct.toFixed(0)}
                                </Text>
                                <Text style={[styles.td, { width: "20%", textAlign: "center", color: barColor, fontWeight: "bold" }]}>
                                    {pct >= outcomeMasteryThreshold ? "Başarılı" : "Geliştirilmeli"}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Soru Bazlı Performans (Kompakt Grid) */}
            {questionScores.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Soru Bazlı Performans</Text>
                    <View style={styles.questionGrid}>
                        {questionScores.slice(0, 20).map((q, i) => {
                            const score = toNum(q?.score ?? q?.earned ?? q, 0);
                            const max = toNum(q?.max ?? q?.maxScore ?? 10, 10);
                            const pct = max > 0 ? (score / max) * 100 : 0;
                            const boxColor = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger;
                            return (
                                <View key={`qs-${i}`} style={[styles.questionBox, { borderColor: boxColor }]}>
                                    <Text style={styles.questionNo}>S{q?.qNo ?? i + 1}</Text>
                                    <Text style={[styles.questionScore, { color: boxColor }]}>{score}/{max}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text style={styles.footerText}>{safeText(config?.schoolName, "BiSınıf")} • {safeText(config?.className)}</Text>
                <Text style={styles.footerText}>Sayfa {index + 1} / {total}</Text>
            </View>
        </Page>
    );
};

// ============================================
// ANA DOKÜMAN
// ============================================

export default function StudentCardsDocument({ analysis, config, students }) {
    const studentList = sortStudentsByNo(students ?? analysis?.studentResults ?? []);
    const total = studentList.length;

    if (total === 0) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: colors.muted, fontSize: 14 }}>Öğrenci verisi bulunamadı.</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            {studentList.map((student, idx) => (
                <StudentCardPage
                    key={`scp-${idx}`}
                    student={student}
                    config={config}
                    analysis={analysis}
                    index={idx}
                    total={total}
                />
            ))}
        </Document>
    );
}
