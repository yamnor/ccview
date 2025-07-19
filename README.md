# CCView - Comp Chem Viewer

Molecular visualization and analysis for VS Code. View computational chemistry output files in 3D, analyze molecular data with integrated terminal commands, and export results in multiple formats.

![](https://i.gyazo.com/04d87b2b1802baf32b5af7e5a6ac228f.png)

## Overview

CCView combines [cclib](https://github.com/cclib/cclib) (computational chemistry parsing) and [miew](https://github.com/epam/miew) (3D molecular visualization) to provide:

- **3D Molecular Visualization** - Rotate, zoom, and explore molecular structures
- **Data Analysis** - Extract energies, frequencies, orbitals, and more
- **Terminal Interface** - Use ccget/ccwrite commands directly in VS Code

## Installation

1. Install CCView from the VS Code Marketplace
2. Install Python dependencies:

```bash
pip install cclib
```
3. Ensure VS Code Python extension is installed and configured

## Quick Start

1. Open any supported file (.log, .out, .pdb, .cif, .xyz)
2. Right-click in the explorer and select "Open CCView"
3. Explore the 3D viewer and terminal interface (type `help` in the terminal to get started)

## Supported File Formats

### Computational Chemistry Output Files

All computational chemistry software output files use `.log` and `.out` extensions. The following table shows supported software and their versions:

| Software | Supported Versions | Description |
|----------|-------------------|-------------|
| **ADF** | 2007, 2013 | Amsterdam Density Functional |
| **DALTON** | 2013, 2015 | Open source |
| **Firefly (PC GAMESS)** | 8.0 | Formerly known as PC GAMESS |
| **GAMESS (US)** | 2017, 2018 | American version |
| **GAMESS-UK** | 7.0, 8.0 | UK version |
| **Gaussian** | 09, 16 | Most widely used |
| **Jaguar** | 7.0, 8.3 | Commercial |
| **Molcas** | 18.0 | Commercial |
| **Molpro** | 2006, 2012 | Commercial |
| **MOPAC** | 2016 | Semi-empirical |
| **NBO** | 7.0 | Natural Bond Orbital analysis |
| **NWChem** | 6.0, 6.1, 6.5, 6.6, 6.8, 7.0 | Open source |
| **ORCA** | 4.1, 4.2, 5.0 | Free version available |
| **Psi4** | 1.2.1, 1.3.1, 1.7 | Open source |
| **Q-Chem** | 5.1, 5.4, 6.0 | Commercial |
| **Turbomole** | 5.9, 7.2, 7.4, 7.5 | Commercial |

### Direct Structure Files

| Format | Extension | Description |
|--------|-----------|-------------|
| **PDB** | `.pdb` | Protein Data Bank format |
| **CIF** | `.cif` | Crystallographic Information Framework |
| **XYZ** | `.xyz` | Cartesian coordinates format |

## Features

### Terminal Interface

**ccget Commands** - Extract computational chemistry data:

```bash
ccget natom           # Get number of atoms
ccget nbasis          # Get number of basis functions
ccget nmo             # Get number of molecular orbitals
ccget charge          # Get total charge
ccget mult            # Get multiplicity
ccget scfenergies     # Get SCF energies
ccget vibfreqs        # Get vibrational frequencies
ccget vibirs          # Get vibrational IR intensities
```

**ccwrite Commands** - Export in multiple formats:

```bash
ccwrite xyz molecule.xyz        # Export as XYZ
ccwrite json molecule.json      # Export as JSON
ccwrite cml molecule.cml        # Export as CML
```

**miew Commands** - Control visualization:

```bash
miew tube                   # Switch to tube representation
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

### Building from Source

1. Clone the repository:

```bash
git clone https://github.com/yamnor/ccview.git
cd ccview
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

- **Issues**: Report bugs and request features on [GitHub](https://github.com/yamnor/ccview/issues)
- **Documentation**: Check the [Wiki](https://github.com/yamnor/ccview/wiki)
- **Community**: Join discussions in [GitHub Discussions](https://github.com/yamnor/ccview/discussions)

---

**CCView** - Making computational chemistry accessible and interactive in VS Code 