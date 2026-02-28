// DOM Elements
const messageContainer = document.getElementById("message-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const uploadButton = document.getElementById("upload-button");
const fileInput = document.getElementById("file-input");
const apiKeyModal = document.getElementById("api-key-modal");
const apiKeyInput = document.getElementById("api-key-input");
const saveApiKeyButton = document.getElementById("save-api-key");
const clearChatButton = document.getElementById("clear-chat");
const exportChatButton = document.getElementById("export-chat");
const themeToggle = document.getElementById("theme-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const animationsToggle = document.getElementById("animations-toggle");
const saveHistoryToggle = document.getElementById("save-history-toggle");
const clearAllDataButton = document.getElementById("clear-all-data");
const changeApiKeyButton = document.getElementById("change-api-key");
const modelVersionSelect = document.getElementById("model-version");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.querySelector(".sidebar");
const settingsButton = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsButton = document.getElementById("close-settings");
const newChatButton = document.getElementById("new-chat");
const voiceInputButton = document.getElementById("voice-input");
const toast = document.getElementById("toast");

// Initialize state
let API_KEY = localStorage.getItem("geminiApiKey") || "";
let MODEL_VERSION = localStorage.getItem("modelVersion") || "gemini-1.5-flash";
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
let isDarkMode = localStorage.getItem("darkMode") === "true";
let useAnimations = localStorage.getItem("useAnimations") !== "false";
let saveHistory = localStorage.getItem("saveHistory") !== "false";
let isSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
let isRecording = false;
let recognition = null;

// Apply initial settings
applyTheme();
initializeParticles();
updateUIBasedOnSettings();

// Check if API key exists
if (!API_KEY) {
    apiKeyModal.style.display = "flex";
} else {
    apiKeyModal.style.display = "none";
    showWelcomeScreen();
}

// Auto-resize textarea
userInput.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
    
    // Enable/disable send button based on input
    sendButton.disabled = this.value.trim() === "";
});

// Event Listeners
sendButton.addEventListener("click", handleUserMessage);
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage();
    }
});
uploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileUpload);
saveApiKeyButton.addEventListener("click", saveApiKey);
clearChatButton.addEventListener("click", clearChat);
exportChatButton.addEventListener("click", exportChat);
themeToggle.addEventListener("click", toggleTheme);
darkModeToggle.addEventListener("change", toggleTheme);
animationsToggle.addEventListener("change", toggleAnimations);
saveHistoryToggle.addEventListener("change", toggleSaveHistory);
clearAllDataButton.addEventListener("click", clearAllData);
changeApiKeyButton.addEventListener("click", showApiKeyModal);
modelVersionSelect.addEventListener("change", changeModelVersion);
sidebarToggle.addEventListener("click", toggleSidebar);
settingsButton.addEventListener("click", openSettings);
closeSettingsButton.addEventListener("click", closeSettings);
newChatButton.addEventListener("click", startNewChat);
voiceInputButton.addEventListener("click", toggleVoiceInput);

// Initialize speech recognition if available
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        userInput.dispatchEvent(new Event('input'));
    };
    
    recognition.onend = function() {
        isRecording = false;
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
    };
}

// Function to save API key
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        API_KEY = key;
        localStorage.setItem("geminiApiKey", key);
        apiKeyModal.style.display = "none";
        showWelcomeScreen();
        showToast("API key saved successfully", "success");
    } else {
        showToast("Please enter a valid API key", "error");
    }
}

// Function to show welcome screen
function showWelcomeScreen() {
    messageContainer.innerHTML = '';
    
    const welcomeScreen = document.createElement("div");
    welcomeScreen.className = "welcome-screen";
    
    const logoContainer = document.createElement("div");
    logoContainer.className = "welcome-logo";
    
    const logoPulse = document.createElement("div");
    logoPulse.className = "logo-pulse";
    
    const logo = document.createElement("div");
    logo.className = "logo";
    logo.textContent = "N";
    
    logoContainer.appendChild(logoPulse);
    logoContainer.appendChild(logo);
    
    const title = document.createElement("h1");
    title.className = "welcome-title";
    title.textContent = "Welcome to Nova AI";
    
    const subtitle = document.createElement("p");
    subtitle.className = "welcome-subtitle";
    subtitle.textContent = "I'm your advanced AI assistant powered by Google's Gemini. I can help with information, creative writing, coding, and much more. What would you like to know?";
    
    const suggestionChips = document.createElement("div");
    suggestionChips.className = "suggestion-chips";
    
    const suggestions = [
        "Explain quantum computing",
        "Write a short story about time travel",
        "Help me debug my JavaScript code",
        "Create a healthy meal plan for a week",
        "Suggest activities for a team building event",
        "Explain the differences between React and Angular"
    ];
    
    suggestions.forEach(text => {
        const chip = document.createElement("div");
        chip.className = "suggestion-chip";
        chip.textContent = text;
        chip.addEventListener("click", () => {
            userInput.value = text;
            userInput.dispatchEvent(new Event('input'));
            handleUserMessage();
        });
        suggestionChips.appendChild(chip);
    });
    
    welcomeScreen.appendChild(logoContainer);
    welcomeScreen.appendChild(title);
    welcomeScreen.appendChild(subtitle);
    welcomeScreen.appendChild(suggestionChips);
    
    messageContainer.appendChild(welcomeScreen);
}

