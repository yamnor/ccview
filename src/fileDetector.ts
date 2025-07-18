import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported quantum chemistry file formats
 */
export interface FileType {
    name: string;
    extensions: string[];
    parser: string;
    priority: number;
}

/**
 * File detection result
 */
export interface DetectionResult {
    isValid: boolean;
    fileType?: FileType;
    error?: string;
}

/**
 * File detector for quantum chemistry output files
 */
export class FileDetector {
    private supportedFormats: FileType[] = [
        { name: 'Gaussian', extensions: ['.log', '.out'], parser: 'gaussian', priority: 1 },
        { name: 'GAMESS', extensions: ['.log', '.out'], parser: 'gamess', priority: 2 },
        { name: 'GAMESS-UK', extensions: ['.log', '.out'], parser: 'gamessuk', priority: 3 },
        { name: 'NWChem', extensions: ['.out'], parser: 'nwchem', priority: 4 },
        { name: 'ORCA', extensions: ['.out'], parser: 'orca', priority: 5 },
        { name: 'Q-Chem', extensions: ['.out'], parser: 'qchem', priority: 6 },
        { name: 'Psi4', extensions: ['.out'], parser: 'psi4', priority: 7 },
        { name: 'Turbomole', extensions: ['.out'], parser: 'turbomole', priority: 8 },
        { name: 'Molpro', extensions: ['.out'], parser: 'molpro', priority: 9 },
        { name: 'Molcas', extensions: ['.out'], parser: 'molcas', priority: 10 },
        { name: 'ADF', extensions: ['.out'], parser: 'adf', priority: 11 },
        { name: 'CFOUR', extensions: ['.out'], parser: 'cfour', priority: 12 },
        { name: 'DALTON', extensions: ['.out'], parser: 'dalton', priority: 13 },
        { name: 'Jaguar', extensions: ['.out'], parser: 'jaguar', priority: 14 },
        { name: 'MOPAC', extensions: ['.out'], parser: 'mopac', priority: 15 },
        { name: 'XTB', extensions: ['.out'], parser: 'xtb', priority: 16 },
        { name: 'PDB', extensions: ['.pdb'], parser: 'direct', priority: 17 },
        { name: 'CIF', extensions: ['.cif'], parser: 'direct', priority: 18 },
        { name: 'XYZ', extensions: ['.xyz'], parser: 'direct', priority: 19 }
    ];

    /**
     * Check if a file is a valid quantum chemistry output file
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
     * Detect the type of quantum chemistry file
     */
    async detectFileType(filePath: string): Promise<DetectionResult> {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return {
                    isValid: false,
                    error: 'File does not exist'
                };
            }

            // Check file extension
            const ext = path.extname(filePath).toLowerCase();
            const supportedByExtension = this.supportedFormats.filter(
                format => format.extensions.includes(ext)
            );

            if (supportedByExtension.length === 0) {
                return {
                    isValid: false,
                    error: `Unsupported file extension: ${ext}`
                };
            }

            // Read file content for content-based detection
            const content = await this.readFileContent(filePath);
            const detectedType = this.detectByContent(content);

            if (detectedType) {
                return {
                    isValid: true,
                    fileType: detectedType
                };
            }

            // Fallback to extension-based detection
            const fallbackType = supportedByExtension[0];
            return {
                isValid: true,
                fileType: fallbackType
            };

        } catch (error) {
            return {
                isValid: false,
                error: `Error detecting file type: ${error}`
            };
        }
    }

    /**
     * Read file content for analysis
     */
    private async readFileContent(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, {
                encoding: 'utf8',
                highWaterMark: 64 * 1024 // 64KB chunks
            });

            let content = '';
            let totalRead = 0;
            const maxRead = 100 * 1024; // Read max 100KB

            stream.on('data', (chunk) => {
                content += chunk;
                totalRead += chunk.length;
                
                if (totalRead >= maxRead) {
                    stream.destroy();
                    resolve(content);
                }
            });

            stream.on('end', () => {
                resolve(content);
            });

            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Detect file type by content analysis
     */
    private detectByContent(content: string): FileType | null {
        const contentLower = content.toLowerCase();

        // Check for characteristic strings
        if (contentLower.includes('gaussian') || 
            content.includes('G09') || 
            content.includes('G16') ||
            contentLower.includes('gaussian, inc.')) {
            return this.supportedFormats.find(f => f.name === 'Gaussian') || null;
        }

        if (contentLower.includes('gamess') && 
            !contentLower.includes('gamess-uk') && 
            !contentLower.includes('gamessuk')) {
            return this.supportedFormats.find(f => f.name === 'GAMESS') || null;
        }

        if (contentLower.includes('gamess-uk') || contentLower.includes('gamessuk')) {
            return this.supportedFormats.find(f => f.name === 'GAMESS-UK') || null;
        }

        if (contentLower.includes('nwchem')) {
            return this.supportedFormats.find(f => f.name === 'NWChem') || null;
        }

        if (contentLower.includes('orca')) {
            return this.supportedFormats.find(f => f.name === 'ORCA') || null;
        }

        if (contentLower.includes('q-chem') || contentLower.includes('qchem')) {
            return this.supportedFormats.find(f => f.name === 'Q-Chem') || null;
        }

        if (contentLower.includes('psi4')) {
            return this.supportedFormats.find(f => f.name === 'Psi4') || null;
        }

        if (contentLower.includes('turbomole')) {
            return this.supportedFormats.find(f => f.name === 'Turbomole') || null;
        }

        if (contentLower.includes('molpro')) {
            return this.supportedFormats.find(f => f.name === 'Molpro') || null;
        }

        if (contentLower.includes('molcas')) {
            return this.supportedFormats.find(f => f.name === 'Molcas') || null;
        }

        if (contentLower.includes('adf')) {
            return this.supportedFormats.find(f => f.name === 'ADF') || null;
        }

        if (contentLower.includes('cfour')) {
            return this.supportedFormats.find(f => f.name === 'CFOUR') || null;
        }

        if (contentLower.includes('dalton')) {
            return this.supportedFormats.find(f => f.name === 'DALTON') || null;
        }

        if (contentLower.includes('jaguar')) {
            return this.supportedFormats.find(f => f.name === 'Jaguar') || null;
        }

        if (contentLower.includes('mopac')) {
            return this.supportedFormats.find(f => f.name === 'MOPAC') || null;
        }

        if (contentLower.includes('xtb')) {
            return this.supportedFormats.find(f => f.name === 'XTB') || null;
        }

        return null;
    }

    /**
     * Get all supported file formats
     */
    getSupportedFormats(): FileType[] {
        return [...this.supportedFormats];
    }
} 