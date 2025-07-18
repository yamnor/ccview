import * as vscode from 'vscode';
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
 * Terminal manager for handling xterm.js integration and command processing
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
                    outputs.push({ type: 'stdout', content: '\x1b[2J\x1b[H', timestamp });
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
                // Format the output nicely
                let formattedOutput = `${propertyName}:`;
                
                if (typeof result.output === 'object') {
                    // For complex objects, format as JSON with indentation
                    formattedOutput += JSON.stringify(result.output, null, 2);
                } else {
                    // For simple values, just show the value
                    formattedOutput += result.output;
                }
                
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
                content: 'Usage: ccwrite <format> [file_path] [output_path]',
                timestamp
            });
            return outputs;
        }

        const format = args[0];
        const filePath = args[1] || this.currentFile;
        const outputPath = args[2];

        if (!filePath) {
            outputs.push({
                type: 'stderr',
                content: 'No file specified. Use: ccwrite <format> <file_path> [output_path]',
                timestamp
            });
            return outputs;
        }

        try {
            const result = await this.parserInterface.executeCcwrite(filePath, format, outputPath);
            
            if (result.success) {
                outputs.push({
                    type: 'stdout',
                    content: `Successfully converted to ${format} format${outputPath ? `: ${outputPath}` : ''}`,
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
        
        // This will be handled by the WebView's miew viewer
        outputs.push({
            type: 'stdout',
            content: `Executing miew script: ${scriptCommand}`,
            timestamp
        });

        // Send command to WebView for execution
        // This will be implemented in the WebView integration
        outputs.push({
            type: 'stdout',
            content: 'Miew script execution will be handled by the viewer',
            timestamp
        });

        return outputs;
    }

    /**
     * Get help output
     */
    private getHelpOutput(): TerminalOutput {
        const helpText = 'CCView Terminal Commands:\n\n' +
            '  ccget <property_name> [file_path]    - Extract property from quantum chemistry file\n' +
            '  ccwrite <format> [file_path] [output] - Convert file to specified format\n' +
            '  miew <script_command>                - Execute miew viewer script\n' +
            '  help                                 - Show this help message\n' +
            '  clear                                - Clear terminal screen\n\n' +
            'Common ccget properties:\n' +
            '  - atomnos, atomcoords, scfenergies, vibfreqs, atomcharges\n' +
            '  - moenergies, moments, polarizabilities\n\n' +
            'Supported ccwrite formats:\n' +
            '  - json, cjson, cml, xyz, molden, wfx\n\n' +
            'Examples:\n' +
            '  ccget atomnos\n' +
            '  ccget scfenergies\n' +
            '  ccwrite xyz\n' +
            '  miew rep 0 mode BS';

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
} 