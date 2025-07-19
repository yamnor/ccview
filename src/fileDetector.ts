import * as fs from 'fs';
import * as path from 'path';

/**
 * File detection result
 */
export interface DetectionResult {
    isValid: boolean;
    parser: 'direct' | 'cclib';
    error?: string;
}

/**
 * Simplified file detector
 */
export class FileDetector {
    private directFormats = ['.pdb', '.cif', '.xyz'];
    private cclibFormats = ['.log', '.out'];

    /**
     * Check if a file is supported
     */
    async isValidFile(filePath: string): Promise<boolean> {
        try {
            const result = await this.detectFileType(filePath);
            return result.isValid;
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect file type and determine parser
     */
    async detectFileType(filePath: string): Promise<DetectionResult> {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return {
                    isValid: false,
                    parser: 'cclib',
                    error: 'File does not exist'
                };
            }

            // Check file extension
            const ext = path.extname(filePath).toLowerCase();

            if (this.directFormats.includes(ext)) {
                return {
                    isValid: true,
                    parser: 'direct'
                };
            }

            if (this.cclibFormats.includes(ext)) {
                return {
                    isValid: true,
                    parser: 'cclib'
                };
            }

            return {
                isValid: false,
                parser: 'cclib',
                error: `Unsupported file extension: ${ext}`
            };

        } catch (error) {
            return {
                isValid: false,
                parser: 'cclib',
                error: `Error detecting file type: ${error}`
            };
        }
    }

    /**
     * Get supported file extensions
     */
    getSupportedExtensions(): string[] {
        return [...this.directFormats, ...this.cclibFormats];
    }
} 