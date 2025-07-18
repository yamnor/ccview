import * as vscode from 'vscode';
import * as path from 'path';
import { MolecularData } from './parserInterface';

/**
 * WebView message types
 */
export interface WebViewMessage {
    type: 'data' | 'command' | 'error' | 'status';
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

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
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
        panel.webview.html = this.getWebviewContent(panel.webview, molecularData);

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
                console.log('Unknown message type:', message.type);
        }
    }

    /**
     * Handle commands from WebView
     */
    private handleCommand(command: any): void {
        // Handle various commands from the WebView
        console.log('Received command from WebView:', command);
        
        // TODO: Implement command handling for ccget, ccwrite, etc.
    }

    /**
     * Get WebView HTML content
     */
    private getWebviewContent(webview: vscode.Webview, molecularData: MolecularData): string {
        const miewCdnUrl = 'https://unpkg.com/miew@0.11.0/dist/Miew.min.js';
        const miewCssUrl = 'https://unpkg.com/miew@0.11.0/dist/Miew.min.css';
        const threeJsUrl = 'https://unpkg.com/three@0.153.0/build/three.min.js';
        const lodashUrl = 'https://unpkg.com/lodash@^4.17.21/lodash.js';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCView - Molecular Viewer</title>
    
    <!-- External Libraries -->
    <script src="${lodashUrl}"></script>
    <script src="${threeJsUrl}"></script>
    <script src="${miewCdnUrl}"></script>
    <link rel="stylesheet" href="${miewCssUrl}" />
    
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            padding: 4px 8px;
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
        
        .terminal-container {
            height: 200px;
            background-color: var(--vscode-terminal-background);
            border-top: 1px solid var(--vscode-panel-border);
            display: none;
        }
        
        .terminal-container.active {
            display: block;
        }
        
        .info-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 10px;
            max-width: 300px;
            font-size: 12px;
            display: none;
        }
        
        .info-panel.active {
            display: block;
        }
        
        .info-item {
            margin-bottom: 5px;
        }
        
        .info-label {
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="controls">
                <div class="control-group">
                    <label>Representation:</label>
                    <select id="representation">
                        <option value="TU">Tube</option>
                        <option value="LC">Licorice</option>
                        <option value="CA">Cartoon</option>
                        <option value="BS" selected>Ball & Stick</option>
                        <option value="VW">Van der Waals</option>
                        <option value="LN">Lines</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label>Color:</label>
                    <select id="coloring">
                        <option value="EL" selected>Element</option>
                        <option value="CH">Chain</option>
                        <option value="UN">Uniform</option>
                        <option value="SS">Secondary Structure</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <button id="reset-view">Reset View</button>
                    <button id="toggle-info">Info</button>
                    <button id="toggle-terminal">Terminal</button>
                </div>
            </div>
        </div>
        
        <div class="viewer-container">
            <div id="miew-container" class="miew-container"></div>
            
            <div id="info-panel" class="info-panel">
                <div class="info-item">
                    <span class="info-label">Atoms:</span>
                    <span id="atom-count">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Charge:</span>
                    <span id="molecule-charge">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Multiplicity:</span>
                    <span id="molecule-multiplicity">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Format:</span>
                    <span id="file-format">-</span>
                </div>
            </div>
            
            <div id="loading" class="loading">
                Loading molecular viewer...
            </div>
            
            <div id="error" class="error" style="display: none;"></div>
        </div>
        
        <div id="terminal-container" class="terminal-container">
            <div id="terminal"></div>
        </div>
    </div>

    <script>
        (function() {
            // Molecular data from VS Code extension
            const molecularData = ${JSON.stringify(molecularData)};
            
            // Global variables
            let viewer = null;
            let terminal = null;
            
            // DOM elements
            const miewContainer = document.getElementById('miew-container');
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            const infoPanel = document.getElementById('info-panel');
            const terminalContainer = document.getElementById('terminal-container');
            
            // Control elements
            const representationSelect = document.getElementById('representation');
            const coloringSelect = document.getElementById('coloring');
            const resetViewButton = document.getElementById('reset-view');
            const toggleInfoButton = document.getElementById('toggle-info');
            const toggleTerminalButton = document.getElementById('toggle-terminal');
            
            // Initialize the application
            async function initialize() {
                try {
                    // Check if molecular data is valid
                    if (!molecularData.success) {
                        throw new Error(molecularData.error || 'Failed to parse molecular data');
                    }
                    
                    // Initialize miew viewer
                    await initializeMiewViewer();
                    
                    // Initialize terminal
                    await initializeTerminal();
                    
                    // Setup event listeners
                    setupEventListeners();
                    
                    // Update info panel
                    updateInfoPanel();
                    
                    // Hide loading
                    loadingElement.style.display = 'none';
                    
                } catch (error) {
                    console.error('Initialization error:', error);
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
                
                // Create miew viewer with optimized settings for XYZ data
                viewer = new Miew({
                    container: miewContainer,
                    // Disable auto preset to manually control representation
                    settings: {
                        autoPreset: false,
                        bg: { color: 0x000000 },
                        fog: { enabled: false },
                        fps: false,
                        axes: false,
                        resolution: 'medium'
                    },
                    // Apply small molecule preset for XYZ data
                    reps: [{
                        mode: 'BS',
                        colorer: 'EL',
                        selector: 'all',
                        material: 'SF'
                    }]
                });
                
                if (viewer.init()) {
                    // Convert molecular data to miew format
                    const miewData = convertToMiewFormat(molecularData);
                    
                    // Load molecule
                    await loadMolecule(miewData);
                    
                    // Start rendering
                    viewer.run();
                    
                    // 初期リサイズ処理
                    setTimeout(() => {
                        if (viewer && viewer._onResize) {
                            viewer._onResize();
                        }
                    }, 100);
                } else {
                    throw new Error('Failed to initialize miew viewer');
                }
            }
            
            // Convert cclib data to miew format
            function convertToMiewFormat(data) {
                if (!data.molecule || !data.molecule.atoms || !data.molecule.coordinates) {
                    throw new Error('Invalid molecular data structure');
                }
                
                const atoms = [];
                const bonds = [];
                
                // coordinatesの最終ステップのみを使用
                const coordsArray = data.molecule.coordinates;
                const lastCoords = Array.isArray(coordsArray) && coordsArray.length > 0
                    ? coordsArray[coordsArray.length - 1]
                    : [];
                
                // Convert atoms
                for (let i = 0; i < data.molecule.atoms.length; i++) {
                    const atomNum = data.molecule.atoms[i];
                    const coords = lastCoords[i];
                    
                    atoms.push({
                        id: i + 1,
                        element: getElementSymbol(atomNum),
                        x: coords ? coords[0] : 0,
                        y: coords ? coords[1] : 0,
                        z: coords ? coords[2] : 0
                    });
                }
                
                // Estimate bonds (simple distance-based approach)
                bonds.push(...estimateBonds(atoms));
                
                return {
                    atoms: atoms,
                    bonds: bonds
                };
            }
            
            // Get element symbol from atomic number
            function getElementSymbol(atomicNumber) {
                const elements = [
                    'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
                    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'
                ];
                return elements[atomicNumber - 1] || 'X';
            }
            
            // Estimate bonds based on distance
            function estimateBonds(atoms) {
                const bonds = [];
                const bondDistances = {
                    'C-C': 1.54, 'C-N': 1.47, 'C-O': 1.43, 'C-H': 1.09,
                    'N-N': 1.45, 'N-O': 1.36, 'N-H': 1.01,
                    'O-O': 1.48, 'O-H': 0.96,
                    'H-H': 0.74
                };
                
                for (let i = 0; i < atoms.length; i++) {
                    for (let j = i + 1; j < atoms.length; j++) {
                        const atom1 = atoms[i];
                        const atom2 = atoms[j];
                        
                        const distance = Math.sqrt(
                            Math.pow(atom1.x - atom2.x, 2) +
                            Math.pow(atom1.y - atom2.y, 2) +
                            Math.pow(atom1.z - atom2.z, 2)
                        );
                        
                        const key = [atom1.element, atom2.element].sort().join('-');
                        const maxDistance = bondDistances[key] || 2.0;
                        
                        if (distance <= maxDistance * 1.2) {
                            bonds.push({
                                atom1: atom1.id,
                                atom2: atom2.id,
                                order: 1
                            });
                        }
                    }
                }
                
                return bonds;
            }
            
            // Load molecule into viewer
            async function loadMolecule(miewData) {
                // Convert to XYZ format for miew
                let xyzContent = miewData.atoms.length + '\\n';
                xyzContent += 'Generated by CCView\\n';
                
                for (const atom of miewData.atoms) {
                    xyzContent += \`\${atom.element} \${atom.x.toFixed(6)} \${atom.y.toFixed(6)} \${atom.z.toFixed(6)}\\n\`;
                }
                
                // Load into viewer with explicit format specification
                await viewer.load(xyzContent, { 
                    sourceType: 'immediate', 
                    fileType: 'xyz' 
                });
            }
            
            // Initialize terminal
            async function initializeTerminal() {
                // Terminal will be implemented in Phase 2
                console.log('Terminal initialization placeholder');
            }
            
            // Setup event listeners
            function setupEventListeners() {
                // Representation change
                representationSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const mode = e.target.value;
                        viewer.rep(0, { mode: mode });
                    }
                });
                
                // Coloring change
                coloringSelect.addEventListener('change', (e) => {
                    if (viewer) {
                        const colorer = e.target.value;
                        viewer.rep(0, { colorer: colorer });
                    }
                });
                
                // Reset view
                resetViewButton.addEventListener('click', () => {
                    if (viewer) {
                        viewer.resetView();  // 分子を保持したままカメラ位置リセット
                    }
                });
                
                // Toggle info panel
                toggleInfoButton.addEventListener('click', () => {
                    infoPanel.classList.toggle('active');
                });
                
                // Toggle terminal
                toggleTerminalButton.addEventListener('click', () => {
                    terminalContainer.classList.toggle('active');
                });
                
                // リサイズ処理の完全対応
                const resizeObserver = new ResizeObserver(() => {
                    if (viewer && viewer._onResize) {
                        viewer._onResize();
                    }
                });
                
                resizeObserver.observe(miewContainer);
            }
            
            // Update info panel
            function updateInfoPanel() {
                if (molecularData.molecule) {
                    document.getElementById('atom-count').textContent = molecularData.molecule.natom;
                    document.getElementById('molecule-charge').textContent = molecularData.molecule.charge;
                    document.getElementById('molecule-multiplicity').textContent = molecularData.molecule.multiplicity;
                }
                
                if (molecularData.detected_format) {
                    document.getElementById('file-format').textContent = molecularData.detected_format;
                }
            }
            
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
                }
            });
            
            // Handle commands from VS Code
            function handleCommand(command) {
                console.log('Received command:', command);
                // TODO: Implement command handling
            }
            
            // Handle data from VS Code
            function handleData(data) {
                console.log('Received data:', data);
                // TODO: Implement data handling
            }
            
            // Send message to VS Code
            function sendMessage(type, payload) {
                if (window.vscode) {
                    window.vscode.postMessage({
                        type: type,
                        payload: payload,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Start initialization
            initialize();
            
        })();
    </script>
</body>
</html>`;
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