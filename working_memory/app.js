/**
 * ============================================================================
 * WAIS-V - Calculadora del Índice de Memoria de Trabajo (IMT)
 * ============================================================================
 * 
 * Este módulo permite calcular el IMT (Working Memory Index) a partir de
 * los puntajes escalares de Retención de Dígitos y Aritmética.
 * 
 */

// ============================================================================
// TABLA DE CONVERSIÓN: SUMA DE PE → IMT → PERCENTIL
// ============================================================================

/**
 * Tabla de conversión del Índice de Memoria de Trabajo.
 * Cada entrada mapea la suma de puntajes escalares al IMT y percentil.
 * 
 * Formato: { sumaPE: { imt: número, percentil: número } }
 */
const IMT_CONVERSION_TABLE = {
    2:  { imt: 50,  percentile: 0.1 },
    3:  { imt: 50,  percentile: 0.1 },
    4:  { imt: 54,  percentile: 0.1 },
    5:  { imt: 57,  percentile: 0.2 },
    6:  { imt: 60,  percentile: 0.4 },
    7:  { imt: 63,  percentile: 0.7 },
    8:  { imt: 66,  percentile: 1 },
    9:  { imt: 69,  percentile: 2 },
    10: { imt: 72,  percentile: 3 },
    11: { imt: 75,  percentile: 5 },
    12: { imt: 78,  percentile: 8 },
    13: { imt: 81,  percentile: 11 },
    14: { imt: 84,  percentile: 15 },
    15: { imt: 87,  percentile: 19 },
    16: { imt: 90,  percentile: 25 },
    17: { imt: 93,  percentile: 31 },
    18: { imt: 95,  percentile: 38 },
    19: { imt: 98,  percentile: 45 },
    20: { imt: 101, percentile: 53 },
    21: { imt: 104, percentile: 60 },
    22: { imt: 107, percentile: 67 },
    23: { imt: 109, percentile: 74 },
    24: { imt: 112, percentile: 79 },
    25: { imt: 115, percentile: 84 },
    26: { imt: 118, percentile: 89 },
    27: { imt: 121, percentile: 92 },
    28: { imt: 124, percentile: 94 },
    29: { imt: 127, percentile: 96 },
    30: { imt: 130, percentile: 98 },
    31: { imt: 133, percentile: 99 },
    32: { imt: 136, percentile: 99.1 },
    33: { imt: 139, percentile: 99.5 },
    34: { imt: 141, percentile: 99.7 },
    35: { imt: 144, percentile: 99.9 },
    36: { imt: 147, percentile: 99.9 },
    37: { imt: 149, percentile: 99.9 },
    38: { imt: 150, percentile: 99.9 }
};

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Obtiene la clasificación descriptiva según el IMT
 * @param {number} imt - Puntaje compuesto del IMT
 * @returns {string} Clasificación descriptiva
 */
function getClassification(imt) {
    if (imt >= 130) return 'Muy Superior';
    if (imt >= 120) return 'Superior';
    if (imt >= 110) return 'Promedio Alto';
    if (imt >= 90)  return 'Promedio';
    if (imt >= 80)  return 'Promedio Bajo';
    if (imt >= 70)  return 'Limítrofe';
    return 'Extremadamente Bajo';
}

/**
 * Calcula el IMT a partir de los puntajes escalares
 * @param {number} digitSpan - Puntaje escalar de Retención de Dígitos (1-19)
 * @param {number} arithmetic - Puntaje escalar de Aritmética (1-19)
 * @returns {Object} Objeto con suma, imt, percentil y clasificación
 */
function calculateIMT(digitSpan, arithmetic) {
    const sum = digitSpan + arithmetic;
    
    // Validar rango
    if (sum < 2 || sum > 38) {
        return {
            sum,
            imt: null,
            percentile: null,
            classification: 'Fuera de rango',
            error: true
        };
    }
    
    const result = IMT_CONVERSION_TABLE[sum];
    
    return {
        sum,
        imt: result.imt,
        percentile: result.percentile,
        classification: getClassification(result.imt),
        error: false
    };
}

// ============================================================================
// FUNCIONES DE UI
// ============================================================================

/**
 * Obtiene referencias a los elementos del DOM
 * @returns {Object} Objeto con todas las referencias
 */
function getDOMElements() {
    return {
        digitSpanInput: document.getElementById('digit-span'),
        arithmeticInput: document.getElementById('arithmetic'),
        btnCalculate: document.getElementById('btn-calculate'),
        resultsSection: document.getElementById('results-section'),
        sumScore: document.getElementById('sum-score'),
        imtScore: document.getElementById('imt-score'),
        percentile: document.getElementById('percentile'),
        classification: document.getElementById('classification')
    };
}

/**
 * Maneja el cálculo y muestra los resultados
 */
function handleCalculate() {
    const elements = getDOMElements();
    
    // Obtener valores
    const digitSpan = parseInt(elements.digitSpanInput.value, 10);
    const arithmetic = parseInt(elements.arithmeticInput.value, 10);
    
    // Validar inputs
    if (isNaN(digitSpan) || digitSpan < 1 || digitSpan > 19) {
        alert('Por favor ingresa un puntaje válido para Retención de Dígitos (1-19).');
        return;
    }
    
    if (isNaN(arithmetic) || arithmetic < 1 || arithmetic > 19) {
        alert('Por favor ingresa un puntaje válido para Aritmética (1-19).');
        return;
    }
    
    // Calcular IMT
    const result = calculateIMT(digitSpan, arithmetic);
    
    // Mostrar resultados
    elements.sumScore.textContent = result.sum;
    
    if (result.error) {
        elements.imtScore.textContent = 'N/A';
        elements.percentile.textContent = 'N/A';
        elements.classification.textContent = result.classification;
    } else {
        elements.imtScore.textContent = result.imt;
        elements.percentile.textContent = result.percentile + '%';
        elements.classification.textContent = result.classification;
    }
    
    // Mostrar sección de resultados
    elements.resultsSection.classList.remove('hidden');
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa la aplicación
 */
function init() {
    const elements = getDOMElements();
    
    // Event listener para el botón de calcular
    elements.btnCalculate.addEventListener('click', handleCalculate);
    
    // Permitir calcular con Enter
    elements.digitSpanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.arithmeticInput.focus();
    });
    
    elements.arithmeticInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCalculate();
    });
    
    console.log('WAIS-V Working Memory Index Calculator initialized');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
