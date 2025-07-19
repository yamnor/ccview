# CCView - Computational Chemistry File Viewer

Advanced 3D molecular visualization and analysis for VS Code. View computational chemistry output files in 3D, analyze molecular data with integrated terminal commands, and export results in multiple formats.

![](https://i.gyazo.com/04d87b2b1802baf32b5af7e5a6ac228f.png)

## Overview

CCView combines **cclib** (computational chemistry parsing) and **miew** (3D molecular visualization) to provide:

- **Interactive 3D Molecular Visualization** - Rotate, zoom, and explore molecular structures
- **Comprehensive Data Analysis** - Extract energies, frequencies, orbitals, and more
- **Integrated Terminal Interface** - Use ccget/ccwrite commands directly in VS Code
- **Smart File Detection** - Automatically recognizes computational chemistry formats
- **Multiple Representation Modes** - Ball & stick, licorice, cartoon, and more

## Installation

1. Install CCView from the VS Code Marketplace
2. Install Python dependencies:
   ```bash
   pip install cclib numpy scipy
   ```
3. Ensure VS Code Python extension is installed and configured
4. **Offline support** - CCView bundles all visualization libraries (miew, xterm.js) locally for offline operation

## Quick Start

1. Open any supported file (.log, .out, .pdb, .cif, .xyz)
2. Right-click in the explorer and select "Open CCView"
3. Explore the 3D viewer and terminal interface

## Supported File Formats

### Computational Chemistry Output Files
| Software | Extensions | Description |
|----------|------------|-------------|
| **Gaussian** | `.log`, `.out` | Most widely used |
| **GAMESS** | `.log`, `.out` | American version |
| **GAMESS-UK** | `.log`, `.out` | UK version |
| **ORCA** | `.log`, `.out` | Free version available |
| **NWChem** | `.log`, `.out` | Open source |
| **Psi4** | `.log`, `.out` | Open source |
| **Q-Chem** | `.log`, `.out` | Commercial |
| **Turbomole** | `.log`, `.out` | Commercial |
| **Molpro** | `.log`, `.out` | Commercial |
| **Molcas** | `.log`, `.out` | Commercial |
| **ADF** | `.log`, `.out` | Amsterdam Density Functional |
| **CFOUR** | `.log`, `.out` | Coupled-Cluster |
| **DALTON** | `.log`, `.out` | Open source |
| **Jaguar** | `.log`, `.out` | Commercial |
| **MOPAC** | `.log`, `.out` | Semi-empirical |
| **XTB** | `.log`, `.out` | Fast calculation |

### Direct Structure Files
| Format | Extension | Description |
|--------|-----------|-------------|
| **PDB** | `.pdb` | Protein Data Bank format |
| **CIF** | `.cif` | Crystallographic Information Framework |
| **XYZ** | `.xyz` | Cartesian coordinates format |

## Features

### Molecular Visualization

**Representation Modes:**
- **Ball & Stick** (default) - Atoms as spheres, bonds as cylinders
- **Licorice** - Atoms and bonds as cylinders
- **Van der Waals** - Atoms as spheres with VDW radii
- **Lines** - Simple line representation
- **Cartoon** (PDB only) - Protein backbone representation
- **Tube** - Smooth tube representation

**Coloring Options:**
- **Element** - Color by chemical element
- **Chain** - Color by protein chain
- **Secondary Structure** - Color by protein secondary structure
- **Residue** - Color by amino acid residue
- **Uniform** - Single color

### Data Analysis

CCView extracts and displays:
- **Molecular Information**: Atomic coordinates, masses, charges, multiplicity
- **Energy Data**: SCF energies, MP2 energies, coupled-cluster energies, ZPVE
- **Vibrational Analysis**: Frequencies, IR intensities, Raman activities, displacements
- **Molecular Orbitals**: Orbital energies, coefficients, HOMO/LUMO information
- **Properties**: Multipole moments, polarizabilities, atomic charges, spin densities

### Terminal Interface

**ccget Commands** - Extract computational chemistry data:
```bash
ccget coords          # Get atomic coordinates
ccget scfenergies     # Get SCF energies
ccget vibfreqs        # Get vibrational frequencies
ccget moenergies      # Get molecular orbital energies
ccget atomcharges     # Get atomic charges
ccget moments         # Get multipole moments
```

**ccwrite Commands** - Export in multiple formats:
```bash
ccwrite json molecule.out    # Export as JSON
ccwrite xyz molecule.out     # Export as XYZ
ccwrite cml molecule.out     # Export as CML
ccwrite molden molecule.out  # Export as MOLDEN
ccwrite wfx molecule.out     # Export as WFX
```

**miew Commands** - Control visualization:
```bash
miew tube                    # Switch to tube representation
miew licorice               # Switch to licorice representation
miew ballstick              # Switch to ball & stick representation
miew color element          # Color by element
miew color chain            # Color by chain
miew color secondary        # Color by secondary structure
```

## Use Cases

### For Computational Chemists
- Visualize calculation results in 3D immediately after computation
- Extract specific data using ccget commands
- Export results in various formats for further analysis
- Compare structures from different calculations

### For Structural Biologists
- View protein structures with cartoon representation
- Analyze secondary structure with color coding
- Export coordinates in standard formats
- Interactive exploration of molecular structures

### For Chemistry Educators
- Demonstrate molecular concepts with 3D visualization
- Show different representations (ball & stick, licorice, etc.)
- Interactive learning through terminal commands
- Export structures for presentations

## Advanced Usage

### Terminal Commands Reference

#### ccget Properties
| Property | Description |
|----------|-------------|
| `atomnos` | Atomic numbers |
| `atomcoords` | Atomic coordinates |
| `scfenergies` | SCF energies |
| `vibfreqs` | Vibrational frequencies |
| `moenergies` | Molecular orbital energies |
| `atomcharges` | Atomic charges |
| `moments` | Multipole moments |
| `polarizabilities` | Polarizabilities |

#### ccwrite Formats
| Format | Description | Options |
|--------|-------------|---------|
| `json` | JSON format | `--terse`, `--index` |
| `cjson` | Compressed JSON | `--terse` |
| `cml` | Chemical Markup Language | `--terse` |
| `xyz` | Cartesian coordinates | `--index` |
| `molden` | MOLDEN format | `--naturalorbitals` |
| `wfx` | WFX format | `--naturalorbitals` |

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Python Environment Not Found** | Install VS Code Python extension, select interpreter |
| **cclib Not Installed** | Run `pip install cclib` |
| **File Not Recognized** | Check file extension and content validity |
| **Terminal Not Responding** | Click Terminal button, press Enter to refresh |
| **3D Viewer Not Loading** | Verify file contains valid data, check browser console for errors |

---

## Development

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
├── media/                # Bundled libraries
│   ├── viewer.js         # Miew viewer
│   ├── xterm.js          # Terminal emulator
│   └── ...               # Other bundled files
└── package.json          # Extension manifest
```

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yamnor/ccview-extension.git
   cd ccview-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile TypeScript and bundle libraries:
   ```bash
   npm run compile
   npm run bundle
   ```

4. Watch for changes:
   ```bash
   npm run watch
   ```

### Debugging

1. Press F5 in VS Code to launch extension in debug mode
2. Open a computational chemistry file
3. Test functionality in the new VS Code window

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **[cclib](https://cclib.github.io/)** - Computational chemistry file parsing library
- **[miew](https://miew.opensource.epam.com/)** - 3D molecular visualization library
- **[xterm.js](https://xtermjs.org/)** - Terminal emulator for the web
- **[VS Code Extension API](https://code.visualstudio.com/api)** - Extension development framework

## Support

- **Issues**: Report bugs and request features on [GitHub](https://github.com/yamnor/ccview-extension/issues)
- **Documentation**: Check the [Wiki](https://github.com/yamnor/ccview-extension/wiki)
- **Community**: Join discussions in [GitHub Discussions](https://github.com/yamnor/ccview-extension/discussions)

---

**CCView** - Making computational chemistry accessible and interactive in VS Code 