/**
 * =====================================================
 * WAIS-V Digit Span Training - Aplicación Principal
 * =====================================================
 * 
 * Este módulo implementa una simulación del proctoreo de
 * la prueba de Retención de Dígitos del WAIS-IV/V.
 * 
 * Incluye:
 * - TTS (Text-to-Speech) para recitar los dígitos
 * - STT (Speech-to-Text) para capturar respuestas del usuario
 * - Lógica de puntuación según el manual WAIS
 * 
 * Autor: Entrenamiento WAIS-V
 * Fecha: 2026
 */

// =====================================================
// CONFIGURACIÓN GLOBAL
// =====================================================

const CONFIG = {
    /** Tiempo entre cada dígito en milisegundos (1 segundo según manual) */
    DIGIT_INTERVAL_MS: 1000,
    
    /** Tiempo de espera para respuesta del usuario (30 segundos según manual) */
    RESPONSE_TIMEOUT_MS: 30000,
    
    /** Velocidad del habla TTS (0.1 a 10, 1 es normal) */
    SPEECH_RATE: 0.85,
    
    /** Tono del habla TTS (0 a 2, 1 es normal) */
    SPEECH_PITCH: 1.0,
    
    /** Idioma para TTS y STT */
    LANGUAGE: 'es-ES',
    
    /** Longitud de secuencias por ítem (ítem 1 = 2 dígitos, ítem 8 = 9 dígitos) */
    SEQUENCE_LENGTHS: {
        DOD: [2, 3, 4, 5, 6, 7, 8, 9],  // 8 ítems, longitud 2-9
        DOI: [2, 3, 4, 5, 6, 7, 8],      // 8 ítems, longitud 2-8
        DS:  [2, 3, 4, 5, 6, 7, 8, 9]    // 8 ítems, longitud 2-9
    },
    
    /** Puntuación máxima por modalidad */
    MAX_SCORES: {
        DOD: 16,
        DOI: 16,
        DS: 16,
        TOTAL: 48
    }
};

// =====================================================
// BAREMOS - TABLAS DE CONVERSIÓN RAW SCORE A PE
// =====================================================

/**
 * Baremos para convertir puntaje bruto total a Puntaje Escalar (PE)
 * Organizados por grupo de edad
 * Formato: { minAge, maxAge, label, ranges: [[minRaw, maxRaw, PE], ...] }
 */
