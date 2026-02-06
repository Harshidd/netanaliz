import { Template, TemplateSchema } from '../schemas'
import { logger } from '../../../core/observability/logger'
import tr_meb_5choice_20q from '../templates/tr_meb_5choice_20q_v1.json'
import tr_meb_5choice_40q from '../templates/tr_meb_5choice_40q_v1.json'
import tr_meb_5choice_80q from '../templates/tr_meb_5choice_80q_v1.json'
import tr_meb_5choice_100q from '../templates/tr_meb_5choice_100q_v1.json'

// Raw imports (implicitly any/json)
// Order is critical here for fallback sorting, but we explicitly sort by questionCount later.
const RAW_TEMPLATES = [
    tr_meb_5choice_20q,
    tr_meb_5choice_40q,
    tr_meb_5choice_80q,
    tr_meb_5choice_100q
]

class TemplateRegistry {
    private templates: Template[] = []
    private fatalError: string | null = null
    private fatalDetails: string[] = []

    constructor() {
        this.loadTemplates()
    }

    private loadTemplates() {
        const validTemplates: Template[] = []
        const errors: string[] = []
        let hasFailure = false

        const startTime = performance.now()

        RAW_TEMPLATES.forEach((raw, index) => {
            const result = TemplateSchema.safeParse(raw)
            if (result.success) {
                validTemplates.push(result.data)
            } else {
                hasFailure = true
                const errDetail = `Template #${index} (${(raw as any)?.templateId || 'unknown'}) invalid: ${result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join(', ')}`
                errors.push(errDetail)
                logger.error('DenemeOkut', 'Template Validation Failed', { error: result.error.format(), raw })
            }
        })

        if (hasFailure) {
            this.fatalError = 'DenemeOkut şablonları yüklenemedi'
            this.fatalDetails = errors
            this.templates = [] // Block usage
            logger.error('DenemeOkut', 'Registry Fatal Error: Templates corrupted', { errors })
            return
        }

        // Validate count (Must match expected official count)
        if (validTemplates.length !== 4) {
            this.fatalError = 'DenemeOkut eksik şablon hatası'
            this.fatalDetails = [`Expected 4 templates, found ${validTemplates.length}`]
            this.templates = []
            logger.error('DenemeOkut', 'Registry Fatal Error: Missing templates')
            return
        }

        // Sort by question count for stable UX: 20 -> 40 -> 80 -> 100
        this.templates = validTemplates.sort((a, b) => a.questionCount - b.questionCount)

        logger.info('DenemeOkut', 'Templates Loaded Successfully', {
            count: this.templates.length,
            durationMs: performance.now() - startTime
        })
    }

    public getAllTemplates(): Template[] {
        if (this.fatalError) {
            throw new Error(`FATAL_REGISTRY_ERROR: ${this.fatalError}`)
        }
        return this.templates
    }

    public getTemplateById(templateId: string, version: number): Template | null {
        if (this.fatalError) return null
        return this.templates.find(t => t.templateId === templateId && t.version === version) || null
    }

    public getFatalError() {
        return this.fatalError ? { message: this.fatalError, details: this.fatalDetails } : null
    }
}

// Singleton export
export const templateRegistry = new TemplateRegistry()