// Function to handle user messages
async function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Clear the input field and reset its height
    userInput.value = "";
    userInput.style.height = "auto";
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, "user");
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        // Call Gemini API
        const response = await callGeminiAPI(message);
        
        // Remove typing indicator
        messageContainer.removeChild(typingIndicator);
        
        // Add bot response to chat
        addMessage(response, "bot");
    } catch (error) {
        // Remove typing indicator
        messageContainer.removeChild(typingIndicator);
        
        // Show error message
        addMessage("Sorry, I couldn't process your request. Please check your API key or try again later.", "bot");
        console.error("Error:", error);
        showToast("Error: " + error.message, "error");
    }
}

// Function to add message to chat
function addMessage(text, sender) {
    // Remove welcome screen if present
    const welcomeScreen = document.querySelector(".welcome-screen");
    if (welcomeScreen) {
        messageContainer.removeChild(welcomeScreen);
    }
    
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(sender);
    
    // Format bot messages with markdown if it's a bot message
    if (sender === "bot") {
        messageDiv.innerHTML = marked.parse(text);
    } else {
        const messagePara = document.createElement("p");
        messagePara.textContent = text;
        messageDiv.appendChild(messagePara);
    }
    
    // Add timestamp
    const timestamp = document.createElement("div");
    timestamp.className = "message-timestamp";
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.appendChild(timestamp);
    
    messageContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    // Save to chat history if enabled
    if (saveHistory) {
        chatHistory.push({ text, sender, timestamp: new Date().toISOString() });
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
}

// Function to add image message
function addImageMessage(src, sender) {
    // Remove welcome screen if present
    const welcomeScreen = document.querySelector(".welcome-screen");
    if (welcomeScreen) {
        messageContainer.removeChild(welcomeScreen);
    }
    
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(sender);
    
    const img = document.createElement("img");
    img.src = src;
    img.className = "message-image";
    
    const caption = document.createElement("p");
    caption.textContent = "Image uploaded";
    
    const timestamp = document.createElement("div");
    timestamp.className = "message-timestamp";
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.appendChild(img);
    messageDiv.appendChild(caption);
    messageDiv.appendChild(timestamp);
    messageContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    // Save to chat history if enabled
    if (saveHistory) {
        chatHistory.push({ text: "[Image]", sender, timestamp: new Date().toISOString() });
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
}

// Function to show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("typing-indicator");
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("span");
        typingDiv.appendChild(dot);
    }
    
    messageContainer.appendChild(typingDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    return typingDiv;
}

// Function to call Gemini API
async function callGeminiAPI(message) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: message
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        }
    };
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the response has the expected structure
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Unexpected API response format");
    }
}

// Function to call Gemini API with image
async function callGeminiAPIWithImage(base64Image) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent`;
    
    const requestBody = {
        contents: [{
            parts: [
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                },
                {
                    text: "What's in this image? Please describe it in detail."
                }
            ]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        }
    };
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Unexpected API response format");
    }
}

// Function to toggle theme
function toggleTheme() {
    if (this.id === "dark-mode-toggle") {
        isDarkMode = this.checked;
    } else {
        isDarkMode = !isDarkMode;
        darkModeToggle.checked = isDarkMode;
    }
    
    localStorage.setItem("darkMode", isDarkMode);
    applyTheme();
}

// Function to apply theme
function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add("dark-theme");
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove("dark-theme");
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Function to toggle animations
function toggleAnimations() {
    useAnimations = this.checked;
    localStorage.setItem("useAnimations", useAnimations);
    
    if (!useAnimations) {
        document.body.style.setProperty('--transition-fast', '0s');
        document.body.style.setProperty('--transition-normal', '0s');
        document.body.style.setProperty('--transition-slow', '0s');
    } else {
        document.body.style.setProperty('--transition-fast', '0.15s');
        document.body.style.setProperty('--transition-normal', '0.25s');
        document.body.style.setProperty('--transition-slow', '0.4s');
    }
}

// Function to toggle save history
function toggleSaveHistory() {
    saveHistory = this.checked;
    localStorage.setItem("saveHistory", saveHistory);
    
    if (!saveHistory) {
        showToast("Chat history saving disabled", "success");
    } else {
        showToast("Chat history saving enabled", "success");
    }
}

// Function to clear chat
function clearChat() {
    // Confirm before clearing
    if (confirm("Are you sure you want to clear the current conversation?")) {
        messageContainer.innerHTML = "";
        showWelcomeScreen();
        
        // Clear current session history but keep the setting
        chatHistory = [];
        if (saveHistory) {
            localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        }
        
        showToast("Chat cleared", "success");
    }
}

// Function to export chat
function exportChat() {
    if (chatHistory.length === 0) {
        showToast("No chat history to export", "error");
        return;
    }
    
    // Format chat history for export
    let exportText = "# Nova AI Chat Export\n";
    exportText += `Date: ${new Date().toLocaleString()}\n\n`;
    
    chatHistory.forEach(msg => {
        const role = msg.sender === "user" ? "User" : "Gemini AI";
        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        exportText += `## ${role} (${time})\n${msg.text}\n\n`;
    });
    
    // Create download link
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Chat exported successfully", "success");
}

