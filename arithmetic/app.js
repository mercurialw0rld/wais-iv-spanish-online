/**
 * ============================================================================
 * WAIS-V Entrenamiento - Subtest de Aritmética
 * ============================================================================
 * 
 * Este módulo implementa la simulación del subtest de Aritmética del WAIS-IV
 * siguiendo las reglas del manual:
 * 
 * - Punto de inicio: Ítem de práctica, luego ítem 6
 * - Regla de secuencia inversa si falla ítems 6 o 7
 * - Criterio de suspensión: 3 fracasos consecutivos
 * - Tiempo límite: 30 segundos por ítem
 * - Una repetición permitida por ítem (sin reiniciar tiempo)
 * 
 */

// ============================================================================
// CONFIGURACIÓN Y DATOS
// ============================================================================

/**
 * Base de datos de ítems del subtest de Aritmética.
 * Cada ítem contiene el texto del problema y la respuesta correcta.
 * Las respuestas alternativas se manejan en la función de validación.
 */
const ITEMS_DATABASE = {
    practice: {
        id: 'practice',
        text: 'Luis tiene 6 pelotas de tenis. Si pierde 3, ¿cuántas pelotas le quedan?',
        answer: 3,
        alternativeAnswers: []
    },
    1: {
        id: 1,
        text: 'Si tienes dos manzanas y compras una más, ¿cuántas manzanas tienes en total?',
        answer: 3,
        alternativeAnswers: []
    },
    2: {
        id: 2,
        text: 'Si tienes cinco lápices en una mano y cinco en la otra, ¿cuántos lápices tienes en total?',
        answer: 10,
        alternativeAnswers: []
    },
    3: {
        id: 3,
        text: 'Juan tiene tres pelotas y regala una. ¿Cuántas pelotas le quedan?',
        answer: 2,
        alternativeAnswers: []
    },
    4: {
        id: 4,
        text: 'En una mesa hay cuatro sillas y traen dos sillas más. ¿Cuántas sillas hay ahora en la mesa?',
        answer: 6,
        alternativeAnswers: []
    },
    5: {
        id: 5,
        text: 'Si tienes diez dulces y le das cinco a un amigo, ¿cuántos dulces te quedan?',
        answer: 5,
        alternativeAnswers: []
    },
    6: {
        id: 6,
        text: 'Pedro tiene cuatro frazadas. Si compra cuatro más, ¿cuántas frazadas tiene ahora?',
        answer: 8,
        alternativeAnswers: []
    },
    7: {
        id: 7,
        text: 'Mario tiene 9 lápices. Si le da cuatro a Juana, ¿cuántos lápices le quedan a Mario?',
        answer: 5,
        alternativeAnswers: []
    },
    8: {
        id: 8,
        text: 'Álvaro tiene 4 hijos y 20 juguetes. Si cada niño recibe el mismo número de juguetes, ¿cuántos recibe cada uno de ellos?',
        answer: 5,
        alternativeAnswers: []
    },
    9: {
        id: 9,
        text: 'Juan tiene 28 libros. Si vende la mitad de ellos a un local de libros usados y regala otros 9, ¿cuántos libros le quedan?',
        answer: 5,
        alternativeAnswers: []
    },
    10: {
        id: 10,
        text: 'Susana tiene 35 años y Roberto tiene 18 años. ¿Cuántos años mayor es Susana que Roberto?',
        answer: 17,
        alternativeAnswers: []
    },
    11: {
        id: 11,
        text: 'Hay 25 paquetes de chicle en una caja. ¿Cuántos paquetes hay en 8 cajas?',
        answer: 200,
        alternativeAnswers: []
    },
    12: {
        id: 12,
        text: 'Pablo tiene 51 boletos. Si regala 8 boletos a cada uno de sus 6 amigos, ¿cuántos boletos le quedan?',
        answer: 3,
        alternativeAnswers: []
    },
    13: {
        id: 13,
        text: 'Jorge regala 4 cartas a cada uno de sus 8 tíos. Si le quedan solo 6 cartas, ¿cuántas tenía al principio?',
        answer: 38,
        alternativeAnswers: []
    },
    14: {
        id: 14,
        text: 'Andrea corre 22 minutos al día de lunes a viernes. Los sábados corre 30 minutos. ¿Cuántos minutos corre en total?',
        answer: 140,
        alternativeAnswers: []
    },
    15: {
        id: 15,
        text: 'Benjamín vendió dos tercios del número de mapas que vendió Camila. Si Benjamín vendió 400 mapas, ¿cuántos vendió Camila?',
        answer: 600,
        alternativeAnswers: []
    },
    16: {
        id: 16,
        text: 'Si Diego prepara 2 pasteles en 31 minutos, ¿cuánto tiempo le toma preparar 12 pasteles?',
        answer: 186,
        alternativeAnswers: []
    },
    17: {
        id: 17,
        text: 'Cristián pesa el doble que Ricardo. Si Cristián pesa 99 kilos, ¿cuánto pesa Ricardo?',
        answer: 49.5,
        alternativeAnswers: [49, 50] // Aceptar redondeos cercanos
    },
    18: {
        id: 18,
        text: 'Javier trabajó 188 horas en 4 semanas. Si todas las semanas trabajó la misma cantidad de tiempo, ¿cuántas horas trabajó en cada una de ellas?',
        answer: 47,
        alternativeAnswers: []
    },
    19: {
        id: 19,
        text: 'Pamela da, normalmente, 60 vueltas a la pista en su caballo. Si hoy disminuyó la cantidad de vueltas en un 15%, ¿cuántas vueltas dio?',
        answer: 51,
        alternativeAnswers: []
    },
    20: {
        id: 20,
        text: 'Carmen hace una fila detrás de 160 personas. Deja pasar a 20 personas antes que ella. Si 6 personas llegan al primer lugar de la fila cada minuto, ¿cuánto tiempo falta para que Carmen llegue al primer lugar?',
        answer: 30,
        alternativeAnswers: []
    },
    21: {
        id: 21,
        text: 'Si 8 máquinas pueden terminar un trabajo en 6 días, ¿cuántas se necesitan para terminar el trabajo en medio día?',
        answer: 96,
        alternativeAnswers: []
    },
    22: {
        id: 22,
        text: 'Una oficina de correos entrega 20.000 cartas en octubre. En noviembre, la cantidad de cartas entregadas aumenta un 10% y en diciembre aumenta otro 5%. ¿Cuántas cartas se entregaron en diciembre luego de ambos aumentos?',
        answer: 23100,
        alternativeAnswers: []
    }
};

