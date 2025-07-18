import * as cp from 'child_process';
import * as path from 'path';
import { PythonManager, EnvironmentStatus } from './pythonManager';

/**
 * Molecular data structure
 */
export interface MolecularData {
    success: boolean;
    file_type?: string;
    detected_format?: string;
    molecule?: {
        natom: number;
        charge: number;
        multiplicity: number;
        atoms: number[];
        coordinates: number[][];
        masses: number[];
    };
    energies?: {
        scf?: number[];
        mp2?: number[];
        cc?: number[];
        zpve?: number;
        enthalpy?: number;
        free_energy?: number;
    };
    vibrations?: {
        frequencies?: number[];
        ir_intensities?: number[];
        raman_activities?: number[];
        displacements?: number[][];
        symmetries?: string[];
    };
    orbitals?: {
        energies?: number[][];
        coefficients?: number[][];
        homo_indices?: number[];
        nbasis?: number;
        nmo?: number;
    };
    properties?: {
        moments?: number[][];
        polarizabilities?: number[][];
        atom_charges?: { [key: string]: number[] };
        atom_spins?: { [key: string]: number[] };
    };
    xyz_content?: string;  // XYZ format string from cclib
    error?: string;
    traceback?: string;
}

/**
 * Command execution result
 */
export interface CommandResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
}

/**
 * Parser interface for communicating with Python backend
 */
export class ParserInterface {
    private pythonManager: PythonManager;
    private pythonPath: string | undefined;
    private parserScriptPath: string;

    constructor(pythonManager: PythonManager) {
        this.pythonManager = pythonManager;
        this.parserScriptPath = path.join(__dirname, '..', 'python', 'parser.py');
    }

    /**
     * Parse quantum chemistry output file
     */
    async parseFile(filePath: string): Promise<MolecularData> {
        try {
            // Ensure Python environment is available
            await this.ensurePythonEnvironment();

            const result = await this.executePythonCommand('parse', [filePath]);
            
            if (result.success) {
                return JSON.parse(result.output) as MolecularData;
            } else {
                return {
                    success: false,
                    error: result.error || 'Failed to parse file'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Parser error: ${error}`
            };
        }
    }

    /**
     * Execute ccget command equivalent
     */
    async executeCcget(filePath: string, propertyName: string): Promise<CommandResult> {
        try {
            await this.ensurePythonEnvironment();

            const result = await this.executePythonCommand('ccget', [filePath, propertyName]);
            
            if (result.success) {
                // Parse the JSON response from Python
                try {
                    const parsedResult = JSON.parse(result.output);
                    if (parsedResult.success) {
                        return {
                            success: true,
                            output: parsedResult.value,
                            error: undefined,
                            executionTime: result.executionTime
                        };
                    } else {
                        return {
                            success: false,
                            output: '',
                            error: parsedResult.error || 'Unknown error from Python backend',
                            executionTime: result.executionTime
                        };
                    }
                } catch (parseError) {
                    return {
                        success: false,
                        output: '',
                        error: `Failed to parse Python response: ${parseError}`,
                        executionTime: result.executionTime
                    };
                }
            } else {
                return {
                    success: false,
                    output: '',
                    error: result.error,
                    executionTime: result.executionTime
                };
            }

        } catch (error) {
            return {
                success: false,
                output: '',
                error: `ccget error: ${error}`,
                executionTime: 0
            };
        }
    }

    /**
     * Execute ccwrite command equivalent
     */
    async executeCcwrite(filePath: string, outputFormat: string, outputPath?: string): Promise<CommandResult> {
        try {
            await this.ensurePythonEnvironment();

            const args = [filePath, outputFormat];
            if (outputPath) {
                args.push(outputPath);
            }

            const result = await this.executePythonCommand('ccwrite', args);
            
            if (result.success) {
                // Parse the JSON response from Python
                try {
                    const parsedResult = JSON.parse(result.output);
                    if (parsedResult.success) {
                        return {
                            success: true,
                            output: parsedResult.content || parsedResult.message || 'Success',
                            error: undefined,
                            executionTime: result.executionTime
                        };
                    } else {
                        return {
                            success: false,
                            output: '',
                            error: parsedResult.error || 'Unknown error from Python backend',
                            executionTime: result.executionTime
                        };
                    }
                } catch (parseError) {
                    return {
                        success: false,
                        output: '',
                        error: `Failed to parse Python response: ${parseError}`,
                        executionTime: result.executionTime
                    };
                }
            } else {
                return {
                    success: false,
                    output: '',
                    error: result.error,
                    executionTime: result.executionTime
                };
            }

        } catch (error) {
            return {
                success: false,
                output: '',
                error: `ccwrite error: ${error}`,
                executionTime: 0
            };
        }
    }

    /**
     * Detect file format
     */
    async detectFileFormat(filePath: string): Promise<{ success: boolean; detected_format?: string; error?: string }> {
        try {
            await this.ensurePythonEnvironment();

            const result = await this.executePythonCommand('detect', [filePath]);
            
            if (result.success) {
                const data = JSON.parse(result.output);
                return {
                    success: data.success,
                    detected_format: data.detected_format,
                    error: data.error
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Detection error: ${error}`
            };
        }
    }

    /**
     * Execute Python command
     */
    private async executePythonCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string; executionTime: number }> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            if (!this.pythonPath) {
                resolve({
                    success: false,
                    output: '',
                    error: 'Python interpreter not available',
                    executionTime: Date.now() - startTime
                });
                return;
            }

            const process = cp.spawn(this.pythonPath, [this.parserScriptPath, command, ...args], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 60000 // 60 second timeout
            });

            let output = '';
            let errorOutput = '';

            process.stdout?.on('data', (data) => {
                output += data.toString();
            });

            process.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                const executionTime = Date.now() - startTime;
                
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output.trim(),
                        executionTime
                    });
                } else {
                    resolve({
                        success: false,
                        output: output.trim(),
                        error: errorOutput || `Process exited with code ${code}`,
                        executionTime
                    });
                }
            });

            process.on('error', (error) => {
                const executionTime = Date.now() - startTime;
                resolve({
                    success: false,
                    output: output.trim(),
                    error: error.message,
                    executionTime
                });
            });
        });
    }

    /**
     * Ensure Python environment is properly configured
     */
    private async ensurePythonEnvironment(): Promise<void> {
        if (!this.pythonPath) {
            const status = await this.pythonManager.validateEnvironment();
            
            if (!status.isValid) {
                throw new Error(`Python environment not valid: ${status.error}`);
            }
            
            this.pythonPath = status.pythonPath;
        }
    }

    /**
     * Validate environment
     */
    async validateEnvironment(): Promise<EnvironmentStatus> {
        return this.pythonManager.validateEnvironment();
    }
} 