/**
 * DenemeOkut Module - Zod Validation Schemas
 * 
 * HARD RULES:
 * - All public boundaries MUST validate with these schemas
 * - Runtime validation required for storage layer
 * - No data enters DB without validation
 */

import { z } from 'zod'
import { TemplateSchema } from './templateSchema'

export { TemplateSchema, type Template } from './templateSchema'

// ============================================
// ANSWER CHOICE SCHEMA
// ============================================

export const AnswerChoiceSchema = z.enum(['A', 'B', 'C', 'D', 'E'])

// ============================================
// EXAM SCHEMA
// ============================================

export const DenemeOkutExamSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    templateId: z.string().min(1),
    templateVersion: z.number().int().positive(),
    templateName: z.string().min(1), // Denormalized for display
    answerKey: z.record(z.coerce.number().int().positive(), AnswerChoiceSchema),
    questionCount: z.number().int().positive().max(200),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export type DenemeOkutExamInput = z.input<typeof DenemeOkutExamSchema>
export type DenemeOkutExamOutput = z.output<typeof DenemeOkutExamSchema>

// ============================================
// SCAN JOB SCHEMA
// ============================================

export const ScanStatusSchema = z.enum(['pending', 'processing', 'processed', 'review_needed', 'completed', 'failed'])

export const ScanFlagSchema = z.enum(['LOW_CONFIDENCE', 'MULTI_MARK', 'ERASURE', 'AMBIGUOUS', 'NO_MARK'])

export const ScanJobSchema = z.object({
    id: z.string().uuid(),
    examId: z.string().uuid(),
    studentId: z.string().optional(),
    imageUrl: z.string().url(),
    templateId: z.string().min(1),
    templateVersion: z.number().int().positive(),
    answers: z.record(z.coerce.number().int().positive(), AnswerChoiceSchema.nullable()),
    confidence: z.record(z.coerce.number().int().positive(), z.number().min(0).max(1)),
    flags: z.record(z.coerce.number().int().positive(), z.array(ScanFlagSchema)),
    status: ScanStatusSchema,
    createdAt: z.string().datetime(),
    processedAt: z.string().datetime().optional(),
})

export type ScanJobInput = z.input<typeof ScanJobSchema>
export type ScanJobOutput = z.output<typeof ScanJobSchema>

// ============================================
// CORRECTION EVENT SCHEMA
// ============================================

export const CorrectionEventSchema = z.object({
    id: z.string().uuid(),
    scanId: z.string().uuid(),
    questionId: z.number().int().positive(),
    oldAnswer: AnswerChoiceSchema.nullable(),
    newAnswer: AnswerChoiceSchema.nullable(),
    deviceId: z.string().min(1),
    timestamp: z.string().datetime(),
    syncedAt: z.string().datetime().optional(),
})

export type CorrectionEventInput = z.input<typeof CorrectionEventSchema>
export type CorrectionEventOutput = z.output<typeof CorrectionEventSchema>

// ============================================
// OUTBOX EVENT SCHEMA
// ============================================

export const OutboxEventTypeSchema = z.enum(['scan_created', 'scan_updated', 'correction_created', 'exam_created', 'exam_updated'])

export const OutboxEventSchema = z.object({
    id: z.string().uuid(),
    eventType: OutboxEventTypeSchema,
    payload: z.unknown(), // Validated at runtime based on eventType
    idempotencyKey: z.string().min(1),
    createdAt: z.string().datetime(),
    sentAt: z.string().datetime().optional(),
    retryCount: z.number().int().nonnegative(),
})

export type OutboxEventInput = z.input<typeof OutboxEventSchema>
export type OutboxEventOutput = z.output<typeof OutboxEventSchema>

// ============================================
// PREFERENCES SCHEMA
// ============================================

export const DenemeOkutPreferencesSchema = z.object({
    lastSelectedExamId: z.string().uuid().optional(),
    cameraAutoCapture: z.boolean(),
    alignmentThreshold: z.number().int().min(0).max(100),
    hapticFeedback: z.boolean(),
    soundFeedback: z.boolean(),
})

export type DenemeOkutPreferencesInput = z.input<typeof DenemeOkutPreferencesSchema>
export type DenemeOkutPreferencesOutput = z.output<typeof DenemeOkutPreferencesSchema>

// ============================================
// QR PAYLOAD SCHEMA (PR-4)
// ============================================

export const QRPayloadSchema = z.object({
    examId: z.string().uuid(),
    templateId: z.string().min(1),
    version: z.number().int().positive()
})

export type QRPayload = z.infer<typeof QRPayloadSchema>

// ============================================
// HELPER: Validate or Throw
// ============================================

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
    const result = schema.safeParse(data)
    if (!result.success) {
        console.error(`[DenemeOkut] Validation failed in ${context}:`, result.error.format())
        throw new Error(`Invalid data in ${context}: ${result.error.message}`)
    }
    return result.data
}