const BAREMOS = [
    {
        minAge: 16, maxAge: 17,
        label: "16:0 a 17:11 años",
        ranges: [
            [0, 10, 1], [11, 11, 2], [12, 12, 3], [13, 13, 4], [14, 15, 5],
            [16, 17, 6], [18, 18, 7], [19, 20, 8], [21, 22, 9], [23, 24, 10],
            [25, 26, 11], [27, 28, 12], [29, 30, 13], [31, 33, 14], [34, 35, 15],
            [36, 37, 16], [38, 39, 17], [40, 42, 18], [43, 48, 19]
        ]
    },
    {
        minAge: 18, maxAge: 19,
        label: "18:0 a 19:11 años",
        ranges: [
            [0, 11, 1], [12, 12, 2], [13, 14, 3], [15, 15, 4], [16, 17, 5],
            [18, 18, 6], [19, 19, 7], [20, 21, 8], [22, 23, 9], [24, 25, 10],
            [26, 27, 11], [28, 29, 12], [30, 31, 13], [32, 33, 14], [34, 36, 15],
            [37, 38, 16], [39, 40, 17], [41, 43, 18], [44, 48, 19]
        ]
    },
    {
        minAge: 20, maxAge: 24,
        label: "20:0 a 24:11 años (Referencia)",
        ranges: [
            [0, 11, 1], [12, 12, 2], [13, 14, 3], [15, 15, 4], [16, 17, 5],
            [18, 18, 6], [19, 20, 7], [21, 22, 8], [23, 24, 9], [25, 26, 10],
            [27, 28, 11], [29, 30, 12], [31, 32, 13], [33, 34, 14], [35, 36, 15],
            [37, 38, 16], [39, 40, 17], [41, 43, 18], [44, 48, 19]
        ]
    },
    {
        minAge: 25, maxAge: 29,
        label: "25:0 a 29:11 años",
        ranges: [
            [0, 10, 1], [11, 11, 2], [12, 12, 3], [13, 13, 4], [14, 15, 5],
            [16, 17, 6], [18, 18, 7], [19, 20, 8], [21, 22, 9], [23, 24, 10],
            [25, 26, 11], [27, 28, 12], [29, 30, 13], [31, 33, 14], [34, 35, 15],
            [36, 37, 16], [38, 39, 17], [40, 42, 18], [43, 48, 19]
        ]
    },
    {
        minAge: 30, maxAge: 34,
        label: "30:0 a 34:11 años",
        ranges: [
            [0, 9, 1], [10, 10, 2], [11, 11, 3], [12, 13, 4], [14, 14, 5],
            [15, 16, 6], [17, 18, 7], [19, 19, 8], [20, 21, 9], [22, 23, 10],
            [24, 25, 11], [26, 27, 12], [28, 30, 13], [31, 32, 14], [33, 34, 15],
            [35, 36, 16], [37, 38, 17], [39, 41, 18], [42, 48, 19]
        ]
    },
    {
        minAge: 35, maxAge: 44,
        label: "35:0 a 44:11 años",
        ranges: [
            [0, 9, 1], [10, 10, 2], [11, 11, 3], [12, 13, 4], [14, 14, 5],
            [15, 16, 6], [17, 17, 7], [18, 19, 8], [20, 21, 9], [22, 23, 10],
            [24, 25, 11], [26, 27, 12], [28, 30, 13], [31, 32, 14], [33, 34, 15],
            [35, 36, 16], [37, 38, 17], [39, 40, 18], [41, 48, 19]
        ]
    },
    {
        minAge: 45, maxAge: 54,
        label: "45:0 a 54:11 años",
        ranges: [
            [0, 7, 1], [8, 8, 2], [9, 9, 3], [10, 11, 4], [12, 12, 5],
            [13, 14, 6], [15, 16, 7], [17, 17, 8], [18, 19, 9], [20, 21, 10],
            [22, 23, 11], [24, 25, 12], [26, 27, 13], [28, 30, 14], [31, 32, 15],
            [33, 34, 16], [35, 36, 17], [37, 38, 18], [39, 48, 19]
        ]
    },
    {
        minAge: 55, maxAge: 64,
        label: "55:0 a 64:11 años",
        ranges: [
            [0, 6, 1], [7, 7, 2], [8, 9, 3], [10, 10, 4], [11, 12, 5],
            [13, 13, 6], [14, 15, 7], [16, 17, 8], [18, 19, 9], [20, 20, 10],
            [21, 22, 11], [23, 24, 12], [25, 26, 13], [27, 28, 14], [29, 30, 15],
            [31, 33, 16], [34, 35, 17], [36, 37, 18], [38, 48, 19]
        ]
    },
    {
        minAge: 65, maxAge: 69,
        label: "65:0 a 69:11 años",
        ranges: [
            [0, 5, 1], [6, 7, 2], [8, 8, 3], [9, 10, 4], [11, 11, 5],
            [12, 13, 6], [14, 14, 7], [15, 16, 8], [17, 18, 9], [19, 20, 10],
            [21, 21, 11], [22, 23, 12], [24, 26, 13], [27, 28, 14], [29, 30, 15],
            [31, 32, 16], [33, 34, 17], [35, 37, 18], [38, 48, 19]
        ]
    },
    {
        minAge: 70, maxAge: 74,
        label: "70:0 a 74:11 años",
        ranges: [
            [0, 5, 1], [6, 6, 2], [7, 7, 3], [8, 9, 4], [10, 10, 5],
            [11, 12, 6], [13, 13, 7], [14, 15, 8], [16, 17, 9], [18, 19, 10],
            [20, 20, 11], [21, 22, 12], [23, 24, 13], [25, 26, 14], [27, 29, 15],
            [30, 31, 16], [32, 33, 17], [34, 35, 18], [36, 48, 19]
        ]
    },
    {
        minAge: 75, maxAge: 79,
        label: "75:0 a 79:11 años",
        ranges: [
            [0, 5, 1], [6, 6, 2], [7, 7, 3], [8, 9, 4], [10, 10, 5],
            [11, 12, 6], [13, 13, 7], [14, 15, 8], [16, 17, 9], [18, 19, 10],
            [20, 20, 11], [21, 22, 12], [23, 24, 13], [25, 26, 14], [27, 28, 15],
            [29, 30, 16], [31, 32, 17], [33, 34, 18], [35, 48, 19]
        ]
    },
    {
        minAge: 80, maxAge: 84,
        label: "80:0 a 84:11 años",
        ranges: [
            [0, 4, 1], [5, 5, 2], [6, 6, 3], [7, 7, 4], [8, 9, 5],
            [10, 10, 6], [11, 12, 7], [13, 14, 8], [15, 15, 9], [16, 17, 10],
            [18, 19, 11], [20, 21, 12], [22, 22, 13], [23, 24, 14], [25, 26, 15],
            [27, 28, 16], [29, 30, 17], [31, 32, 18], [33, 48, 19]
        ]
    },
    {
        minAge: 85, maxAge: 90,
        label: "85:0 a 90:11 años",
        ranges: [
            [0, 4, 1], [5, 5, 2], [6, 6, 3], [7, 7, 4], [8, 9, 5],
            [10, 10, 6], [11, 12, 7], [13, 14, 8], [15, 15, 9], [16, 17, 10],
            [18, 19, 11], [20, 21, 12], [22, 22, 13], [23, 24, 14], [25, 26, 15],
            [27, 28, 16], [29, 30, 17], [31, 32, 18], [33, 48, 19]
        ]
    }
];

// =====================================================
// ESTADO DE LA APLICACIÓN
// =====================================================

/**
 * Estado global de la aplicación
 * Contiene toda la información del test en progreso
 */
const state = {
    /** Edad del usuario (para calcular PE según baremos) */
    userAge: 25,
    
    /** Modalidad actual: 'DOD', 'DOI', o 'DS' */
    currentMode: null,
    
    /** Número de ítem actual (1-8) */
    currentItem: 0,
    
    /** Número de intento actual (1 o 2) */
    currentAttempt: 0,
    
    /** Secuencia de dígitos generada para el intento actual */
    currentSequence: [],
    
    /** Indica si estamos en un ítem de práctica */
    isPractice: false,
    
    /** Puntuaciones por modalidad */
    scores: {
        DOD: 0,
        DOI: 0,
        DS: 0
    },
    
    /** Puntos en el intento 1 del ítem actual */
    attempt1Score: 0,
    
    /** Puntos en el intento 2 del ítem actual */
    attempt2Score: 0,
    
    /** Mayor secuencia lograda por modalidad */
    longestSequence: {
        DOD: 0,
        DOI: 0,
        DS: 0
    },
    
    /** Indica si el test está en progreso */
    isRunning: false,
    
    /** Indica si estamos esperando respuesta del usuario */
    awaitingResponse: false
};

