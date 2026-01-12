/**
 * ============================================
 * WAIS-V Vocabulario - Aplicación de Entrenamiento
 * ============================================
 * 
 * Simula el proctoreo de la subprueba de Vocabulario del WAIS-IV/V
 * usando TTS para instrucciones, STT para capturar respuestas,
 * y Gemini API para evaluar las respuestas del usuario.
 * 
 * @author Copilot
 * @version 1.0.0
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

/**
 * Ítems de la subprueba de Vocabulario
 * Incluye ítems ilustrados (1-3) y verbales (4-30)
 */
const VOCABULARY_ITEMS = [
    // Ítems ilustrados (1-3) - Se pregunta "¿Qué es esto?"
    { id: 1, word: "Libro", isIllustrated: true, isLearning: false },
    { id: 2, word: "Avión", isIllustrated: true, isLearning: false },
    { id: 3, word: "Canasto", isIllustrated: true, isLearning: false },
    // Ítems verbales (4-30) - Se pregunta "¿Qué significa [palabra]?"
    { id: 4, word: "Cama", isIllustrated: false, isLearning: false },
    { id: 5, word: "Manzana", isIllustrated: false, isLearning: true }, // Inicio para adultos
    { id: 6, word: "Terminar", isIllustrated: false, isLearning: true },
    { id: 7, word: "Guante", isIllustrated: false, isLearning: false },
    { id: 8, word: "Desayuno", isIllustrated: false, isLearning: false },
    { id: 9, word: "Estorbar", isIllustrated: false, isLearning: false },
    { id: 10, word: "Íntimo", isIllustrated: false, isLearning: false },
    { id: 11, word: "Ignorante", isIllustrated: false, isLearning: false },
    { id: 12, word: "Curioso", isIllustrated: false, isLearning: false },
    { id: 13, word: "Ordinario", isIllustrated: false, isLearning: false },
    { id: 14, word: "Supremo", isIllustrated: false, isLearning: false },
    { id: 15, word: "Consumir", isIllustrated: false, isLearning: false },
    { id: 16, word: "Fortuito", isIllustrated: false, isLearning: false },
    { id: 17, word: "Cómodo", isIllustrated: false, isLearning: false },
    { id: 18, word: "Improvisar", isIllustrated: false, isLearning: false },
    { id: 19, word: "Escéptico", isIllustrated: false, isLearning: false },
    { id: 20, word: "Expedito", isIllustrated: false, isLearning: false },
    { id: 21, word: "Plagiar", isIllustrated: false, isLearning: false },
    { id: 22, word: "Pertinente", isIllustrated: false, isLearning: false },
    { id: 23, word: "Audaz", isIllustrated: false, isLearning: false },
    { id: 24, word: "Optimizar", isIllustrated: false, isLearning: false },
    { id: 25, word: "Instinto", isIllustrated: false, isLearning: false },
    { id: 26, word: "Bilateral", isIllustrated: false, isLearning: false },
    { id: 27, word: "Cancillería", isIllustrated: false, isLearning: false },
    { id: 28, word: "Paliar", isIllustrated: false, isLearning: false },
    { id: 29, word: "Extraditar", isIllustrated: false, isLearning: false },
    { id: 30, word: "Subrepticio", isIllustrated: false, isLearning: false }
];

/**
 * Índice de inicio para adultos (16-90 años)
 * Se comienza en el ítem 5 (Manzana)
 */
const ADULT_START_INDEX = 4; // índice 4 = ítem 5

/**
 * Máximo puntaje posible en la subprueba
 * Según el manual WAIS-IV (estandarización chilena), el máximo es 57 puntos
 */
const MAX_SCORE = 57;

/**
 * Número de ceros consecutivos para suspender la prueba
 */
const DISCONTINUE_THRESHOLD = 3;

