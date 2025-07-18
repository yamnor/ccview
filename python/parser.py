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
    from cclib.io import ccread, ccwrite
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
        pass
    
    def _get_format_from_cclib_data(self, data) -> str:
        """Get format from cclib data object"""
        class_name = type(data).__name__.lower()
        
        # Map cclib class names to format names
        format_mapping = {
            'gaussian': 'gaussian',
            'gamess': 'gamess',
            'gamessuk': 'gamessuk',
            'nwchem': 'nwchem',
            'orca': 'orca',
            'qchem': 'qchem',
            'psi4': 'psi4',
            'turbomole': 'turbomole',
            'molpro': 'molpro',
            'molcas': 'molcas',
            'adf': 'adf',
            'cfour': 'cfour',
            'dalton': 'dalton',
            'jaguar': 'jaguar',
            'mopac': 'mopac',
            'xtb': 'xtb'
        }
        
        return format_mapping.get(class_name, 'unknown')
    
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
                'detected_format': self._get_format_from_cclib_data(data),
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
    
    def _convert_complex_to_json(self, obj) -> Any:
        """Convert complex objects (including nested numpy arrays) to JSON-serializable format"""
        if obj is None:
            return None
        elif NUMPY_AVAILABLE and isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: self._convert_complex_to_json(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._convert_complex_to_json(item) for item in obj]
        elif NUMPY_AVAILABLE and isinstance(obj, np.integer):
            return int(obj)
        elif NUMPY_AVAILABLE and isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, (int, float, str, bool)):
            return obj
        else:
            # For other types, try to convert to string
            return str(obj)
    
    def execute_ccget(self, file_path: str, property_name: str) -> Dict[str, Any]:
        """Execute ccget command equivalent"""
        try:
            data = ccread(file_path)
            
            if hasattr(data, property_name):
                value = getattr(data, property_name)
                converted_value = self._convert_complex_to_json(value)
                return {
                    'success': True,
                    'property': property_name,
                    'value': converted_value
                }
            else:
                return {
                    'success': False,
                    'error': f'Property {property_name} not available'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def execute_ccwrite(self, file_path: str, output_format: str, output_path: str = None) -> Dict[str, Any]:
        """Execute ccwrite command equivalent using cclib's ccwrite function"""
        try:
            data = ccread(file_path)
            
            # Use cclib's ccwrite function for all formats
            if output_path:
                # Write to file
                ccwrite(data, output_format, output_path)
                return {
                    'success': True,
                    'format': output_format,
                    'output_path': output_path,
                    'message': f'Successfully converted to {output_format} format: {output_path}'
                }
            else:
                # Return content as string
                result = ccwrite(data, output_format, None)
                return {
                    'success': True,
                    'format': output_format,
                    'content': result,
                    'message': f'Successfully converted to {output_format} format'
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
        try:
            # Use cclib to detect format
            data = ccread(file_path)
            format_type = parser._get_format_from_cclib_data(data)
            print(json.dumps({
                'success': True,
                'detected_format': format_type
            }))
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': str(e)
            }))
        
    else:
        print(json.dumps({
            'success': False,
            'error': 'Invalid command or arguments'
        }))


if __name__ == '__main__':
    main() 