// =====================================================
// ELEMENTOS DEL DOM
// =====================================================

const elements = {
    currentMode: document.getElementById('current-mode'),
    currentItem: document.getElementById('current-item'),
    currentAttempt: document.getElementById('current-attempt'),
    instructionsText: document.getElementById('instructions-text'),
    digitDisplay: document.getElementById('digit-display'),
    userResponse: document.getElementById('user-response'),
    feedbackMessage: document.getElementById('feedback-message'),
    btnStart: document.getElementById('btn-start'),
    btnListen: document.getElementById('btn-listen'),
    btnSkip: document.getElementById('btn-skip'),
    micStatus: document.getElementById('mic-status'),
    scorePanel: document.getElementById('score-panel'),
    scoreDOD: document.getElementById('score-dod'),
    scoreDOI: document.getElementById('score-doi'),
    scoreDS: document.getElementById('score-ds'),
    scoreTotal: document.getElementById('score-total'),
    debugLog: document.getElementById('debug-log'),
    // Nuevos elementos para edad y scaled score
    ageForm: document.getElementById('age-form'),
    userAgeInput: document.getElementById('user-age'),
    btnConfirmAge: document.getElementById('btn-confirm-age'),
    scaledScoreSection: document.getElementById('scaled-score-section'),
    ageGroup: document.getElementById('age-group'),
    scaledScore: document.getElementById('scaled-score')
};

// =====================================================
// FUNCIONES DE BAREMOS Y SCALED SCORE
// =====================================================

/**
 * Obtiene el grupo de baremo correspondiente a una edad
 * 
 * @param {number} age - Edad del usuario en años
 * @returns {object|null} Objeto del baremo o null si no se encuentra
 */
function getBaremoForAge(age) {
    for (const baremo of BAREMOS) {
        if (age >= baremo.minAge && age <= baremo.maxAge) {
            return baremo;
        }
    }
    return null;
}

/**
 * Calcula el Puntaje Escalar (PE) a partir del puntaje bruto
 * 
 * @param {number} rawScore - Puntaje bruto total (0-48)
 * @param {number} age - Edad del usuario
 * @returns {object} { scaledScore: number, ageGroup: string }
 */
function calculateScaledScore(rawScore, age) {
    const baremo = getBaremoForAge(age);
    
    if (!baremo) {
        logDebug(`No se encontró baremo para edad ${age}`, 'error');
        return { scaledScore: null, ageGroup: 'No encontrado' };
    }
    
    // Buscar el PE correspondiente al raw score
    for (const [minRaw, maxRaw, pe] of baremo.ranges) {
        if (rawScore >= minRaw && rawScore <= maxRaw) {
            logDebug(`Raw Score ${rawScore} → PE ${pe} (${baremo.label})`, 'success');
            return { scaledScore: pe, ageGroup: baremo.label };
        }
    }
    
    // Si no se encuentra en los rangos, devolver el máximo o mínimo
    logDebug(`Raw Score ${rawScore} fuera de rangos`, 'error');
    return { scaledScore: rawScore >= 48 ? 19 : 1, ageGroup: baremo.label };
}

// =====================================================
// INICIALIZACIÓN DE TTS Y STT
// =====================================================

/** Instancia de síntesis de voz */
const synth = window.speechSynthesis;

/** Reconocimiento de voz (si está disponible) */
let recognition = null;

/** Flag para evitar múltiples procesamientos */
let isProcessingResult = false;

/**
 * Inicializa el reconocimiento de voz (STT)
 * @returns {boolean} true si el STT está disponible
 */
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        logDebug('STT no disponible en este navegador', 'error');
        return false;
    }
    
    logDebug('STT disponible', 'success');
    return true;
}

/**
 * Crea una nueva instancia del reconocedor de voz
 * Debe llamarse antes de cada sesión de escucha para evitar problemas en móviles
 */
function createRecognitionInstance() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) return null;
    
    const rec = new SpeechRecognition();
    rec.lang = CONFIG.LANGUAGE;
    rec.continuous = false;          // Una sola frase
    rec.interimResults = false;      // Solo resultados finales para evitar duplicados
    rec.maxAlternatives = 1;         // Solo la mejor alternativa
    
    return rec;
}

/**
 * Obtiene la mejor voz en español disponible para TTS
 * @returns {SpeechSynthesisVoice|null} La voz seleccionada o null
 */
function getBestSpanishVoice() {
    const voices = synth.getVoices();
    
    // Prioridad: voces nativas en español
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    
    // Preferir voces de mayor calidad (Microsoft, Google)
    const preferredVoice = spanishVoices.find(v => 
        v.name.includes('Microsoft') || 
        v.name.includes('Google') ||
        v.name.includes('Natural')
    );
    
    return preferredVoice || spanishVoices[0] || null;
}

// =====================================================
// FUNCIONES DE GENERACIÓN DE SECUENCIAS
// =====================================================

/**
 * Genera una secuencia aleatoria de dígitos
 * Los dígitos van de 0 a 9 (incluye cero)
 * 
 * @param {number} length - Longitud de la secuencia a generar
 * @returns {number[]} Array de dígitos aleatorios
 */
function generateRandomSequence(length) {
    const sequence = [];
    let lastDigit = -1;
    
    for (let i = 0; i < length; i++) {
        let digit;
        // Evitar repetir el mismo dígito consecutivamente
        do {
            digit = Math.floor(Math.random() * 10); // 0-9
        } while (digit === lastDigit);
        
        sequence.push(digit);
        lastDigit = digit;
    }
    
    logDebug(`Secuencia generada: ${sequence.join('-')}`, 'info');
    return sequence;
}

