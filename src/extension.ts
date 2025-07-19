import * as vscode from 'vscode';
import { FileDetector } from './fileDetector';
import { ParserInterface } from './parserInterface';
import { WebViewManager } from './webViewManager';
import { PythonManager } from './pythonManager';
import { TerminalManager } from './terminalManager';

/**
 * CCView VS Code Extension
 * 
 * This extension provides computational chemistry output file viewing capabilities
 * using cclib for parsing and miew for 3D molecular visualization.
 */
export function activate(context: vscode.ExtensionContext) {

    // Initialize managers
    const fileDetector = new FileDetector();
    const pythonManager = new PythonManager();
    const parserInterface = new ParserInterface(pythonManager);
    const webViewManager = new WebViewManager(context.extensionUri);
    const terminalManager = new TerminalManager(parserInterface);
    
    // Set terminal manager in web view manager
    webViewManager.setTerminalManager(terminalManager);

    // Register commands
    const openViewerCommand = vscode.commands.registerCommand('ccview.openViewer', async () => {
        try {
            // Get active text editor
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showErrorMessage('No active file to parse');
                return;
            }

            const filePath = activeEditor.document.uri.fsPath;
            
            // Detect file type
            const fileType = await fileDetector.detectFileType(filePath);
            if (!fileType.isValid) {
                vscode.window.showErrorMessage(fileType.error || 'File format not supported');
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Opening molecular viewer...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Set current file for terminal commands
                terminalManager.setCurrentFile(filePath);

                // Process based on file type
                if (fileType.parser === 'direct') {
                    // Direct loading for PDB, CIF, XYZ files
                    progress.report({ increment: 30, message: "Loading file directly..." });
                    await webViewManager.createDirectViewer(filePath);
                } else {
                    // cclib parsing for quantum chemistry files
                    progress.report({ increment: 30, message: "Parsing file with cclib..." });
                    const result = await parserInterface.parseFile(filePath);
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to parse file');
                    }

                    progress.report({ increment: 50, message: "Opening viewer..." });
                    
                    // Open WebView with parsed data
                    await webViewManager.createViewer(result);
                }
                
                progress.report({ increment: 100 });
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error opening CCView: ${error}`);
        }
    });

    const parseFileCommand = vscode.commands.registerCommand('ccview.parseFile', async () => {
        try {
            // Show file picker
            const uris = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Molecular Structure Files': ['pdb', 'cif', 'xyz'],
                    'Computational Chemistry Files': ['log', 'out']
                }
            });

            if (!uris || uris.length === 0) {
                return;
            }

            const filePath = uris[0].fsPath;
            
            // Detect file type
            const fileType = await fileDetector.detectFileType(filePath);
            if (!fileType.isValid) {
                vscode.window.showErrorMessage(fileType.error || 'File format not supported');
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Opening molecular viewer...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Set current file for terminal commands
                terminalManager.setCurrentFile(filePath);

                // Process based on file type
                if (fileType.parser === 'direct') {
                    // Direct loading for PDB, CIF, XYZ files
                    progress.report({ increment: 30, message: "Loading file directly..." });
                    await webViewManager.createDirectViewer(filePath);
                } else {
                    // cclib parsing for quantum chemistry files
                    progress.report({ increment: 30, message: "Parsing file with cclib..." });
                    const result = await parserInterface.parseFile(filePath);
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to parse file');
                    }

                    progress.report({ increment: 50, message: "Opening viewer..." });
                    
                    // Open WebView with parsed data
                    await webViewManager.createViewer(result);
                }
                
                progress.report({ increment: 100 });
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing file: ${error}`);
        }
    });

    // Register file system watcher for automatic detection
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{log,out,pdb,cif,xyz}');
    
    const onDidCreate = fileWatcher.onDidCreate(async (uri) => {
        // Optional: Auto-detect and show notification for new quantum chemistry files
        const isSupported = await fileDetector.isValidFile(uri.fsPath);
        if (isSupported) {
            vscode.window.showInformationMessage(
                `Quantum chemistry file detected: ${uri.fsPath}`,
                'Open with CCView'
            ).then(selection => {
                if (selection === 'Open with CCView') {
                    vscode.commands.executeCommand('ccview.openViewer');
                }
            });
        }
    });

    // Add commands to context
    context.subscriptions.push(openViewerCommand);
    context.subscriptions.push(parseFileCommand);
    context.subscriptions.push(fileWatcher);
    context.subscriptions.push(onDidCreate);

    // Check Python environment on activation
    pythonManager.validateEnvironment().then((status: any) => {
        if (!status.isValid) {
            vscode.window.showWarningMessage(
                'CCView: Python environment not properly configured. Some features may not work.',
                'Configure Python'
            ).then(selection => {
                if (selection === 'Configure Python') {
                    vscode.commands.executeCommand('python.selectInterpreter');
                }
            });
        }
    });
}

export function deactivate() {
} 