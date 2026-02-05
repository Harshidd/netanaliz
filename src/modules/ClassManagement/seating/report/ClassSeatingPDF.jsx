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
    primary: '#1E293B',      // Dark Navy (Text)
    accent: '#334155',       // Slightly Lighter Navy
    border: '#CBD5E1',       // Standard Border
    deskBg: '#F8FAFC',       // Very light gray/blue fill for desks
    deskBorder: '#E2E8F0',
    deskShadow: '#94A3B8',   // Darker gray for 3D bottom border
    boardBg: '#1E293B',      // Dark Smart Board
    badgeBg: '#E0F2FE',      // Light Blue for Number Badge
    badgeText: '#0369A1',    // Dark Blue for Number Text
    textDark: '#0F172A',
    textGray: '#64748B',
    white: '#FFFFFF'
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Roboto',
        backgroundColor: '#FFFFFF'
    },
    // --- Layout 1: Scene Plan (Full Scale) ---

    // HEADER (Antet)
    headerContainer: {
        position: 'absolute',
        top: 25,
        left: 30,
        right: 30,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: `1pt solid ${THEME.border}`,
    },
    schoolName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.textDark,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    classNameTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.accent,
        marginBottom: 4
    },
    metaRow: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center'
    },
    metaText: {
        fontSize: 9,
        color: THEME.textGray,
        fontWeight: 'normal'
    },

    // A large container for the classroom "scene"
    sceneContainer: {
        marginTop: 90,
        flex: 1,
        paddingHorizontal: 30,
        paddingBottom: 40,
        alignItems: 'center',
    },

    // Scene Elements
    boardBar: {
        width: '50%',
        height: 14,
        backgroundColor: THEME.boardBg, // Dark solid fill
        borderRadius: 4,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardLabel: {
        color: '#FFF',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 2
    },
    teacherDesk: {
        width: 100,
        height: 40,
        backgroundColor: '#F1F5F9', // Light gray wood-ish
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
        borderStyle: 'solid',
        borderBottomWidth: 3, // 3D Effect
        borderBottomColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30
    },
    teacherLabel: {
        fontSize: 8,
        color: THEME.textGray,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },

    // ARCHITECTURAL DOOR (Top-Left)
    doorArea: {
        position: 'absolute',
        top: 60, // Near the board/front row
        left: 30, // Far left
        width: 50,
        height: 50,
    },
    doorSwing: {
        width: 40,
        height: 40,
        borderTopLeftRadius: 40, // arc
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#94A3B8', // Architectural Gray
        borderStyle: 'dashed'
    },
    doorLabel: {
        position: 'absolute',
        top: 15,
        left: 10,
        fontSize: 6,
        color: '#94A3B8',
        fontWeight: 'bold',
        transform: 'rotate(-45deg)'
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    // deskBox: The container for the desk (Single or Double)
    deskBox: {
        backgroundColor: THEME.deskBg, // Light Fill
        borderWidth: 1,
        borderColor: THEME.deskBorder,
        borderStyle: 'solid',
        borderRadius: 8, // Soft corners
        overflow: 'hidden',
        borderBottomWidth: 3, // 3D Effect
        borderBottomColor: THEME.deskShadow // Darker bottom
    },
    deskDouble: { flexDirection: 'row' },
    deskSingle: {},

    seat: {
        width: '50%',
        height: '100%',
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    seatLeftBorder: {
        borderRightWidth: 1,
        borderRightColor: THEME.deskBorder,
        borderRightStyle: 'dashed'
    },

    // Clean Backgrounds
    bgEmpty: { opacity: 0.5 }, // Faded if empty
    bgNormal: { opacity: 1 },

    // Typography for Student Card
    badgeContainer: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: THEME.badgeBg,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4
    },
    studentNo: {
        fontSize: 7,
        color: THEME.badgeText,
        fontWeight: 'bold',
        fontFamily: 'Roboto'
    },

    nameContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: 8
    },
    firstName: {
        fontWeight: 'bold', // Fixed: 'heavy' causes crash
        color: THEME.primary,
        textAlign: 'center',
        lineHeight: 1.1
    },
    lastName: {
        fontWeight: 'normal',
        color: THEME.textGray, // Softer contrast
        textAlign: 'center',
        lineHeight: 1.1,
        marginTop: 2
    },

    // REMOVED REPORT-ONLY STYLES TO CLEANUP
})

// --- Components ---

