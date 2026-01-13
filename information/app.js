/**
 * ============================================
 * WAIS-V Información - Aplicación de Entrenamiento
 * ============================================
 * 
 * Simula el proctoreo de la subprueba de Información del WAIS-IV/V
 * usando TTS para instrucciones, STT para capturar respuestas,
 * y Gemini API para evaluar las respuestas del usuario.
 * 
 * Características especiales:
 * - Puntuación binaria (0 o 1 punto)
 * - Secuencia inversa si falla en ítems 3 o 4
 * - Ítems de aprendizaje (3 y 4)
 * 
 * @author Copilot
 * @version 1.0.0
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

/**
 * Ítems de la subprueba de Información
 * 26 preguntas de conocimiento general
 */
const INFORMATION_ITEMS = [
    { id: 1, question: "¿Qué día viene después del lunes?", isLearning: false },
    { id: 2, question: "¿Cuál es la forma de la mayoría de las pelotas?", isLearning: false },
    { id: 3, question: "¿Para qué se usa un termómetro?", isLearning: true }, // Inicio para adultos
    { id: 4, question: "¿Cuántos segundos hay en un minuto?", isLearning: true },
    { id: 5, question: "¿Quién fue J.F. Kennedy?", isLearning: false },
    { id: 6, question: "¿Qué línea imaginaria divide la Tierra en mitad norte y sur?", isLearning: false },
    { id: 7, question: "¿De qué está hecha el agua?", isLearning: false },
    { id: 8, question: "¿Cuál es la capital de Italia?", isLearning: false },
    { id: 9, question: "¿Quién fue Cleopatra?", isLearning: false },
    { id: 10, question: "¿En qué continente está India?", isLearning: false },
    { id: 11, question: "¿Quién fue el líder de la Revolución Cubana?", isLearning: false },
    { id: 12, question: "¿En qué continente está el Desierto del Sahara?", isLearning: false },
    { id: 13, question: "¿A qué temperatura hierve el agua?", isLearning: false },
    { id: 14, question: "¿En qué país se realizaron los primeros Juegos Olímpicos?", isLearning: false },
    { id: 15, question: "¿Quién escribió Don Quijote de la Mancha?", isLearning: false },
    { id: 16, question: "¿Qué nombre se asocia con la teoría de la relatividad?", isLearning: false },
    { id: 17, question: "¿Quién fue Mahatma Gandhi?", isLearning: false },
    { id: 18, question: "¿Quién creó a Condorito?", isLearning: false },
    { id: 19, question: "¿Quién fue Francisco Franco?", isLearning: false },
    { id: 20, question: "¿Por qué flota el hielo?", isLearning: false },
    { id: 21, question: "¿Cuál es el idioma más hablado en el mundo?", isLearning: false },
    { id: 22, question: "¿Quién fue Ícaro?", isLearning: false },
    { id: 23, question: "¿Cuál es el órgano más grande del cuerpo humano?", isLearning: false },
    { id: 24, question: "¿Por qué es famosa Rigoberta Menchú?", isLearning: false },
    { id: 25, question: "¿Cuántos minutos se demora la luz solar en llegar a la Tierra?", isLearning: false },
    { id: 26, question: "¿Quién escribió Alicia en el País de las Maravillas?", isLearning: false }
];

/**
 * Respuestas correctas para cada ítem (guía para el LLM)
 * Se usan como referencia para la evaluación
 */