// ============================================================================
// BAREMOS - TABLAS DE CONVERSIÓN RAW SCORE A SCALED SCORE
// ============================================================================

/**
 * Tabla de baremos por grupo de edad.
 * Cada grupo contiene un array donde el índice es el Puntaje Escalar (PE)
 * y el valor es un array [min, max] del Raw Score correspondiente.
 * 
 * Formato: { grupoEdad: { minAge, maxAge, label, conversions: { PE: [minRS, maxRS] } } }
 */
const BAREMOS = {
    '16-17': {
        minAge: 16, maxAge: 17.99, label: '16:0 a 17:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 11], 10: [12, 12],
            11: [13, 13], 12: [14, 15], 13: [16, 16], 14: [17, 17], 15: [18, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '18-19': {
        minAge: 18, maxAge: 19.99, label: '18:0 a 19:11 años',
        conversions: {
            1: [0, 3], 2: [4, 5], 3: [6, 6], 4: [7, 7], 5: [8, 8],
            6: [9, 9], 7: [10, 10], 8: [11, 11], 9: [12, 12], 10: [13, 14],
            11: [15, 15], 12: [16, 16], 13: [17, 18], 14: [19, 19], 15: [20, 20],
            16: [21, 21], 17: [22, 22], 18: null, 19: null
        }
    },
    '20-24': {
        minAge: 20, maxAge: 24.99, label: '20:0 a 24:11 años (Referencia)',
        conversions: {
            1: [0, 3], 2: [4, 4], 3: [5, 5], 4: [6, 6], 5: [7, 7],
            6: [8, 8], 7: [9, 9], 8: [10, 10], 9: [11, 11], 10: [12, 13],
            11: [14, 14], 12: [15, 15], 13: [16, 17], 14: [18, 18], 15: [19, 19],
            16: [20, 20], 17: [21, 21], 18: null, 19: [22, 22]
        }
    },
    '25-29': {
        minAge: 25, maxAge: 29.99, label: '25:0 a 29:11 años',
        conversions: {
            1: [0, 3], 2: [4, 4], 3: [5, 5], 4: [6, 6], 5: [7, 7],
            6: [8, 8], 7: [9, 9], 8: [10, 10], 9: [11, 11], 10: [12, 13],
            11: [14, 14], 12: [15, 15], 13: [16, 17], 14: [18, 18], 15: [19, 19],
            16: [20, 20], 17: [21, 21], 18: null, 19: [22, 22]
        }
    },
    '30-34': {
        minAge: 30, maxAge: 34.99, label: '30:0 a 34:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 13], 12: [14, 14], 13: [15, 16], 14: [17, 17], 15: [18, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '35-44': {
        minAge: 35, maxAge: 44.99, label: '35:0 a 44:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 13], 12: [14, 14], 13: [15, 16], 14: [17, 17], 15: [18, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '45-54': {
        minAge: 45, maxAge: 54.99, label: '45:0 a 54:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 13], 12: [14, 14], 13: [15, 16], 14: [17, 17], 15: [18, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '55-64': {
        minAge: 55, maxAge: 64.99, label: '55:0 a 64:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 13], 12: [14, 14], 13: [15, 15], 14: [16, 17], 15: [18, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '65-69': {
        minAge: 65, maxAge: 69.99, label: '65:0 a 69:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 13], 12: [14, 14], 13: [15, 15], 14: [16, 16], 15: [17, 18],
            16: [19, 19], 17: [20, 20], 18: [21, 21], 19: [22, 22]
        }
    },
    '70-74': {
        minAge: 70, maxAge: 74.99, label: '70:0 a 74:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 12], 12: [13, 13], 13: [14, 14], 14: [15, 15], 15: [16, 16],
            16: [17, 17], 17: [18, 18], 18: [19, 19], 19: [20, 22]
        }
    },
    '75-79': {
        minAge: 75, maxAge: 79.99, label: '75:0 a 79:11 años',
        conversions: {
            1: [0, 2], 2: [3, 3], 3: [4, 4], 4: [5, 5], 5: [6, 6],
            6: [7, 7], 7: [8, 8], 8: [9, 9], 9: [10, 10], 10: [11, 11],
            11: [12, 12], 12: [13, 13], 13: [14, 14], 14: [15, 15], 15: [16, 16],
            16: [17, 17], 17: [18, 18], 18: [19, 19], 19: [20, 22]
        }
    },
    '80-84': {
        minAge: 80, maxAge: 84.99, label: '80:0 a 84:11 años',
        conversions: {
            1: [0, 1], 2: [2, 2], 3: [3, 3], 4: [4, 4], 5: [5, 5],
            6: [6, 6], 7: [7, 7], 8: [8, 8], 9: [9, 9], 10: [10, 10],
            11: [11, 11], 12: [12, 12], 13: [13, 13], 14: [14, 14], 15: [15, 15],
            16: [16, 16], 17: [17, 17], 18: [18, 18], 19: [19, 22]
        }
    },
    '85-90': {
        minAge: 85, maxAge: 90.99, label: '85:0 a 90:11 años',
        conversions: {
            1: [0, 0], 2: [1, 1], 3: [2, 2], 4: [3, 3], 5: [4, 4],
            6: [5, 5], 7: [6, 6], 8: [7, 7], 9: [8, 8], 10: [9, 9],
            11: [10, 10], 12: [11, 11], 13: [12, 12], 14: [13, 13], 15: [14, 14],
            16: [15, 15], 17: [16, 16], 18: [17, 17], 19: [18, 22]
        }
    }
};

