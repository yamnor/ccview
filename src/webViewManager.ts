import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MolecularData } from './parserInterface';
import { TerminalManager, TerminalCommand, TerminalOutput } from './terminalManager';

/**
 * WebView message types
 */
export interface WebViewMessage {
    type: 'data' | 'command' | 'error' | 'status' | 'terminal_output';
    payload: any;
    timestamp: number;
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: WebViewMessage) => void;

/**
 * WebView manager for miew viewer integration
 */
export class WebViewManager {
    private extensionUri: vscode.Uri;
    private currentPanel: vscode.WebviewPanel | undefined;
    private terminalManager: TerminalManager | undefined;
    
    // Output channels for structured data
    private textChannel: vscode.OutputChannel;
    private jsonChannel: vscode.OutputChannel;
    private logChannel: vscode.LogOutputChannel;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
        
        // Initialize output channels
        this.textChannel = vscode.window.createOutputChannel('CCView');
        this.jsonChannel = vscode.window.createOutputChannel('CCView JSON', 'json');
        this.logChannel = vscode.window.createOutputChannel('CCView Log', { log: true });
    }

    /**
     * Set terminal manager
     */
    setTerminalManager(terminalManager: TerminalManager): void {
        this.terminalManager = terminalManager;
    }

    /**
     * Create miew viewer WebView
     */
    async createViewer(molecularData: MolecularData): Promise<vscode.WebviewPanel> {
        // Close existing panel if any
        if (this.currentPanel) {
            this.currentPanel.dispose();
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'ccview',
            'CCView',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media'),
                    vscode.Uri.joinPath(this.extensionUri, 'out')
                ]
            }
        );

        this.currentPanel = panel;

        // Set WebView content
        panel.webview.html = await this.getWebviewContent(panel.webview, molecularData);

        // Handle messages from WebView
        panel.webview.onDidReceiveMessage(
            (message: WebViewMessage) => {
                this.handleWebViewMessage(message);
            },
            undefined,
            []
        );

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.currentPanel = undefined;
        });

        return panel;
    }

    /**
     * Create direct file viewer (for PDB, CIF, XYZ files)
     */
    async createDirectViewer(filePath: string): Promise<vscode.WebviewPanel> {
        // Close existing panel if any
        if (this.currentPanel) {
            this.currentPanel.dispose();
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'ccview',
            'CCView - Molecular Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media'),
                    vscode.Uri.joinPath(this.extensionUri, 'out')
                ]
            }
        );

        this.currentPanel = panel;

        // Set WebView content for direct file loading
        panel.webview.html = await this.getDirectViewerContent(panel.webview, filePath);

        // Handle messages from WebView
        panel.webview.onDidReceiveMessage(
            (message: WebViewMessage) => {
                this.handleWebViewMessage(message);
            },
            undefined,
            []
        );

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.currentPanel = undefined;
        });

        return panel;
    }

    /**
     * Send message to WebView
     */
    async sendMessage(message: WebViewMessage): Promise<void> {
        if (this.currentPanel) {
            this.currentPanel.webview.postMessage(message);
        } else {
        }
    }

    /**
     * Handle messages from WebView
     */
    private handleWebViewMessage(message: WebViewMessage): void {
        
        switch (message.type) {
            case 'command':
                this.handleCommand(message.payload);
                break;
            case 'error':
                vscode.window.showErrorMessage(`CCView Error: ${message.payload}`);
                break;
            case 'status':
                vscode.window.showInformationMessage(`CCView: ${message.payload}`);
                break;
            default:
        }
    }

    /**
     * Handle commands from WebView
     */
    private async handleCommand(command: any): Promise<void> {
        
        if (command.type === 'miew_input') {
            // Handle miew command output
            this.logChannel.info(`Miew command executed: ${command.content}`);
            this.textChannel.appendLine(`> ${command.content}`);
            this.textChannel.show();
            
        } else if (command.type === 'miew_output') {
            // Handle miew command result
            if (command.success) {
                if (command.content && command.content.trim()) {
                    this.textChannel.appendLine(command.content);
                }
            } else {
                this.textChannel.appendLine(`Error: ${command.content}`);
            }
            this.textChannel.show();
            
        } else if (command.type === 'user_input' && this.terminalManager) {
            try {
                // Log command execution
                this.logChannel.info(`Command executed: ${command.content}`);
                
                // Execute command
                const terminalCommand = this.terminalManager.parseCommand(command.content);
                const outputs = await this.terminalManager.executeCommand(terminalCommand);
                
                // Output to appropriate channels
                for (const output of outputs) {
                    const targetChannel = this.determineOutputChannel(output);
                    
                    // Show command
                    targetChannel.appendLine(`> ${command.content}`);
                    
                    // Show result
                    if (output.type === 'stdout') {
                        const formattedContent = this.formatOutput(output, command.content);
                        targetChannel.appendLine(formattedContent);
                    } else if (output.type === 'stderr') {
                        targetChannel.appendLine(`Error: ${output.content}`);
                    } else if (output.type === 'error') {
                        targetChannel.appendLine(`Error: ${output.content}`);
                    }
                    
                    // Show channel and ensure it's visible
                    targetChannel.show();
                    // VS Code automatically scrolls to bottom when new content is added
                }
                
                // Send outputs back to WebView (existing functionality)
                for (const output of outputs) {
                    await this.sendMessage({
                        type: 'terminal_output',
                        payload: output,
                        timestamp: Date.now()
                    });
                }
                
            } catch (error) {
                this.logChannel.error(`Command execution failed: ${error}`);
                this.textChannel.appendLine(`> ${command.content}`);
                this.textChannel.appendLine(`Error: ${error}`);
                this.textChannel.show();
            }
        } else if (this.terminalManager && command.type === 'terminal') {
            try {
                const terminalCommand = this.terminalManager.parseCommand(command.command);
                
                const outputs = await this.terminalManager.executeCommand(terminalCommand);
                
                // Send outputs back to WebView
                for (const output of outputs) {
                    await this.sendMessage({
                        type: 'terminal_output',
                        payload: output,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                await this.sendMessage({
                    type: 'terminal_output',
                    payload: {
                        type: 'error',
                        content: `Command execution error: ${error}`,
                        timestamp: Date.now()
                    },
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Determine which output channel to use for a given terminal output
     */
    private determineOutputChannel(output: TerminalOutput): vscode.OutputChannel {
        // Check if content is JSON data
        if (this.isJsonData(output.content)) {
            return this.jsonChannel;
        }
        
        // Check if content is XML data
        if (this.isXmlData(output.content)) {
            return this.jsonChannel; // Use JSON channel for XML syntax highlighting
        }
        
        // Default to text channel for all other content
        return this.textChannel;
    }

    /**
     * Check if content is JSON data
     */
    private isJsonData(content: string): boolean {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if content is XML data
     */
    private isXmlData(content: string): boolean {
        const trimmed = content.trim();
        return trimmed.startsWith('<') && trimmed.includes('>');
    }

    /**
     * Format output content for display in output channels
     */
    private formatOutput(output: TerminalOutput, command: string): string {
        // Handle clear command specially
        if (command === 'clear') {
            // Clear all output channels
            this.textChannel.clear();
            this.jsonChannel.clear();
            this.logChannel.clear();
            return 'Terminal cleared';
        }
        
        // ccget command formatting
        if (command.startsWith('ccget ')) {
            return this.formatCcgetOutput(output);
        }
        
        // ccwrite command formatting
        if (command.startsWith('ccwrite ')) {
            return this.formatCcwriteOutput(output);
        }
        
        // miew command formatting
        if (command.startsWith('miew ')) {
            return this.formatMiewOutput(output);
        }
        
        // Default formatting
        return output.content;
    }

    /**
     * Format ccget command output
     */
    private formatCcgetOutput(output: TerminalOutput): string {
        // TerminalManager already formats the output, just return as is
        return output.content;
    }

    /**
     * Format ccwrite command output
     */
    private formatCcwriteOutput(output: TerminalOutput): string {
        // ccwrite often returns JSON or structured data
        if (this.isJsonData(output.content)) {
            try {
                const parsed = JSON.parse(output.content);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return output.content;
            }
        }
        return output.content;
    }

    /**
     * Format miew command output
     */
    private formatMiewOutput(output: TerminalOutput): string {
        // miew commands typically return simple status messages
        return output.content;
    }

    /**
     * Format atom coordinates for better readability
     * TODO: Commented out to use generic data type formatter
     */
    /*
    private formatAtomCoords(coords: number[][][]): string {
        let result = 'atomcoords:\n';
        
        coords.forEach((step, stepIndex) => {
            result += `\nStep ${stepIndex + 1}:\n`;
            step.forEach((atom, atomIndex) => {
                const [x, y, z] = atom;
                result += `  Atom ${atomIndex + 1}: [${x.toFixed(6)}, ${y.toFixed(6)}, ${z.toFixed(6)}]\n`;
            });
        });
        
        return result;
    }
    */



    /**
     * Format general array data for better readability
     */
    private formatArrayData(propertyName: string, data: any[]): string {
        let result = `${propertyName}:\n`;
        
        if (data.length === 0) {
            return result + '  (empty array)\n';
        }
        
        // Check if it's a simple array of numbers
        if (data.every(item => typeof item === 'number')) {
            result += '  [' + data.map(num => num.toFixed(6)).join(', ') + ']\n';
            return result;
        }
        
        // Check if it's an array of arrays (2D)
        if (data.every(item => Array.isArray(item) && item.every(subItem => typeof subItem === 'number'))) {
            data.forEach((row, index) => {
                result += `  [${index}]: [${row.map(num => num.toFixed(6)).join(', ')}]\n`;
            });
            return result;
        }
        
        // Default formatting for complex arrays
        return `${propertyName}:\n${JSON.stringify(data, null, 2)}`;
    }

    /**
     * Get unified WebView HTML content for both molecular data and direct file loading
     */
    private async getUnifiedViewerContent(options: {
        webview: vscode.Webview;
        dataSource: 'molecular' | 'direct';
        data: MolecularData | string;
        filePath?: string;
    }): Promise<string> {
        // Use local bundled resources instead of CDN
        const viewerJsUri = options.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'viewer.js')
        );
        const miewCssUri = options.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'miew.min.css')
        );
        const lodashUri = options.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'lodash.js')
        );

        // Build HTML content in parts to avoid template literal nesting issues
        const headContent = this.getHeadContent(viewerJsUri, miewCssUri, lodashUri);
        const bodyContent = this.getBodyContent(options);
        const scriptContent = this.getScriptContent(options);

        return `<!DOCTYPE html>
<html lang="en">
${headContent}
${bodyContent}
${scriptContent}
</html>`;
    }

    /**
     * Get HTML head content
     */
    private getHeadContent(viewerJsUri: vscode.Uri, miewCssUri: vscode.Uri, lodashUri: vscode.Uri): string {
        return `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCView - Molecular Viewer</title>
    
    <!-- External Libraries -->
    <script src="${lodashUri}"></script>
    <script src="${viewerJsUri}"></script>
    <link rel="stylesheet" href="${miewCssUri}" />
    
    <style>
        ${this.getCommonStyles()}
    </style>
    

</head>`;
    }

    /**
     * Get HTML body content
     */
    private getBodyContent(options: {
        dataSource: 'molecular' | 'direct';
        filePath?: string;
    }): string {
        // Generate representation options (always show all options)
        const representationOptions = `
                        <option value="BS" selected>Ball & Stick</option>
                        <option value="LC">Licorice</option>
                        <option value="VW">Van der Waals</option>
                        <option value="LN">Lines</option>
                        <option value="CA">Cartoon</option>
                        <option value="TU">Tube</option>`;

        // Generate color options (always show all options)
        const colorOptions = `
                        <option value="EL" selected>Element</option>
                        <option value="SS">Structure</option>
                        <option value="RE">Residue</option>
                        <option value="CH">Chain</option>
                        <option value="UN">Uniform</option>`;

        return `<body>
    <div class="container">
        <div class="viewer-container">
            <div id="miew-container" class="miew-container"></div>
            
            <div id="loading" class="loading">
                Loading molecular viewer...
            </div>
            
            <div id="error" class="error" style="display: none;"></div>
        </div>
        
        <div class="footer">
            <div class="controls">
                <div class="control-group">
                    <input type="text" id="user-input" placeholder="CCView: Enter command..." />
                </div>
                
                <div class="control-group">
                    <label>Style:</label>
                    <select id="representation">
                        ${representationOptions}
                    </select>
                </div>
                
                <div class="control-group">
                    <label>Color:</label>
                    <select id="colorer">
                        ${colorOptions}
                    </select>
                </div>
            </div>
        </div>
    </div>
</body>`;
    }

    /**
     * Get JavaScript content
     */
    private getScriptContent(options: {
        dataSource: 'molecular' | 'direct';
        data: MolecularData | string;
        filePath?: string;
    }): string {
        const molecularDataScript = options.dataSource === 'molecular' ? `
            // Molecular data from VS Code extension
            const molecularData = ${JSON.stringify(options.data)};` : '';

        const colorerVar = 'const colorerSelect = document.getElementById("colorer");';

        const molecularDataCheck = options.dataSource === 'molecular' ? `
                    // Check if molecular data is valid
                    if (!molecularData.success) {
                        throw new Error(molecularData.error || 'Failed to parse molecular data');
                    }` : '';

        const molecularDataLoad = options.dataSource === 'molecular' ? `
                    // Load molecule using XYZ content from cclib
                    await loadMolecule(molecularData.xyz_content);` : `
                    // Load file directly
                    await loadFileDirectly();`;

        const molecularDataFunctions = options.dataSource === 'molecular' ? `
            // Load molecule into viewer
            async function loadMolecule(xyzContent) {
                // Load into viewer with explicit format specification
                await viewer.load(xyzContent, { 
                    sourceType: 'immediate', 
                    fileType: 'xyz' 
                });
            }` : `
            // Load file directly
            async function loadFileDirectly() {
                try {
                    if (!viewer) {
                        throw new Error('Miew viewer not initialized');
                    }
                    
                    const fileContent = \`${options.data}\`;
                    const fileType = '${this.getFileTypeFromExtension(options.filePath?.split('.').pop()?.toLowerCase())}';
                    await viewer.load(fileContent, { 
                        sourceType: 'immediate',
                        fileType: fileType 
                    });
                } catch (error) {
                    showError('Failed to load file: ' + error.message);
                }
            }`;

        // Generate event handlers (always support both representation and colorer)
        const representationEventHandler = `
                // Representation change with colorer support
                representationSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = e.target.value;
                        const colorer = colorerSelect ? colorerSelect.value : 'EL';
                        viewer.rep(0, { mode: mode, colorer: colorer });
                    }
                });`;

        const colorerEventHandler = `
                // Colorer change
                colorerSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = representationSelect.value;
                        const colorer = e.target.value;
                        viewer.rep(0, { mode: mode, colorer: colorer });
                    }
                });`;

        return `<script>
        (function() {
            ${molecularDataScript}
            
            // Global variables
            let viewer = null;
            let commandExecuting = false; // Flag to control focus restoration
            
            // DOM elements
            const miewContainer = document.getElementById('miew-container');
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            
            // Control elements
            const representationSelect = document.getElementById('representation');
            ${colorerVar}
            
            // Input elements
            const userInput = document.getElementById('user-input');
            
            // Initialize the application
            async function initialize() {
                try {
                    ${molecularDataCheck}
                    
                    // Initialize miew viewer
                    await initializeMiewViewer();
                    
                    // Setup event listeners
                    setupEventListeners();
                    
                    // Hide loading
                    loadingElement.style.display = 'none';
                    
                } catch (error) {
                    loadingElement.style.display = 'none';
                    errorElement.textContent = 'Error initializing viewer: ' + error.message;
                    errorElement.style.display = 'block';
                }
            }
            
            // Initialize miew viewer
            async function initializeMiewViewer() {
                // Libraries are now bundled and available immediately
                if (typeof Miew === 'undefined') {
                    // Only log in development environment
                    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
                        console.error('Miew library not available');
                    }
                    throw new Error('Miew library not available');
                }
                
                // Create miew viewer with optimized settings
                viewer = new Miew({
                    container: miewContainer,
                    settings: {
                        autoPreset: false,
                        bg: { color: 0xffffff, transparent: true },
                        fog: { enabled: true },
                        fps: false,
                        axes: false,
                        resolution: 'medium'
                    },
                    reps: [{
                        mode: 'BS',
                        colorer: 'EL',
                        selector: 'all',
                        material: 'SF'
                    }]
                });
                
                if (viewer.init()) {
                    ${molecularDataLoad}
                    
                    // Start rendering
                    viewer.run();
                    
                    // Initial resize handling
                    if (viewer && viewer._onResize) {
                        viewer._onResize();
                    }
                } else {
                    throw new Error('Failed to initialize miew viewer');
                }
            }
            
            ${molecularDataFunctions}
            
            // Setup event listeners
            function setupEventListeners() {
                ${representationEventHandler}
                
                ${colorerEventHandler}
                
                // Input handling
                if (userInput) {
                    // Enter key press
                    userInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleUserInput();
                        }
                    });
                    
                    // Add focus event listener to maintain focus (conditional)
                    userInput.addEventListener('blur', () => {
                        // Only restore focus if command is not executing
                        if (!commandExecuting) {
                            setTimeout(() => {
                                if (document.activeElement !== userInput && 
                                    !document.activeElement.matches('select, button')) {
                                    userInput.focus();
                                }
                            }, 10);
                        }
                    });
                }
                
                // Complete resize handling with debouncing
                let resizeTimeout = null;
                const resizeObserver = new ResizeObserver(() => {
                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }
                    resizeTimeout = setTimeout(() => {
                        if (viewer && viewer._onResize) {
                            viewer._onResize();
                        }
                        resizeTimeout = null;
                    }, 100); // 100ms debounce
                });
                
                resizeObserver.observe(miewContainer);
            }
            
            // Handle user input
            function handleUserInput() {
                if (userInput && userInput.value.trim()) {
                    const input = userInput.value.trim();
                    
                    // Set command executing flag
                    commandExecuting = true;
                    
                    // Check if it's a miew command
                    if (input.toLowerCase().startsWith('miew ')) {
                        const miewCommand = input.substring(5); // Remove 'miew ' prefix
                        
                        // Send miew command to VS Code for output channel display
                        sendMessage('command', {
                            type: 'miew_input',
                            content: input,
                            miewCommand: miewCommand
                        });
                        
                        // Execute miew script in WebView
                        executeMiewScript(miewCommand);
                    } else {
                        // Send non-miew commands to VS Code
                        sendMessage('command', {
                            type: 'user_input',
                            content: input
                        });
                    }
                    
                    // Clear input field
                    userInput.value = '';
                    
                    // Reset command executing flag after delay and restore focus
                    setTimeout(() => {
                        commandExecuting = false;
                        // Restore focus after command execution
                        if (document.activeElement !== userInput) {
                            userInput.focus();
                        }
                    }, 500);
                }
            }
            
            // Execute miew script
            function executeMiewScript(scriptCommand) {
                if (viewer && typeof viewer.script === 'function') {
                    try {
                        viewer.script(scriptCommand, 
                            (str) => {
                                // Success callback
                                const normalizedContent = str
                                    .replace(/\\r\\n/g, '\\n')
                                    .replace(/\\r/g, '\\n');
                                
                                // Send result to VS Code for output channel display
                                sendMessage('command', {
                                    type: 'miew_output',
                                    content: normalizedContent,
                                    success: true
                                });
                            }, 
                            (str) => {
                                // Error callback
                                const normalizedContent = str
                                    .replace(/\\r\\n/g, '\\n')
                                    .replace(/\\r/g, '\\n');
                                
                                // Send error to VS Code for output channel display
                                sendMessage('command', {
                                    type: 'miew_output',
                                    content: normalizedContent,
                                    success: false
                                });
                            }
                        );
                        
                    } catch (err) {
                        const errorMsg = \`Error: \${err.message}\`;
                        
                        // Send error to VS Code for output channel display
                        sendMessage('command', {
                            type: 'miew_output',
                            content: errorMsg,
                            success: false
                        });
                    }
                } else {
                    const errorMsg = 'Error: Miew viewer not available';
                    
                    // Send error to VS Code for output channel display
                    sendMessage('command', {
                        type: 'miew_output',
                        content: errorMsg,
                        success: false
                    });
                }
            }
            
            // Initialize VS Code API
            const vscode = acquireVsCodeApi();
            
            // Send message to VS Code
            function sendMessage(type, payload) {
                try {
                    vscode.postMessage({
                        type: type,
                        payload: payload,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    // Fallback: try to use window.vscode if available
                    if (window.vscode) {
                        try {
                            window.vscode.postMessage({
                                type: type,
                                payload: payload,
                                timestamp: Date.now()
                            });
                        } catch (fallbackError) {
                        }
                    }
                }
            }
            
            // Start initialization
            initialize();
            
        })();
    </script>`;
    }

    /**
     * Get common styles for both viewer types
     */
    private getCommonStyles(): string {
        const baseStyles = `
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .footer {
            flex-shrink: 0;
            padding: 5px 10px;
            background-color: var(--vscode-titleBar-activeBackground);
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .control-group:first-child {
            flex: 1;
            min-width: 0;
        }
        
        .control-group label {
            font-size: 12px;
            font-weight: 500;
        }
        
        select, button {
            padding: 5px 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-size: 12px;
        }
        
        select:focus, button:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        

        
        .viewer-container {
            flex: 1;
            position: relative;
            min-height: 0;
        }
        
        .miew-container {
            width: 100%;
            height: 100%;
        }
        

        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .error {
            color: var(--vscode-errorForeground);
            padding: 20px;
            text-align: center;
        }
                
        #user-input {
            flex: 1;
            min-width: 200px;
            width: 100%;
            padding: 6px 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 13px;
            font-family: var(--vscode-editor-font-family);
        }
        
        #user-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
        }
        
        

        `;

        return baseStyles;
    }

    



    

    /**
     * Get WebView HTML content
     */
    private async getWebviewContent(webview: vscode.Webview, molecularData: MolecularData): Promise<string> {
        return this.getUnifiedViewerContent({
            webview,
            dataSource: 'molecular',
            data: molecularData
        });
    }

    /**
     * Get WebView HTML content for direct file loading
     */
    private async getDirectViewerContent(webview: vscode.Webview, filePath: string): Promise<string> {
        // Read file content and escape it for safe embedding
        let fileContent: string;
        try {
            fileContent = await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read file: ${error}`);
        }

        // Escape special characters for template literal
        const escapedContent = fileContent
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/\\/g, '\\\\');

        return this.getUnifiedViewerContent({
            webview,
            dataSource: 'direct',
            data: escapedContent,
            filePath
        });
    }

    /**
     * Get file type from extension
     */
    private getFileTypeFromExtension(extension: string | undefined): string {
        switch (extension) {
            case 'pdb': return 'pdb';
            case 'cif': return 'cif';
            case 'xyz': return 'xyz';
            default: return 'pdb';
        }
    }

    /**
     * Dispose WebView manager
     */
    dispose(): void {
        if (this.currentPanel) {
            this.currentPanel.dispose();
        }
        if (this.textChannel) {
            this.textChannel.dispose();
        }
        if (this.jsonChannel) {
            this.jsonChannel.dispose();
        }
        if (this.logChannel) {
            this.logChannel.dispose();
        }
    }
} 