import * as vscode from 'vscode';
import { FileDetector } from './fileDetector';
import { ParserInterface } from './parserInterface';
import { WebViewManager } from './webViewManager';
import { PythonManager } from './pythonManager';

/**
 * CCView VS Code Extension
 * 
 * This extension provides quantum chemistry output file viewing capabilities
 * using cclib for parsing and miew for 3D molecular visualization.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('CCView extension is now active!');

    // Initialize managers
    const fileDetector = new FileDetector();
    const pythonManager = new PythonManager();
    const parserInterface = new ParserInterface(pythonManager);
    const webViewManager = new WebViewManager(context.extensionUri);

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
            
            // Check if file is supported
            const isSupported = await fileDetector.isValidFile(filePath);
            if (!isSupported) {
                vscode.window.showErrorMessage('File format not supported for quantum chemistry parsing');
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Parsing quantum chemistry file...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Parse file
                progress.report({ increment: 30, message: "Parsing file with cclib..." });
                const result = await parserInterface.parseFile(filePath);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to parse file');
                }

                progress.report({ increment: 50, message: "Opening viewer..." });
                
                // Open WebView with parsed data
                await webViewManager.createViewer(result);
                
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
                    'Quantum Chemistry Files': ['log', 'out']
                }
            });

            if (!uris || uris.length === 0) {
                return;
            }

            const filePath = uris[0].fsPath;
            
            // Check if file is supported
            const isSupported = await fileDetector.isValidFile(filePath);
            if (!isSupported) {
                vscode.window.showErrorMessage('File format not supported for quantum chemistry parsing');
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Parsing quantum chemistry file...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Parse file
                progress.report({ increment: 30, message: "Parsing file with cclib..." });
                const result = await parserInterface.parseFile(filePath);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to parse file');
                }

                progress.report({ increment: 50, message: "Opening viewer..." });
                
                // Open WebView with parsed data
                await webViewManager.createViewer(result);
                
                progress.report({ increment: 100 });
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing file: ${error}`);
        }
    });

    // Register file system watcher for automatic detection
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{log,out}');
    
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
    console.log('CCView extension is now deactivated!');
} 