/**
 * Obtiene el grupo de edad correspondiente según la edad del usuario
 * @param {number} age - Edad del usuario en años
 * @returns {Object|null} Objeto del grupo de edad o null si no se encuentra
 */
function getAgeGroup(age) {
    for (const [key, group] of Object.entries(BAREMOS)) {
        if (age >= group.minAge && age <= group.maxAge) {
            return { key, ...group };
        }
    }
    return null;
}

/**
 * Convierte el Raw Score a Scaled Score (Puntaje Escalar) según la edad
 * @param {number} rawScore - Puntaje bruto obtenido
 * @param {number} age - Edad del usuario en años
 * @returns {Object} Objeto con scaledScore, ageGroup y label
 */
function rawToScaledScore(rawScore, age) {
    const ageGroup = getAgeGroup(age);
    
    if (!ageGroup) {
        return {
            scaledScore: null,
            ageGroupKey: null,
            ageGroupLabel: 'Edad fuera de rango (16-90 años)',
            error: true
        };
    }
    
    // Buscar el PE correspondiente al Raw Score
    for (let pe = 19; pe >= 1; pe--) {
        const range = ageGroup.conversions[pe];
        if (range === null) continue; // PE no disponible para este grupo
        
        const [minRS, maxRS] = range;
        if (rawScore >= minRS && rawScore <= maxRS) {
            return {
                scaledScore: pe,
                ageGroupKey: ageGroup.key,
                ageGroupLabel: ageGroup.label,
                error: false
            };
        }
    }
    
    // Si el raw score es mayor que cualquier rango, dar el máximo PE disponible
    // (esto no debería pasar si los datos están bien)
    return {
        scaledScore: 1,
        ageGroupKey: ageGroup.key,
        ageGroupLabel: ageGroup.label,
        error: false
    };
}

/**
 * Configuración de constantes del test
 */
const CONFIG = {
    TIME_LIMIT_SECONDS: 30,
    CONSECUTIVE_FAILURES_TO_STOP: 3,
    STANDARD_START_ITEM: 6,
    TTS_LANG: 'es-ES',
    TTS_RATE: 0.9,
    STT_LANG: 'es-ES'
};

// ============================================================================
// ESTADO DE LA APLICACIÓN
// ============================================================================

/**
 * Estado global de la evaluación
 */
const state = {
    currentItemId: null,           // ID del ítem actual
    score: 0,                       // Puntaje acumulado
    consecutiveErrors: 0,           // Errores consecutivos
    hasRepeated: false,             // Si ya se repitió el ítem actual
    timerInterval: null,            // Referencia al intervalo del timer
    timeRemaining: 30,              // Tiempo restante en segundos
    timerStarted: false,            // Si el timer ya empezó
    isListening: false,             // Si está escuchando por micrófono
    testEnded: false,               // Si el test terminó
    itemsAdministered: [],          // Historial de ítems administrados
    reverseSequenceActive: false,   // Si está en secuencia inversa
    reverseSequenceNeeded: false,   // Si se necesita secuencia inversa
    perfectScoresInReverse: 0,      // Puntajes perfectos consecutivos en reversa
    capturedResponse: null,         // Respuesta capturada por STT
    userAge: 25,                    // Edad del usuario en años
    autoCreditApplied: false        // Si ya se otorgó crédito automático de ítems 1-5
};

// ============================================================================
// REFERENCIAS AL DOM
// ============================================================================

/**
 * Obtiene referencias a los elementos del DOM
 * @returns {Object} Objeto con todas las referencias a elementos
 */
function getDOMElements() {
    return {
        // Pantallas
        instructionsScreen: document.getElementById('instructions-screen'),
        evaluationScreen: document.getElementById('evaluation-screen'),
        resultsScreen: document.getElementById('results-screen'),
        
        // Input de edad
        userAgeInput: document.getElementById('user-age'),
        
        // Status panel
        currentItemDisplay: document.getElementById('current-item'),
        timerDisplay: document.getElementById('timer'),
        scoreDisplay: document.getElementById('score'),
        consecutiveErrorsDisplay: document.getElementById('consecutive-errors'),
        
        // Evaluación
        statusIndicator: document.getElementById('status-indicator'),
        capturedResponse: document.getElementById('captured-response'),
        btnRepeat: document.getElementById('btn-repeat'),
        btnMic: document.getElementById('btn-mic'),
        feedback: document.getElementById('feedback'),
        
        // Resultados
        finalScore: document.getElementById('final-score'),
        scaledScore: document.getElementById('scaled-score'),
        ageGroup: document.getElementById('age-group'),
        itemsCompleted: document.getElementById('items-completed'),
        itemLog: document.getElementById('item-log'),
        
        // Botones principales
        btnStart: document.getElementById('btn-start'),
        btnRestart: document.getElementById('btn-restart')
    };
}

