import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register Custom Font with TR Support (Roboto)
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Bold.ttf', fontWeight: 'bold' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 'medium' }
    ]
})

// === THEME CONFIG ===
const THEME = {
    primary: '#2563EB',      // Rich Blue
    accentLight: '#DBEAFE',  // Very Light Blue
    accentSoft: '#BFDBFE',   // Soft Blue
    warnLight: '#FEF2F2',
    warnBorder: '#FCA5A5',
    lockLight: '#FFFBEB',
    lockBorder: '#FDE68A',
    textDark: '#1E293B',
    textLight: '#64748B'
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Roboto',
        backgroundColor: '#FFFFFF'
    },
    // --- Layout 1: Scene Plan (Full Scale) ---
    sceneHeader: {
        position: 'absolute',
        top: 20,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    sceneTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    sceneDate: {
        fontSize: 9,
        color: '#94A3B8'
    },

    // A large container for the classroom "scene"
    sceneContainer: {
        marginTop: 50,
        flex: 1,
        paddingHorizontal: 30,
        paddingBottom: 40,
        alignItems: 'center',
        // 'justifyContent' is dynamic based on density
    },

    // Scene Elements
    boardBar: {
        width: '60%',
        height: 12,
        backgroundColor: THEME.primary,
        borderRadius: 6,
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    boardLabel: {
        color: '#FFF',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    teacherDesk: {
        width: 100,
        height: 40,
        backgroundColor: THEME.accentLight,
        border: `1pt solid ${THEME.accentSoft}`,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20 // Dynamic spacing could be applied here
    },
    teacherLabel: {
        fontSize: 7,
        color: THEME.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    door: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 40,
        height: 6,
        backgroundColor: '#CBD5E1',
        borderRadius: 2
    },
    doorLabel: {
        position: 'absolute',
        bottom: 38,
        right: 35,
        fontSize: 7,
        color: '#94A3B8',
        textTransform: 'uppercase'
    },

    // Grid Scaling handled inline
    row: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    // Desk Visuals Base
    deskBox: {
        backgroundColor: '#FFFFFF',
        border: '1pt solid #E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
        borderBottomWidth: 3, // Thicker bottom for 3D effect
        borderBottomColor: '#CBD5E1'
    },
    deskDouble: { flexDirection: 'row' },

    seat: {
        width: '50%', // Relative to desk box
        height: '100%',
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    seatLeftBorder: { borderRight: '1pt solid #F1F5F9' },

    // Seat States (Backgrounds & Accents)
    bgEmpty: { backgroundColor: '#F8FAFC' },
    bgNormal: { backgroundColor: '#FFFFFF' },
    bgSpecial: { backgroundColor: THEME.accentLight },
    bgPinned: { backgroundColor: THEME.lockLight },

    // Accent Strips
    accentStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4
    },
    stripNormal: { backgroundColor: '#E2E8F0' },
    stripSpecial: { backgroundColor: THEME.primary },
    stripPinned: { backgroundColor: '#F59E0B' },
    stripWarn: { backgroundColor: '#EF4444' },

    studentName: {
        fontWeight: 'bold',
        color: THEME.textDark,
        textAlign: 'center',
        lineHeight: 1.1,
        marginTop: 2
    },
    studentNo: {
        color: '#94A3B8',
        position: 'absolute',
        top: 4,
        right: 5
    },

    // Legend
    legendBar: {
        position: 'absolute',
        bottom: 20,
        right: 30,
        flexDirection: 'row',
        gap: 12
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 6, height: 6, borderRadius: 3 },
    legendLabel: { fontSize: 7, color: '#64748B' },


    // --- Layout 2: Report Theme ---
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingTop: 40,
        marginBottom: 20
    },
    reportTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textDark },
    reportSub: { fontSize: 10, color: THEME.primary, fontWeight: 'bold' },

    sectionBox: {
        marginHorizontal: 40,
        marginBottom: 16,
        padding: 15,
        borderRadius: 8,
        border: '1pt solid #E2E8F0',
        backgroundColor: '#FFFFFF'
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderBottom: `1pt solid ${THEME.accentLight}`,
        paddingBottom: 6
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 6
    },
    bulletText: { fontSize: 10, color: '#334155', lineHeight: 1.6, marginBottom: 2 },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    kpiCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginHorizontal: 4
    },
    kpiVal: { fontSize: 16, fontWeight: 'bold', color: THEME.textDark },
    kpiLabel: { fontSize: 7, color: '#64748B', marginTop: 2, textTransform: 'uppercase' },

    warningBox: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        marginHorizontal: 40,
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        marginTop: 10
    },

    compactFooter: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1pt solid #E2E8F0',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    metaText: { fontSize: 7, color: '#94A3B8' }
})

