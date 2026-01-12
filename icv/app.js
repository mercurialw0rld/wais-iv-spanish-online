/**
 * ============================================
 * WAIS-V ICV - Calculadora de Índice de Comprensión Verbal
 * ============================================
 * 
 * Calcula el Índice de Comprensión Verbal (ICV) a partir de los
 * puntajes escalares de las subpruebas: Analogías, Vocabulario e Información.
 * 
 * Utiliza la Tabla A.2 del manual WAIS-IV (estandarización chilena)
 * para convertir la suma de PE a ICV y percentil.
 * 
 * @author Copilot
 * @version 1.0.0
 */

// ============================================
// TABLA A.2 - CONVERSIÓN DE SUMA PE A ICV
// ============================================

/**
 * Tabla de conversión de Suma de Puntajes Equivalentes a ICV y Percentil
 * Extraída de la Tabla A.2 del manual WAIS-IV (estandarización chilena)
 * 
 * Formato: sumaPE: { icv: número, percentile: número }
 */
const ICV_TABLE = {
    3: { icv: 50, percentile: 0.1 },
    4: { icv: 50, percentile: 0.1 },
    5: { icv: 51, percentile: 0.1 },
    6: { icv: 54, percentile: 0.1 },
    7: { icv: 57, percentile: 0.2 },
    8: { icv: 59, percentile: 0.3 },
    9: { icv: 61, percentile: 0.5 },
    10: { icv: 63, percentile: 0.7 },
    11: { icv: 65, percentile: 1 },
    12: { icv: 67, percentile: 2 },
    13: { icv: 70, percentile: 2 },
    14: { icv: 72, percentile: 3 },
    15: { icv: 74, percentile: 4 },
    16: { icv: 75, percentile: 5 },
    17: { icv: 77, percentile: 7 },
    18: { icv: 79, percentile: 8 },
    19: { icv: 81, percentile: 11 },
    20: { icv: 83, percentile: 13 },
    21: { icv: 85, percentile: 16 },
    22: { icv: 87, percentile: 19 },
    23: { icv: 89, percentile: 22 },
    24: { icv: 90, percentile: 26 },
    25: { icv: 92, percentile: 30 },
    26: { icv: 94, percentile: 34 },
    27: { icv: 96, percentile: 39 },
    28: { icv: 98, percentile: 44 },
    29: { icv: 99, percentile: 48 },
    30: { icv: 101, percentile: 53 },
    31: { icv: 103, percentile: 58 },
    32: { icv: 105, percentile: 63 },
    33: { icv: 107, percentile: 67 },
    34: { icv: 108, percentile: 71 },
    35: { icv: 110, percentile: 75 },
    36: { icv: 112, percentile: 79 },
    37: { icv: 114, percentile: 82 },
    38: { icv: 116, percentile: 85 },
    39: { icv: 117, percentile: 88 },
    40: { icv: 119, percentile: 90 },
    41: { icv: 121, percentile: 92 },
    42: { icv: 123, percentile: 94 },
    43: { icv: 125, percentile: 95 },
    44: { icv: 127, percentile: 96 },
    45: { icv: 129, percentile: 97 },
    46: { icv: 131, percentile: 98 },
    47: { icv: 133, percentile: 99 },
    48: { icv: 135, percentile: 99 },
    49: { icv: 137, percentile: 99.3 },
    50: { icv: 139, percentile: 99.6 },
    51: { icv: 141, percentile: 99.7 },
    52: { icv: 144, percentile: 99.8 },
    53: { icv: 146, percentile: 99.9 },
    54: { icv: 148, percentile: 99.9 },
    55: { icv: 149, percentile: 99.9 },
    56: { icv: 150, percentile: 99.9 },
    57: { icv: 150, percentile: 99.9 }
};

/**
 * Clasificaciones descriptivas según la Tabla 4.1 del manual
 */