// ============================================================================
// FUNCIONES DE TEXT-TO-SPEECH (TTS)
// ============================================================================

/**
 * Sintetiza texto a voz usando la API Web Speech
 * @param {string} text - Texto a sintetizar
 * @returns {Promise<void>} Promesa que se resuelve cuando termina de hablar
 */
function speak(text) {
    return new Promise((resolve, reject) => {
        // Cancelar cualquier síntesis anterior
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = CONFIG.TTS_LANG;
        utterance.rate = CONFIG.TTS_RATE;
        
        // Intentar usar una voz en español
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => 
            voice.lang.startsWith('es') && voice.name.includes('Microsoft')
        ) || voices.find(voice => voice.lang.startsWith('es'));
        
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        utterance.onend = () => {
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.error('Error en TTS:', event);
            reject(event);
        };
        
        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Pre-carga las voces del navegador (necesario en algunos navegadores)
 * @returns {Promise<void>}
 */
function loadVoices() {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                resolve();
            };
        }
    });
}

// ============================================================================
// FUNCIONES DE SPEECH-TO-TEXT (STT)
// ============================================================================

/**
 * Instancia del reconocedor de voz
 */
let recognition = null;

/**
 * Normaliza la transcripción para mejorar extracción numérica.
 * - Elimina muletillas/conectores.
 * - Colapsa repeticiones consecutivas (artefactos de STT).
 * - Unifica separadores decimales "coma"/"punto".
 * @param {string} text
 * @returns {string}
 */
function normalizeTranscript(text) {
    const fillers = ['y', 'ee', 'eh', 'este', 'pues', 'mmm', 'ajá', 'aja'];
    let normalized = text.toLowerCase()
        .replace(/[¿?¡!,:;]/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    // Convertir "coma" y "punto" a separador decimal
    normalized = normalized.replace(/\bcoma\b|\bpunto\b/g, '.');
    const tokens = normalized.split(' ').filter(Boolean);
    const cleaned = [];
    for (const token of tokens) {
        if (fillers.includes(token)) continue;
        if (cleaned.length && cleaned[cleaned.length - 1] === token) continue;
        cleaned.push(token);
    }
    return cleaned.join(' ');
}

/**
 * Convierte palabras numéricas en español a valor numérico (hasta miles).
 * @param {string[]} tokens
 * @returns {number|null}
 */
function parseSpanishNumber(tokens) {
    const units = {
        'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
        'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
        'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14,
        'quince': 15, 'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17,
        'dieciocho': 18, 'diecinueve': 19
    };
    const tens = {
        'veinte': 20, 'veintiuno': 21, 'veintiuna': 21, 'veintidós': 22, 'veintidos': 22,
        'veintitrés': 23, 'veintitres': 23, 'veinticuatro': 24, 'veinticinco': 25,
        'veintiséis': 26, 'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
        'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60,
        'setenta': 70, 'ochenta': 80, 'noventa': 90
    };
    const hundreds = {
        'cien': 100, 'ciento': 100, 'doscientos': 200, 'doscientas': 200,
        'trescientos': 300, 'trescientas': 300, 'cuatrocientos': 400, 'cuatrocientas': 400,
        'quinientos': 500, 'quinientas': 500, 'seiscientos': 600, 'seiscientas': 600,
        'setecientos': 700, 'setecientas': 700, 'ochocientos': 800, 'ochocientas': 800,
        'novecientos': 900, 'novecientas': 900
    };
    let total = 0;
    let current = 0;
    for (const token of tokens) {
        if (token === 'y') continue;
        if (units.hasOwnProperty(token)) {
            current += units[token];
        } else if (tens.hasOwnProperty(token)) {
            current += tens[token];
        } else if (hundreds.hasOwnProperty(token)) {
            current += hundreds[token];
        } else if (token === 'mil') {
            total += (current || 1) * 1000;
            current = 0;
        } else {
            return null; // token desconocido
        }
    }
    return total + current;
}

/**
 * Extrae todos los números posibles de un texto (en dígitos o palabras) incluyendo decimales.
 * @param {string} text
 * @returns {number[]}
 */
function extractNumbersFromTranscript(text) {
    const normalized = normalizeTranscript(text);
    const numbers = [];
    
    // 1) Números en dígitos (con . o , como decimal)
    const digitMatches = normalized.match(/-?\d+(?:[.,]\d+)?/g);
    if (digitMatches) {
        for (const match of digitMatches) {
            const value = parseFloat(match.replace(',', '.'));
            if (!Number.isNaN(value)) numbers.push(value);
        }
    }
    
    // 2) Decimales con palabras: "X . Y"
    const decimalWordMatch = normalized.match(/([\w\s]+)\.([\w\s]+)/);
    if (decimalWordMatch) {
        const leftTokens = decimalWordMatch[1].trim().split(' ').filter(Boolean);
        const rightTokens = decimalWordMatch[2].trim().split(' ').filter(Boolean);
        const left = parseSpanishNumber(leftTokens) ?? parseFloat(leftTokens.join(''));
        const rightNumeric = parseSpanishNumber(rightTokens);
        const rightDigitsStr = rightNumeric !== null ? rightNumeric.toString() : rightTokens.join('');
        if (left !== null && rightDigitsStr !== '') {
            const fraction = rightDigitsStr.replace(/\s+/g, '');
            const value = parseFloat(`${left}.${fraction}`);
            if (!Number.isNaN(value)) numbers.push(value);
        }
    }
    
    // 3) Números solo en palabras
    if (numbers.length === 0) {
        const wordTokens = normalized.split(' ').filter(Boolean);
        const value = parseSpanishNumber(wordTokens);
        if (value !== null) numbers.push(value);
    }
    
    // Deduplicar preservando orden
    const deduped = [];
    for (const n of numbers) {
        if (!deduped.some(x => Math.abs(x - n) < 0.0001)) deduped.push(n);
    }
    return deduped;
}

/**
 * Selecciona la mejor alternativa de SpeechRecognition ponderando confianza y cantidad de números.
 * @param {SpeechRecognitionEvent} event
 * @returns {{transcript: string, confidence: number}}
 */
function selectBestTranscript(event) {
    const lastIndex = event.results.length - 1;
    const alternatives = Array.from(event.results[lastIndex]);
    let best = alternatives[0];
    let bestScore = -1;
    for (const alt of alternatives) {
        const nums = extractNumbersFromTranscript(alt.transcript);
        const score = (alt.confidence || 0) + nums.length * 0.05;
        if (score > bestScore) {
            bestScore = score;
            best = alt;
        }
    }
    return { transcript: best.transcript.trim(), confidence: best.confidence || 0 };
}

/**
 * Si hay múltiples números en la transcripción, pide al usuario cuál es la respuesta correcta.
 * @param {number[]} numbers
 * @returns {number|null}
 */
function resolveMultipleResponses(numbers) {
    if (numbers.length <= 1) return numbers[0] ?? null;
    const [first, second] = numbers;
    const message = `Usted dijo ${first} y también dijo ${second}. ¿Cuál es la correcta?\nPulsa Aceptar para ${first} o Cancelar para ${second}.`;
    return window.confirm(message) ? first : second;
}

/**
 * Inicializa el reconocedor de voz
 */
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.error('Speech Recognition no está soportado en este navegador');
        alert('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.');
        return;
    }
    
    createRecognitionInstance();
}

