import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { QRPayloadSchema } from '../schemas'
import { logger } from '../../../core/observability/logger'
import { z } from 'zod'

/**
 * Generate QR Code Data URL from Exam Payload
 * Uses ECC Level 'M' for balance between size and error correction.
 */
export const generateExamQRCode = async (
    examId: string,
    templateId: string,
    version: number
): Promise<string> => {
    const payload = JSON.stringify({ examId, templateId, version })

    try {
        const url = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            width: 256,
            margin: 2
        })
        return url
    } catch (err) {
        logger.error('DenemeOkut', 'QR Generation Failed', { error: err })
        throw new Error('QR kod oluşturulamadı.')
    }
}

/**
 * Detect and Parse QR Code from Image File (Browser)
 * - Reads file as Image
 * - Draws to Canvas (max 1024px)
 * - Scans with jsQR
 * - Validates Schema
 */
export const detectQRCodeFromImage = async (file: File): Promise<z.infer<typeof QRPayloadSchema> | null> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            try {
                // Resize logic for performance
                let width = img.width
                let height = img.height
                const MAX_DIM = 1024

                if (width > MAX_DIM || height > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
                    width = Math.round(width * ratio)
                    height = Math.round(height * ratio)
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Canvas context failed'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)
                const imageData = ctx.getImageData(0, 0, width, height)

                const code = jsQR(imageData.data, imageData.width, imageData.height)

                if (code) {
                    logger.info('DenemeOkut', 'QR Detected', { data: code.data })
                    try {
                        const json = JSON.parse(code.data)
                        const validated = QRPayloadSchema.parse(json)
                        resolve(validated)
                    } catch (err) {
                        logger.warn('DenemeOkut', 'QR Invalid Payload', { data: code.data })
                        resolve(null) // Found QR but not ours
                    }
                } else {
                    resolve(null)
                }
            } catch (err) {
                logger.error('DenemeOkut', 'QR Detection Error', { error: err })
                reject(err)
            } finally {
                URL.revokeObjectURL(url)
            }
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Resim yüklenemedi'))
        }

        img.src = url
    })
}
