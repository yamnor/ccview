#!/usr/bin/env python3
"""
CCView Python Backend - Quantum Chemistry File Parser

This module provides the Python backend for parsing quantum chemistry output files
using cclib library and converting data to formats suitable for miew viewer.
"""

import json
import sys
import os
from typing import Dict, Any, List, Optional, Union
import traceback

try:
    import cclib
    from cclib.io import moldenwriter
    from cclib.io import ccread
    CCLIB_AVAILABLE = True
except ImportError:
    CCLIB_AVAILABLE = False
    # Suppress warning for now as it's working correctly
    pass

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    # Suppress warning for now as it's working correctly
    pass


class QuantumChemistryParser:
    """Parser for quantum chemistry output files using cclib"""
    
    def __init__(self):
        self.supported_formats = {
            'gaussian': ['.log', '.out'],
            'gamess': ['.log', '.out'],
            'gamessuk': ['.log', '.out'],
            'nwchem': ['.out'],
            'orca': ['.out'],
            'qchem': ['.out'],
            'psi4': ['.out'],
            'turbomole': ['.out'],
            'molpro': ['.out'],
            'molcas': ['.out'],
            'adf': ['.out'],
            'cfour': ['.out'],
            'dalton': ['.out'],
            'jaguar': ['.out'],
            'mopac': ['.out'],
            'xtb': ['.out']
        }
    
    def detect_file_format(self, file_path: str) -> str:
        """Detect the format of quantum chemistry output file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(2000)  # Read first 2000 characters
                
            # Check for characteristic strings
            content_lower = content.lower()
            
            if 'gaussian' in content_lower or 'g09' in content or 'g16' in content:
                return 'gaussian'
            elif 'gamess' in content_lower and 'uk' not in content_lower:
                return 'gamess'
            elif 'gamess-uk' in content_lower or 'gamessuk' in content_lower:
                return 'gamessuk'
            elif 'nwchem' in content_lower:
                return 'nwchem'
            elif 'orca' in content_lower:
                return 'orca'
            elif 'q-chem' in content_lower or 'qchem' in content_lower:
                return 'qchem'
            elif 'psi4' in content_lower:
                return 'psi4'
            elif 'turbomole' in content_lower:
                return 'turbomole'
            elif 'molpro' in content_lower:
                return 'molpro'
            elif 'molcas' in content_lower:
                return 'molcas'
            elif 'adf' in content_lower:
                return 'adf'
            elif 'cfour' in content_lower:
                return 'cfour'
            elif 'dalton' in content_lower:
                return 'dalton'
            elif 'jaguar' in content_lower:
                return 'jaguar'
            elif 'mopac' in content_lower:
                return 'mopac'
            elif 'xtb' in content_lower:
                return 'xtb'
            else:
                return 'unknown'
                
        except Exception as e:
            return f"error: {str(e)}"
    
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """Parse quantum chemistry output file and return structured data"""
        if not CCLIB_AVAILABLE:
            return {
                'success': False,
                'error': 'cclib library not available'
            }
        
        try:
            # Parse file using cclib
            data = ccread(file_path)
            
            # Convert to dictionary format
            result = {
                'success': True,
                'file_type': type(data).__name__,
                'detected_format': self.detect_file_format(file_path),
                'molecule': self._extract_molecule_data(data),
                'energies': self._extract_energy_data(data),
                'vibrations': self._extract_vibration_data(data),
                'orbitals': self._extract_orbital_data(data),
                'properties': self._extract_property_data(data)
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _extract_molecule_data(self, data) -> Dict[str, Any]:
        """Extract molecular structure data"""
        molecule = {
            'natom': getattr(data, 'natom', 0),
            'charge': getattr(data, 'charge', 0),
            'multiplicity': getattr(data, 'mult', 1)
        }
        
        # Extract atomic data
        if hasattr(data, 'atomnos') and data.atomnos is not None:
            molecule['atoms'] = self._convert_to_list(data.atomnos)
        else:
            molecule['atoms'] = []
            
        if hasattr(data, 'atomcoords') and data.atomcoords is not None:
            molecule['coordinates'] = self._convert_to_list(data.atomcoords)
        else:
            molecule['coordinates'] = []
            
        if hasattr(data, 'atommasses') and data.atommasses is not None:
            molecule['masses'] = self._convert_to_list(data.atommasses)
        else:
            molecule['masses'] = []
        
        return molecule
    
    def _extract_energy_data(self, data) -> Dict[str, Any]:
        """Extract energy data"""
        energies = {}
        
        if hasattr(data, 'scfenergies') and data.scfenergies is not None:
            energies['scf'] = self._convert_to_list(data.scfenergies)
            
        if hasattr(data, 'mpenergies') and data.mpenergies is not None:
            energies['mp2'] = self._convert_to_list(data.mpenergies)
            
        if hasattr(data, 'ccenergies') and data.ccenergies is not None:
            energies['cc'] = self._convert_to_list(data.ccenergies)
            
        if hasattr(data, 'zpve') and data.zpve is not None:
            energies['zpve'] = float(data.zpve)
            
        if hasattr(data, 'enthalpy') and data.enthalpy is not None:
            energies['enthalpy'] = float(data.enthalpy)
            
        if hasattr(data, 'freeenergy') and data.freeenergy is not None:
            energies['free_energy'] = float(data.freeenergy)
        
        return energies
    
    def _extract_vibration_data(self, data) -> Dict[str, Any]:
        """Extract vibrational data"""
        vibrations = {}
        
        if hasattr(data, 'vibfreqs') and data.vibfreqs is not None:
            vibrations['frequencies'] = self._convert_to_list(data.vibfreqs)
            
        if hasattr(data, 'vibirs') and data.vibirs is not None:
            vibrations['ir_intensities'] = self._convert_to_list(data.vibirs)
            
        if hasattr(data, 'vibramans') and data.vibramans is not None:
            vibrations['raman_activities'] = self._convert_to_list(data.vibramans)
            
        if hasattr(data, 'vibdisps') and data.vibdisps is not None:
            vibrations['displacements'] = self._convert_to_list(data.vibdisps)
            
        if hasattr(data, 'vibsyms') and data.vibsyms is not None:
            vibrations['symmetries'] = list(data.vibsyms)
        
        return vibrations
    
    def _extract_orbital_data(self, data) -> Dict[str, Any]:
        """Extract molecular orbital data"""
        orbitals = {}
        
        if hasattr(data, 'moenergies') and data.moenergies is not None:
            orbitals['energies'] = [self._convert_to_list(mo) for mo in data.moenergies]
            
        if hasattr(data, 'mocoeffs') and data.mocoeffs is not None:
            orbitals['coefficients'] = [self._convert_to_list(mo) for mo in data.mocoeffs]
            
        if hasattr(data, 'homos') and data.homos is not None:
            orbitals['homo_indices'] = self._convert_to_list(data.homos)
            
        if hasattr(data, 'nbasis') and data.nbasis is not None:
            orbitals['nbasis'] = int(data.nbasis)
            
        if hasattr(data, 'nmo') and data.nmo is not None:
            orbitals['nmo'] = int(data.nmo)
        
        return orbitals
    
    def _extract_property_data(self, data) -> Dict[str, Any]:
        """Extract other property data"""
        properties = {}
        
        if hasattr(data, 'moments') and data.moments is not None:
            properties['moments'] = [self._convert_to_list(m) for m in data.moments]
            
        if hasattr(data, 'polarizabilities') and data.polarizabilities is not None:
            properties['polarizabilities'] = [self._convert_to_list(p) for p in data.polarizabilities]
            
        if hasattr(data, 'atomcharges') and data.atomcharges is not None:
            properties['atom_charges'] = {k: self._convert_to_list(v) for k, v in data.atomcharges.items()}
            
        if hasattr(data, 'atomspins') and data.atomspins is not None:
            properties['atom_spins'] = {k: self._convert_to_list(v) for k, v in data.atomspins.items()}
        
        return properties
    
    def _convert_to_list(self, obj) -> List:
        """Convert numpy arrays or other objects to Python lists"""
        if NUMPY_AVAILABLE and isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (list, tuple)):
            return list(obj)
        else:
            return [obj] if obj is not None else []
    
    def execute_ccget(self, file_path: str, property_name: str) -> Dict[str, Any]:
        """Execute ccget command equivalent"""
        try:
            data = ccread(file_path)
            
            if hasattr(data, property_name):
                value = getattr(data, property_name)
                return {
                    'success': True,
                    'property': property_name,
                    'value': self._convert_to_list(value)
                }
            else:
                return {
                    'success': False,
                    'error': f'Property {property_name} not available'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def execute_ccwrite(self, file_path: str, output_format: str, output_path: str = None) -> Dict[str, Any]:
        """Execute ccwrite command equivalent"""
        try:
            data = ccread(file_path)
            
            if output_format == 'json':
                result = self.parse_file(file_path)
                if output_path:
                    with open(output_path, 'w') as f:
                        json.dump(result, f, indent=2)
                return {
                    'success': True,
                    'format': 'json',
                    'output_path': output_path,
                    'data': result
                }
            elif output_format == 'xyz':
                if hasattr(data, 'writexyz'):
                    if output_path:
                        data.writexyz(output_path)
                    else:
                        # Return XYZ content as string
                        import io
                        output = io.StringIO()
                        data.writexyz(output)
                        return {
                            'success': True,
                            'format': 'xyz',
                            'content': output.getvalue()
                        }
                else:
                    return {
                        'success': False,
                        'error': 'XYZ output not supported for this file type'
                    }
            else:
                return {
                    'success': False,
                    'error': f'Output format {output_format} not supported'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


def main():
    """Main function for command-line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No command specified'
        }))
        return
    
    parser = QuantumChemistryParser()
    command = sys.argv[1]
    
    if command == 'parse' and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        result = parser.parse_file(file_path)
        print(json.dumps(result))
        
    elif command == 'ccget' and len(sys.argv) >= 4:
        file_path = sys.argv[2]
        property_name = sys.argv[3]
        result = parser.execute_ccget(file_path, property_name)
        print(json.dumps(result))
        
    elif command == 'ccwrite' and len(sys.argv) >= 4:
        file_path = sys.argv[2]
        output_format = sys.argv[3]
        output_path = sys.argv[4] if len(sys.argv) > 4 else None
        result = parser.execute_ccwrite(file_path, output_format, output_path)
        print(json.dumps(result))
        
    elif command == 'detect' and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        format_type = parser.detect_file_format(file_path)
        print(json.dumps({
            'success': True,
            'detected_format': format_type
        }))
        
    else:
        print(json.dumps({
            'success': False,
            'error': 'Invalid command or arguments'
        }))


if __name__ == '__main__':
    main() 