/**
 * Crea una nueva instancia del reconocedor de voz
 * Se debe llamar antes de cada sesión de escucha para evitar problemas
 */
function createRecognitionInstance() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;
    
    recognition = new SpeechRecognition();
    recognition.lang = CONFIG.STT_LANG;
    recognition.continuous = true;           // Mantener escuchando
    recognition.interimResults = true;       // Mostrar resultados intermedios
    recognition.maxAlternatives = 5;
    
    recognition.onresult = handleSpeechResult;
    recognition.onerror = handleSpeechError;
    recognition.onend = handleSpeechEnd;
    recognition.onsoundstart = () => {
        console.log('Sonido detectado');
    };
    recognition.onspeechstart = () => {
        console.log('Habla detectada');
    };
}

/**
 * Inicia la escucha del micrófono
 */
function startListening() {
    if (state.isListening) return;
    
    // Recrear instancia para evitar problemas de estado
    createRecognitionInstance();
    
    if (!recognition) {
        alert('El reconocimiento de voz no está disponible.');
        return;
    }
    
    state.isListening = true;
    const elements = getDOMElements();
    elements.btnMic.classList.add('listening');
    elements.btnMic.textContent = '⏹';
    updateStatusIndicator('listening', 'Escuchando... Habla ahora');
    
    try {
        recognition.start();
        console.log('Reconocimiento de voz iniciado');
    } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        stopListening();
    }
}

/**
 * Detiene la escucha del micrófono
 */
function stopListening() {
    state.isListening = false;
    const elements = getDOMElements();
    elements.btnMic.classList.remove('listening');
    elements.btnMic.textContent = '🎤';
    
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            // Ignorar error si ya estaba detenido
        }
    }
}

/**
 * Maneja el resultado del reconocimiento de voz
 * @param {SpeechRecognitionEvent} event - Evento con los resultados
 */
function handleSpeechResult(event) {
    const elements = getDOMElements();
    const { transcript } = selectBestTranscript(event);
    const isFinal = event.results[event.results.length - 1].isFinal;
    const candidates = extractNumbersFromTranscript(transcript);
    
    console.log('Transcripción:', transcript, '| Final:', isFinal, '| Candidatos:', candidates);
    
    if (candidates.length > 0) {
        // Solo preguntar por múltiples respuestas cuando es resultado final
        const numberToUse = candidates.length === 1
            ? candidates[0]
            : (isFinal ? resolveMultipleResponses(candidates) : candidates[0]);
        if (numberToUse === null || numberToUse === undefined) {
            elements.capturedResponse.textContent = `"${transcript}"`;
            return;
        }
        state.capturedResponse = numberToUse;
        elements.capturedResponse.textContent = numberToUse;
        
        if (isFinal && state.timerStarted) {
            stopListening();
            processResponse(numberToUse);
        }
    } else {
        elements.capturedResponse.textContent = `"${transcript}"`;
    }
}

/**
 * Maneja errores del reconocimiento de voz
 * @param {SpeechRecognitionError} event - Evento de error
 */
function handleSpeechError(event) {
    console.error('Error de reconocimiento:', event.error);
    
    // No detener si es un error menor que se puede recuperar
    if (event.error === 'no-speech') {
        // Si no hay habla, seguir escuchando (no hacer nada)
        console.log('No se detectó habla, continuando...');
        updateStatusIndicator('listening', 'No se detectó voz. Sigue hablando...');
        return;
    } else if (event.error === 'aborted') {
        // Fue abortado intencionalmente
        return;
    } else if (event.error === 'not-allowed') {
        stopListening();
        alert('Por favor permite el acceso al micrófono para continuar. Verifica que estés en HTTPS o localhost.');
    } else if (event.error === 'network') {
        stopListening();
        updateStatusIndicator('waiting', 'Error de red. Intenta de nuevo.');
    } else {
        stopListening();
        updateStatusIndicator('waiting', 'Error de reconocimiento. Intenta de nuevo.');
    }
}

