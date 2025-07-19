# CCView - Computational Chemistry File Viewer

CCView is a VS Code extension that provides comprehensive computational chemistry output file viewing capabilities. It combines the robust parsing power of cclib with the advanced 3D molecular visualization of miew, offering an integrated terminal interface for computational chemistry workflows.

## ✨ Features

### 🔬 **Advanced Molecular Visualization**
- **3D Molecular Structure Viewing**: Interactive 3D visualization using miew viewer
- **Multiple Representation Modes**: 
  - Ball & Stick, Licorice, Tube, Lines, Van der Waals
  - Cartoon representation for PDB files with secondary structure coloring
- **Dynamic Coloring Options**: Element-based, Chain-based, Secondary structure, Uniform
- **Interactive Controls**: Rotate, zoom, pan, and select atoms
- **Real-time Updates**: Dynamic representation and color scheme changes

### 📊 **Comprehensive Data Parsing**
- **cclib Integration**: Robust parsing of quantum chemistry data
- **Molecular Information**: Atomic coordinates, masses, charges, multiplicity
- **Energy Data**: SCF energies, MP2 energies, coupled-cluster energies, ZPVE
- **Vibrational Analysis**: Frequencies, IR intensities, Raman activities, displacements
- **Molecular Orbitals**: Orbital energies, coefficients, HOMO/LUMO information
- **Properties**: Multipole moments, polarizabilities, atomic charges, spin densities

### 💻 **Integrated Terminal Interface**
- **xterm.js Terminal**: Full-featured terminal emulator within VS Code
- **ccget Commands**: Extract molecular data using cclib's ccget functionality
- **ccwrite Commands**: Export data in multiple formats (JSON, XYZ, CML, MOLDEN, WFX)
- **miew Scripting**: Direct control of molecular visualization through miew commands
- **Command History**: Navigate through command history with arrow keys
- **Real-time Output**: Live display of command results and errors

### 🔍 **Smart File Detection**
- **Automatic Format Recognition**: Detects quantum chemistry file formats
- **Direct File Support**: Native support for PDB, CIF, XYZ files
- **cclib Processing**: Advanced parsing for quantum chemistry output files

## 🧪 Supported File Formats

### Quantum Chemistry Output Files
- **Gaussian** (.log, .out) - Most widely used
- **GAMESS** (.log, .out) - American version
- **GAMESS-UK** (.log, .out) - British version
- **NWChem** (.out) - Open source
- **ORCA** (.out) - Free version available
- **Q-Chem** (.out) - Commercial
- **Psi4** (.out) - Open source
- **Turbomole** (.out) - Commercial
- **Molpro** (.out) - Commercial
- **Molcas** (.out) - Commercial
- **ADF** (.out) - Amsterdam Density Functional
- **CFOUR** (.out) - Coupled-Cluster
- **DALTON** (.out) - Open source
- **Jaguar** (.out) - Commercial
- **MOPAC** (.out) - Semi-empirical
- **XTB** (.out) - Fast calculation

### Direct Structure Files
- **PDB** (.pdb) - Protein Data Bank format
- **CIF** (.cif) - Crystallographic Information Framework
- **XYZ** (.xyz) - Cartesian coordinates format

## 🚀 Quick Start

### Installation

1. **Install the Extension**
   - Install from VS Code Marketplace
   - Or clone and install locally:
   ```bash
   git clone https://github.com/your-repo/ccview-extension.git
   cd ccview-extension
   npm install
   npm run compile
   ```

2. **Install Python Dependencies**
   ```bash
   pip install cclib numpy scipy
   ```

3. **Verify Python Environment**
   - Ensure VS Code Python extension is installed
   - Select appropriate Python interpreter in VS Code

### Usage

1. **Open a File**
   - Open any supported quantum chemistry file (.log, .out, .pdb, .cif, .xyz)
   - Right-click in the explorer and select "Open with CCView"
   - Or use Command Palette: `CCView: Open CCView`

2. **Explore the Interface**
   - **3D Viewer**: Interactive molecular visualization
   - **Controls**: Change representation modes and colors
   - **Terminal**: Access advanced commands (click Terminal button)

3. **Use Terminal Commands**
   ```bash
   # Get molecular coordinates
   ccget coords
   
   # Get SCF energies
   ccget scfenergies
   
   # Get vibrational frequencies
   ccget vibfreqs
   
   # Export to XYZ format
   ccwrite xyz molecule.out
   
   # Change molecular representation
   miew tube
   miew ballstick
   miew color element
   ```