/**
 * Obtiene la respuesta esperada según la modalidad
 * 
 * @param {number[]} sequence - Secuencia original
 * @param {string} mode - Modalidad: 'DOD', 'DOI', o 'DS'
 * @returns {number[]} Secuencia esperada como respuesta
 */
function getExpectedResponse(sequence, mode) {
    switch (mode) {
        case 'DOD':
            // Orden Directo: misma secuencia
            return [...sequence];
        
        case 'DOI':
            // Orden Inverso: secuencia invertida
            return [...sequence].reverse();
        
        case 'DS':
            // Secuenciación: orden ascendente
            return [...sequence].sort((a, b) => a - b);
        
        default:
            return [...sequence];
    }
}

// =====================================================
// FUNCIONES DE TEXT-TO-SPEECH (TTS)
// =====================================================

/**
 * Pronuncia un texto usando TTS
 * 
 * @param {string} text - Texto a pronunciar
 * @param {object} options - Opciones de pronunciación
 * @param {number} options.rate - Velocidad (0.1-10)
 * @param {number} options.pitch - Tono (0-2)
 * @param {boolean} options.lowerPitchAtEnd - Bajar tono al final
 * @returns {Promise} Promesa que resuelve cuando termina de hablar
 */
function speak(text, options = {}) {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.lang = CONFIG.LANGUAGE;
        utterance.rate = options.rate || CONFIG.SPEECH_RATE;
        utterance.pitch = options.pitch || CONFIG.SPEECH_PITCH;
        
        const voice = getBestSpanishVoice();
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
            logDebug(`Error TTS: ${e.error}`, 'error');
            resolve();
        };
        
        synth.speak(utterance);
    });
}

/**
 * Pronuncia una secuencia de dígitos con el timing correcto
 * Según el manual: 1 dígito por segundo, bajar inflexión en el último
 * NOTA: No se muestran los dígitos en pantalla para evitar memoria visual
 * 
 * @param {number[]} sequence - Array de dígitos a pronunciar
 * @returns {Promise} Promesa que resuelve cuando termina
 */
async function speakDigitSequence(sequence) {
    // Mostrar indicador de que se están recitando los dígitos (sin mostrar los números)
    elements.digitDisplay.textContent = '🔊';
    elements.digitDisplay.classList.add('speaking');
    
    for (let i = 0; i < sequence.length; i++) {
        const digit = sequence[i];
        const isLast = i === sequence.length - 1;
        
        // NO mostrar el dígito - solo audio para evitar memoria visual
        // elements.digitDisplay.textContent = digit;
        
        // Bajar ligeramente el tono en el último dígito (según manual)
        const pitch = isLast ? CONFIG.SPEECH_PITCH * 0.85 : CONFIG.SPEECH_PITCH;
        
        await speak(digit.toString(), { pitch });
        
        // Esperar el intervalo si no es el último dígito
        if (!isLast) {
            await delay(CONFIG.DIGIT_INTERVAL_MS - 500); // Compensar tiempo de habla
        }
    }
    
    elements.digitDisplay.classList.remove('speaking');
    elements.digitDisplay.textContent = '🎤';
}

/**
 * Pronuncia las instrucciones del evaluador
 * 
 * @param {string} instruction - Texto de la instrucción
 */
async function speakInstruction(instruction) {
    elements.instructionsText.textContent = instruction;
    await speak(instruction, { rate: CONFIG.SPEECH_RATE * 1.1 });
}

// =====================================================
// FUNCIONES DE SPEECH-TO-TEXT (STT)
// =====================================================

/**
 * Escucha la respuesta del usuario usando STT
 * Implementación mejorada para móviles
 * 
 * @returns {Promise<string>} Promesa con el texto reconocido
 */