/**
 * Maneja el fin del reconocimiento de voz
 */
function handleSpeechEnd() {
    console.log('Reconocimiento terminado');
    
    // Si todavía debería estar escuchando (continuous mode puede terminar),
    // reiniciar automáticamente
    if (state.isListening && state.timerStarted && !state.testEnded) {
        console.log('Reiniciando reconocimiento...');
        try {
            recognition.start();
        } catch (error) {
            console.error('Error al reiniciar:', error);
            stopListening();
            updateStatusIndicator('waiting', 'Presiona el micrófono para hablar');
        }
        return;
    }
    
    stopListening();
    
    if (state.timerStarted && !state.testEnded) {
        updateStatusIndicator('waiting', 'Presiona el micrófono para responder');
    }
}

/**
 * Extrae un número de un texto hablado
 * Maneja números escritos en letras y dígitos
 * @param {string} text - Texto del cual extraer el número
 * @returns {number|null} Número extraído o null si no se encuentra
 */
function extractNumberFromText(text) {
    // Usar el nuevo extractor mejorado
    const nums = extractNumbersFromTranscript(text);
    return nums.length ? nums[0] : null;
}

// ============================================================================
// FUNCIONES DE TIMER
// ============================================================================

/**
 * Inicia el cronómetro de 30 segundos
 */
function startTimer() {
    if (state.timerStarted) return;
    
    state.timerStarted = true;
    state.timeRemaining = CONFIG.TIME_LIMIT_SECONDS;
    
    const elements = getDOMElements();
    elements.btnMic.disabled = false;
    elements.btnRepeat.disabled = state.hasRepeated;
    
    updateTimerDisplay();
    
    // Iniciar escucha automáticamente
    setTimeout(() => {
        startListening();
    }, 300);
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        if (state.timeRemaining <= 0) {
            handleTimeout();
        }
    }, 1000);
}

/**
 * Detiene el cronómetro
 */
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.timerStarted = false;
}

/**
 * Actualiza la visualización del timer
 */
function updateTimerDisplay() {
    const elements = getDOMElements();
    elements.timerDisplay.textContent = `${state.timeRemaining}s`;
    
    // Cambiar color según tiempo restante
    elements.timerDisplay.classList.remove('warning', 'danger');
    if (state.timeRemaining <= 10 && state.timeRemaining > 5) {
        elements.timerDisplay.classList.add('warning');
    } else if (state.timeRemaining <= 5) {
        elements.timerDisplay.classList.add('danger');
    }
}

/**
 * Maneja el timeout (tiempo agotado)
 */
function handleTimeout() {
    stopTimer();
    stopListening();
    
    const elements = getDOMElements();
    
    // Marcar como incorrecto
    showFeedback('timeout', '⏱ Tiempo agotado - 0 puntos');
    updateStatusIndicator('timeout', 'Tiempo agotado');
    
    // Registrar resultado
    recordItemResult(state.currentItemId, null, false);

    // Retroalimentación correctiva para ítems de aprendizaje
    if (state.currentItemId === 1 || state.currentItemId === 2) {
        const item = ITEMS_DATABASE[state.currentItemId];
        if (item) provideLearningFeedback(item);
    }
    
    // Incrementar errores consecutivos
    state.consecutiveErrors++;
    elements.consecutiveErrorsDisplay.textContent = state.consecutiveErrors;
    
    // Verificar si debe continuar
    setTimeout(() => {
        checkAndProceed();
    }, 2000);
}

// ============================================================================
// FUNCIONES DE FLUJO DEL TEST
// ============================================================================

/**
 * Inicia la evaluación desde el principio
 */
async function startEvaluation() {
    // Resetear estado
    resetState();
    
    const elements = getDOMElements();
    
    // Capturar edad del usuario
    const ageInput = parseInt(elements.userAgeInput.value, 10);
    if (isNaN(ageInput) || ageInput < 16 || ageInput > 90) {
        alert('Por favor ingresa una edad válida entre 16 y 90 años.');
        return;
    }
    state.userAge = ageInput;
    
    // Cambiar a pantalla de evaluación
    showScreen('evaluation');
    
    // Cargar voces y comenzar con el ítem de práctica
    await loadVoices();
    
    // Administrar ítem de práctica
    await administerItem('practice');
}

/**
 * Administra un ítem específico
 * @param {string|number} itemId - ID del ítem a administrar
 */
async function administerItem(itemId) {
    const item = ITEMS_DATABASE[itemId];
    if (!item) {
        console.error('Ítem no encontrado:', itemId);
        endTest();
        return;
    }
    
    // Actualizar estado
    state.currentItemId = itemId;
    state.hasRepeated = false;
    state.capturedResponse = null;
    
    const elements = getDOMElements();
    
    // Actualizar UI
    elements.currentItemDisplay.textContent = itemId === 'practice' ? 'Práctica' : `Ítem ${itemId}`;
    elements.capturedResponse.textContent = '--';
    elements.btnRepeat.disabled = true;
    elements.btnMic.disabled = true;
    hideFeedback();
    
    // Indicar que está hablando
    updateStatusIndicator('speaking', 'Escucha el problema...');
    
    // Leer el problema en voz alta
    await speak(item.text);
    
    // Iniciar el cronómetro después de terminar de hablar
    startTimer();
    updateStatusIndicator('waiting', 'Responde ahora');
}

/**
 * Repite el ítem actual (sin reiniciar el timer)
 */