// --- Components ---

const Seat = ({ student, isPinned, isDouble, side, isViolation, fontSize, noFontSize }) => {
    const containerStyle = [styles.seat]
    // Width is handled by flex in parent desk, but we need to ensure styling correct
    if (isDouble) {
        containerStyle.push({ width: '50%' })
    } else {
        containerStyle.push({ width: '100%' })
    }

    if (isDouble && side === 'left') containerStyle.push(styles.seatLeftBorder)

    if (!student) {
        containerStyle.push(styles.bgEmpty)
        return <View style={containerStyle} />
    }

    if (isPinned) containerStyle.push(styles.bgPinned)
    else if (student._profile?.specialNeeds) containerStyle.push(styles.bgSpecial)
    else containerStyle.push(styles.bgNormal)

    // Accent Strip
    let stripStyle = styles.stripNormal
    if (isViolation) stripStyle = styles.stripWarn
    else if (isPinned) stripStyle = styles.stripPinned
    else if (student._profile?.specialNeeds) stripStyle = styles.stripSpecial

    return (
        <View style={containerStyle}>
            <View style={[styles.accentStrip, stripStyle]} />
            <Text style={[styles.studentNo, { fontSize: noFontSize }]}>
                {student.schoolNo || student.no || ''}
            </Text>
            <Text
                style={[styles.studentName, { fontSize: fontSize }]}
                maxLines={2}
            >
                {student.name}
            </Text>
        </View>
    )
}

const SceneGrid = ({ setup, assignments, students, violations, pinnedSeats }) => {
    const rows = Array.from({ length: setup.rows }, (_, i) => i + 1)
    const cols = Array.from({ length: setup.cols }, (_, i) => i + 1)

    const studentMap = new Map(students.map(s => [s.id, s]))
    const violationSet = new Set(violations.map(v => v.seatId))

    // === DYNAMIC SCALING CALCULATION ===
    // Available Space (Approximation for A4 Landscape with padding)
    const AVAIL_WIDTH = 750
    const AVAIL_HEIGHT = 400 // Reduced slightly to account for headers/teacher desk

    // Base limits
    const MIN_DESK_W = 90
    const MAX_DESK_W = 180
    const MIN_DESK_H = 60
    const MAX_DESK_H = 110

    // Gaps
    const GAP_X = 15
    const GAP_Y = 15

    // Config
    const isDouble = setup.deskType === 'double'

    // Calculate raw dimensions
    let calcW = (AVAIL_WIDTH - (cols.length * GAP_X)) / cols.length
    let calcH = (AVAIL_HEIGHT - (rows.length * GAP_Y)) / rows.length

    // Double desk needs double width if we treat col as desk unit? 
    // Usually 'cols' implies desk columns. If deskType is double, the desk gets wider.
    // Let's assume calculated 'calcW' is for the DESK UNIT itself.
    // If it's too wide, clamping kicks in.

    // Clamping
    const finalW = Math.min(Math.max(calcW, MIN_DESK_W), MAX_DESK_W)
    const finalH = Math.min(Math.max(calcH, MIN_DESK_H), MAX_DESK_H)

    // Calculate dynamic Font Sizes relative to Desk Height
    const fontSizeName = Math.max(10, Math.min(14, finalH * 0.2))
    const fontSizeNo = Math.max(7, Math.min(9, finalH * 0.15))

    // Vertical Justification Strategy
    // If total height is small relative to page, center vertically. 
    // If it fills page, start from top.
    const totalContentHeight = rows.length * (finalH + GAP_Y)
    const justifyMethod = totalContentHeight < 300 ? 'center' : 'flex-start'

    return (
        <View style={[styles.sceneContainer, { justifyContent: justifyMethod }]}>
            <View style={styles.boardBar}>
                <Text style={styles.boardLabel}>TAHTA</Text>
            </View>
            <View style={styles.teacherDesk}>
                <Text style={styles.teacherLabel}>Öğretmen Masası</Text>
            </View>

            {rows.map(r => (
                <View key={r} style={[styles.row, { marginBottom: GAP_Y }]}>
                    {cols.map(c => {
                        const leftId = `R${r}-C${c}-L`
                        const rightId = `R${r}-C${c}-R`
                        const singleId = `R${r}-C${c}`

                        if (isDouble) {
                            return (
                                <View key={c} style={[styles.deskBox, styles.deskDouble, { width: finalW, height: finalH, marginHorizontal: GAP_X / 2 }]}>
                                    <Seat
                                        student={studentMap.get(assignments[leftId])}
                                        isPinned={pinnedSeats.includes(leftId)}
                                        isViolation={violationSet.has(leftId)}
                                        isDouble={true} side="left"
                                        fontSize={fontSizeName}
                                        noFontSize={fontSizeNo}
                                    />
                                    <Seat
                                        student={studentMap.get(assignments[rightId])}
                                        isPinned={pinnedSeats.includes(rightId)}
                                        isViolation={violationSet.has(rightId)}
                                        isDouble={true} side="right"
                                        fontSize={fontSizeName}
                                        noFontSize={fontSizeNo}
                                    />
                                </View>
                            )
                        } else {
                            return (
                                <View key={c} style={[styles.deskBox, styles.deskSingle, { width: finalW, height: finalH, marginHorizontal: GAP_X / 2 }]}>
                                    <Seat
                                        student={studentMap.get(assignments[singleId])}
                                        isPinned={pinnedSeats.includes(singleId)}
                                        isViolation={violationSet.has(singleId)}
                                        isDouble={false}
                                        fontSize={fontSizeName}
                                        noFontSize={fontSizeNo}
                                    />
                                </View>
                            )
                        }
                    })}
                </View>
            ))}
            <View style={styles.door} />
            <Text style={styles.doorLabel}>KAPI</Text>
        </View>
    )
}

