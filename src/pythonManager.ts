import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

/**
 * Python environment status
 */
export interface EnvironmentStatus {
    isValid: boolean;
    pythonPath?: string;
    version?: string;
    packages?: PackageStatus[];
    error?: string;
}

/**
 * Package installation status
 */
export interface PackageStatus {
    name: string;
    installed: boolean;
    version?: string;
    error?: string;
}

/**
 * Installation result
 */
export interface InstallResult {
    success: boolean;
    package: string;
    version?: string;
    error?: string;
}

/**
 * Python environment manager
 */
export class PythonManager {
    private pythonPath: string | undefined;
    private requiredPackages = ['cclib', 'numpy', 'scipy'];

    /**
     * Detect Python environment
     */
    async detectPythonEnvironment(): Promise<EnvironmentStatus> {
        try {
            // Try to get Python path from VS Code settings
            const pythonPath = await this.getPythonPath();
            
            if (!pythonPath) {
                return {
                    isValid: false,
                    error: 'Python interpreter not found'
                };
            }

            // Check Python version
            const version = await this.getPythonVersion(pythonPath);
            if (!version) {
                return {
                    isValid: false,
                    error: 'Could not determine Python version'
                };
            }

            // Check required packages
            const packages = await this.validatePackages(pythonPath);

            const isValid = packages.every(pkg => pkg.installed);

            return {
                isValid,
                pythonPath,
                version,
                packages
            };

        } catch (error) {
            return {
                isValid: false,
                error: `Error detecting Python environment: ${error}`
            };
        }
    }

    /**
     * Get Python path from VS Code settings or system
     */
    private async getPythonPath(): Promise<string | undefined> {
        try {
            // Try VS Code Python extension
            const pythonExtension = vscode.extensions.getExtension('ms-python.python');
            if (pythonExtension) {
                const pythonPath = vscode.workspace.getConfiguration('python').get('defaultInterpreterPath') as string;
                if (pythonPath) {
                    return pythonPath;
                }
            }

            // Try system Python
            const systemPython = await this.findSystemPython();
            if (systemPython) {
                return systemPython;
            }

            return undefined;

        } catch (error) {
            console.error('Error getting Python path:', error);
            return undefined;
        }
    }

    /**
     * Find system Python installation
     */
    private async findSystemPython(): Promise<string | undefined> {
        const pythonCommands = ['python3', 'python', 'py'];
        
        for (const command of pythonCommands) {
            try {
                const result = await this.executeCommand(command, ['--version']);
                if (result.success) {
                    return command;
                }
            } catch (error) {
                // Continue to next command
            }
        }

        return undefined;
    }

    /**
     * Get Python version
     */
    private async getPythonVersion(pythonPath: string): Promise<string | undefined> {
        try {
            const result = await this.executeCommand(pythonPath, ['--version']);
            if (result.success) {
                // Extract version from output (e.g., "Python 3.9.5")
                const match = result.output.match(/Python (\d+\.\d+\.\d+)/);
                return match ? match[1] : undefined;
            }
        } catch (error) {
            console.error('Error getting Python version:', error);
        }

        return undefined;
    }

    /**
     * Validate required packages
     */
    async validatePackages(pythonPath?: string): Promise<PackageStatus[]> {
        const path = pythonPath || await this.getPythonPath();
        if (!path) {
            return this.requiredPackages.map(pkg => ({
                name: pkg,
                installed: false,
                error: 'Python not found'
            }));
        }

        const packages: PackageStatus[] = [];

        for (const packageName of this.requiredPackages) {
            try {
                const result = await this.executeCommand(path, [
                    '-c', 
                    `import ${packageName}; print(${packageName}.__version__)`
                ]);

                if (result.success) {
                    packages.push({
                        name: packageName,
                        installed: true,
                        version: result.output.trim()
                    });
                } else {
                    packages.push({
                        name: packageName,
                        installed: false,
                        error: result.error
                    });
                }

            } catch (error) {
                packages.push({
                    name: packageName,
                    installed: false,
                    error: `Error checking package: ${error}`
                });
            }
        }

        return packages;
    }

    /**
     * Install a Python package
     */
    async installPackage(pkgName: string, pythonPath?: string): Promise<InstallResult> {
        const path = pythonPath || await this.getPythonPath();
        if (!path) {
            return {
                success: false,
                package: pkgName,
                error: 'Python interpreter not found'
            };
        }

        try {
            const result = await this.executeCommand(path, ['-m', 'pip', 'install', pkgName]);
            
            if (result.success) {
                // Get installed version
                const versionResult = await this.executeCommand(path, [
                    '-c', 
                    `import ${pkgName}; print(${pkgName}.__version__)`
                ]);

                return {
                    success: true,
                    package: pkgName,
                    version: versionResult.success ? versionResult.output.trim() : undefined
                };
            } else {
                return {
                    success: false,
                    package: pkgName,
                    error: result.error
                };
            }

        } catch (error) {
            return {
                success: false,
                package: pkgName,
                error: `Installation failed: ${error}`
            };
        }
    }

    /**
     * Execute Python command
     */
    async executeCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
        return new Promise((resolve) => {
            const process = cp.spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000 // 30 second timeout
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
                if (code === 0) {
                    resolve({
                        success: true,
                        output
                    });
                } else {
                    resolve({
                        success: false,
                        output,
                        error: errorOutput || `Process exited with code ${code}`
                    });
                }
            });

            process.on('error', (error) => {
                resolve({
                    success: false,
                    output,
                    error: error.message
                });
            });
        });
    }

    /**
     * Validate Python environment
     */
    async validateEnvironment(): Promise<EnvironmentStatus> {
        return this.detectPythonEnvironment();
    }

    /**
     * Get Python path for parser interface
     */
    getPythonPathForParser(): string | undefined {
        return this.pythonPath;
    }

    /**
     * Set Python path
     */
    setPythonPath(path: string): void {
        this.pythonPath = path;
    }
} 