const CORRECT_ANSWERS = {
    1: "Martes",
    2: "Redonda / Esférica",
    3: "Para medir la temperatura",
    4: "60 segundos",
    5: "Presidente de Estados Unidos (asesinado en 1963)",
    6: "El Ecuador / Línea ecuatorial",
    7: "Hidrógeno y oxígeno / H2O",
    8: "Roma",
    9: "Reina de Egipto / Faraona",
    10: "Asia",
    11: "Fidel Castro",
    12: "África",
    13: "100 grados Celsius / 100°C (a nivel del mar)",
    14: "Grecia",
    15: "Miguel de Cervantes",
    16: "Albert Einstein",
    17: "Líder pacifista de la independencia de India",
    18: "Pepo / René Ríos Boettiger",
    19: "Dictador de España",
    20: "Porque es menos denso que el agua líquida / el agua se expande al congelarse",
    21: "Chino mandarín / Inglés (como segunda lengua)",
    22: "Personaje mitológico griego que voló con alas de cera",
    23: "La piel",
    24: "Activista indígena guatemalteca / Premio Nobel de la Paz",
    25: "Aproximadamente 8 minutos",
    26: "Lewis Carroll"
};

/**
 * Índice de inicio para adultos (16-90 años)
 * Se comienza en el ítem 3
 */
const ADULT_START_INDEX = 2; // índice 2 = ítem 3

/**
 * Máximo puntaje posible en la subprueba (26 ítems x 1 punto)
 */
const MAX_SCORE = 26;

/**
 * Número de ceros consecutivos para suspender la prueba
 */
const DISCONTINUE_THRESHOLD = 3;

/**
 * Baremos para convertir puntaje bruto a puntaje escalar según edad
 * Basados en la Tabla A.1 del WAIS-IV (estandarización chilena)
 * Nota: null indica que ese PE no tiene rango de PB asignado
 */