const CLASSIFICATIONS = {
    VERY_SUPERIOR: { min: 130, max: Infinity, label: 'Muy Superior', class: 'very-superior' },
    SUPERIOR: { min: 120, max: 129, label: 'Superior', class: 'superior' },
    ABOVE_AVERAGE: { min: 110, max: 119, label: 'Sobre el Promedio', class: 'above-average' },
    AVERAGE: { min: 90, max: 109, label: 'Promedio', class: 'average' },
    BELOW_AVERAGE: { min: 80, max: 89, label: 'Bajo el Promedio', class: 'below-average' },
    BORDERLINE: { min: 70, max: 79, label: 'Limítrofe', class: 'borderline' },
    VERY_LOW: { min: -Infinity, max: 69, label: 'Muy Bajo', class: 'very-low' }
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================

const elements = {
    analogiesScore: document.getElementById('analogies-score'),
    vocabularyScore: document.getElementById('vocabulary-score'),
    informationScore: document.getElementById('information-score'),
    calculateBtn: document.getElementById('calculate-btn'),
    resultsSection: document.getElementById('results-section'),
    anaValue: document.getElementById('ana-value'),
    vocValue: document.getElementById('voc-value'),
    infValue: document.getElementById('inf-value'),
    sumValue: document.getElementById('sum-value'),
    icvValue: document.getElementById('icv-value'),
    percentileValue: document.getElementById('percentile-value'),
    classificationBadge: document.getElementById('classification-badge'),
    icvMarker: document.getElementById('icv-marker'),
    markerValue: document.getElementById('marker-value'),
    interpretationText: document.getElementById('interpretation-text'),
    resetBtn: document.getElementById('reset-btn')
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    elements.calculateBtn.addEventListener('click', calculateICV);
    elements.resetBtn.addEventListener('click', resetCalculator);

    // Validar inputs mientras el usuario escribe
    [elements.analogiesScore, elements.vocabularyScore, elements.informationScore].forEach(input => {
        input.addEventListener('input', validateInput);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculateICV();
        });
    });
}

/**
 * Valida que el input esté en el rango válido (1-19)
 * @param {Event} event - Evento de input
 */
function validateInput(event) {
    const input = event.target;
    let value = parseInt(input.value);

    if (value < 1) input.value = 1;
    if (value > 19) input.value = 19;
}

// ============================================
// CÁLCULO DEL ICV
// ============================================

/**
 * Calcula el ICV a partir de los puntajes escalares ingresados
 */
function calculateICV() {
    // Obtener valores
    const analogies = parseInt(elements.analogiesScore.value);
    const vocabulary = parseInt(elements.vocabularyScore.value);
    const information = parseInt(elements.informationScore.value);

    // Validar que todos los campos estén completos
    if (isNaN(analogies) || isNaN(vocabulary) || isNaN(information)) {
        alert('Por favor, ingresa los tres puntajes escalares (1-19)');
        return;
    }

    // Validar rangos
    if (analogies < 1 || analogies > 19 || 
        vocabulary < 1 || vocabulary > 19 || 
        information < 1 || information > 19) {
        alert('Los puntajes escalares deben estar entre 1 y 19');
        return;
    }

    // Calcular suma
    const sum = analogies + vocabulary + information;

    // Obtener ICV y percentil de la tabla
    const result = getICVFromTable(sum);

    // Obtener clasificación
    const classification = getClassification(result.icv);

    // Mostrar resultados
    displayResults({
        analogies,
        vocabulary,
        information,
        sum,
        icv: result.icv,
        percentile: result.percentile,
        classification
    });
}

/**
 * Obtiene el ICV y percentil de la Tabla A.2
 * @param {number} sum - Suma de puntajes equivalentes
 * @returns {Object} - { icv, percentile }
 */
function getICVFromTable(sum) {
    // Verificar si la suma está en la tabla
    if (ICV_TABLE[sum]) {
        return ICV_TABLE[sum];
    }

    // Si está fuera de rango, usar valores extremos
    if (sum < 3) {
        return { icv: 50, percentile: 0.1 };
    }
    if (sum > 57) {
        return { icv: 150, percentile: 99.9 };
    }

    // No debería llegar aquí, pero por seguridad
    return { icv: 100, percentile: 50 };
}

/**
 * Obtiene la clasificación descriptiva según el ICV
 * @param {number} icv - Índice de Comprensión Verbal
 * @returns {Object} - Objeto de clasificación
 */
function getClassification(icv) {
    for (const [key, classification] of Object.entries(CLASSIFICATIONS)) {
        if (icv >= classification.min && icv <= classification.max) {
            return classification;
        }
    }
    return CLASSIFICATIONS.AVERAGE;
}

/**
 * Muestra los resultados en la UI
 * @param {Object} data - Datos calculados
 */
function displayResults(data) {
    // Mostrar sección de resultados
    elements.resultsSection.classList.remove('hidden');

    // Scroll suave a resultados
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Actualizar valores de suma
    elements.anaValue.textContent = data.analogies;
    elements.vocValue.textContent = data.vocabulary;
    elements.infValue.textContent = data.information;
    elements.sumValue.textContent = data.sum;

    // Actualizar ICV y percentil
    elements.icvValue.textContent = data.icv;
    elements.percentileValue.textContent = formatPercentile(data.percentile);

    // Actualizar clasificación
    elements.classificationBadge.textContent = data.classification.label;
    elements.classificationBadge.className = `classification-badge ${data.classification.class}`;

    // Actualizar marcador en la curva
    updateBellCurveMarker(data.icv);

    // Highlight de la sección correspondiente
    highlightCurveSection(data.icv);

    // Generar texto interpretativo
    elements.interpretationText.innerHTML = generateInterpretation(data);
}