function listenForResponse() {
    return new Promise((resolve, reject) => {
        // Crear nueva instancia para evitar problemas de estado en móviles
        recognition = createRecognitionInstance();
        
        if (!recognition) {
            reject(new Error('STT no disponible'));
            return;
        }
        
        let timeoutId;
        let hasResolved = false;
        
        // Función para limpiar y resolver (evitar múltiples resoluciones)
        const cleanup = () => {
            clearTimeout(timeoutId);
            elements.micStatus.classList.remove('listening');
            elements.micStatus.querySelector('span').textContent = 'Micrófono inactivo';
            
            try {
                recognition.stop();
            } catch (e) {
                // Ignorar si ya estaba detenido
            }
        };
        
        // Configurar indicador visual
        elements.micStatus.classList.add('listening');
        elements.micStatus.querySelector('span').textContent = 'Escuchando... Habla ahora';
        
        recognition.onresult = (event) => {
            if (hasResolved) return; // Evitar duplicados
            hasResolved = true;
            
            // Tomar solo el resultado final
            const lastResultIndex = event.results.length - 1;
            const result = event.results[lastResultIndex][0].transcript;
            
            logDebug(`STT resultado: "${result}"`, 'success');
            cleanup();
            resolve(result);
        };
        
        recognition.onerror = (event) => {
            if (hasResolved) return;
            
            logDebug(`STT error: ${event.error}`, 'error');
            
            // En móviles, 'no-speech' puede ocurrir frecuentemente
            if (event.error === 'no-speech') {
                // Reintentar automáticamente
                elements.micStatus.querySelector('span').textContent = 'No se detectó voz. Habla...';
                try {
                    recognition.start();
                } catch (e) {
                    // Si falla el reinicio, crear nueva instancia
                    setTimeout(() => {
                        if (!hasResolved) {
                            recognition = createRecognitionInstance();
                            if (recognition) {
                                recognition.onresult = arguments.callee;
                                recognition.onerror = arguments.callee;
                                recognition.start();
                            }
                        }
                    }, 100);
                }
                return;
            }
            
            if (event.error === 'aborted') {
                return; // Fue cancelado intencionalmente
            }
            
            hasResolved = true;
            cleanup();
            reject(new Error(event.error));
        };
        
        recognition.onend = () => {
            if (!hasResolved) {
                // Si terminó sin resultado, reintentar
                elements.micStatus.querySelector('span').textContent = 'Reintentando...';
                setTimeout(() => {
                    if (!hasResolved) {
                        try {
                            recognition = createRecognitionInstance();
                            if (recognition) {
                                setupRecognitionHandlers();
                                recognition.start();
                            }
                        } catch (e) {
                            logDebug('Error al reiniciar STT', 'error');
                        }
                    }
                }, 200);
            }
        };
        
        // Función para configurar handlers (para reinicios)
        const setupRecognitionHandlers = () => {
            recognition.onresult = (event) => {
                if (hasResolved) return;
                hasResolved = true;
                const lastResultIndex = event.results.length - 1;
                const result = event.results[lastResultIndex][0].transcript;
                logDebug(`STT resultado: "${result}"`, 'success');
                cleanup();
                resolve(result);
            };
            
            recognition.onerror = (event) => {
                if (hasResolved) return;
                if (event.error === 'no-speech' || event.error === 'aborted') return;
                hasResolved = true;
                cleanup();
                reject(new Error(event.error));
            };
            
            recognition.onend = () => {
                // No hacer nada, el timeout manejará si no hay respuesta
            };
        };
        
        // Timeout de 30 segundos según manual
        timeoutId = setTimeout(() => {
            if (!hasResolved) {
                hasResolved = true;
                cleanup();
                reject(new Error('Tiempo agotado'));
            }
        }, CONFIG.RESPONSE_TIMEOUT_MS);
        
        // Iniciar reconocimiento
        try {
            recognition.start();
            logDebug('STT iniciado', 'info');
        } catch (e) {
            logDebug(`Error al iniciar STT: ${e.message}`, 'error');
            hasResolved = true;
            cleanup();
            reject(e);
        }
    });
}

/**
 * Extrae dígitos de un texto reconocido por STT
 * Convierte palabras numéricas a dígitos
 * Implementación mejorada para evitar duplicados en móviles
 * 
 * @param {string} text - Texto del STT
 * @returns {number[]} Array de dígitos extraídos
 */
function extractDigitsFromText(text) {
    // Mapa de palabras a números (incluye variaciones comunes)
    const wordToNumber = {
        'cero': 0, 'zero': 0, '0': 0,
        'uno': 1, 'una': 1, 'un': 1, '1': 1,
        'dos': 2, '2': 2,
        'tres': 3, '3': 3,
        'cuatro': 4, '4': 4,
        'cinco': 5, '5': 5,
        'seis': 6, '6': 6,
        'siete': 7, '7': 7,
        'ocho': 8, '8': 8,
        'nueve': 9, '9': 9
    };
    
    // Normalizar texto
    let normalized = text.toLowerCase()
        .replace(/[.,;:!?¿¡]/g, ' ')  // Quitar puntuación
        .replace(/\s+/g, ' ')          // Normalizar espacios
        .trim();
    
    logDebug(`Texto normalizado: "${normalized}"`, 'info');
    
    const digits = [];
    const parts = normalized.split(' ');
    
    for (const part of parts) {
        if (part === '') continue;
        
        // Si es una palabra numérica conocida
        if (wordToNumber.hasOwnProperty(part)) {
            digits.push(wordToNumber[part]);
        }
        // Si es un número directo (ej: "42" -> [4, 2])
        else if (/^\d+$/.test(part)) {
            for (const char of part) {
                digits.push(parseInt(char, 10));
            }
        }
        // Buscar dígitos dentro de palabras compuestas o mal reconocidas
        else {
            // Extraer solo los dígitos si los hay
            const digitsInPart = part.match(/\d/g);
            if (digitsInPart) {
                for (const d of digitsInPart) {
                    digits.push(parseInt(d, 10));
                }
            }
        }
    }
    
    logDebug(`Dígitos extraídos: [${digits.join(', ')}]`, 'info');
    return digits;
}

/**
 * Compara la respuesta del usuario con la esperada
 * 
 * @param {number[]} userDigits - Dígitos del usuario
 * @param {number[]} expectedDigits - Dígitos esperados
 * @returns {boolean} true si la respuesta es correcta
 */
function compareResponses(userDigits, expectedDigits) {
    if (userDigits.length !== expectedDigits.length) {
        return false;
    }
    
    for (let i = 0; i < userDigits.length; i++) {
        if (userDigits[i] !== expectedDigits[i]) {
            return false;
        }
    }
    
    return true;
}

// =====================================================
// LÓGICA PRINCIPAL DEL TEST
// =====================================================

/**
 * Inicia el test completo de Retención de Dígitos
 */
