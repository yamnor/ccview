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

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
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
        
        if (this.terminalManager && command.type === 'terminal') {
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
        } else {
        }
    }

    /**
     * Get unified WebView HTML content for both molecular data and direct file loading
     */
    private async getUnifiedViewerContent(options: {
        webview: vscode.Webview;
        hasTerminal: boolean;
        dataSource: 'molecular' | 'direct';
        data: MolecularData | string;
        filePath?: string;
    }): Promise<string> {
        const miewCdnUrl = 'https://unpkg.com/miew@0.11.0/dist/Miew.min.js';
        const miewCssUrl = 'https://unpkg.com/miew@0.11.0/dist/Miew.min.css';
        const threeJsUrl = 'https://unpkg.com/three@0.153.0/build/three.min.js';
        const lodashUrl = 'https://unpkg.com/lodash@^4.17.21/lodash.js';
        const xtermJsUrl = 'https://unpkg.com/xterm@5.3.0/lib/xterm.js';
        const xtermCssUrl = 'https://unpkg.com/xterm@5.3.0/css/xterm.css';
        const xtermFitUrl = 'https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js';
        const xtermWebLinksUrl = 'https://unpkg.com/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.js';

        // Build HTML content in parts to avoid template literal nesting issues
        const headContent = this.getHeadContent(miewCdnUrl, miewCssUrl, threeJsUrl, lodashUrl, xtermJsUrl, xtermCssUrl, xtermFitUrl, xtermWebLinksUrl, options.hasTerminal);
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
    private getHeadContent(miewCdnUrl: string, miewCssUrl: string, threeJsUrl: string, lodashUrl: string, xtermJsUrl: string, xtermCssUrl: string, xtermFitUrl: string, xtermWebLinksUrl: string, hasTerminal: boolean): string {
        return `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCView - Molecular Viewer</title>
    
    <!-- External Libraries -->
    <script src="${lodashUrl}"></script>
    <script src="${threeJsUrl}"></script>
    <script src="${miewCdnUrl}"></script>
    <link rel="stylesheet" href="${miewCssUrl}" />
    <script src="${xtermJsUrl}"></script>
    <link rel="stylesheet" href="${xtermCssUrl}" />
    <script src="${xtermFitUrl}"></script>
    <script src="${xtermWebLinksUrl}"></script>
    
    <style>
        ${this.getCommonStyles(hasTerminal)}
    </style>
    
    <!-- VS Code Codicon CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css">
</head>`;
    }

    /**
     * Get HTML body content
     */
    private getBodyContent(options: {
        hasTerminal: boolean;
        dataSource: 'molecular' | 'direct';
        filePath?: string;
    }): string {
        const terminalButton = options.hasTerminal ? `
                    <button id="toggle-terminal" class="icon-button" title="Terminal">
                        <span class="codicon codicon-terminal"></span>
                        Terminal
                    </button>` : '';



        const terminalContainer = options.hasTerminal ? `
        <div id="terminal-container" class="terminal-container">
            <div id="terminal"></div>
        </div>` : '';

        // Check if this is a PDB file for additional representation options
        const isPDBFile = options.dataSource === 'direct' && 
                         options.filePath?.toLowerCase().endsWith('.pdb');

        // Generate representation options based on file type
        const representationOptions = isPDBFile ? `
                        <option value="LC">Licorice</option>
                        <option value="BS">Ball & Stick</option>
                        <option value="VW">Van der Waals</option>
                        <option value="LN">Lines</option>
                        <option value="CA" selected>Cartoon</option>
                        <option value="TU">Tube</option>` : `
                        <option value="LC">Licorice</option>
                        <option value="BS" selected>Ball & Stick</option>
                        <option value="VW">Van der Waals</option>
                        <option value="LN">Lines</option>`;

        // Generate color options based on file type
        const colorOptions = isPDBFile ? `
                        <option value="EL">Element</option>
                        <option value="CH">Chain</option>
                        <option value="SS" selected>Structure</option>
                        <option value="RE">Residue</option>
                        <option value="UN">Uniform</option>` : `
                        <option value="EL" selected>Element</option>`;

        // Generate color control group based on file type
        const colorControlGroup = isPDBFile ? `
                <div class="control-group">
                    <label>Color:</label>
                    <select id="colorer">
                        ${colorOptions}
                    </select>
                </div>` : '';

        return `<body>
    <div class="container">
        <div class="header">
            <div class="controls">
                <div class="control-group">
                    <label>Style:</label>
                    <select id="representation">
                        ${representationOptions}
                    </select>
                </div>
                
                ${colorControlGroup}
                
                <div class="control-group">
                    ${terminalButton}
                </div>
            </div>
        </div>
        
        <div class="viewer-container">
            <div id="miew-container" class="miew-container"></div>
            
            <div id="loading" class="loading">
                Loading molecular viewer...
            </div>
            
            <div id="error" class="error" style="display: none;"></div>
        </div>
        
        ${terminalContainer}
    </div>
</body>`;
    }

    /**
     * Get JavaScript content
     */
    private getScriptContent(options: {
        hasTerminal: boolean;
        dataSource: 'molecular' | 'direct';
        data: MolecularData | string;
        filePath?: string;
    }): string {
        const molecularDataScript = options.dataSource === 'molecular' ? `
            // Molecular data from VS Code extension
            const molecularData = ${JSON.stringify(options.data)};` : '';

        const terminalVars = options.hasTerminal ? 'let terminal = null;' : '';
        const terminalContainerVar = options.hasTerminal ? 'const terminalContainer = document.getElementById("terminal-container");' : '';
        const toggleTerminalButtonVar = options.hasTerminal ? 'const toggleTerminalButton = document.getElementById("toggle-terminal");' : '';

        // Check if this is a PDB file for additional controls
        const isPDBFile = options.dataSource === 'direct' && 
                         options.filePath?.toLowerCase().endsWith('.pdb');
        const colorerVar = isPDBFile ? 'const colorerSelect = document.getElementById("colorer");' : '';

        const molecularDataCheck = options.dataSource === 'molecular' ? `
                    // Check if molecular data is valid
                    if (!molecularData.success) {
                        throw new Error(molecularData.error || 'Failed to parse molecular data');
                    }` : '';

        const terminalInit = options.hasTerminal ? `
                    // Initialize terminal
                    await initializeTerminal();` : '';

        const updateInfoPanel = options.dataSource === 'molecular' ? `
                    // Update info panel
                    updateInfoPanel();` : '';

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
                    console.log('File loaded successfully');
                } catch (error) {
                    console.error('File loading error:', error);
                    showError('Failed to load file: ' + error.message);
                }
            }`;

        const terminalFunctions = options.hasTerminal ? `
            // Initialize terminal
            async function initializeTerminal() {
                while (typeof Terminal === 'undefined') {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                terminal = new Terminal({
                    cursorBlink: true,
                    fontSize: 12,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    rows: 15,
                    theme: {
                        background: 'transparent',
                        foreground: '#ffffff',
                        cursor: '#ffffff',
                        selection: 'rgba(38, 79, 120, 0.8)'
                    },
                    allowTransparency: true
                });
                
                const fitAddon = new FitAddon.FitAddon();
                const webLinksAddon = new WebLinksAddon.WebLinksAddon();
                
                terminal.loadAddon(fitAddon);
                terminal.loadAddon(webLinksAddon);
                
                terminal.open(document.getElementById('terminal'));
                fitAddon.fit();
                
                terminal.onData((data) => {
                    handleTerminalInput(data);
                });
                
                window.addEventListener('resize', () => {
                    if (terminalContainer.classList.contains('active')) {
                        fitAddon.fit();
                    }
                });
                
                terminal.writeln('\\x1b[1;32mCCView Terminal\\x1b[0m');
                terminal.writeln('Type \\x1b[1;33mhelp\\x1b[0m for available commands.');
                terminal.writeln('');
                terminal.write('\\x1b[1;32m>\\x1b[0m ');
            }` : '';

        const terminalToggle = options.hasTerminal ? `
                // Toggle terminal
                toggleTerminalButton.addEventListener('click', () => {
                    terminalContainer.classList.toggle('active');
                    
                    // Execute resize when terminal is shown
                    if (terminalContainer.classList.contains('active')) {
                        setTimeout(() => {
                            if (fitAddon) {
                                fitAddon.fit();
                            }
                        }, 100);
                    }
                });` : '';

        const terminalResize = options.hasTerminal ? `
                    // Handle terminal resize as well
                    if (terminalContainer.classList.contains('active') && fitAddon) {
                        fitAddon.fit();
                    }` : '';



        // Generate event handlers based on file type
        const representationEventHandler = isPDBFile ? `
                // Representation change with colorer support
                representationSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = e.target.value;
                        const colorer = colorerSelect ? colorerSelect.value : 'EL';
                        viewer.rep(0, { mode: mode, colorer: colorer });
                    }
                });` : `
                // Representation change
                representationSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = e.target.value;
                        viewer.rep(0, { mode: mode });
                    }
                });`;

        const colorerEventHandler = isPDBFile ? `
                // Colorer change
                colorerSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = representationSelect.value;
                        const colorer = e.target.value;
                        viewer.rep(0, { mode: mode, colorer: colorer });
                    }
                });` : '';

        const terminalMessageHandling = options.hasTerminal ? `
            // Message handling for VS Code communication
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.type) {
                    case 'command':
                        handleCommand(message.payload);
                        break;
                    case 'data':
                        handleData(message.payload);
                        break;
                    case 'terminal_output':
                        handleTerminalOutput(message.payload);
                        break;
                    default:
                }
            });
            
            // Handle terminal input
            let currentLine = '';
            
            function handleTerminalInput(data) {
                if (data === '\\r') {
                    // Enter key pressed
                    terminal.writeln('');
                    executeTerminalCommand(currentLine);
                    currentLine = '';
                    // Don't add prompt here - it will be added after command execution
                } else if (data === '\\u007f') {
                    // Backspace
                    if (currentLine.length > 0) {
                        currentLine = currentLine.slice(0, -1);
                        terminal.write('\\b \\b');
                    }
                } else if (data.charCodeAt(0) < 32) {
                    // Control characters (except backspace)
                    return;
                } else {
                    // Regular character
                    currentLine += data;
                    terminal.write(data);
                }
            }
            
            // Execute terminal command
            async function executeTerminalCommand(command) {
                if (!command.trim()) {
                    // Show prompt only for empty commands
                    terminal.write('\\x1b[1;32m>\\x1b[0m ');
                    return;
                }
                
                // Check if it's a miew command
                if (command.toLowerCase().startsWith('miew ')) {
                    const miewCommand = command.substring(5); // Remove 'miew ' prefix
                    executeMiewScript(miewCommand);
                } else {
                    // Send command to VS Code extension
                    sendMessage('command', {
                        type: 'terminal',
                        command: command
                    });
                }
            }
            
            // Execute miew script
            function executeMiewScript(scriptCommand) {
                if (viewer && typeof viewer.script === 'function') {
                    try {
                        viewer.script(scriptCommand, 
                            (str) => {
                                // Success callback
                                if (terminal) {
                                    terminal.writeln(str);
                                    terminal.write('\\x1b[1;32m>\\x1b[0m ');
                                }
                            }, 
                            (str) => {
                                // Error callback
                                if (terminal) {
                                    terminal.writeln(\`\\x1b[1;31mError: \${str}\\x1b[0m\`);
                                    terminal.write('\\x1b[1;32m>\\x1b[0m ');
                                }
                            }
                        );
                        
                    } catch (err) {
                        if (terminal) {
                            terminal.writeln(\`\\x1b[1;31mError: \${err.message}\\x1b[0m\`);
                            terminal.write('\\x1b[1;32m>\\x1b[0m ');
                        }
                    }
                } else {
                    if (terminal) {
                        terminal.writeln('\\x1b[1;31mError: Miew viewer not available\\x1b[0m');
                        terminal.write('\\x1b[1;32m>\\x1b[0m ');
                    }
                }
            }
            
            // Handle commands from VS Code
            function handleCommand(command) {
                // TODO: Implement command handling
            }
            
            // Handle data from VS Code
            function handleData(data) {
                // TODO: Implement data handling
            }
            
            // Handle terminal output from VS Code
            function handleTerminalOutput(output) {
                if (terminal) {
                    if (output.type === 'stdout') {
                        // Split content by newlines and write each line separately
                        const lines = output.content.split('\\n');
                        for (let i = 0; i < lines.length; i++) {
                            if (i === lines.length - 1 && lines[i] === '') {
                                // Skip empty last line to avoid extra newline
                                break;
                            }
                            terminal.writeln(lines[i]);
                        }
                    } else if (output.type === 'stderr') {
                        terminal.writeln(\`\\x1b[1;31m\${output.content}\\x1b[0m\`);
                    } else if (output.type === 'error') {
                        terminal.writeln(\`\\x1b[1;31mError: \${output.content}\\x1b[0m\`);
                    }
                    // Add prompt after all output is complete
                    terminal.write('\\x1b[1;32m>\\x1b[0m ');
                } else {
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
            }` : '';

        return `<script>
        (function() {
            ${molecularDataScript}
            
            // Global variables
            let viewer = null;
            ${terminalVars}
            
            // DOM elements
            const miewContainer = document.getElementById('miew-container');
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            ${terminalContainerVar}
            
            // Control elements
            const representationSelect = document.getElementById('representation');
            ${toggleTerminalButtonVar}
            ${colorerVar}
            
            // Initialize the application
            async function initialize() {
                try {
                    ${molecularDataCheck}
                    
                    // Initialize miew viewer
                    await initializeMiewViewer();
                    
                    ${terminalInit}
                    
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
                // Wait for miew to be available
                while (typeof Miew === 'undefined') {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Create miew viewer with optimized settings
                viewer = new Miew({
                    container: miewContainer,
                    settings: {
                        autoPreset: false,
                        bg: { color: 0x000000 },
                        fog: { enabled: false },
                        fps: false,
                        axes: false,
                        resolution: 'medium'
                    },
                    reps: [{
                        mode: '${isPDBFile ? 'CA' : 'BS'}',
                        colorer: '${isPDBFile ? 'SS' : 'EL'}',
                        selector: 'all',
                        material: 'SF'
                    }]
                });
                
                if (viewer.init()) {
                    ${molecularDataLoad}
                    
                    // Set default representation for PDB files
                    ${isPDBFile ? `
                    // Apply default PDB representation (Cartoon + Secondary Structure)
                    setTimeout(() => {
                        if (viewer) {
                            viewer.rep(0, { mode: 'CA', colorer: 'SS' });
                        }
                    }, 500);` : ''}
                    
                    // Start rendering
                    viewer.run();
                    
                    // Initial resize handling
                    setTimeout(() => {
                        if (viewer && viewer._onResize) {
                            viewer._onResize();
                        }
                    }, 100);
                } else {
                    throw new Error('Failed to initialize miew viewer');
                }
            }
            
            ${molecularDataFunctions}
            
            ${terminalFunctions}
            
            // Setup event listeners
            function setupEventListeners() {
                ${representationEventHandler}
                
                ${colorerEventHandler}
                
                ${terminalToggle}
                
                // Complete resize handling
                const resizeObserver = new ResizeObserver(() => {
                    if (viewer && viewer._onResize) {
                        viewer._onResize();
                    }
                    ${terminalResize}
                });
                
                resizeObserver.observe(miewContainer);
            }
            

            
            ${terminalMessageHandling}
            
            // Start initialization
            initialize();
            
        })();
    </script>`;
    }

    /**
     * Get common styles for both viewer types
     */
    private getCommonStyles(hasTerminal: boolean): string {
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
        
        .header {
            flex-shrink: 0;
            padding: 10px;
            background-color: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
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
        
        .icon-button {
            min-width: 60px;
            height: 26px;
            padding: 2px 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 12px;
            font-weight: 500;
        }
        
        .icon-button:hover {
            background-color: var(--vscode-button-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }
        
        .icon-button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 1px;
        }
        
        .icon-button .codicon {
            font-size: 16px;
            color: inherit;
            vertical-align: middle;
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
        `;

        const terminalStyles = hasTerminal ? `
        .terminal-container {
            position: absolute;
            top: 60px;
            left: 10px;
            right: 10px;
            height: 220px;
            z-index: 1000;
            display: none;
            transition: all 0.3s ease;
        }
        
        .terminal-container.active {
            display: block;
        }
        
        #terminal {
            height: 100% !important;
            width: 100% !important;
            box-sizing: border-box;
            overflow: hidden;
        }
        #terminal .xterm,
        #terminal .xterm-viewport,
        #terminal .xterm-screen {
            height: 100% !important;
            box-sizing: border-box;
        }
        #terminal .xterm-viewport {
            background: transparent !important;
        }

        #terminal .xterm-screen {
            width: 100% !important;
            background: rgba(0, 0, 0, 0.7) !important;
            padding: 4px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        #terminal canvas {
            background: transparent !important;
        }
        ` : '';

        return baseStyles + terminalStyles;
    }

    



    

    /**
     * Get WebView HTML content
     */
    private async getWebviewContent(webview: vscode.Webview, molecularData: MolecularData): Promise<string> {
        return this.getUnifiedViewerContent({
            webview,
            hasTerminal: true,
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
            hasTerminal: false,
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
            this.currentPanel = undefined;
        }
    }
} 