/**
 * Formatea el percentil para mostrar
 * @param {number} percentile - Valor del percentil
 * @returns {string} - Percentil formateado
 */
function formatPercentile(percentile) {
    if (percentile >= 99) {
        return `>${Math.floor(percentile)}`;
    }
    if (percentile < 1) {
        return `<1`;
    }
    return percentile.toString();
}

/**
 * Actualiza la posición del marcador en la curva de campana
 * @param {number} icv - Valor del ICV
 */
function updateBellCurveMarker(icv) {
    elements.icvMarker.classList.remove('hidden');
    elements.markerValue.textContent = icv;

    // Calcular posición (ICV va de ~50 a ~150, mapeamos a 0-100%)
    // Usamos un rango de 55-145 para la visualización
    const minICV = 55;
    const maxICV = 145;
    const clampedICV = Math.max(minICV, Math.min(maxICV, icv));
    const percentage = ((clampedICV - minICV) / (maxICV - minICV)) * 100;

    elements.icvMarker.style.left = `${percentage}%`;
}

/**
 * Resalta la sección correspondiente en la curva
 * @param {number} icv - Valor del ICV
 */
function highlightCurveSection(icv) {
    // Remover highlights anteriores
    document.querySelectorAll('.curve-sections .section').forEach(section => {
        section.classList.remove('active');
    });

    // Determinar qué sección activar
    let sectionClass;
    if (icv >= 130) sectionClass = 'very-superior';
    else if (icv >= 120) sectionClass = 'superior';
    else if (icv >= 110) sectionClass = 'above-avg';
    else if (icv >= 90) sectionClass = 'average';
    else if (icv >= 80) sectionClass = 'below-avg';
    else if (icv >= 70) sectionClass = 'borderline';
    else sectionClass = 'very-low';

    const activeSection = document.querySelector(`.section.${sectionClass}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
}

/**
 * Genera el texto interpretativo de los resultados
 * @param {Object} data - Datos calculados
 * @returns {string} - HTML con la interpretación
 */
function generateInterpretation(data) {
    const descriptions = {
        'very-superior': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Muy Superior</strong>, superando al ${data.percentile}% de la población de referencia. Esto indica capacidades excepcionales en razonamiento verbal, formación de conceptos y conocimiento adquirido.`,
        
        'superior': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Superior</strong>, superando al ${data.percentile}% de la población de referencia. Esto refleja habilidades verbales significativamente por encima del promedio en comprensión, expresión y razonamiento verbal.`,
        
        'above-average': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Sobre el Promedio</strong>, superando al ${data.percentile}% de la población de referencia. Indica un buen desarrollo de las capacidades de comprensión verbal, vocabulario y conocimiento general.`,
        
        'average': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Promedio</strong>, equivalente al percentil ${data.percentile}. Las habilidades de comprensión verbal, vocabulario y razonamiento verbal se encuentran dentro de lo esperado para su grupo de edad.`,
        
        'below-average': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Bajo el Promedio</strong>, en el percentil ${data.percentile}. Sugiere que las habilidades de comprensión verbal podrían beneficiarse de intervención y estimulación adicional.`,
        
        'borderline': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Limítrofe</strong>, en el percentil ${data.percentile}. Indica dificultades en las capacidades verbales que requieren evaluación adicional y posible intervención.`,
        
        'very-low': `Un ICV de <strong>${data.icv}</strong> se ubica en el rango <strong>Muy Bajo</strong>, en el percentil ${data.percentile}. Señala dificultades significativas en comprensión verbal que requieren evaluación detallada y apoyo especializado.`
    };

    return `<p>${descriptions[data.classification.class]}</p>`;
}

/**
 * Reinicia la calculadora
 */
function resetCalculator() {
    // Limpiar inputs
    elements.analogiesScore.value = '';
    elements.vocabularyScore.value = '';
    elements.informationScore.value = '';

    // Ocultar resultados
    elements.resultsSection.classList.add('hidden');

    // Remover highlights de la curva
    document.querySelectorAll('.curve-sections .section').forEach(section => {
        section.classList.remove('active');
    });

    // Ocultar marcador
    elements.icvMarker.classList.add('hidden');

    // Scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