const BAREMOS = {
    // Grupo 16:0 a 17:11 años
    '16-17': [
        null, [0, 0], [1, 1], [2, 2], [3, 3],
        [4, 5], [6, 7], [8, 9], [10, 10], [11, 12],
        [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
        [23, 23], [24, 24], [25, 25], [26, 26]
    ],
    // Grupo 18:0 a 19:11 años
    '18-19': [
        null, [0, 0], [1, 1], [2, 2], [3, 4],
        [5, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupo 20:0 a 24:11 años (Grupo de Referencia)
    '20-24': [
        [0, 0], [1, 1], [2, 2], [3, 3], [4, 5],
        [6, 6], [7, 8], [9, 10], [11, 12], [13, 14],
        [15, 16], [17, 18], [19, 20], [21, 22], [23, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupo 25:0 a 29:11 años
    '25-29': [
        [0, 0], [1, 1], [2, 2], [3, 3], [4, 5],
        [6, 6], [7, 8], [9, 10], [11, 12], [13, 14],
        [15, 16], [17, 18], [19, 20], [21, 22], [23, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupos 30:0 a 34:11 años
    '30-34': [
        null, [0, 0], [1, 1], [2, 2], [3, 4],
        [5, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupo 35:0 a 44:11 años
    '35-44': [
        null, [0, 0], [1, 1], [2, 2], [3, 4],
        [5, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupos 45:0 a 54:11 años
    '45-54': [
        null, [0, 0], null, [1, 2], [3, 3],
        [4, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupos 55:0 a 64:11 años
    '55-64': [
        null, [0, 0], null, [1, 2], [3, 3],
        [4, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupo 65:0 a 69:11 años
    '65-69': [
        null, [0, 0], null, [1, 2], [3, 3],
        [4, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupos 70:0 a 74:11 años
    '70-74': [
        null, [0, 0], null, [1, 2], [3, 3],
        [4, 5], [6, 7], [8, 9], [10, 11], [12, 13],
        [14, 15], [16, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupos 75:0 a 79:11 años
    '75-79': [
        null, [0, 0], null, [1, 1], [2, 3],
        [4, 4], [5, 6], [7, 8], [9, 10], [11, 12],
        [13, 14], [15, 17], [18, 19], [20, 21], [22, 23],
        [24, 24], [25, 25], null, [26, 26]
    ],
    // Grupo 80:0 a 84:11 años
    '80-84': [
        null, null, [0, 0], [1, 1], [2, 2],
        [3, 4], [5, 6], [7, 8], [9, 10], [11, 12],
        [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
        [23, 23], [24, 24], [25, 25], [26, 26]
    ],
    // Grupo 85:0 a 90:11 años
    '85-90': [
        null, null, [0, 0], [1, 1], [2, 2],
        [3, 3], [4, 5], [6, 7], [8, 9], [10, 11],
        [12, 14], [15, 16], [17, 18], [19, 20], [21, 22],
        [23, 23], [24, 24], [25, 25], [26, 26]
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
    scores: [], // Array de {itemId, score, administered}
    consecutiveZeros: 0,
    isTestActive: false,
    isRecording: false,
    isEvaluating: false,
    needsProbe: false,
    probeAttempts: 0,
    recognition: null,
    synthesis: window.speechSynthesis,
    // Secuencia inversa
    reverseSequenceNeeded: false,
    reverseSequenceItems: [],
    inReverseSequence: false,
    reverseIndex: 0,
    perfectConsecutive: 0 // Para tracking de 2 perfectos consecutivos en reversa
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
    ageInput: document.getElementById('age-input'),
    apiStatus: document.getElementById('api-status'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    questionDisplay: document.getElementById('question-display'),
    itemBadge: document.getElementById('item-badge'),
    learningBadge: document.getElementById('learning-badge'),
    recordingStatus: document.getElementById('recording-status'),
    statusText: document.getElementById('status-text'),
    transcriptDisplay: document.getElementById('transcript-display'),
    transcriptText: document.getElementById('transcript-text'),
    feedbackSection: document.getElementById('feedback-section'),
    feedbackContent: document.getElementById('feedback-content'),
    autoAdvanceNotice: document.getElementById('auto-advance-notice'),
    currentScore: document.getElementById('current-score'),
    rawScore: document.getElementById('raw-score'),
    scaledScore: document.getElementById('scaled-score'),
    ageGroupDisplay: document.getElementById('age-group-display'),
    itemsList: document.getElementById('items-list'),
    restartBtn: document.getElementById('restart-btn'),
    textInputContainer: document.getElementById('text-input-container'),
    textResponseInput: document.getElementById('text-response-input'),
    submitTextBtn: document.getElementById('submit-text-btn')
};

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Configura la aplicación inicial
 * - Carga API key guardada
 * - Configura event listeners
 * - Inicializa reconocimiento de voz
 */
function initializeApp() {
    // Cargar API key guardada
    if (state.apiKey) {
        elements.apiKeyInput.value = state.apiKey;
        updateApiStatus(true);
    }

    // Cargar edad guardada
    const savedAge = localStorage.getItem('user_age');
    if (savedAge) {
        elements.ageInput.value = savedAge;
        state.userAge = parseInt(savedAge);
    }

    // Verificar si podemos habilitar el botón de inicio
    checkStartButtonState();

    // Configurar event listeners
    setupEventListeners();

    // Inicializar reconocimiento de voz
    initializeSpeechRecognition();

    // Inicializar scores para todos los ítems
    initializeScores();
}

/**
 * Inicializa el array de scores con todos los ítems como no administrados
 */
function initializeScores() {
    state.scores = INFORMATION_ITEMS.map(item => ({
        itemId: item.id,
        score: null,
        administered: false
    }));
}

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
    // Guardar API key
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Input de edad
    elements.ageInput.addEventListener('input', handleAgeInput);

    // Comenzar test
    elements.startBtn.addEventListener('click', startTest);

    // Grabar respuesta (toggle)
    elements.recordBtn.addEventListener('click', toggleRecording);

    // Enviar respuesta de texto
    elements.submitTextBtn.addEventListener('click', submitTextResponse);
    elements.textResponseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitTextResponse();
    });

    // Reiniciar test
    elements.restartBtn.addEventListener('click', restartTest);
}

/**
 * Guarda la API key en localStorage
 */
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (apiKey) {
        state.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        updateApiStatus(true);
        checkStartButtonState();
    }
}

/**
 * Maneja el input de edad
 */
function handleAgeInput() {
    const age = parseInt(elements.ageInput.value);
    if (age >= 16 && age <= 90) {
        state.userAge = age;
        localStorage.setItem('user_age', age.toString());
    } else {
        state.userAge = null;
    }
    checkStartButtonState();
}

/**
 * Verifica si el botón de inicio debe estar habilitado
 */
function checkStartButtonState() {
    const hasApiKey = state.apiKey && state.apiKey.length > 0;
    const hasValidAge = state.userAge && state.userAge >= 16 && state.userAge <= 90;
    elements.startBtn.disabled = !(hasApiKey && hasValidAge);
}

/**
 * Actualiza el estado visual de la API
 * @param {boolean} connected - Si la API está configurada
 */
function updateApiStatus(connected) {
    if (connected) {
        elements.apiStatus.classList.add('connected');
        elements.apiStatus.querySelector('.status-text').textContent = 'API Key configurada';
    } else {
        elements.apiStatus.classList.remove('connected');
        elements.apiStatus.querySelector('.status-text').textContent = 'API Key no configurada';
    }
}

// ============================================
// RECONOCIMIENTO DE VOZ (STT)
// ============================================

/**
 * Inicializa el reconocimiento de voz
 */
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        state.recognition.lang = 'es-ES';
        state.recognition.continuous = true;
        state.recognition.interimResults = true;

        state.recognition.onresult = handleSpeechResult;
        state.recognition.onerror = handleSpeechError;
        state.recognition.onend = handleSpeechEnd;
    } else {
        console.warn('El reconocimiento de voz no está soportado en este navegador');
        showTextInputFallback();
    }
}

/**
 * Muestra el input de texto como alternativa al reconocimiento de voz
 */
function showTextInputFallback() {
    elements.textInputContainer.classList.remove('hidden');
}

/**
 * Alterna el estado de grabación (toggle on/off)
 */
function toggleRecording() {
    if (state.isEvaluating) return;

    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

/**
 * Inicia la grabación de voz
 */
function startRecording() {
    if (!state.recognition) {
        showTextInputFallback();
        return;
    }

    state.isRecording = true;
    elements.recordBtn.classList.add('recording');
    elements.recordingStatus.classList.add('active');
    elements.statusText.textContent = 'Grabando... (clic para detener)';
    elements.recordBtn.querySelector('span:last-child').textContent = 'Detener Grabación';

    // Limpiar transcripción anterior
    elements.transcriptDisplay.classList.add('hidden');
    elements.transcriptText.textContent = '';

    try {
        state.recognition.start();
    } catch (e) {
        console.error('Error al iniciar reconocimiento:', e);
        stopRecording();
        showTextInputFallback();
    }
}

/**
 * Detiene la grabación de voz
 */
function stopRecording() {
    state.isRecording = false;
    elements.recordBtn.classList.remove('recording');
    elements.recordingStatus.classList.remove('active');
    elements.statusText.textContent = 'Presiona para grabar';
    elements.recordBtn.querySelector('span:last-child').textContent = 'Grabar Respuesta';

    if (state.recognition) {
        try {
            state.recognition.stop();
        } catch (e) {
            console.error('Error al detener reconocimiento:', e);
        }
    }
}

/**
 * Maneja el resultado del reconocimiento de voz
 * @param {SpeechRecognitionEvent} event - Evento de reconocimiento
 */
function handleSpeechResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }

    // Mostrar transcripción
    if (finalTranscript || interimTranscript) {
        elements.transcriptDisplay.classList.remove('hidden');
        elements.transcriptText.textContent = finalTranscript || interimTranscript;
    }

    // Si tenemos una transcripción final y no estamos grabando, evaluar
    if (finalTranscript && !state.isRecording) {
        evaluateResponse(finalTranscript);
    }
}

/**
 * Maneja errores del reconocimiento de voz
 * @param {SpeechRecognitionError} event - Evento de error
 */
function handleSpeechError(event) {
    console.error('Error de reconocimiento de voz:', event.error);
    stopRecording();

    if (event.error === 'network') {
        elements.statusText.textContent = 'Error de red. Usa el input de texto.';
        showTextInputFallback();
    } else if (event.error === 'not-allowed') {
        elements.statusText.textContent = 'Permiso de micrófono denegado';
        showTextInputFallback();
    } else if (event.error === 'no-speech') {
        elements.statusText.textContent = 'No se detectó voz. Intenta de nuevo.';
    }
}

/**
 * Maneja el fin del reconocimiento de voz
 */
function handleSpeechEnd() {
    if (state.isRecording) {
        // Si todavía estamos en modo grabación pero el reconocimiento terminó,
        // reiniciarlo
        try {
            state.recognition.start();
        } catch (e) {
            stopRecording();
        }
    } else {
        // Si ya no estamos grabando y hay transcripción, evaluar
        const transcript = elements.transcriptText.textContent;
        if (transcript && !state.isEvaluating) {
            evaluateResponse(transcript);
        }
    }
}

/**
 * Envía la respuesta escrita en el input de texto
 */
function submitTextResponse() {
    const response = elements.textResponseInput.value.trim();
    if (response && !state.isEvaluating) {
        elements.transcriptDisplay.classList.remove('hidden');
        elements.transcriptText.textContent = response;
        elements.textResponseInput.value = '';
        evaluateResponse(response);
    }
}

// ============================================
// SÍNTESIS DE VOZ (TTS)
// ============================================

/**
 * Habla el texto proporcionado usando TTS
 * @param {string} text - Texto a hablar
 * @returns {Promise} - Promesa que se resuelve cuando termina de hablar
 */
function speak(text) {
    return new Promise((resolve) => {
        // Cancelar cualquier síntesis en curso
        state.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Buscar una voz en español
        const voices = state.synthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        utterance.onend = resolve;
        utterance.onerror = resolve;

        state.synthesis.speak(utterance);
    });
}

// ============================================
// LÓGICA DEL TEST
// ============================================

/**
 * Inicia el test de Información
 */
async function startTest() {
    // Ocultar configuración, mostrar test
    elements.configSection.classList.add('hidden');
    elements.testSection.classList.remove('hidden');

    // Reiniciar estado
    state.isTestActive = true;
    state.currentItemIndex = ADULT_START_INDEX; // Comenzar en ítem 3
    state.consecutiveZeros = 0;
    state.reverseSequenceNeeded = false;
    state.inReverseSequence = false;
    state.reverseIndex = 0;
    state.perfectConsecutive = 0;
    initializeScores();

    // Cargar primer ítem
    await loadItem(state.currentItemIndex);
}

/**
 * Carga un ítem específico
 * @param {number} index - Índice del ítem a cargar
 */
async function loadItem(index) {
    const item = INFORMATION_ITEMS[index];
    if (!item) {
        endTest();
        return;
    }

    // Actualizar UI
    updateProgress(index);
    elements.itemBadge.textContent = `Ítem ${item.id}`;
    elements.questionDisplay.textContent = item.question;

    // Mostrar/ocultar badge de aprendizaje
    if (item.isLearning) {
        elements.learningBadge.classList.remove('hidden');
    } else {
        elements.learningBadge.classList.add('hidden');
    }

    // Ocultar feedback anterior
    elements.feedbackSection.classList.add('hidden');
    elements.transcriptDisplay.classList.add('hidden');
    elements.autoAdvanceNotice.classList.add('hidden');

    // Reiniciar estado de probe
    state.needsProbe = false;
    state.probeAttempts = 0;

    // Habilitar grabación
    elements.recordBtn.disabled = false;
    elements.textResponseInput.disabled = false;
    elements.submitTextBtn.disabled = false;

    // Leer la pregunta con TTS
    await speak(item.question);
}

/**
 * Actualiza la barra de progreso
 * @param {number} currentIndex - Índice actual
 */
function updateProgress(currentIndex) {
    const total = INFORMATION_ITEMS.length;
    const current = currentIndex + 1;
    const percentage = (current / total) * 100;

    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `Ítem ${INFORMATION_ITEMS[currentIndex].id} de ${total}`;
}

/**
 * Evalúa la respuesta del usuario usando Gemini API
 * @param {string} userResponse - Respuesta transcrita del usuario
 */
async function evaluateResponse(userResponse) {
    if (state.isEvaluating) return;

    state.isEvaluating = true;
    elements.recordBtn.disabled = true;
    elements.textResponseInput.disabled = true;
    elements.submitTextBtn.disabled = true;
    elements.statusText.textContent = 'Evaluando respuesta...';

    const currentItem = INFORMATION_ITEMS[state.currentItemIndex];
    const correctAnswer = CORRECT_ANSWERS[currentItem.id];

    try {
        const result = await evaluateWithGemini(currentItem, userResponse, correctAnswer);
        await displayFeedback(result, currentItem);
    } catch (error) {
        console.error('Error al evaluar:', error);
        elements.statusText.textContent = 'Error al evaluar. Intenta de nuevo.';
        state.isEvaluating = false;
        elements.recordBtn.disabled = false;
        elements.textResponseInput.disabled = false;
        elements.submitTextBtn.disabled = false;
    }
}

/**
 * Llama a Gemini API para evaluar la respuesta
 * @param {Object} item - Ítem actual
 * @param {string} userResponse - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta de referencia
 * @returns {Object} - Resultado de la evaluación
 */
async function evaluateWithGemini(item, userResponse, correctAnswer) {
    const isProbe = state.needsProbe && state.probeAttempts > 0;

    const prompt = `Eres un psicólogo experto en evaluación cognitiva administrando la subprueba de Información del WAIS-IV.

PREGUNTA: "${item.question}"
RESPUESTA CORRECTA DE REFERENCIA: "${correctAnswer}"
RESPUESTA DEL USUARIO: "${userResponse}"
${isProbe ? 'NOTA: Esta es una respuesta después de una consulta (P) para pedir más detalles.' : ''}

REGLAS DE CALIFICACIÓN PARA INFORMACIÓN:
1. Puntuación BINARIA: Solo 0 o 1 punto.
2. 1 PUNTO: La respuesta contiene el dato fáctico correcto, aunque la expresión sea imperfecta.
3. 0 PUNTOS: La respuesta es incorrecta, insuficiente o contradice el hecho correcto.
4. CONSULTA (P): Si la respuesta es vaga pero potencialmente correcta (ej: "en el continente más grande" para India), necesita más precisión.
5. NO penalizar por gramática o pronunciación pobre si el contenido es correcto.
6. Si el usuario da múltiples respuestas, considerar la mejor, SALVO que una contradiga la correcta.

Responde SOLO con un JSON válido:
{
    "score": 0 o 1,
    "needsProbe": true/false (si necesita consulta P),
    "feedback": "Explicación breve de la calificación",
    "probeQuestion": "Pregunta de sondeo si needsProbe es true (ej: 'Sí, ¿pero cómo se llama?')"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500
            }
        })
    });

    if (!response.ok) {
        throw new Error('Error en la API de Gemini');
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    // Extraer JSON de la respuesta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No se pudo parsear la respuesta');
}

/**
 * Muestra el feedback de la evaluación
 * @param {Object} result - Resultado de la evaluación
 * @param {Object} item - Ítem evaluado
 */
async function displayFeedback(result, item) {
    const score = result.score;

    // Si necesita probe y no lo hemos intentado
    if (result.needsProbe && state.probeAttempts === 0) {
        state.needsProbe = true;
        state.probeAttempts = 1;
        state.isEvaluating = false;

        // Mostrar pregunta de sondeo
        elements.feedbackSection.classList.remove('hidden');
        elements.feedbackContent.innerHTML = `
            <div class="probe-message">
                <p>🔍 Consulta adicional:</p>
                <p><strong>${result.probeQuestion || '¿Podrías ser más específico?'}</strong></p>
            </div>
        `;

        // Leer pregunta de sondeo
        await speak(result.probeQuestion || '¿Podrías ser más específico?');

        // Habilitar grabación de nuevo
        elements.recordBtn.disabled = false;
        elements.textResponseInput.disabled = false;
        elements.submitTextBtn.disabled = false;
        elements.statusText.textContent = 'Presiona para grabar tu respuesta';
        return;
    }

    // Guardar score
    state.scores[state.currentItemIndex] = {
        itemId: item.id,
        score: score,
        administered: true
    };

    // Actualizar puntaje visual
    updateCurrentScore();

    // Mostrar feedback
    elements.feedbackSection.classList.remove('hidden');
    elements.feedbackContent.innerHTML = `
        <div class="score-badge score-${score}">${score}</div>
        <p class="feedback-text">${result.feedback}</p>
    `;

    // Lógica de secuencia inversa (solo para ítems 3 y 4)
    if ((item.id === 3 || item.id === 4) && score === 0 && !state.reverseSequenceNeeded) {
        state.reverseSequenceNeeded = true;
    }

    // Actualizar consecutiveZeros
    if (score === 0) {
        state.consecutiveZeros++;
    } else {
        state.consecutiveZeros = 0;
    }

    // Verificar suspensión
    if (state.consecutiveZeros >= DISCONTINUE_THRESHOLD) {
        setTimeout(() => {
            endTest();
        }, 2000);
        return;
    }

    // Avanzar automáticamente
    elements.autoAdvanceNotice.classList.remove('hidden');
    setTimeout(() => {
        state.isEvaluating = false;
        advanceToNextItem();
    }, 2000);
}

/**
 * Actualiza el puntaje actual mostrado
 */
function updateCurrentScore() {
    const total = state.scores
        .filter(s => s.administered)
        .reduce((sum, s) => sum + (s.score || 0), 0);
    elements.currentScore.textContent = total;
}

/**
 * Avanza al siguiente ítem
 */
async function advanceToNextItem() {
    // Si necesitamos hacer secuencia inversa y no la hemos hecho
    if (state.reverseSequenceNeeded && !state.inReverseSequence && state.currentItemIndex >= ADULT_START_INDEX) {
        // Verificar si ya pasamos los ítems 3 y 4
        const item3Score = state.scores[2].score; // índice 2 = ítem 3
        const item4Score = state.scores[3].score; // índice 3 = ítem 4

        // Si falló en ítem 3 o 4, iniciar secuencia inversa
        if ((item3Score === 0 || item4Score === 0) && state.currentItemIndex === 3) {
            state.inReverseSequence = true;
            state.reverseIndex = 1; // Comenzar con ítem 2 (índice 1)
            state.perfectConsecutive = 0;
            await loadItem(state.reverseIndex);
            return;
        }
    }

    // Si estamos en secuencia inversa
    if (state.inReverseSequence) {
        const lastScore = state.scores[state.reverseIndex].score;
        if (lastScore === 1) {
            state.perfectConsecutive++;
        } else {
            state.perfectConsecutive = 0;
        }

        // Terminar secuencia inversa si: 2 perfectos consecutivos o llegamos al ítem 1
        if (state.perfectConsecutive >= 2 || state.reverseIndex === 0) {
            state.inReverseSequence = false;
            // Continuar desde donde estábamos (ítem 5 en adelante)
            state.currentItemIndex = 4; // índice 4 = ítem 5
            await loadItem(state.currentItemIndex);
            return;
        }

        // Retroceder al ítem anterior
        state.reverseIndex--;
        if (state.reverseIndex >= 0) {
            await loadItem(state.reverseIndex);
            return;
        } else {
            // Terminamos la secuencia inversa
            state.inReverseSequence = false;
            state.currentItemIndex = 4;
            await loadItem(state.currentItemIndex);
            return;
        }
    }

    // Avance normal
    state.currentItemIndex++;
    if (state.currentItemIndex >= INFORMATION_ITEMS.length) {
        endTest();
    } else {
        await loadItem(state.currentItemIndex);
    }
}

/**
 * Finaliza el test y muestra resultados
 */
function endTest() {
    state.isTestActive = false;
    state.synthesis.cancel();

    // Calcular puntaje bruto (suma de ítems administrados)
    // Para ítems no administrados antes del inicio, asumimos 1 punto
    let rawScore = 0;
    for (let i = 0; i < state.scores.length; i++) {
        const scoreData = state.scores[i];
        if (scoreData.administered) {
            rawScore += scoreData.score || 0;
        } else if (i < ADULT_START_INDEX) {
            // Ítems antes del inicio que no se administraron = 1 punto cada uno
            rawScore += 1;
            state.scores[i].score = 1;
            state.scores[i].administered = false; // Marcar como no administrado pero con puntaje
        }
    }

    // Calcular puntaje escalar
    const scaledScore = calculateScaledScore(rawScore, state.userAge);
    const ageGroup = getAgeGroup(state.userAge);

    // Mostrar resultados
    elements.testSection.classList.add('hidden');
    elements.resultsSection.classList.remove('hidden');

    elements.ageGroupDisplay.textContent = `Grupo de edad: ${ageGroup} años`;
    elements.rawScore.textContent = rawScore;
    elements.scaledScore.textContent = scaledScore;

    // Generar lista de ítems
    elements.itemsList.innerHTML = state.scores.map((scoreData, index) => {
        const item = INFORMATION_ITEMS[index];
        const scoreClass = scoreData.administered ? `score-${scoreData.score}` : 
                          (index < ADULT_START_INDEX && scoreData.score === 1) ? 'score-1' : 'not-administered';
        const displayScore = scoreData.administered ? scoreData.score : 
                            (index < ADULT_START_INDEX && scoreData.score === 1) ? '1*' : '-';
        return `
            <div class="item-score ${scoreClass}">
                <span class="item-num">${item.id}</span>
                <span class="item-pts">${displayScore}</span>
            </div>
        `;
    }).join('');
}

/**
 * Obtiene el grupo de edad para los baremos
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
    const baremo = BAREMOS[ageGroup];

    if (!baremo) {
        console.warn('No se encontró baremo para el grupo de edad:', ageGroup);
        return 10; // Valor por defecto
    }

    // Buscar el PE correspondiente al PB
    for (let pe = 0; pe < baremo.length; pe++) {
        const range = baremo[pe];
        if (range === null) continue;
        
        const [min, max] = range;
        if (rawScore >= min && rawScore <= max) {
            return pe + 1; // PE es 1-indexed
        }
    }

    // Si el puntaje es mayor al máximo del baremo, devolver PE máximo
    if (rawScore >= MAX_SCORE) {
        return 19;
    }

    // Si no encontramos rango, buscar el más cercano
    for (let pe = baremo.length - 1; pe >= 0; pe--) {
        const range = baremo[pe];
        if (range !== null && rawScore >= range[0]) {
            return pe + 1;
        }
    }

    return 1; // Mínimo
}

/**
 * Reinicia el test
 */
function restartTest() {
    // Reiniciar estado
    state.currentItemIndex = 0;
    state.consecutiveZeros = 0;
    state.isTestActive = false;
    state.isRecording = false;
    state.isEvaluating = false;
    state.needsProbe = false;
    state.probeAttempts = 0;
    state.reverseSequenceNeeded = false;
    state.inReverseSequence = false;
    state.reverseIndex = 0;
    state.perfectConsecutive = 0;
    initializeScores();

    // Mostrar configuración
    elements.resultsSection.classList.add('hidden');
    elements.configSection.classList.remove('hidden');

    // Resetear UI
    elements.currentScore.textContent = '0';
    elements.feedbackSection.classList.add('hidden');
    elements.transcriptDisplay.classList.add('hidden');
}
