import * as vscode from 'vscode';
import * as path from 'path';
import { ParserInterface } from './parserInterface';

/**
 * Terminal command types
 */
export interface TerminalCommand {
    type: 'ccget' | 'ccwrite' | 'miew' | 'help' | 'clear';
    args: string[];
    raw: string;
}

/**
 * Terminal output types
 */
export interface TerminalOutput {
    type: 'stdout' | 'stderr' | 'error';
    content: string;
    timestamp: number;
}

/**
 * Terminal manager for handling command processing
 */
export class TerminalManager {
    private parserInterface: ParserInterface;
    private currentFile: string | null = null;
    private commandHistory: string[] = [];
    private historyIndex: number = 0;

    constructor(parserInterface: ParserInterface) {
        this.parserInterface = parserInterface;
    }

    /**
     * Set current file for ccget/ccwrite commands
     */
    setCurrentFile(filePath: string): void {
        this.currentFile = filePath;
    }

    /**
     * Get current file path
     */
    getCurrentFile(): string | null {
        return this.currentFile;
    }

    /**
     * Parse command string into command object
     */
    parseCommand(commandStr: string): TerminalCommand {
        const trimmed = commandStr.trim();
        const parts = trimmed.split(/\s+/);
        
        if (parts.length === 0) {
            return { type: 'help', args: [], raw: trimmed };
        }

        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'ccget':
                return { type: 'ccget', args, raw: trimmed };
            case 'ccwrite':
                return { type: 'ccwrite', args, raw: trimmed };
            case 'miew':
                return { type: 'miew', args, raw: trimmed };
            case 'help':
                return { type: 'help', args, raw: trimmed };
            case 'clear':
                return { type: 'clear', args, raw: trimmed };
            default:
                return { type: 'help', args: [], raw: trimmed };
        }
    }

    /**
     * Execute terminal command
     */
    async executeCommand(command: TerminalCommand): Promise<TerminalOutput[]> {
        const outputs: TerminalOutput[] = [];
        const timestamp = Date.now();

        try {
            switch (command.type) {
                case 'ccget':
                    outputs.push(...await this.executeCcget(command.args));
                    break;
                case 'ccwrite':
                    outputs.push(...await this.executeCcwrite(command.args));
                    break;
                case 'miew':
                    outputs.push(...await this.executeMiew(command.args));
                    break;
                case 'help':
                    outputs.push(this.getHelpOutput());
                    break;
                case 'clear':
                    outputs.push({ type: 'stdout', content: '', timestamp });
                    break;
                default:
                    outputs.push({
                        type: 'stderr',
                        content: `Unknown command: ${command.raw}`,
                        timestamp
                    });
            }
        } catch (error) {
            outputs.push({
                type: 'error',
                content: `Error executing command: ${error}`,
                timestamp
            });
        }

        // Add command to history
        if (command.raw.trim()) {
            this.commandHistory.push(command.raw);
            this.historyIndex = this.commandHistory.length;
        }

        return outputs;
    }

    /**
     * Execute ccget command
     */
    private async executeCcget(args: string[]): Promise<TerminalOutput[]> {
        const outputs: TerminalOutput[] = [];
        const timestamp = Date.now();

        if (args.length === 0) {
            outputs.push({
                type: 'stderr',
                content: 'Usage: ccget <property_name> [file_path]',
                timestamp
            });
            return outputs;
        }

        const propertyName = args[0];
        const filePath = args[1] || this.currentFile;

        if (!filePath) {
            outputs.push({
                type: 'stderr',
                content: 'No file specified. Use: ccget <property_name> <file_path>',
                timestamp
            });
            return outputs;
        }

        try {
            const result = await this.parserInterface.executeCcget(filePath, propertyName);
            
            if (result.success) {
                // Use Python-formatted output
                const formattedOutput = result.formatted_output || `${propertyName}: ${JSON.stringify(result.output, null, 2)}`;
                
                outputs.push({
                    type: 'stdout',
                    content: formattedOutput,
                    timestamp
                });
            } else {
                outputs.push({
                    type: 'stderr',
                    content: `Error: ${result.error}`,
                    timestamp
                });
            }
        } catch (error) {
            outputs.push({
                type: 'error',
                content: `Failed to execute ccget: ${error}`,
                timestamp
            });
        }

        return outputs;
    }

    /**
     * Execute ccwrite command
     */
    private async executeCcwrite(args: string[]): Promise<TerminalOutput[]> {
        const outputs: TerminalOutput[] = [];
        const timestamp = Date.now();

        if (args.length < 1) {
            outputs.push({
                type: 'stderr',
                content: 'Usage: ccwrite <format> [output_path] or ccwrite <format> <file_path> <output_path>',
                timestamp
            });
            return outputs;
        }

        const format = args[0];
        let filePath: string;
        let outputPath: string | undefined;

        // Parse arguments based on number of arguments
        if (args.length === 1) {
            // ccwrite xyz
            filePath = this.currentFile || '';
            outputPath = undefined;
        } else if (args.length === 2) {
            // ccwrite xyz example.xyz
            filePath = this.currentFile || '';
            outputPath = this.resolveOutputPath(args[1]);
        } else if (args.length === 3) {
            // ccwrite xyz input.log example.xyz
            filePath = args[1];
            outputPath = this.resolveOutputPath(args[2]);
        } else {
            outputs.push({
                type: 'stderr',
                content: 'Too many arguments. Usage: ccwrite <format> [output_path] or ccwrite <format> <file_path> <output_path>',
                timestamp
            });
            return outputs;
        }

        if (!filePath) {
            outputs.push({
                type: 'stderr',
                content: 'No file specified. Use: ccwrite <format> [output_path] or ccwrite <format> <file_path> <output_path>',
                timestamp
            });
            return outputs;
        }

        try {
            const result = await this.parserInterface.executeCcwrite(filePath, format, outputPath);
            
            if (result.success) {
                if (outputPath) {
                    // File saved
                    outputs.push({
                        type: 'stdout',
                        content: `Successfully converted to ${format} format`,
                        timestamp
                    });
                } else {
                    // Content display - Python side returns content in result.output
                    const content = result.output || 'No content available';
                    outputs.push({
                        type: 'stdout',
                        content: content,
                        timestamp
                    });
                }
            } else {
                outputs.push({
                    type: 'stderr',
                    content: `Error: ${result.error}`,
                    timestamp
                });
            }
        } catch (error) {
            outputs.push({
                type: 'error',
                content: `Failed to execute ccwrite: ${error}`,
                timestamp
            });
        }

        return outputs;
    }

    /**
     * Execute miew script command
     */
    private async executeMiew(args: string[]): Promise<TerminalOutput[]> {
        const outputs: TerminalOutput[] = [];
        const timestamp = Date.now();

        if (args.length === 0) {
            outputs.push({
                type: 'stderr',
                content: 'Usage: miew <script_command>',
                timestamp
            });
            return outputs;
        }

        const scriptCommand = args.join(' ');
        
        // Miew script execution is handled by the WebView
        // The command is sent to WebView for execution, and results are displayed there
        outputs.push({
            type: 'stdout',
            content: `${scriptCommand}`,
            timestamp
        });

        return outputs;
    }

    /**
     * Get help output
     */
    private getHelpOutput(): TerminalOutput {
        const helpText = 'CCView Commands:\n\n' +
            '  ccget <property>              - Extract property from comp chem file\n' +
            '  ccwrite <format> [filename]   - Convert current file to specified format\n' +
            '  miew <command>                - Execute miew viewer command\n' +
            '  help                          - Show this help message\n' +
            '  clear                         - Clear terminal screen\n\n' +
            'Examples:\n' +
            '  ccget atomcharges\n' +
            '  ccget scfenergies\n' +
            '  ccwrite xyz\n' +
            '  ccwrite xyz output.xyz\n' +
            '  miew rep 0 m=LC\n' +
            '  miew set autoRotation 0.5\n' +
            '  miew screenshot';

        return {
            type: 'stdout',
            content: helpText,
            timestamp: Date.now()
        };
    }

    /**
     * Get command history
     */
    getCommandHistory(): string[] {
        return [...this.commandHistory];
    }

    /**
     * Navigate command history
     */
    navigateHistory(direction: 'up' | 'down'): string | null {
        if (direction === 'up' && this.historyIndex > 0) {
            this.historyIndex--;
            return this.commandHistory[this.historyIndex] || '';
        } else if (direction === 'down' && this.historyIndex < this.commandHistory.length) {
            this.historyIndex++;
            return this.historyIndex < this.commandHistory.length 
                ? this.commandHistory[this.historyIndex] 
                : '';
        }
        return null;
    }

    /**
     * Clear command history
     */
    clearHistory(): void {
        this.commandHistory = [];
        this.historyIndex = 0;
    }



    /**
     * Resolve output path to ensure it's writable
     */
    private resolveOutputPath(outputPath: string): string {
        // If outputPath is already an absolute path, return as is
        if (path.isAbsolute(outputPath)) {
            return outputPath;
        }

        // Get workspace root directory
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            // Use the first workspace folder as the base directory
            return path.join(workspaceFolders[0].uri.fsPath, outputPath);
        }

        // If no workspace, use the directory of the current file
        if (this.currentFile) {
            return path.join(path.dirname(this.currentFile), outputPath);
        }

        // Fallback to current working directory
        return path.resolve(outputPath);
    }
} 