// Function to clear all data
function clearAllData() {
    if (confirm("Are you sure you want to clear all data? This will remove your API key, chat history, and all settings.")) {
        localStorage.clear();
        showToast("All data cleared. Reloading page...", "success");
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

// Function to show API key modal
function showApiKeyModal() {
    apiKeyInput.value = API_KEY || "";
    apiKeyModal.style.display = "flex";
}

// Function to change model version
function changeModelVersion() {
    MODEL_VERSION = this.value;
    localStorage.setItem("modelVersion", MODEL_VERSION);
    showToast(`Model changed to ${MODEL_VERSION}`, "success");
}

// Function to toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
    isSidebarCollapsed = sidebar.classList.contains("collapsed");
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
    
    if (isSidebarCollapsed) {
        sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
    } else {
        sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
    }
}

// Function to open settings
function openSettings() {
    settingsPanel.classList.add("open");
}

// Function to close settings
function closeSettings() {
    settingsPanel.classList.remove("open");
}

// Function to start new chat
function startNewChat() {
    clearChat();
}

// Function to toggle voice input
function toggleVoiceInput() {
    if (!recognition) {
        showToast("Speech recognition not supported in this browser", "error");
        return;
    }
    
    if (isRecording) {
        recognition.stop();
        isRecording = false;
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
        recognition.start();
        isRecording = true;
        voiceInputButton.innerHTML = '<i class="fas fa-stop"></i>';
        showToast("Listening...", "success");
    }
}

// Function to handle file upload
async function handleFileUpload() {
    if (!fileInput.files.length) return;
    
    const file = fileInput.files[0];
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast("The image is too large. Please upload an image smaller than 10MB.", "error");
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const base64Image = e.target.result.split(",")[1];
        
        // Add image preview to chat
        addImageMessage(e.target.result, "user");
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        try {
            // Call Gemini API with image
            const response = await callGeminiAPIWithImage(base64Image);
            
            // Remove typing indicator
            messageContainer.removeChild(typingIndicator);
            
            // Add bot response
            addMessage(response, "bot");
        } catch (error) {
            messageContainer.removeChild(typingIndicator);
            addMessage("Sorry, I couldn't process the image. Please try again with a different image.", "bot");
            console.error("Error processing image:", error);
            showToast("Error processing image", "error");
        }
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    fileInput.value = "";
}

// Function to show toast notification
function showToast(message, type = "default") {
    toast.textContent = message;
    toast.className = "toast";
    toast.classList.add(type);
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Function to update UI based on settings
function updateUIBasedOnSettings() {
    // Set sidebar state
    if (isSidebarCollapsed) {
        sidebar.classList.add("collapsed");
        sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
    
    // Set form values
    darkModeToggle.checked = isDarkMode;
    animationsToggle.checked = useAnimations;
    saveHistoryToggle.checked = saveHistory;
    modelVersionSelect.value = MODEL_VERSION;
    
    // Apply animation settings
    if (!useAnimations) {
        document.body.style.setProperty('--transition-fast', '0s');
        document.body.style.setProperty('--transition-normal', '0s');
        document.body.style.setProperty('--transition-slow', '0s');
    }
}

// Function to initialize particles background
function initializeParticles() {
    particlesJS("particles-js", {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": isDarkMode ? "#ffffff" : "#4285F4"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.2,
                "random": false,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": isDarkMode ? "#ffffff" : "#4285F4",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.6
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });
}
