/**
 * Text sanitization utilities for user input
 * Simple HTML tag stripping without external dependencies
 */

/**
 * Strip all HTML tags from text
 * @param text - Input text that may contain HTML
 * @returns Plain text with HTML tags removed
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Remove all HTML tags using regex
    // This is a simple but effective approach for server-side Next.js
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&lt;/g, '<')   // Decode HTML entities
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .trim();
}

/**
 * Validate text length
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export function validateTextLength(
    text: string,
    maxLength: number,
    fieldName: string
): string | null {
    if (!text || text.trim().length === 0) {
        return `${fieldName} est requis`;
    }

    if (text.length > maxLength) {
        return `${fieldName} est trop long (max ${maxLength} caractères)`;
    }

    return null;
}
