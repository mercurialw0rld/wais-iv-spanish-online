/**
 * ============================================
 * WAIS-V Analogías - Aplicación de Entrenamiento
 * ============================================
 * 
 * Simula el proctoreo de la subprueba de Analogías del WAIS-IV/V
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
 * Ítems de la subprueba de Analogías
 * Incluye el ítem de práctica y los 18 ítems oficiales
 */
const ANALOGIES_ITEMS = [
    { id: 0, word1: "dos", word2: "siete", isPractice: true, isLearning: false },
    { id: 1, word1: "tenedor", word2: "cuchara", isPractice: false, isLearning: false },
    { id: 2, word1: "amarillo", word2: "verde", isPractice: false, isLearning: false },
    { id: 3, word1: "zanahoria", word2: "coliflor", isPractice: false, isLearning: false },
    { id: 4, word1: "caballo", word2: "tigre", isPractice: false, isLearning: true }, // Inicio para adultos
    { id: 5, word1: "guitarra", word2: "tambor", isPractice: false, isLearning: true },
    { id: 6, word1: "bote", word2: "automóvil", isPractice: false, isLearning: false },
    { id: 7, word1: "celular", word2: "computador", isPractice: false, isLearning: false },
    { id: 8, word1: "poema", word2: "escultura", isPractice: false, isLearning: false },
    { id: 9, word1: "Brasilia", word2: "Montevideo", isPractice: false, isLearning: false },
    { id: 10, word1: "nariz", word2: "lengua", isPractice: false, isLearning: false },
    { id: 11, word1: "capullo", word2: "bebé", isPractice: false, isLearning: false },
    { id: 12, word1: "comida", word2: "gasolina", isPractice: false, isLearning: false },
    { id: 13, word1: "ancla", word2: "cerco", isPractice: false, isLearning: false },
    { id: 14, word1: "deseo", word2: "expectativa", isPractice: false, isLearning: false },
    { id: 15, word1: "permitir", word2: "restringir", isPractice: false, isLearning: false },
    { id: 16, word1: "Amazonía", word2: "Antártica", isPractice: false, isLearning: false },
    { id: 17, word1: "aceptación", word2: "negación", isPractice: false, isLearning: false },
    { id: 18, word1: "amigo", word2: "enemigo", isPractice: false, isLearning: false }
];

/**
 * Índice de inicio para adultos (16-90 años)
 * Se comienza con práctica, luego se salta al ítem 4
 */
const ADULT_START_INDEX = 4;

/**
 * Máximo puntaje posible en la subprueba
 */
const MAX_SCORE = 36;

/**
 * Número de ceros consecutivos para suspender la prueba
 */
const DISCONTINUE_THRESHOLD = 3;

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

/**
 * Estado global de la aplicación
 */
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    currentItemIndex: 0,
    scores: [],
    consecutiveZeros: 0,
    isTestActive: false,
    isPracticeComplete: false,
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
    nextBtn: document.getElementById('next-btn'),
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
 * Permite al usuario escribir su respuesta en lugar de hablar
 */
function showTextInputFallback() {
    // Ocultar botón de grabación
    toggleElement(elements.recordBtn, false);
    
    // Mostrar input de texto
    const fallbackContainer = document.getElementById('text-input-fallback');
    const textInput = document.getElementById('text-response-input');
    const submitBtn = document.getElementById('submit-text-btn');
    
    if (fallbackContainer) {
        toggleElement(fallbackContainer, true);
        textInput.focus();
        
        // Agregar event listeners si no existen
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
 * Prioriza voces femeninas y de alta calidad
 * @returns {SpeechSynthesisVoice|null} La voz seleccionada o null
 */
function getBestSpanishVoice() {
    const voices = state.synthesis.getVoices();
    
    // Prioridad: voces en español de alta calidad
    const spanishVoices = voices.filter(v => 
        v.lang.startsWith('es') || v.lang.includes('ES')
    );
    
    // Preferir voces de Microsoft o Google (suelen ser de mejor calidad)
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
        // Cancelar cualquier síntesis en curso
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
            resolve(); // Resolver de todos modos para no bloquear
        };
        
        state.synthesis.speak(utterance);
    });
}

