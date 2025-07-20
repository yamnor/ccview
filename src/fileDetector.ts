import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * File detection result
 */
export interface DetectionResult {
    isValid: boolean;
    parser: 'direct' | 'cclib';
    error?: string;
}

/**
 * Configurable file detector
 * 
 * This detector reads file extensions from VS Code settings, allowing users to:
 * - Configure direct loading formats (PDB, CIF, XYZ, etc.)
 * - Configure known chemistry software extensions
 * - Add custom extensions for cclib processing
 */
export class FileDetector {
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
     * Detect file type based on extension and user settings
     * 
     * Reads file extensions from VS Code settings:
     * - Direct formats: loaded directly without cclib
     * - Chemistry extensions: known quantum chemistry software outputs
     * - Custom extensions: passed to cclib for content-based detection
     */
    async detectFileType(filePath: string): Promise<DetectionResult> {
        try {
            if (!fs.existsSync(filePath)) {
                return {
                    isValid: false,
                    parser: 'cclib',
                    error: 'File does not exist'
                };
            }

            const ext = path.extname(filePath).toLowerCase();
            
            // Get extensions from user settings (defaults are defined in package.json)
            const config = vscode.workspace.getConfiguration('ccview');
            const directFormats = config.get<string[]>('directFormats', []);
            const chemistryExtensions = config.get<string[]>('chemistryExtensions', []);
            const customExtensions = config.get<string[]>('customExtensions', []);
            
            // Direct loading formats
            if (directFormats.includes(ext)) {
                return { isValid: true, parser: 'direct' };
            }
            
            // Known chemistry software extensions
            if (chemistryExtensions.includes(ext)) {
                return { isValid: true, parser: 'cclib' };
            }
            
            // Custom extensions - let cclib handle detection
            if (customExtensions.includes(ext)) {
                return { isValid: true, parser: 'cclib' };
            }
            
            return {
                isValid: false,
                parser: 'cclib',
                error: 'Unsupported file type'
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
     * Get all supported file extensions from settings
     */
    getSupportedExtensions(): string[] {
        const config = vscode.workspace.getConfiguration('ccview');
        const directFormats = config.get<string[]>('directFormats', []);
        const chemistryExtensions = config.get<string[]>('chemistryExtensions', []);
        const customExtensions = config.get<string[]>('customExtensions', []);
        
        return [...directFormats, ...chemistryExtensions, ...customExtensions];
    }

    /**
     * Get direct loading formats from settings
     */
    getDirectFormats(): string[] {
        const config = vscode.workspace.getConfiguration('ccview');
        return config.get<string[]>('directFormats', []);
    }

    /**
     * Get chemistry extensions from settings
     */
    getChemistryExtensions(): string[] {
        const config = vscode.workspace.getConfiguration('ccview');
        return config.get<string[]>('chemistryExtensions', []);
    }

    /**
     * Get custom extensions from settings
     */
    getCustomExtensions(): string[] {
        const config = vscode.workspace.getConfiguration('ccview');
        return config.get<string[]>('customExtensions', []);
    }


}