async function startTest() {
    logDebug('=== INICIANDO TEST ===', 'success');
    logDebug(`Edad del usuario: ${state.userAge} años`, 'info');
    
    state.isRunning = true;
    state.scores = { DOD: 0, DOI: 0, DS: 0 };
    state.longestSequence = { DOD: 0, DOI: 0, DS: 0 };
    
    elements.btnStart.disabled = true;
    elements.scorePanel.style.display = 'block';
    elements.scaledScoreSection.style.display = 'none'; // Ocultar hasta el final
    
    // Ejecutar las tres modalidades en orden
    await runMode('DOD');
    await runMode('DOI');
    await runMode('DS');
    
    // Mostrar resultados finales
    await showFinalResults();
    
    state.isRunning = false;
    elements.btnStart.disabled = false;
    elements.btnStart.innerHTML = '<span class="icon">▶</span> Reiniciar Test';
}

/**
 * Ejecuta una modalidad completa (DOD, DOI, o DS)
 * 
 * @param {string} mode - Modalidad a ejecutar
 */
async function runMode(mode) {
    state.currentMode = mode;
    state.currentItem = 0;
    
    logDebug(`--- Iniciando modalidad: ${mode} ---`, 'info');
    updateStatusDisplay();
    
    // Instrucción inicial según modalidad
    await giveInitialInstruction(mode);
    
    // Ítem de práctica para DOI y DS
    if (mode === 'DOI' || mode === 'DS') {
        await runPracticeItem(mode);
    }
    
    // Ejecutar ítems 1-8
    const maxItems = CONFIG.SEQUENCE_LENGTHS[mode].length;
    
    for (let item = 1; item <= maxItems; item++) {
        state.currentItem = item;
        state.isPractice = false;
        updateStatusDisplay();
        
        const itemScore = await runItem(mode, item);
        
        // Criterio de suspensión: 0 puntos en ambos intentos
        if (itemScore === 0) {
            logDebug(`Suspensión: 0 puntos en ítem ${item}`, 'error');
            await speakInstruction('Pasemos a la siguiente parte.');
            break;
        }
    }
}

/**
 * Da la instrucción inicial según la modalidad
 * 
 * @param {string} mode - Modalidad actual
 */
async function giveInitialInstruction(mode) {
    let instruction = '';
    
    switch (mode) {
        case 'DOD':
            instruction = 'Ahora diré algunos números. Escuche atentamente ya que no puedo repetirlos. Cuando haya terminado, repítalos en el mismo orden.';
            break;
        
        case 'DOI':
            instruction = 'Ahora le diré otros números y deberá repetirlos en orden inverso.';
            break;
        
        case 'DS':
            instruction = 'Ahora diré otros números. Luego repítalos en orden, comenzando por el menor.';
            break;
    }
    
    await speakInstruction(instruction);
    await delay(500);
}

/**
 * Ejecuta el ítem de práctica para DOI o DS
 * 
 * @param {string} mode - Modalidad (DOI o DS)
 */
async function runPracticeItem(mode) {
    state.isPractice = true;
    state.currentItem = 0;
    updateStatusDisplay();
    
    logDebug(`Iniciando práctica para ${mode}`, 'info');
    
    if (mode === 'DOI') {
        // Práctica DOI: 7-1 y 3-4
        await speakInstruction('Si digo siete, uno, ¿qué me diría?');
        await runPracticeAttempt([7, 1], [1, 7], mode);
        
        await speakInstruction('Intentemos con otro. Tres, cuatro.');
        await runPracticeAttempt([3, 4], [4, 3], mode);
    } else if (mode === 'DS') {
        // Práctica DS: 2-3-1 y 5-2-7
        await speakInstruction('Si digo dos, tres, uno, ¿qué me diría?');
        await runPracticeAttempt([2, 3, 1], [1, 2, 3], mode);
        
        await speakInstruction('Intentemos con otro. Cinco, dos, siete.');
        await runPracticeAttempt([5, 2, 7], [2, 5, 7], mode);
    }
    
    await speakInstruction('Bien, comencemos.');
    await delay(500);
}

/**
 * Ejecuta un intento de práctica con retroalimentación
 * 
 * @param {number[]} sequence - Secuencia a presentar
 * @param {number[]} expected - Respuesta esperada
 * @param {string} mode - Modalidad actual
 */
async function runPracticeAttempt(sequence, expected, mode) {
    elements.btnListen.disabled = false;
    state.awaitingResponse = true;
    
    const response = await captureUserResponse();
    const userDigits = extractDigitsFromText(response);
    const isCorrect = compareResponses(userDigits, expected);
    
    elements.userResponse.textContent = `Tu respuesta: ${userDigits.join(' - ')}`;
    
    if (isCorrect) {
        showFeedback('¡Correcto!', 'correct');
        await speak('Correcto.');
    } else {
        showFeedback(`Incorrecto. La respuesta correcta es: ${expected.join(' - ')}`, 'incorrect');
        await speak(`La respuesta correcta es ${expected.join(', ')}.`);
    }
    
    await delay(1000);
    clearFeedback();
}

/**
 * Ejecuta un ítem completo (2 intentos)
 * 
 * @param {string} mode - Modalidad actual
 * @param {number} itemNumber - Número de ítem (1-8)
 * @returns {number} Puntuación del ítem (0-2)
 */