## 🛠️ Advanced Features

### Terminal Commands

#### ccget Commands
- `ccget --list` - List available properties
- `ccget coords` - Get atomic coordinates
- `ccget scfenergies` - Get SCF energies
- `ccget vibfreqs` - Get vibrational frequencies
- `ccget moenergies` - Get molecular orbital energies
- `ccget atomcharges` - Get atomic charges
- `ccget moments` - Get multipole moments

#### ccwrite Commands
- `ccwrite json molecule.out` - Export as JSON
- `ccwrite xyz molecule.out` - Export as XYZ
- `ccwrite cml molecule.out` - Export as CML
- `ccwrite molden molecule.out` - Export as MOLDEN
- `ccwrite wfx molecule.out` - Export as WFX

#### miew Commands
- `miew tube` - Switch to tube representation
- `miew licorice` - Switch to licorice representation
- `miew ballstick` - Switch to ball & stick representation
- `miew color element` - Color by element
- `miew color chain` - Color by chain
- `miew color secondary` - Color by secondary structure

### Representation Modes

#### For Quantum Chemistry Files
- **Ball & Stick** (default) - Atoms as spheres, bonds as cylinders
- **Licorice** - Atoms and bonds as cylinders
- **Van der Waals** - Atoms as spheres with VDW radii
- **Lines** - Simple line representation

#### For PDB Files (Additional)
- **Cartoon** (default) - Protein backbone representation
- **Tube** - Smooth tube representation
- **Secondary Structure** - Helix, sheet, coil coloring

### Color Schemes
- **Element** - Color by chemical element
- **Chain** - Color by protein chain
- **Secondary Structure** - Color by protein secondary structure
- **Residue** - Color by amino acid residue
- **Uniform** - Single color

## 🔧 Development

### Project Structure
```
ccview-extension/
├── src/                    # TypeScript source files
│   ├── extension.ts       # Main extension entry point
│   ├── fileDetector.ts    # File format detection
│   ├── pythonManager.ts   # Python environment management
│   ├── parserInterface.ts # Python backend communication
│   ├── webViewManager.ts  # WebView and miew integration
│   └── terminalManager.ts # Terminal interface management
├── python/                # Python backend
│   └── parser.py         # cclib integration
├── out/                   # Compiled JavaScript files
└── package.json          # Extension manifest
```

### Building from Source
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

### Debugging
1. Press F5 in VS Code to launch extension in debug mode
2. Open a quantum chemistry file
3. Test functionality in the new VS Code window

## 🐛 Troubleshooting

### Common Issues

1. **Python Environment Not Found**
   - Install VS Code Python extension
   - Select Python interpreter: `Ctrl+Shift+P` → "Python: Select Interpreter"

2. **cclib Not Installed**
   ```bash
   pip install cclib
   ```

3. **File Not Recognized**
   - Check file extension (.log, .out, .pdb, .cif, .xyz)
   - Verify file content is valid

4. **Terminal Not Responding**
   - Click the Terminal button to activate
   - Try pressing Enter to refresh the prompt

5. **3D Viewer Not Loading**
   - Check internet connection (CDN libraries)
   - Verify file contains valid molecular data

### Debug Information
- Check VS Code Output panel for error messages
- Use Developer Tools (F12) in WebView for detailed errors
- Review console logs for debugging information

## 📈 Performance

- **Large Molecules**: Optimized for molecules with 1000+ atoms
- **Memory Management**: Efficient memory usage for large files
- **Rendering**: Hardware-accelerated 3D rendering
- **Parsing**: Fast cclib-based parsing with caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use English for all code comments and UI text
- Maintain consistent code style
- Add appropriate error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[cclib](https://cclib.github.io/)** - Quantum chemistry file parsing library
- **[miew](https://miew.opensource.epam.com/)** - 3D molecular visualization library
- **[xterm.js](https://xtermjs.org/)** - Terminal emulator for the web
- **[VS Code Extension API](https://code.visualstudio.com/api)** - Extension development framework

## 📞 Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check the [Wiki](https://github.com/your-repo/ccview-extension/wiki)
- **Community**: Join discussions in GitHub Discussions

---

**CCView** - Making computational chemistry accessible and interactive in VS Code! 🧪⚛️ 