/**
 * Genera la frase de la pregunta de analogía
 * Siguiendo las instrucciones del manual: sin artículos
 * @param {string} word1 - Primera palabra
 * @param {string} word2 - Segunda palabra
 * @returns {string} La frase formateada
 */
function generateAnalogiesQuestion(word1, word2) {
    return `¿En qué se parecen ${word1} y ${word2}?`;
}

// ============================================
// FUNCIONES DE SPEECH-TO-TEXT (STT)
// ============================================

/**
 * Inicializa el reconocimiento de voz con la API Web Speech
 * Configura eventos y parámetros para una experiencia natural
 */
function initializeSpeechRecognition() {
    // Verificar soporte del navegador
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
    
    // Evento: resultado de reconocimiento
    state.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        // Mostrar resultado intermedio
        elements.userResponseText.textContent = transcript;
        
        // Si es resultado final, procesar
        if (result.isFinal) {
            handleUserResponse(transcript);
        }
    };
    
    // Evento: inicio de grabación
    state.recognition.onstart = () => {
        state.isRecording = true;
        elements.recordBtn.classList.add('recording');
        toggleElement(elements.recordingIndicator, true);
        elements.recordText.textContent = 'Detener grabación';
    };
    
    // Evento: fin de grabación
    state.recognition.onend = () => {
        state.isRecording = false;
        elements.recordBtn.classList.remove('recording');
        toggleElement(elements.recordingIndicator, false);
        elements.recordText.textContent = 'Comenzar a grabar';
    };
    
    // Evento: error
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
                showStatus('Permiso de micrófono denegado. Habilita el micrófono en tu navegador.', 'error');
                break;
            case 'network':
                showStatus('Error de red. Asegúrate de tener conexión a internet.', 'error');
                // Mostrar input de texto como fallback
                showTextInputFallback();
                break;
            case 'aborted':
                // Usuario canceló, no mostrar error
                break;
            case 'audio-capture':
                showStatus('No se encontró micrófono. Verifica tu dispositivo de audio.', 'error');
                showTextInputFallback();
                break;
            case 'service-not-allowed':
                showStatus('Servicio de voz no permitido. Usa HTTPS o localhost.', 'error');
                showTextInputFallback();
                break;
            default:
                showStatus(`Error de reconocimiento: ${event.error}`, 'error');
        }
    };
    
    return true;
}

/**
 * Alterna el estado de grabación (toggle on/off)
 * Si está grabando, detiene. Si no, inicia.
 */