async function runItem(mode, itemNumber) {
    const length = CONFIG.SEQUENCE_LENGTHS[mode][itemNumber - 1];
    let itemScore = 0;
    
    logDebug(`Ítem ${itemNumber}, longitud: ${length}`, 'info');
    
    // Intento 1
    state.currentAttempt = 1;
    updateStatusDisplay();
    
    const score1 = await runAttempt(mode, length);
    itemScore += score1;
    
    if (score1 === 1) {
        // Actualizar mayor secuencia
        state.longestSequence[mode] = Math.max(state.longestSequence[mode], length);
    }
    
    await delay(500);
    
    // Intento 2
    state.currentAttempt = 2;
    updateStatusDisplay();
    
    const score2 = await runAttempt(mode, length);
    itemScore += score2;
    
    if (score2 === 1) {
        state.longestSequence[mode] = Math.max(state.longestSequence[mode], length);
    }
    
    // Actualizar puntuación
    state.scores[mode] += itemScore;
    updateScoreDisplay();
    
    logDebug(`Ítem ${itemNumber} completado: ${itemScore}/2 puntos`, 'info');
    
    await delay(500);
    return itemScore;
}

/**
 * Ejecuta un intento individual
 * 
 * @param {string} mode - Modalidad actual
 * @param {number} length - Longitud de la secuencia
 * @returns {number} Puntuación (0 o 1)
 */
async function runAttempt(mode, length) {
    // Generar y mostrar secuencia
    const sequence = generateRandomSequence(length);
    state.currentSequence = sequence;
    
    // Pronunciar los dígitos
    await speakDigitSequence(sequence);
    
    // Esperar respuesta del usuario
    elements.btnListen.disabled = false;
    elements.btnSkip.disabled = false;
    state.awaitingResponse = true;
    
    showFeedback('Ahora es tu turno. Presiona "Responder" o habla.', 'info');
    
    try {
        const response = await captureUserResponse();
        const userDigits = extractDigitsFromText(response);
        const expectedDigits = getExpectedResponse(sequence, mode);
        const isCorrect = compareResponses(userDigits, expectedDigits);
        
        elements.userResponse.textContent = `Tu respuesta: ${userDigits.join(' - ')}`;
        
        if (isCorrect) {
            showFeedback('¡Correcto!', 'correct');
            return 1;
        } else {
            showFeedback(`Incorrecto. Esperado: ${expectedDigits.join(' - ')}`, 'incorrect');
            return 0;
        }
    } catch (error) {
        logDebug(`Error capturando respuesta: ${error.message}`, 'error');
        showFeedback('No se pudo capturar la respuesta. 0 puntos.', 'incorrect');
        return 0;
    } finally {
        elements.btnListen.disabled = true;
        elements.btnSkip.disabled = true;
        state.awaitingResponse = false;
        await delay(1500);
        clearFeedback();
    }
}

/**
 * Captura la respuesta del usuario (STT o botón skip)
 * 
 * @returns {Promise<string>} Texto de la respuesta
 */
function captureUserResponse() {
    return new Promise((resolve, reject) => {
        let resolved = false;
        
        // Handler para el botón de responder (activa STT)
        const handleListen = async () => {
            if (resolved) return;
            
            try {
                const response = await listenForResponse();
                resolved = true;
                cleanup();
                resolve(response);
            } catch (error) {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    reject(error);
                }
            }
        };
        
        // Handler para saltar (sin respuesta)
        const handleSkip = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(''); // Respuesta vacía = incorrecto
        };
        
        // Timeout automático
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error('Tiempo agotado'));
            }
        }, CONFIG.RESPONSE_TIMEOUT_MS);
        
        // Cleanup function
        const cleanup = () => {
            clearTimeout(timeoutId);
            elements.btnListen.removeEventListener('click', handleListen);
            elements.btnSkip.removeEventListener('click', handleSkip);
        };
        
        elements.btnListen.addEventListener('click', handleListen);
        elements.btnSkip.addEventListener('click', handleSkip);
    });
}

/**
 * Muestra los resultados finales del test
 * Incluye cálculo del Puntaje Escalar (PE) según baremos
 */
async function showFinalResults() {
    const total = state.scores.DOD + state.scores.DOI + state.scores.DS;
    
    // Calcular Puntaje Escalar
    const { scaledScore, ageGroup } = calculateScaledScore(total, state.userAge);
    
    logDebug('=== RESULTADOS FINALES ===', 'success');
    logDebug(`DOD: ${state.scores.DOD}/${CONFIG.MAX_SCORES.DOD}`, 'info');
    logDebug(`DOI: ${state.scores.DOI}/${CONFIG.MAX_SCORES.DOI}`, 'info');
    logDebug(`DS: ${state.scores.DS}/${CONFIG.MAX_SCORES.DS}`, 'info');
    logDebug(`TOTAL (Raw Score): ${total}/${CONFIG.MAX_SCORES.TOTAL}`, 'success');
    logDebug(`Puntaje Escalar (PE): ${scaledScore}`, 'success');
    logDebug(`Grupo de Edad: ${ageGroup}`, 'info');
    logDebug(`MSDD: ${state.longestSequence.DOD}`, 'info');
    logDebug(`MSDI: ${state.longestSequence.DOI}`, 'info');
    logDebug(`MSDS: ${state.longestSequence.DS}`, 'info');
    
    // Mostrar sección de Scaled Score
    elements.scaledScoreSection.style.display = 'block';
    elements.ageGroup.textContent = ageGroup;
    elements.scaledScore.textContent = scaledScore !== null ? scaledScore : '--';
    
    await speakInstruction('El test ha finalizado. Veamos tus resultados.');
    
    // Descripción del nivel según PE
    const levelDescription = getScaledScoreDescription(scaledScore);
    
    elements.instructionsText.innerHTML = `
        <strong>Test Completado</strong><br><br>
        <strong>Orden Directo (DOD):</strong> ${state.scores.DOD}/16 | Mayor secuencia: ${state.longestSequence.DOD}<br>
        <strong>Orden Inverso (DOI):</strong> ${state.scores.DOI}/16 | Mayor secuencia: ${state.longestSequence.DOI}<br>
        <strong>Secuenciación (DS):</strong> ${state.scores.DS}/16 | Mayor secuencia: ${state.longestSequence.DS}<br><br>
        <strong>TOTAL (Raw Score):</strong> ${total}/48<br>
        <strong>Puntaje Escalar (PE):</strong> ${scaledScore} - ${levelDescription}
    `;
    
    await speak(`Tu puntaje escalar es ${scaledScore}, que corresponde a un nivel ${levelDescription}.`);
}