const Seat = ({ student, isDouble, side, fontSize }) => {
    const containerStyle = [styles.seat]
    if (isDouble) {
        containerStyle.push({ width: '50%' })
    } else {
        containerStyle.push({ width: '100%' })
    }

    if (isDouble && side === 'left') containerStyle.push(styles.seatLeftBorder)

    if (!student) {
        // Render Empty Seat
        return (
            <View style={[...containerStyle, styles.bgEmpty]}>
                {/* Optional: Add a very faint placeholder number or text if needed */}
            </View>
        )
    }

    containerStyle.push(styles.bgNormal)

    // Name Parsing
    const parts = (student.name || '').trim().split(' ')
    let firstName = student.name
    let lastName = ''

    if (parts.length > 1) {
        lastName = parts.pop()
        firstName = parts.join(' ')
    }

    return (
        <View style={containerStyle}>
            {/* Number Badge */}
            <View style={styles.badgeContainer}>
                <Text style={styles.studentNo}>
                    {student.schoolNo || student.no || ''}
                </Text>
            </View>

            <View style={styles.nameContainer}>
                <Text style={[styles.firstName, { fontSize: fontSize }]} hyphenationCallback={(word) => [word]}>
                    {firstName}
                </Text>
                <Text style={[styles.lastName, { fontSize: fontSize - 2 }]} hyphenationCallback={(word) => [word]}>
                    {lastName}
                </Text>
            </View>
        </View>
    )
}

const SceneGrid = ({ setup, assignments, students }) => {
    const rows = Array.from({ length: setup.rows }, (_, i) => i + 1)
    const cols = Array.from({ length: setup.cols }, (_, i) => i + 1)

    const studentMap = new Map(students.map(s => [s.id, s]))

    // === DYNAMIC SCALING CALCULATION ===
    const AVAIL_WIDTH = 750
    const AVAIL_HEIGHT = 380

    const MIN_DESK_W = 90
    const MAX_DESK_W = 180
    const MIN_DESK_H = 65 // Slightly taller for 3D effect
    const MAX_DESK_H = 120
    const GAP_X = 20 // More spacing
    const GAP_Y = 20
    const isDouble = setup.deskType === 'double'

    let calcW = (AVAIL_WIDTH - (cols.length * GAP_X)) / cols.length
    let calcH = (AVAIL_HEIGHT - (rows.length * GAP_Y)) / rows.length

    const finalW = Math.min(Math.max(calcW, MIN_DESK_W), MAX_DESK_W)
    const finalH = Math.min(Math.max(calcH, MIN_DESK_H), MAX_DESK_H)

    const fontSizeName = Math.max(9, Math.min(13, finalH * 0.18))

    const totalContentHeight = rows.length * (finalH + GAP_Y)
    const justifyMethod = totalContentHeight < 300 ? 'center' : 'flex-start'

    return (
        <View style={[styles.sceneContainer, { justifyContent: justifyMethod }]}>
            {/* BOARD */}
            <View style={styles.boardBar}>
                <Text style={styles.boardLabel}>AKILLI TAHTA</Text>
            </View>

            {/* TEACHER DESK */}
            <View style={styles.teacherDesk}>
                <Text style={styles.teacherLabel}>ÖĞRETMEN MASASI</Text>
            </View>

            {/* DOOR (Moved to Top Left area via absolute pos relative to scene container, but needs to be handled carefully) */}
            {/* Since sceneContainer centers items, absolute positioning might be tricky relative to dynamic width. */}
            {/* We will place it using the doorArea style which is absolute to the PAGE or relative to Container? */}
            {/* Let's keep it simple: Absolute inside the SceneContainer works if relative to it. */}
            <View style={styles.doorArea}>
                <View style={styles.doorSwing} />
                <Text style={styles.doorLabel}>KAPI</Text>
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
                                        isDouble={true} side="left"
                                        fontSize={fontSizeName}
                                    />
                                    <Seat
                                        student={studentMap.get(assignments[rightId])}
                                        isDouble={true} side="right"
                                        fontSize={fontSizeName}
                                    />
                                </View>
                            )
                        } else {
                            return (
                                <View key={c} style={[styles.deskBox, styles.deskSingle, { width: finalW, height: finalH, marginHorizontal: GAP_X / 2 }]}>
                                    <Seat
                                        student={studentMap.get(assignments[singleId])}
                                        isDouble={false}
                                        fontSize={fontSizeName}
                                    />
                                </View>
                            )
                        }
                    })}
                </View>
            ))}
        </View>
    )
}

export const ClassSeatingPDF = ({ setup, assignments, students, reportData, violations, meta }) => {
    // Current date formatted DD.MM.YYYY
    const today = new Date().toLocaleDateString('tr-TR')

    // Fallbacks
    const schoolName = meta?.schoolName || '(OKUL ADI TANIMLANMADI)'
    const className = meta?.className || '(SINIF)'
    const teacherName = meta?.teacherName || '(Öğretmen Tanımlanmadı)'

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Antet */}
                <View style={styles.headerContainer}>
                    <Text style={styles.schoolName}>{schoolName}</Text>
                    <Text style={styles.classNameTitle}>{className} SINIFI OTURMA PLANI</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Öğretmen: {teacherName}</Text>
                        <Text style={styles.metaText}>|</Text>
                        <Text style={styles.metaText}>Tarih: {today}</Text>
                    </View>
                </View>

                {/* Scene */}
                <SceneGrid
                    setup={setup}
                    assignments={assignments}
                    students={students}
                />
            </Page>
        </Document>
    )
}