function toggleRecording() {
    if (!state.recognition) {
        if (!initializeSpeechRecognition()) return;
    }
    
    if (state.isRecording) {
        // Detener grabación
        try {
            state.recognition.stop();
        } catch (e) {
            console.error('Error al detener grabación:', e);
        }
    } else {
        // Iniciar grabación
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
 * Actúa como un psicólogo experto en WAIS-IV
 * @returns {string} El prompt del sistema
 */
function buildSystemPrompt() {
    return `Eres un psicólogo experto en la administración del WAIS-IV, específicamente en la subprueba de Analogías del Índice de Comprensión Verbal (ICV).

Tu rol es evaluar las respuestas del usuario a preguntas de analogías, asignando puntajes de 0, 1 o 2 puntos según los criterios del manual.

CRITERIOS DE PUNTUACIÓN:

**2 puntos** - Respuesta de alta abstracción:
- Identifica la categoría conceptual superior que une ambos elementos
- Usa conceptos abstractos y generales
- Ejemplo para "caballo y tigre": "Son mamíferos" o "Son animales"

**1 punto** - Respuesta parcialmente correcta:
- Identifica una similitud menor o concreta
- Describe una propiedad compartida pero no la categoría esencial
- Ejemplo para "caballo y tigre": "Tienen cuatro patas" o "Tienen pelo"

**0 puntos** - Respuesta incorrecta o irrelevante:
- No identifica ninguna similitud válida
- Describe diferencias en lugar de similitudes
- Respuesta vaga sin contenido relevante
- No responde o dice "no sé"

CONSULTA (P):
Si la respuesta es vaga pero parece apuntar en la dirección correcta, debes indicar que se necesita una consulta adicional. Las respuestas que ameritan consulta son aquellas donde el usuario da una pista pero no elabora suficientemente.

FORMATO DE RESPUESTA (JSON estricto):
{
    "score": <0, 1, o 2>,
    "needsProbe": <true si necesita consulta adicional, false si no>,
    "probeQuestion": "<pregunta de consulta si needsProbe es true, ej: '¿Qué quiere decir con eso?' o 'Dígame algo más sobre eso'>",
    "explanation": "<breve explicación del puntaje asignado>",
    "idealAnswer": "<ejemplo de respuesta de 2 puntos para referencia>"
}

IMPORTANTE:
- Sé justo pero estricto con los criterios
- Considera sinónimos y formas alternativas de expresar la misma idea
- Si el usuario da múltiples respuestas, puntúa la mejor siempre que una no invalide a la otra
- Las respuestas coloquiales pero correctas deben recibir el puntaje correspondiente`;
}

/**
 * Evalúa la respuesta del usuario usando la API de Gemini
 * @param {string} word1 - Primera palabra de la analogía
 * @param {string} word2 - Segunda palabra de la analogía
 * @param {string} userResponse - Respuesta del usuario
 * @param {boolean} isProbeResponse - Si es respuesta a una consulta adicional
 * @returns {Promise<Object>} Resultado de la evaluación
 */
async function evaluateWithGemini(word1, word2, userResponse, isProbeResponse = false) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;
    
    const contextMessage = isProbeResponse 
        ? `El usuario ya dio una respuesta inicial vaga y ahora responde a la consulta adicional.`
        : `Esta es la respuesta inicial del usuario.`;
    
    const userPrompt = `Evalúa la siguiente respuesta a la pregunta de analogías:

Pregunta: ¿En qué se parecen ${word1} y ${word2}?
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
        
        // Extraer JSON de la respuesta
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('No se pudo parsear la respuesta');
        
    } catch (error) {
        console.error('Error al evaluar con Gemini:', error);
        showStatus('Error al evaluar respuesta', 'error');
        
        // Retornar evaluación por defecto en caso de error
        return {
            score: 0,
            needsProbe: false,
            probeQuestion: '',
            explanation: 'Error en la evaluación',
            idealAnswer: ''
        };
    }
}

// ============================================
// FUNCIONES DE LÓGICA DEL TEST
// ============================================

/**
 * Inicia la evaluación desde el principio
 * Configura el estado inicial y muestra el ítem de práctica
 */
async function startTest() {
    state.isTestActive = true;
    state.currentItemIndex = 0;
    state.scores = [];
    state.consecutiveZeros = 0;
    state.isPracticeComplete = false;
    
    // Ocultar botón de inicio, mostrar controles
    toggleElement(elements.startBtn, false);
    toggleElement(elements.recordBtn, true);
    toggleElement(elements.repeatBtn, true);
    
    // Inicializar reconocimiento de voz
    initializeSpeechRecognition();
    
    // Instrucciones iniciales
    await speak('Vamos a realizar una actividad en la que te voy a decir dos palabras y tú me dirás en qué se parecen.', 0.85);
    await wait(500);
    await speak('Por ejemplo, te voy a preguntar:', 0.85);
    await wait(300);
    
    // Mostrar ítem de práctica
    displayCurrentItem();
}

/**
 * Muestra el ítem actual en pantalla y lo lee con TTS
 */
async function displayCurrentItem() {
    const item = ANALOGIES_ITEMS[state.currentItemIndex];
    
    // Limpiar estados anteriores
    toggleElement(elements.feedbackSection, false);
    toggleElement(elements.responseDisplay, false);
    state.needsProbe = false;
    state.probeAttempts = 0;
    
    // Actualizar barra de progreso
    updateProgress();
    
    // Construir el display del estímulo
    let badgeHTML = '';
    if (item.isPractice) {
        badgeHTML = '<span class="practice-badge">Ítem de Práctica</span>';
    } else {
        const learningBadge = item.isLearning ? '<span class="learning-badge">Aprendizaje</span>' : '';
        badgeHTML = `<span class="item-number">Ítem ${item.id}${learningBadge}</span>`;
    }
    
    elements.stimulusDisplay.innerHTML = `
        ${badgeHTML}
        <p class="stimulus-question">¿En qué se parecen...</p>
        <p class="stimulus-words">${item.word1} y ${item.word2}?</p>
    `;
    
    // Leer la pregunta con TTS
    await wait(500);
    const question = generateAnalogiesQuestion(item.word1, item.word2);
    await speak(question, 0.85);
}

/**
 * Actualiza la barra de progreso
 */
function updateProgress() {
    const totalItems = ANALOGIES_ITEMS.length - 1; // Excluir práctica
    const completedItems = state.scores.length;
    const percentage = (completedItems / totalItems) * 100;
    
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `Ítem ${completedItems} de ${totalItems}`;
}

/**
 * Procesa la respuesta del usuario
 * @param {string} response - Texto de la respuesta del usuario
 */
async function handleUserResponse(response) {
    if (!response.trim() || state.isEvaluating) return;
    
    state.isEvaluating = true;
    const item = ANALOGIES_ITEMS[state.currentItemIndex];
    
    // Mostrar estado de evaluación
    toggleElement(elements.feedbackSection, true);
    elements.feedbackContent.innerHTML = `
        <div class="evaluating-state">
            <div class="loading-spinner"></div>
            <p>Evaluando respuesta...</p>
        </div>
    `;
    toggleElement(elements.nextBtn, false);
    
    // Evaluar con Gemini
    const evaluation = await evaluateWithGemini(
        item.word1, 
        item.word2, 
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
        
        // Leer la consulta
        await speak(evaluation.probeQuestion, 0.85);
        return;
    }
    
    // Mostrar resultado de la evaluación
    displayFeedback(evaluation, item);
    state.isEvaluating = false;
}

/**
 * Muestra el feedback de la evaluación al usuario
 * Avanza automáticamente al siguiente ítem después de mostrar el feedback
 * @param {Object} evaluation - Resultado de la evaluación
 * @param {Object} item - Ítem actual
 */
async function displayFeedback(evaluation, item) {
    const { score, explanation, idealAnswer } = evaluation;
    
    // Tiempo de espera antes de pasar al siguiente ítem (en ms)
    const AUTO_ADVANCE_DELAY = 2500;
    const LEARNING_DELAY = 4000; // Más tiempo para ítems de aprendizaje
    
    // Para ítems de práctica, siempre dar retroalimentación
    if (item.isPractice) {
        elements.feedbackContent.innerHTML = `
            <div class="score-badge score-${score}">${score}</div>
            <p class="feedback-text">${explanation}</p>
            <div class="feedback-correct">
                <strong>Respuesta modelo:</strong> ${idealAnswer}
            </div>
            <p class="auto-advance-notice">Continuando en unos segundos...</p>
        `;
        
        if (score < 2) {
            await speak(`Una respuesta correcta sería: ${idealAnswer}`, 0.85);
        }
        
        // Esperar y avanzar automáticamente
        await wait(LEARNING_DELAY);
        nextItem();
        return;
    }
    
    // Para ítems de aprendizaje (4 y 5), dar retroalimentación correctiva
    if (item.isLearning && score < 2) {
        elements.feedbackContent.innerHTML = `
            <div class="score-badge score-${score}">${score}</div>
            <p class="feedback-text">${explanation}</p>
            <div class="feedback-correct">
                <strong>Respuesta de 2 puntos:</strong> ${idealAnswer}
            </div>
            <p class="auto-advance-notice">Continuando en unos segundos...</p>
        `;
        
        await speak(`Una respuesta de 2 puntos sería: ${idealAnswer}`, 0.85);
    } else {
        // Para ítems normales, solo mostrar puntuación sin retroalimentación
        elements.feedbackContent.innerHTML = `
            <div class="score-badge score-${score}">${score}</div>
            <p class="feedback-text">${explanation}</p>
            <p class="auto-advance-notice">Continuando en unos segundos...</p>
        `;
    }
    
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
    
    // Esperar y avanzar automáticamente
    const delayTime = item.isLearning ? LEARNING_DELAY : AUTO_ADVANCE_DELAY;
    await wait(delayTime);
    nextItem();
}

/**
 * Avanza al siguiente ítem
 */
async function nextItem() {
    // Si terminó la práctica, saltar al ítem 4 (inicio para adultos)
    if (ANALOGIES_ITEMS[state.currentItemIndex].isPractice) {
        state.isPracticeComplete = true;
        state.currentItemIndex = ADULT_START_INDEX;
        elements.nextBtn.innerHTML = '<span>Siguiente ítem</span><span class="btn-icon">→</span>';
    } else {
        state.currentItemIndex++;
    }
    
    // Verificar si llegamos al final o criterio de suspensión
    if (state.currentItemIndex >= ANALOGIES_ITEMS.length || 
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
    const item = ANALOGIES_ITEMS[state.currentItemIndex];
    const question = generateAnalogiesQuestion(item.word1, item.word2);
    await speak(question, 0.85);
}

/**
 * Muestra los resultados finales de la evaluación
 */
function showResults() {
    state.isTestActive = false;
    
    // Ocultar sección de test, mostrar resultados
    toggleElement(elements.testSection, false);
    toggleElement(elements.resultsSection, true);
    
    // Calcular puntaje total
    const totalScore = state.scores.reduce((sum, item) => sum + item.score, 0);
    elements.rawScore.textContent = totalScore;
    
    // Generar desglose de ítems
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
    
    speak(`Has completado la evaluación. Tu puntaje bruto es de ${totalScore} puntos.`, 0.85);
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
    elements.progressText.textContent = 'Ítem 0 de 18';
    
    state.scores = [];
    state.consecutiveZeros = 0;
    state.currentItemIndex = 0;
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN DE API
// ============================================

/**
 * Guarda la API key y muestra la sección del test
 */
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('Por favor ingresa una API Key válida', 'error');
        return;
    }
    
    state.apiKey = apiKey;
    localStorage.setItem('gemini_api_key', apiKey);
    
    toggleElement(elements.configSection, false);
    toggleElement(elements.testSection, true);
    
    showStatus('API Key guardada correctamente', 'success');
}

/**
 * Verifica si hay una API key guardada al cargar la página
 */
function checkStoredApiKey() {
    if (state.apiKey) {
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
    // Guardar API Key
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
    
    // Iniciar test
    elements.startBtn.addEventListener('click', startTest);
    
    // Grabación de voz (toggle on/off)
    elements.recordBtn.addEventListener('click', toggleRecording);
    
    // Repetir pregunta
    elements.repeatBtn.addEventListener('click', repeatQuestion);
    
    // Siguiente ítem
    elements.nextBtn.addEventListener('click', nextItem);
    
    // Reiniciar
    elements.restartBtn.addEventListener('click', restartTest);
    
    // Cargar voces cuando estén disponibles
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
 * Se ejecuta cuando el DOM está completamente cargado
 */
function init() {
    console.log('WAIS-V Analogías - Inicializando...');
    
    // Verificar API key guardada
    checkStoredApiKey();
    
    // Inicializar eventos
    initializeEventListeners();
    
    // Pre-cargar voces
    state.synthesis.getVoices();
    
    console.log('WAIS-V Analogías - Listo');
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
