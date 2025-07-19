// WebView entry point for bundling
// Import libraries for proper bundling
import * as THREE from 'three';
import Miew from 'miew';

// Make them globally available for the WebView
window.THREE = THREE;
window.Miew = Miew;

// Only log in development environment
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    console.log('CCView WebView bundle loaded');
} 