/**
 * Obtiene una descripción del nivel según el Puntaje Escalar
 * 
 * @param {number} pe - Puntaje Escalar (1-19)
 * @returns {string} Descripción del nivel
 */
function getScaledScoreDescription(pe) {
    if (pe === null) return 'No calculado';
    if (pe <= 3) return 'Muy Bajo';
    if (pe <= 6) return 'Bajo';
    if (pe <= 8) return 'Promedio Bajo';
    if (pe <= 12) return 'Promedio';
    if (pe <= 14) return 'Promedio Alto';
    if (pe <= 16) return 'Alto';
    return 'Muy Alto';
}

// =====================================================
// FUNCIONES DE UI Y UTILIDADES
// =====================================================

/**
 * Actualiza el panel de estado
 */
function updateStatusDisplay() {
    const modeNames = {
        DOD: 'Orden Directo',
        DOI: 'Orden Inverso',
        DS: 'Secuenciación'
    };
    
    elements.currentMode.textContent = state.currentMode ? modeNames[state.currentMode] : '--';
    elements.currentItem.textContent = state.isPractice ? 'Práctica' : (state.currentItem || '--');
    elements.currentAttempt.textContent = state.currentAttempt || '--';
}

/**
 * Actualiza el panel de puntuación
 */
function updateScoreDisplay() {
    const total = state.scores.DOD + state.scores.DOI + state.scores.DS;
    
    elements.scoreDOD.textContent = `${state.scores.DOD}/16`;
    elements.scoreDOI.textContent = `${state.scores.DOI}/16`;
    elements.scoreDS.textContent = `${state.scores.DS}/16`;
    elements.scoreTotal.textContent = `${total}/48`;
}

/**
 * Muestra un mensaje de feedback
 * 
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'correct', 'incorrect', 'info'
 */
function showFeedback(message, type) {
    elements.feedbackMessage.textContent = message;
    elements.feedbackMessage.className = `feedback-message ${type}`;
}

/**
 * Limpia el mensaje de feedback
 */
function clearFeedback() {
    elements.feedbackMessage.textContent = '';
    elements.feedbackMessage.className = 'feedback-message';
    elements.digitDisplay.textContent = '--';
    elements.userResponse.textContent = 'Tu respuesta: --';
}

/**
 * Registra un mensaje en el log de debug
 * 
 * @param {string} message - Mensaje a registrar
 * @param {string} type - Tipo: 'info', 'success', 'error'
 */
function logDebug(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const p = document.createElement('p');
    p.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="${type}">${message}</span>`;
    elements.debugLog.insertBefore(p, elements.debugLog.firstChild);
    console.log(`[${timestamp}] ${message}`);
}

/**
 * Función de delay/espera
 * 
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que resuelve después del delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// EVENT LISTENERS Y INICIALIZACIÓN
// =====================================================

/**
 * Confirma la edad del usuario y muestra los controles del test
 */
function confirmAge() {
    const age = parseInt(elements.userAgeInput.value, 10);
    
    // Validar edad
    if (isNaN(age) || age < 16 || age > 90) {
        alert('Por favor ingresa una edad válida entre 16 y 90 años.');
        return;
    }
    
    state.userAge = age;
    
    // Verificar que existe baremo para esta edad
    const baremo = getBaremoForAge(age);
    if (baremo) {
        logDebug(`Edad confirmada: ${age} años → ${baremo.label}`, 'success');
    } else {
        logDebug(`Edad ${age} fuera de rangos de baremos`, 'error');
    }
    
    // Ocultar formulario de edad y mostrar controles
    elements.ageForm.style.display = 'none';
    elements.btnStart.style.display = 'inline-flex';
    
    elements.instructionsText.textContent = `Edad: ${age} años. Presiona "Iniciar Test" para comenzar.`;
}

/**
 * Inicializa la aplicación
 */
function init() {
    logDebug('Inicializando aplicación...', 'info');
    
    // Verificar soporte de TTS
    if (!synth) {
        logDebug('TTS no soportado en este navegador', 'error');
        alert('Tu navegador no soporta Text-to-Speech. Usa Chrome o Edge.');
        return;
    }
    
    // Inicializar STT
    const sttAvailable = initSpeechRecognition();
    if (!sttAvailable) {
        alert('Tu navegador no soporta Speech-to-Text. Usa Chrome o Edge.');
    }
    
    // Cargar voces (pueden tardar en cargar)
    synth.onvoiceschanged = () => {
        const voice = getBestSpanishVoice();
        logDebug(`Voz seleccionada: ${voice?.name || 'Predeterminada'}`, 'info');
    };
    
    // Ocultar botón de inicio hasta que se confirme la edad
    elements.btnStart.style.display = 'none';
    
    // Event listeners
    elements.btnConfirmAge.addEventListener('click', confirmAge);
    elements.btnStart.addEventListener('click', startTest);
    
    // Permitir confirmar edad con Enter
    elements.userAgeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmAge();
        }
    });
    
    logDebug('Aplicación lista', 'success');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
