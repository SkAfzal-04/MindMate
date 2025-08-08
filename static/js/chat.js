// Theme management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    bindEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
}

// Chat management
class ChatManager {
    constructor() {
        this.form = document.getElementById("chat-form");
        this.chatBox = document.getElementById("chat-box");
        this.messageInput = document.getElementById("message");
        this.sendBtn = document.getElementById("send-btn");
        this.isTyping = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTextareaAutoResize();
        this.setupQuickActions();
        this.scrollToBottom();
        this.updateSendButton();
    }

    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Enter key to send (Shift+Enter for new line)
        if (this.messageInput) {
            this.messageInput.addEventListener("keydown", (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Input changes
            this.messageInput.addEventListener("input", () => {
                this.updateSendButton();
            });
        }
    }

    setupTextareaAutoResize() {
        if (!this.messageInput) return;
        
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });
    }

    setupQuickActions() {
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', () => {
                const message = action.dataset.message;
                if (this.messageInput && message) {
                    this.messageInput.value = message;
                    this.updateSendButton();
                    this.messageInput.focus();
                    // Auto resize after setting value
                    this.messageInput.style.height = 'auto';
                    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
                }
            });
        });
    }

    updateSendButton() {
        if (!this.sendBtn || !this.messageInput) return;
        
        const hasContent = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasContent || this.isTyping;
    }

    async sendMessage() {
        if (!this.messageInput || !this.chatBox) return;
        
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to UI immediately
        this.addUserMessage(message);
        
        // Clear input and reset height
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.updateSendButton();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send message to Flask backend
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                body: new URLSearchParams({ message: message })
            });

            let data;
            try {
                data = await response.json();
            } catch (err) {
                console.error('JSON parsing error:', err);
                data = { response: "Sorry, something went wrong. Please try again." };
            }

            const botReply = data.response || "Sorry, something went wrong. Please try again.";
            
            // Hide typing indicator and add bot response
            this.hideTypingIndicator();
            this.addBotMessage(botReply);

        } catch (error) {
            console.error('Network error:', error);
            this.hideTypingIndicator();
            this.addBotMessage("I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.");
        }
    }

    addUserMessage(content) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement("div");
        messageDiv.className = "message user-message";
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="avatar user-avatar">👤</div>
                <span>You</span>
                <span>•</span>
                <span>${time}</span>
            </div>
            <div class="bubble">${this.escapeHtml(content)}</div>
        `;
        
        this.chatBox.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(content) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement("div");
        messageDiv.className = "message bot-message";
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="avatar bot-avatar">🤖</div>
                <span>MindMate</span>
                <span>•</span>
                <span>${time}</span>
            </div>
            <div class="bubble">${content}</div>
        `;
        
        this.chatBox.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.updateSendButton();
        
        const typingDiv = document.createElement("div");
        typingDiv.className = "message bot-message";
        typingDiv.id = "typing-indicator";
        typingDiv.innerHTML = `
            <div class="message-header">
                <div class="avatar bot-avatar">🤖</div>
                <span>MindMate</span>
                <span>•</span>
                <span>typing...</span>
            </div>
            <div class="typing-indicator">
                <span>Thinking</span>
                <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        this.chatBox.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.updateSendButton();
        
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        if (!this.chatBox) return;
        
        setTimeout(() => {
            this.chatBox.scrollTop = this.chatBox.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        return text.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
}

// Initialize Theme and Chat Managers
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new ChatManager();
});
