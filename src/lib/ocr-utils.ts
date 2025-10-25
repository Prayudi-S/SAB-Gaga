import { createWorker } from 'tesseract.js';

export type OCRMeterResult = {
  meterId: string;
  reading: number;
  confidence: number;
};

export type OCRError = {
  message: string;
  code: 'CAMERA_ERROR' | 'OCR_ERROR' | 'PARSE_ERROR' | 'PERMISSION_ERROR';
};

/**
 * Extract meter data from image using OCR
 * @param imageFile - The captured image file
 * @returns Promise with extracted meter data or error
 */
export async function extractMeterData(imageFile: File): Promise<OCRMeterResult> {
  try {
    // Initialize Tesseract worker
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure for better number recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-',
      tessedit_pageseg_mode: '6', // Single uniform block of text
    });

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(imageFile);
    
    // Clean up worker
    await worker.terminate();

    // Parse the extracted text
    const result = parseMeterText(text);
    
    return {
      meterId: result.meterId,
      reading: result.reading,
      confidence: confidence / 100 // Convert to 0-1 scale
    };

  } catch (error) {
    console.error('OCR Error:', error);
    throw {
      message: 'Gagal memproses gambar. Pastikan gambar jelas dan terang.',
      code: 'OCR_ERROR'
    } as OCRError;
  }
}

/**
 * Parse OCR text to extract meter ID and reading
 * @param text - Raw OCR text
 * @returns Parsed meter data
 */
function parseMeterText(text: string): { meterId: string; reading: number } {
  // Clean the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Common patterns for meter readings
  const patterns = {
    // Look for decimal numbers (meter readings)
    reading: /(\d+\.?\d*)\s*(?:m³|m3|cubic|meter|reading)/i,
    // Look for alphanumeric meter IDs (usually shorter, mixed case)
    meterId: /\b([A-Za-z0-9]{3,12})\b/g
  };

  // Extract reading (look for decimal numbers)
  const readingMatch = cleanText.match(/(\d+\.?\d*)/);
  const reading = readingMatch ? parseFloat(readingMatch[1]) : 0;

  // Extract potential meter IDs
  const meterIdMatches = [...cleanText.matchAll(patterns.meterId)];
  const meterIds = meterIdMatches.map(match => match[1]).filter(id => 
    // Filter out pure numbers (likely readings) and very short strings
    !/^\d+$/.test(id) && id.length >= 3
  );

  // Choose the most likely meter ID (usually the first non-numeric match)
  const meterId = meterIds.length > 0 ? meterIds[0] : '';

  // If no meter ID found, try to extract from the beginning of text
  if (!meterId) {
    const words = cleanText.split(' ').filter(word => word.length >= 3);
    const potentialId = words.find(word => /^[A-Za-z0-9]+$/.test(word));
    if (potentialId) {
      return { meterId: potentialId, reading };
    }
  }

  return { meterId, reading };
}

/**
 * Validate OCR result before applying to form
 * @param result - OCR result to validate
 * @returns Validation result with suggestions
 */
export function validateOCRResult(result: OCRMeterResult): {
  isValid: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let isValid = true;

  // Check reading validity
  if (result.reading <= 0) {
    suggestions.push('Pembacaan meter tidak valid. Periksa angka yang terdeteksi.');
    isValid = false;
  }

  if (result.reading > 999999) {
    suggestions.push('Pembacaan meter terlalu besar. Periksa angka yang terdeteksi.');
    isValid = false;
  }

  // Check meter ID validity
  if (!result.meterId || result.meterId.length < 3) {
    suggestions.push('ID meter tidak terdeteksi. Periksa apakah ID meter terlihat jelas.');
    isValid = false;
  }

  // Check confidence
  if (result.confidence < 0.5) {
    suggestions.push('Kualitas gambar rendah. Coba ambil foto lagi dengan pencahayaan yang lebih baik.');
    isValid = false;
  }

  return { isValid, suggestions };
}