export const ClassSeatingPDF = ({ setup, assignments, students, reportData, violations }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.sceneHeader}>
                <Text style={styles.sceneTitle}>BiSınıf | {reportData.displayTitle}</Text>
                <Text style={styles.sceneDate}>{reportData.generatedAt}</Text>
            </View>
            <SceneGrid
                setup={setup}
                assignments={assignments}
                students={students}
                violations={violations}
                pinnedSeats={assignments.pinnedSeatIds || []}
            />
            <View style={styles.legendBar}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: THEME.primary }]} />
                    <Text style={styles.legendLabel}>Özel Durum</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendLabel}>Kilitli</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendLabel}>Uyarı</Text>
                </View>
            </View>
        </Page>

        <Page size="A4" style={styles.page}>
            <View style={styles.reportHeader}>
                <View>
                    <Text style={styles.reportTitle}>{reportData.displayTitle}</Text>
                    <Text style={{ fontSize: 9, color: '#94A3B8' }}>Pedagojik Gerekçe ve Analiz Raporu</Text>
                </View>
                <Text style={styles.reportSub}>BiSınıf v2.5</Text>
            </View>
            <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.primary }} />
                    <Text style={styles.sectionTitle}>Amaç ve Kapsam</Text>
                </View>
                <Text style={styles.bulletText}>{reportData.purpose}</Text>
            </View>
            <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.primary }} />
                    <Text style={styles.sectionTitle}>Uygulanan Kriterler</Text>
                </View>
                {reportData.criteria.map((c, i) => (
                    <Text key={i} style={styles.bulletText}>• {c}</Text>
                ))}
            </View>
            <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.primary }} />
                    <Text style={styles.sectionTitle}>Oluşturma Özeti</Text>
                </View>
                <View style={styles.kpiRow}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiVal}>{students.length}</Text>
                        <Text style={styles.kpiLabel}>Öğrenci</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiVal}>{Object.values(assignments).filter(Boolean).length}</Text>
                        <Text style={styles.kpiLabel}>Yerleşen</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={[styles.kpiVal, { color: violations.length ? '#DC2626' : '#16A34A' }]}>{violations.length}</Text>
                        <Text style={styles.kpiLabel}>Manuel Uyarı</Text>
                    </View>
                </View>
            </View>
            {violations.length > 0 && (
                <View style={styles.warningBox}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#B91C1C', marginBottom: 5 }}>⚠️ Dikkat Edilmesi Gereken Hususlar</Text>
                    {violations.map((v, i) => (
                        <Text key={i} style={{ fontSize: 9, color: '#991B1B', marginBottom: 2 }}>• {v.message}</Text>
                    ))}
                </View>
            )}
            <View style={styles.compactFooter}>
                <Text style={styles.metaText}>BiSınıf Akıllı Sınıf Yönetim Sistemi</Text>
                <Text style={styles.metaText}>{reportData.metadata.planId} | {reportData.metadata.hash}</Text>
            </View>
        </Page>
    </Document>
)