/**
 * Baremos para convertir puntaje bruto a puntaje escalar según edad
 * Basados en la Tabla A.1 del WAIS-IV (estandarización chilena)
 * Cada array contiene rangos [min, max] para PE 1 a 19
 */
const BAREMOS = {
    // Grupo 16:0 a 17:11 años
    '16-17': [
        [0, 0], [1, 1], [2, 4], [5, 6], [7, 10],
        [11, 14], [15, 18], [19, 22], [23, 26], [27, 29],
        [30, 33], [34, 36], [37, 40], [41, 43], [44, 46],
        [47, 49], [50, 52], [53, 54], [55, 57]
    ],
    // Grupo 18:0 a 19:11 años
    '18-19': [
        [0, 0], [1, 2], [3, 5], [6, 9], [10, 13],
        [14, 17], [18, 21], [22, 24], [25, 28], [29, 32],
        [33, 35], [36, 39], [40, 42], [43, 45], [46, 48],
        [49, 51], [52, 53], [54, 54], [55, 57]
    ],
    // Grupo 20:0 a 24:11 años (Grupo de Referencia)
    '20-24': [
        [0, 2], [3, 5], [6, 8], [9, 12], [13, 15],
        [16, 19], [20, 23], [24, 27], [28, 31], [32, 35],
        [36, 38], [39, 42], [43, 45], [46, 48], [49, 50],
        [51, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupo 25:0 a 29:11 años
    '25-29': [
        [0, 2], [3, 5], [6, 8], [9, 12], [13, 16],
        [17, 20], [21, 24], [25, 28], [29, 32], [33, 35],
        [36, 39], [40, 42], [43, 45], [46, 48], [49, 50],
        [51, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupo 30:0 a 34:11 años
    '30-34': [
        [0, 2], [3, 5], [6, 8], [9, 12], [13, 15],
        [16, 19], [20, 23], [24, 27], [28, 31], [32, 34],
        [35, 38], [39, 42], [43, 45], [46, 48], [49, 50],
        [51, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupo 35:0 a 44:11 años
    '35-44': [
        [0, 2], [3, 4], [5, 7], [8, 11], [12, 15],
        [16, 19], [20, 23], [24, 27], [28, 31], [32, 34],
        [35, 38], [39, 41], [42, 44], [45, 47], [48, 50],
        [51, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupos 45:0 a 54:11 años
    '45-54': [
        [0, 2], [3, 4], [5, 7], [8, 10], [11, 14],
        [15, 18], [19, 22], [23, 25], [26, 29], [30, 32],
        [33, 36], [37, 39], [40, 43], [44, 46], [47, 49],
        [50, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupos 55:0 a 64:11 años
    '55-64': [
        [0, 2], [3, 4], [5, 7], [8, 10], [11, 14],
        [15, 18], [19, 21], [22, 25], [26, 28], [29, 32],
        [33, 35], [36, 39], [40, 43], [44, 46], [47, 49],
        [50, 52], [53, 53], [54, 54], [55, 57]
    ],
    // Grupo 65:0 a 69:11 años
    '65-69': [
        [0, 1], [2, 3], [4, 6], [7, 9], [10, 13],
        [14, 16], [17, 20], [21, 23], [24, 27], [28, 31],
        [32, 34], [35, 38], [39, 41], [42, 45], [46, 48],
        [49, 51], [52, 53], [54, 54], [55, 57]
    ],
    // Grupos 70:0 a 74:11 años
    '70-74': [
        [0, 1], [2, 3], [4, 6], [7, 9], [10, 12],
        [13, 15], [16, 19], [20, 23], [24, 26], [27, 30],
        [31, 34], [35, 37], [38, 41], [42, 44], [45, 48],
        [49, 51], [52, 53], [54, 54], [55, 57]
    ],
    // Grupos 75:0 a 79:11 años
    '75-79': [
        [0, 1], [2, 3], [4, 6], [7, 9], [10, 12],
        [13, 15], [16, 19], [20, 23], [24, 26], [27, 30],
        [31, 34], [35, 37], [38, 41], [42, 44], [45, 48],
        [49, 51], [52, 53], [54, 54], [55, 57]
    ],
    // Grupo 80:0 a 84:11 años
    '80-84': [
        [0, 1], [2, 3], [4, 6], [7, 8], [9, 11],
        [12, 14], [15, 18], [19, 21], [22, 25], [26, 28],
        [29, 32], [33, 36], [37, 39], [40, 43], [44, 47],
        [48, 50], [51, 52], [53, 54], [55, 57]
    ],
    // Grupo 85:0 a 90:11 años
    '85-90': [
        [0, 0], [1, 1], [2, 3], [4, 6], [7, 9],
        [10, 13], [14, 16], [17, 19], [20, 23], [24, 26],
        [27, 30], [31, 34], [35, 38], [39, 42], [43, 46],
        [47, 50], [51, 52], [53, 54], [55, 57]
    ]
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

/**
 * Estado global de la aplicación
 */
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    userAge: null,
    currentItemIndex: 0,
    scores: [],
    consecutiveZeros: 0,
    isTestActive: false,
    isRecording: false,
    isEvaluating: false,
    needsProbe: false,
    probeAttempts: 0,
    recognition: null,
    synthesis: window.speechSynthesis
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================

/**
 * Referencias a los elementos del DOM
 */
const elements = {
    configSection: document.getElementById('config-section'),
    testSection: document.getElementById('test-section'),
    resultsSection: document.getElementById('results-section'),
    apiKeyInput: document.getElementById('api-key-input'),
    saveApiKeyBtn: document.getElementById('save-api-key'),
    startBtn: document.getElementById('start-btn'),
    recordBtn: document.getElementById('record-btn'),
    recordText: document.getElementById('record-text'),
    repeatBtn: document.getElementById('repeat-btn'),
    restartBtn: document.getElementById('restart-btn'),
    stimulusDisplay: document.getElementById('stimulus-display'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    recordingIndicator: document.getElementById('recording-indicator'),
    responseDisplay: document.getElementById('response-display'),
    userResponseText: document.getElementById('user-response-text'),
    feedbackSection: document.getElementById('feedback-section'),
    feedbackContent: document.getElementById('feedback-content'),
    rawScore: document.getElementById('raw-score'),
    itemsBreakdown: document.getElementById('items-breakdown'),
    statusMessage: document.getElementById('status-message')
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Muestra un mensaje de estado temporal en la pantalla
 * @param {string} message - El mensaje a mostrar
 * @param {string} type - Tipo de mensaje: 'success', 'error', 'info'
 * @param {number} duration - Duración en milisegundos
 */
function showStatus(message, type = 'info', duration = 3000) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type}`;
    elements.statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
        elements.statusMessage.classList.add('hidden');
    }, duration);
}

/**
 * Muestra u oculta un elemento del DOM
 * @param {HTMLElement} element - Elemento a modificar
 * @param {boolean} show - True para mostrar, false para ocultar
 */
function toggleElement(element, show) {
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Espera un número determinado de milisegundos
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que se resuelve después del tiempo especificado
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Muestra el input de texto como fallback cuando el reconocimiento de voz falla
 */
function showTextInputFallback() {
    toggleElement(elements.recordBtn, false);
    
    const fallbackContainer = document.getElementById('text-input-fallback');
    const textInput = document.getElementById('text-response-input');
    const submitBtn = document.getElementById('submit-text-btn');
    
    if (fallbackContainer) {
        toggleElement(fallbackContainer, true);
        textInput.focus();
        
        if (!submitBtn.hasAttribute('data-listener')) {
            submitBtn.setAttribute('data-listener', 'true');
            
            submitBtn.addEventListener('click', () => {
                const response = textInput.value.trim();
                if (response) {
                    elements.userResponseText.textContent = response;
                    toggleElement(elements.responseDisplay, true);
                    textInput.value = '';
                    handleUserResponse(response);
                }
            });
            
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitBtn.click();
                }
            });
        }
    }
}

// ============================================
// FUNCIONES DE TEXT-TO-SPEECH (TTS)
// ============================================

/**
 * Obtiene la mejor voz en español disponible en el sistema
 * @returns {SpeechSynthesisVoice|null} La voz seleccionada o null
 */
function getBestSpanishVoice() {
    const voices = state.synthesis.getVoices();
    
    const spanishVoices = voices.filter(v => 
        v.lang.startsWith('es') || v.lang.includes('ES')
    );
    
    const preferredVoice = spanishVoices.find(v => 
        v.name.includes('Microsoft') || 
        v.name.includes('Google') ||
        v.name.includes('Paulina') ||
        v.name.includes('Helena')
    );
    
    return preferredVoice || spanishVoices[0] || voices[0];
}

/**
 * Lee un texto en voz alta usando la API de Web Speech
 * @param {string} text - Texto a leer
 * @param {number} rate - Velocidad de lectura (0.1 a 10, default 0.9)
 * @returns {Promise} Promesa que se resuelve cuando termina de hablar
 */
function speak(text, rate = 0.9) {
    return new Promise((resolve, reject) => {
        state.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = getBestSpanishVoice();
        utterance.lang = 'es-ES';
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
            console.error('Error en TTS:', event);
            resolve();
        };
        
        state.synthesis.speak(utterance);
    });
}

/**
 * Genera la pregunta según el tipo de ítem
 * @param {Object} item - El ítem actual
 * @returns {string} La pregunta formateada
 */
function generateQuestion(item) {
    if (item.isIllustrated) {
        return `¿Qué es esto?`;
    }
    return `¿Qué significa ${item.word}?`;
}

// ============================================
// FUNCIONES DE SPEECH-TO-TEXT (STT)
// ============================================

/**
 * Inicializa el reconocimiento de voz con la API Web Speech
 */
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showStatus('Tu navegador no soporta reconocimiento de voz', 'error');
        return false;
    }
    
    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'es-ES';
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.maxAlternatives = 1;
    
    state.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        elements.userResponseText.textContent = transcript;
        
        if (result.isFinal) {
            handleUserResponse(transcript);
        }
    };
    
    state.recognition.onstart = () => {
        state.isRecording = true;
        elements.recordBtn.classList.add('recording');
        toggleElement(elements.recordingIndicator, true);
        elements.recordText.textContent = 'Detener grabación';
    };
    
    state.recognition.onend = () => {
        state.isRecording = false;
        elements.recordBtn.classList.remove('recording');
        toggleElement(elements.recordingIndicator, false);
        elements.recordText.textContent = 'Comenzar a grabar';
    };
    
    state.recognition.onerror = (event) => {
        console.error('Error en reconocimiento:', event.error);
        state.isRecording = false;
        elements.recordBtn.classList.remove('recording');
        toggleElement(elements.recordingIndicator, false);
        elements.recordText.textContent = 'Comenzar a grabar';
        
        switch (event.error) {
            case 'no-speech':
                showStatus('No se detectó voz. Intenta de nuevo.', 'info');
                break;
            case 'not-allowed':
                showStatus('Permiso de micrófono denegado.', 'error');
                break;
            case 'network':
                showStatus('Error de red. Usa el input de texto.', 'error');
                showTextInputFallback();
                break;
            case 'audio-capture':
                showStatus('No se encontró micrófono.', 'error');
                showTextInputFallback();
                break;
            case 'service-not-allowed':
                showStatus('Servicio de voz no permitido. Usa HTTPS.', 'error');
                showTextInputFallback();
                break;
            default:
                showStatus(`Error: ${event.error}`, 'error');
        }
    };
    
    return true;
}

/**
 * Alterna el estado de grabación (toggle on/off)
 */
function toggleRecording() {
    if (!state.recognition) {
        if (!initializeSpeechRecognition()) return;
    }
    
    if (state.isRecording) {
        try {
            state.recognition.stop();
        } catch (e) {
            console.error('Error al detener grabación:', e);
        }
    } else {
        toggleElement(elements.responseDisplay, true);
        elements.userResponseText.textContent = '...';
        
        try {
            state.recognition.start();
        } catch (e) {
            console.error('Error al iniciar grabación:', e);
        }
    }
}

// ============================================
// FUNCIONES DE EVALUACIÓN CON GEMINI
// ============================================

/**
 * Construye el prompt del sistema para Gemini
 * Actúa como un psicólogo experto en WAIS-IV para Vocabulario
 * @returns {string} El prompt del sistema
 */
function buildSystemPrompt() {
    return `Eres un psicólogo experto en la administración del WAIS-IV, específicamente en la subprueba de Vocabulario del Índice de Comprensión Verbal (ICV).

Tu rol es evaluar las respuestas del usuario cuando se le pide definir palabras, asignando puntajes de 0, 1 o 2 puntos según los criterios del manual.

CRITERIOS DE PUNTUACIÓN:

**2 puntos** - Definición precisa y completa:
- Buen sinónimo de la palabra
- Clasificación general correcta (categoría + función/característica)
- Definición que demuestra comprensión profunda del concepto
- Ejemplo: Para "Guante" → "Es una prenda de vestir para las manos"

**1 punto** - Definición parcialmente correcta:
- Respuesta vaga pero en la dirección correcta
- Descripción meramente funcional sin categorización
- Sinónimo pobre o ejemplo concreto sin generalización
- Ejemplo: Para "Guante" → "Van en las manos" (correcto pero incompleto)

**0 puntos** - Respuesta incorrecta:
- No demuestra comprensión del significado
- Respuesta demasiado trivial o genérica
- Confusión con otra palabra
- No responde o dice "no sé"
- Ejemplo: Para "Guante" → "Para el invierno" (muy vago)

CONSULTA (P):
Si la respuesta es una descripción funcional sin categoría (ej: "es para comer" para una fruta), 
o si parece que el usuario sabe pero no elabora suficiente, indica que necesita consulta.
La consulta típica es: "Sí, pero ¿qué es?" o "¿Qué quiere decir con eso?" o "Dígame algo más"

FORMATO DE RESPUESTA (JSON estricto):
{
    "score": <0, 1, o 2>,
    "needsProbe": <true si necesita consulta adicional, false si no>,
    "probeQuestion": "<pregunta de consulta si needsProbe es true>",
    "explanation": "<breve explicación del puntaje asignado>"
}

IMPORTANTE:
- No penalices por gramática pobre o mala pronunciación
- Enfócate únicamente en el contenido conceptual
- Si el usuario da múltiples respuestas, puntúa la mejor
- Considera sinónimos y expresiones coloquiales válidas`;
}

/**
 * Evalúa la respuesta del usuario usando la API de Gemini
 * @param {string} word - La palabra a definir
 * @param {string} userResponse - Respuesta del usuario
 * @param {boolean} isProbeResponse - Si es respuesta a una consulta adicional
 * @returns {Promise<Object>} Resultado de la evaluación
 */
async function evaluateWithGemini(word, userResponse, isProbeResponse = false) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;
    
    const contextMessage = isProbeResponse 
        ? `El usuario ya dio una respuesta inicial y ahora responde a la consulta adicional.`
        : `Esta es la respuesta inicial del usuario.`;
    
    const userPrompt = `Evalúa la siguiente respuesta a la pregunta de vocabulario:

Palabra: ${word}
Pregunta: ¿Qué significa "${word}"?
Respuesta del usuario: "${userResponse}"

${contextMessage}

Responde ÚNICAMENTE con el JSON especificado, sin texto adicional.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userPrompt
                    }]
                }],
                systemInstruction: {
                    parts: [{
                        text: buildSystemPrompt()
                    }]
                },
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 500
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error de API: ${response.status}`);
        }
        
        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('No se pudo parsear la respuesta');
        
    } catch (error) {
        console.error('Error al evaluar con Gemini:', error);
        showStatus('Error al evaluar respuesta', 'error');
        
        return {
            score: 0,
            needsProbe: false,
            probeQuestion: '',
            explanation: 'Error en la evaluación'
        };
    }
}

// ============================================
// FUNCIONES DE LÓGICA DEL TEST
// ============================================

/**
 * Inicia la evaluación desde el principio
 */
async function startTest() {
    state.isTestActive = true;
    state.currentItemIndex = ADULT_START_INDEX; // Comenzar en ítem 5
    state.scores = [];
    state.consecutiveZeros = 0;
    
    toggleElement(elements.startBtn, false);
    toggleElement(elements.recordBtn, true);
    toggleElement(elements.repeatBtn, true);
    
    initializeSpeechRecognition();
    
    await speak('Vamos a realizar una actividad en la que te voy a decir una palabra y tú me dirás qué significa.', 0.85);
    await wait(500);
    
    displayCurrentItem();
}

/**
 * Muestra el ítem actual en pantalla y lo lee con TTS
 */
async function displayCurrentItem() {
    const item = VOCABULARY_ITEMS[state.currentItemIndex];
    
    toggleElement(elements.feedbackSection, false);
    toggleElement(elements.responseDisplay, false);
    state.needsProbe = false;
    state.probeAttempts = 0;
    
    updateProgress();
    
    // Construir el display del estímulo
    let badgeHTML = '';
    if (item.isIllustrated) {
        badgeHTML = '<span class="illustrated-badge">Ítem Ilustrado</span>';
    }
    
    const learningBadge = item.isLearning ? '<span class="learning-badge">Aprendizaje</span>' : '';
    
    elements.stimulusDisplay.innerHTML = `
        <span class="item-number">Ítem ${item.id}${learningBadge}</span>
        ${badgeHTML}
        <p class="stimulus-question">${item.isIllustrated ? '¿Qué es esto?' : '¿Qué significa...?'}</p>
        <p class="stimulus-word">${item.word}</p>
    `;
    
    // Leer la pregunta con TTS
    await wait(500);
    const question = generateQuestion(item);
    await speak(question, 0.85);
}

/**
 * Actualiza la barra de progreso
 */
function updateProgress() {
    const totalItems = VOCABULARY_ITEMS.length;
    const completedItems = state.scores.length;
    const percentage = (completedItems / totalItems) * 100;
    
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `Ítem ${state.currentItemIndex + 1} de ${totalItems}`;
}

/**
 * Procesa la respuesta del usuario
 * @param {string} response - Texto de la respuesta del usuario
 */
async function handleUserResponse(response) {
    if (!response.trim() || state.isEvaluating) return;
    
    state.isEvaluating = true;
    const item = VOCABULARY_ITEMS[state.currentItemIndex];
    
    toggleElement(elements.feedbackSection, true);
    elements.feedbackContent.innerHTML = `
        <div class="evaluating-state">
            <div class="loading-spinner"></div>
            <p>Evaluando respuesta...</p>
        </div>
    `;
    
    const evaluation = await evaluateWithGemini(
        item.word, 
        response, 
        state.probeAttempts > 0
    );
    
    // Manejar consulta adicional (P)
    if (evaluation.needsProbe && state.probeAttempts < 1) {
        state.needsProbe = true;
        state.probeAttempts++;
        state.isEvaluating = false;
        
        elements.feedbackContent.innerHTML = `
            <div class="probe-question">
                <p>🔍 ${evaluation.probeQuestion}</p>
            </div>
        `;
        
        await speak(evaluation.probeQuestion, 0.85);
        return;
    }
    
    displayFeedback(evaluation, item);
    state.isEvaluating = false;
}

/**
 * Muestra el feedback de la evaluación al usuario
 * @param {Object} evaluation - Resultado de la evaluación
 * @param {Object} item - Ítem actual
 */
async function displayFeedback(evaluation, item) {
    const { score, explanation } = evaluation;
    
    const AUTO_ADVANCE_DELAY = 2000;
    
    elements.feedbackContent.innerHTML = `
        <div class="score-badge score-${score}">${score}</div>
        <p class="feedback-text">${explanation}</p>
        <p class="auto-advance-notice">Continuando en unos segundos...</p>
    `;
    
    // Registrar puntuación
    state.scores.push({ itemId: item.id, score });
    
    // Verificar ceros consecutivos
    if (score === 0) {
        state.consecutiveZeros++;
    } else {
        state.consecutiveZeros = 0;
    }
    
    // Verificar criterio de suspensión
    if (state.consecutiveZeros >= DISCONTINUE_THRESHOLD) {
        elements.feedbackContent.innerHTML = `
            <div class="score-badge score-${score}">${score}</div>
            <p class="feedback-text">${explanation}</p>
            <p class="auto-advance-notice">La evaluación ha finalizado. Mostrando resultados...</p>
        `;
        await speak('La evaluación ha finalizado.', 0.85);
        await wait(AUTO_ADVANCE_DELAY);
        showResults();
        return;
    }
    
    await wait(AUTO_ADVANCE_DELAY);
    nextItem();
}

/**
 * Avanza al siguiente ítem
 */
async function nextItem() {
    state.currentItemIndex++;
    
    if (state.currentItemIndex >= VOCABULARY_ITEMS.length || 
        state.consecutiveZeros >= DISCONTINUE_THRESHOLD) {
        showResults();
        return;
    }
    
    displayCurrentItem();
}

/**
 * Repite la pregunta actual con TTS
 */
async function repeatQuestion() {
    const item = VOCABULARY_ITEMS[state.currentItemIndex];
    const question = generateQuestion(item);
    await speak(question, 0.85);
}

/**
 * Obtiene el grupo de baremo según la edad del usuario
 * @param {number} age - Edad del usuario
 * @returns {string} Clave del grupo de baremo
 */
function getAgeGroup(age) {
    if (age >= 16 && age <= 17) return '16-17';
    if (age >= 18 && age <= 19) return '18-19';
    if (age >= 20 && age <= 24) return '20-24';
    if (age >= 25 && age <= 29) return '25-29';
    if (age >= 30 && age <= 34) return '30-34';
    if (age >= 35 && age <= 44) return '35-44';
    if (age >= 45 && age <= 54) return '45-54';
    if (age >= 55 && age <= 64) return '55-64';
    if (age >= 65 && age <= 69) return '65-69';
    if (age >= 70 && age <= 74) return '70-74';
    if (age >= 75 && age <= 79) return '75-79';
    if (age >= 80 && age <= 84) return '80-84';
    if (age >= 85 && age <= 90) return '85-90';
    return '20-24';
}

/**
 * Convierte el puntaje bruto a puntaje escalar usando los baremos
 * @param {number} rawScore - Puntaje bruto
 * @param {number} age - Edad del usuario
 * @returns {number} Puntaje escalar (1-19)
 */
function calculateScaledScore(rawScore, age) {
    const ageGroup = getAgeGroup(age);
    const ranges = BAREMOS[ageGroup];
    
    for (let pe = 0; pe < ranges.length; pe++) {
        const [min, max] = ranges[pe];
        if (rawScore >= min && rawScore <= max) {
            return pe + 1;
        }
    }
    
    if (rawScore >= 60) return 19;
    return 1;
}

/**
 * Muestra los resultados finales de la evaluación
 */
function showResults() {
    state.isTestActive = false;
    
    toggleElement(elements.testSection, false);
    toggleElement(elements.resultsSection, true);
    
    const totalScore = state.scores.reduce((sum, item) => sum + item.score, 0);
    const scaledScore = calculateScaledScore(totalScore, state.userAge);
    const ageGroup = getAgeGroup(state.userAge);
    
    elements.rawScore.textContent = totalScore;
    document.getElementById('scaled-score').textContent = scaledScore;
    document.getElementById('age-group-display').textContent = `Grupo de edad: ${ageGroup} años`;
    
    let breakdownHTML = '';
    state.scores.forEach(item => {
        breakdownHTML += `
            <div class="item-score pts-${item.score}">
                <span class="item-num">Ítem ${item.itemId}</span>
                <span class="item-pts">${item.score}</span>
            </div>
        `;
    });
    elements.itemsBreakdown.innerHTML = breakdownHTML;
    
    speak(`Has completado la evaluación. Tu puntaje bruto es de ${totalScore} puntos y tu puntaje escalar es ${scaledScore}.`, 0.85);
}

/**
 * Reinicia la evaluación desde el principio
 */
function restartTest() {
    toggleElement(elements.resultsSection, false);
    toggleElement(elements.testSection, true);
    toggleElement(elements.startBtn, true);
    toggleElement(elements.recordBtn, false);
    toggleElement(elements.repeatBtn, false);
    toggleElement(elements.feedbackSection, false);
    toggleElement(elements.responseDisplay, false);
    
    elements.stimulusDisplay.innerHTML = `
        <p class="instruction-text">Presiona "Iniciar" para comenzar la evaluación</p>
    `;
    
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = 'Ítem 0 de 30';
    
    state.scores = [];
    state.consecutiveZeros = 0;
    state.currentItemIndex = ADULT_START_INDEX;
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN DE API
// ============================================

/**
 * Guarda la API key y la edad, luego muestra la sección del test
 */
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    const ageInput = document.getElementById('age-input');
    const age = parseInt(ageInput.value, 10);
    
    if (!apiKey) {
        showStatus('Por favor ingresa una API Key válida', 'error');
        return;
    }
    
    if (!age || age < 16 || age > 90) {
        showStatus('Por favor ingresa una edad válida (16-90 años)', 'error');
        return;
    }
    
    state.apiKey = apiKey;
    state.userAge = age;
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('user_age', age.toString());
    
    toggleElement(elements.configSection, false);
    toggleElement(elements.testSection, true);
    
    showStatus('Configuración guardada correctamente', 'success');
}

/**
 * Verifica si hay una API key y edad guardadas al cargar la página
 */
function checkStoredApiKey() {
    const storedAge = localStorage.getItem('user_age');
    if (storedAge) {
        state.userAge = parseInt(storedAge, 10);
        document.getElementById('age-input').value = storedAge;
    }
    
    if (state.apiKey && state.userAge) {
        toggleElement(elements.configSection, false);
        toggleElement(elements.testSection, true);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Inicializa todos los event listeners de la aplicación
 */
function initializeEventListeners() {
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
    
    elements.startBtn.addEventListener('click', startTest);
    
    elements.recordBtn.addEventListener('click', toggleRecording);
    
    elements.repeatBtn.addEventListener('click', repeatQuestion);
    
    elements.restartBtn.addEventListener('click', restartTest);
    
    if (state.synthesis.onvoiceschanged !== undefined) {
        state.synthesis.onvoiceschanged = () => {
            getBestSpanishVoice();
        };
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Función principal de inicialización
 */
function init() {
    console.log('WAIS-V Vocabulario - Inicializando...');
    
    checkStoredApiKey();
    initializeEventListeners();
    state.synthesis.getVoices();
    
    console.log('WAIS-V Vocabulario - Listo');
}

document.addEventListener('DOMContentLoaded', init);
