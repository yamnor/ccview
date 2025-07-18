# CCView - Quantum Chemistry File Viewer

CCView is a VS Code extension that provides quantum chemistry output file viewing capabilities using cclib for parsing and miew for 3D molecular visualization.

## Features

- **File Detection**: Automatic detection of quantum chemistry output files (Gaussian, GAMESS, NWChem, ORCA, etc.)
- **Molecular Visualization**: 3D molecular structure viewing with miew
- **Data Parsing**: Comprehensive parsing of quantum chemistry data using cclib
- **Interactive Controls**: Representation modes, coloring options, and view controls
- **Python Integration**: Seamless integration with Python environment for cclib processing

## Supported File Formats

- **Gaussian** (.log, .out)
- **GAMESS** (.log, .out)
- **GAMESS-UK** (.log, .out)
- **NWChem** (.out)
- **ORCA** (.out)
- **Q-Chem** (.out)
- **Psi4** (.out)
- **Turbomole** (.out)
- **Molpro** (.out)
- **Molcas** (.out)
- **ADF** (.out)
- **CFOUR** (.out)
- **DALTON** (.out)
- **Jaguar** (.out)
- **MOPAC** (.out)
- **XTB** (.out)

## Requirements

- VS Code 1.74.0 or higher
- Python 3.7 or higher
- Required Python packages:
  - cclib
  - numpy
  - scipy

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Install required Python packages:
   ```bash
   pip install cclib numpy scipy
   ```

## Usage

1. Open a quantum chemistry output file (.log or .out) in VS Code
2. Right-click on the file in the explorer and select "Open with CCView"
3. Or use the command palette: `CCView: Open CCView`
4. The molecular viewer will open with the parsed structure

## Development

### Project Structure

```
ccview-extension/
├── src/                    # TypeScript source files
│   ├── extension.ts       # Main extension entry point
│   ├── fileDetector.ts    # File format detection
│   ├── pythonManager.ts   # Python environment management
│   ├── parserInterface.ts # Python backend communication
│   └── webViewManager.ts  # WebView and miew integration
├── python/                # Python backend
│   └── parser.py         # cclib integration
├── out/                   # Compiled JavaScript files
└── package.json          # Extension manifest
```

### Building

```bash
# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

### Testing

1. Press F5 in VS Code to launch the extension in debug mode
2. Open a quantum chemistry output file
3. Test the extension functionality

## Features in Development

- Terminal interface with xterm.js
- ccget and ccwrite command integration
- Advanced molecular analysis tools
- Export functionality
- Animation support for vibrational modes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [cclib](https://cclib.github.io/) - Quantum chemistry file parsing library
- [miew](https://miew.opensource.epam.com/) - 3D molecular visualization library
- [VS Code Extension API](https://code.visualstudio.com/api) - Extension development framework 