async function repeatCurrentItem() {
    if (state.hasRepeated || !state.timerStarted) return;
    
    state.hasRepeated = true;
    const elements = getDOMElements();
    elements.btnRepeat.disabled = true;
    
    // Detener escucha durante la repetición
    stopListening();
    
    // Indicar que está repitiendo
    updateStatusIndicator('speaking', 'Repitiendo problema...');
    
    // Leer el problema nuevamente (el timer sigue corriendo)
    const item = ITEMS_DATABASE[state.currentItemId];
    await speak(item.text);
    
    // Volver a estado de espera
    updateStatusIndicator('waiting', 'Responde ahora');
}

/**
 * Procesa la respuesta del usuario
 * @param {number} response - Respuesta numérica del usuario
 */
function processResponse(response) {
    stopTimer();
    stopListening();
    
    const item = ITEMS_DATABASE[state.currentItemId];
    const isCorrect = validateResponse(response, item);
    
    const elements = getDOMElements();
    
    if (isCorrect) {
        // Respuesta correcta
        showFeedback('correct', '✓ Correcto - 1 punto');
        state.score++;
        state.consecutiveErrors = 0;
        elements.scoreDisplay.textContent = state.score;
        elements.consecutiveErrorsDisplay.textContent = state.consecutiveErrors;
        
        // Si estamos en reversa, contar puntaje perfecto
        if (state.reverseSequenceActive) {
            state.perfectScoresInReverse++;
        }
    } else {
        // Respuesta incorrecta
        showFeedback('incorrect', `✗ Incorrecto - La respuesta era ${item.answer}`);
        state.consecutiveErrors++;
        elements.consecutiveErrorsDisplay.textContent = state.consecutiveErrors;
        
        // Resetear contador de perfectos en reversa
        if (state.reverseSequenceActive) {
            state.perfectScoresInReverse = 0;
        }

        // Ítems de aprendizaje (1 y 2) requieren retroalimentación inmediata
        if (state.currentItemId === 1 || state.currentItemId === 2) {
            provideLearningFeedback(item);
        }
    }
    
    // Registrar resultado
    recordItemResult(state.currentItemId, response, isCorrect);
    
    // Verificar si debe continuar
    setTimeout(() => {
        checkAndProceed();
    }, 2000);
}

/**
 * Valida si la respuesta es correcta
 * @param {number} response - Respuesta del usuario
 * @param {Object} item - Objeto del ítem
 * @returns {boolean} True si la respuesta es correcta
 */
function validateResponse(response, item) {
    // Comparar con respuesta principal
    if (Math.abs(response - item.answer) < 0.1) {
        return true;
    }
    
    // Comparar con respuestas alternativas
    for (const alt of item.alternativeAnswers) {
        if (Math.abs(response - alt) < 0.1) {
            return true;
        }
    }
    
    return false;
}

/**
 * Registra el resultado de un ítem
 * @param {string|number} itemId - ID del ítem
 * @param {number|null} response - Respuesta dada
 * @param {boolean} correct - Si fue correcta
 */
function recordItemResult(itemId, response, correct, options = {}) {
    state.itemsAdministered.push({
        itemId,
        response,
        correct,
        credited: options.credited || false,
        timestamp: new Date()
    });
}

/**
 * Aplica crédito automático a ítems 1-5 cuando 6 y 7 fueron correctos.
 */
function applyAutoCreditIfEligible() {
    if (state.autoCreditApplied) return;
    const item6 = state.itemsAdministered.find(r => r.itemId === 6);
    const item7 = state.itemsAdministered.find(r => r.itemId === 7);
    if (!item6 || !item7) return;
    if (state.reverseSequenceNeeded) return; // hubo error en 6/7, no corresponde crédito automático
    if (item6.correct && item7.correct) {
        state.autoCreditApplied = true;
        for (let i = 1; i <= 5; i++) {
            recordItemResult(i, null, true, { credited: true });
        }
        state.score += 5;
        const elements = getDOMElements();
        elements.scoreDisplay.textContent = state.score;
        console.log('Crédito automático aplicado: +5 puntos (ítems 1-5)');
    }
}

/**
 * Retroalimentación correctiva para ítems de aprendizaje (1 y 2).
 * @param {Object} item
 */
function provideLearningFeedback(item) {
    const message = `La respuesta correcta es ${item.answer}.`;
    showFeedback('incorrect', `✗ Incorrecto - ${message}`);
    speak(message).catch(() => {});
}

/**
 * Verifica las condiciones y decide el siguiente paso
 */
function checkAndProceed() {
    const currentId = state.currentItemId;
    
    // Si era ítem de práctica, ir al ítem 6
    if (currentId === 'practice') {
        administerItem(CONFIG.STANDARD_START_ITEM);
        return;
    }
    
    // Verificar criterio de suspensión (3 errores consecutivos)
    if (state.consecutiveErrors >= CONFIG.CONSECUTIVE_FAILURES_TO_STOP) {
        endTest();
        return;
    }
    
    // Verificar regla de secuencia inversa
    if (!state.reverseSequenceActive) {
        const lastResult = state.itemsAdministered[state.itemsAdministered.length - 1];
        
        // Si falló ítem 6 o 7, activar secuencia inversa
        if ((currentId === 6 || currentId === 7) && !lastResult.correct) {
            state.reverseSequenceNeeded = true;
        }
        
        // Si completó ítem 7 sin activar reversa, aplicar crédito automático 1-5
        if (currentId === 7 && !state.reverseSequenceNeeded) {
            applyAutoCreditIfEligible();
        }
        
        // Si terminó ítem 7 y necesita reversa, iniciar secuencia inversa
        if (currentId === 7 && state.reverseSequenceNeeded) {
            state.reverseSequenceActive = true;
            state.perfectScoresInReverse = 0;
            administerItem(5); // Comenzar desde ítem 5 hacia atrás
            return;
        }
    }
    
    // Si estamos en secuencia inversa
    if (state.reverseSequenceActive) {
        // Si obtuvimos 2 perfectos consecutivos, terminar reversa
        if (state.perfectScoresInReverse >= 2) {
            state.reverseSequenceActive = false;
            // Continuar desde ítem 8
            administerItem(8);
            return;
        }
        
        // Ir al ítem anterior
        const prevItem = currentId - 1;
        if (prevItem >= 1) {
            administerItem(prevItem);
            return;
        } else {
            // Llegamos al ítem 1, terminar reversa
            state.reverseSequenceActive = false;
            administerItem(8);
            return;
        }
    }
    
    // Avanzar al siguiente ítem
    const nextItem = currentId + 1;
    if (nextItem <= 22) {
        administerItem(nextItem);
    } else {
        endTest();
    }
}

/**
 * Finaliza el test y muestra resultados
 */
function endTest() {
    state.testEnded = true;
    stopTimer();
    stopListening();
    
    const elements = getDOMElements();
    
    // Actualizar resultados básicos
    elements.finalScore.textContent = state.score;
    elements.itemsCompleted.textContent = state.itemsAdministered.length;
    
    // Calcular y mostrar Scaled Score
    const result = rawToScaledScore(state.score, state.userAge);
    if (result.error) {
        elements.scaledScore.textContent = 'N/A';
        elements.ageGroup.textContent = result.ageGroupLabel;
    } else {
        elements.scaledScore.textContent = result.scaledScore;
        elements.ageGroup.textContent = result.ageGroupLabel;
    }
    
    // Generar log de ítems
    let logHTML = '';
    for (const record of state.itemsAdministered) {
        const itemLabel = record.itemId === 'practice' ? 'Práctica' : `Ítem ${record.itemId}`;
        const responseText = record.credited ? 'Crédito automático' : (record.response !== null ? record.response : 'Sin respuesta');
        const statusClass = record.correct ? 'correct' : 'incorrect';
        const statusText = record.correct ? '✓' : '✗';
        
        logHTML += `
            <div class="item-log-entry ${statusClass}">
                <span>${itemLabel}</span>
                <span>Respuesta: ${responseText}</span>
                <span>${statusText}</span>
            </div>
        `;
    }
    elements.itemLog.innerHTML = logHTML;
    
    // Mostrar pantalla de resultados
    showScreen('results');
}

/**
 * Resetea el estado para una nueva evaluación
 */
function resetState() {
    state.currentItemId = null;
    state.score = 0;
    state.consecutiveErrors = 0;
    state.hasRepeated = false;
    state.timerInterval = null;
    state.timeRemaining = 30;
    state.timerStarted = false;
    state.isListening = false;
    state.testEnded = false;
    state.itemsAdministered = [];
    state.reverseSequenceActive = false;
    state.reverseSequenceNeeded = false;
    state.perfectScoresInReverse = 0;
    state.capturedResponse = null;
    state.autoCreditApplied = false;
    
    const elements = getDOMElements();
    elements.scoreDisplay.textContent = '0';
    elements.consecutiveErrorsDisplay.textContent = '0';
    elements.timerDisplay.textContent = '30s';
    elements.timerDisplay.classList.remove('warning', 'danger');
}

// ============================================================================
// FUNCIONES DE UI
// ============================================================================

/**
 * Muestra una pantalla específica y oculta las demás
 * @param {string} screenName - Nombre de la pantalla ('instructions', 'evaluation', 'results')
 */
function showScreen(screenName) {
    const elements = getDOMElements();
    
    elements.instructionsScreen.classList.remove('active');
    elements.evaluationScreen.classList.remove('active');
    elements.resultsScreen.classList.remove('active');
    
    switch (screenName) {
        case 'instructions':
            elements.instructionsScreen.classList.add('active');
            break;
        case 'evaluation':
            elements.evaluationScreen.classList.add('active');
            break;
        case 'results':
            elements.resultsScreen.classList.add('active');
            break;
    }
}

/**
 * Actualiza el indicador de estado visual
 * @param {string} status - Estado ('speaking', 'listening', 'waiting', 'timeout')
 * @param {string} text - Texto a mostrar
 */
function updateStatusIndicator(status, text) {
    const elements = getDOMElements();
    const indicator = elements.statusIndicator;
    
    indicator.className = 'status-indicator ' + status;
    indicator.querySelector('.status-text').textContent = text;
}

/**
 * Muestra el feedback de respuesta
 * @param {string} type - Tipo ('correct', 'incorrect', 'timeout')
 * @param {string} message - Mensaje a mostrar
 */
function showFeedback(type, message) {
    const elements = getDOMElements();
    elements.feedback.className = 'feedback ' + type;
    elements.feedback.textContent = message;
}

/**
 * Oculta el feedback
 */
function hideFeedback() {
    const elements = getDOMElements();
    elements.feedback.className = 'feedback hidden';
}

// ============================================================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ============================================================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
function init() {
    const elements = getDOMElements();
    
    // Inicializar reconocimiento de voz
    initSpeechRecognition();
    
    // Event Listeners
    elements.btnStart.addEventListener('click', startEvaluation);
    
    elements.btnRepeat.addEventListener('click', repeatCurrentItem);
    
    elements.btnMic.addEventListener('click', () => {
        if (state.isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
    
    elements.btnRestart.addEventListener('click', () => {
        showScreen('instructions');
    });
    
    console.log('WAIS-V Arithmetic Training inicializado');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
