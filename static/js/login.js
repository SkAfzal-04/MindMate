// DOM Elements
const loginForm = document.getElementById('loginForm');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.getElementById('loginBtn');
const btnLoader = document.getElementById('btnLoader');
const agreeTerms = document.getElementById('agreeTerms');
const toggleModeLink = document.getElementById('toggleMode');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');

// Error message elements
const nameError = document.getElementById('nameError');
const passwordError = document.getElementById('passwordError');
const passwordStrength = document.getElementById('passwordStrength');

// State management
let isLoginMode = false;
let isLoading = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeMoodButtons();
    setSignupMode(); // Start in signup mode
});

// Event Listeners
function initializeEventListeners() {
    // Form submission
    loginForm.addEventListener('submit', handleFormSubmission);
    
    // Password toggle
    passwordToggle.addEventListener('click', togglePassword);
    
    // Real-time validation
    nameInput.addEventListener('input', handleNameInput);
    passwordInput.addEventListener('input', handlePasswordInput);
    nameInput.addEventListener('blur', validateName);
    passwordInput.addEventListener('blur', validatePassword);
    
    // Mode toggle
    toggleModeLink.addEventListener('click', handleModeToggle);
    
    // Social login buttons
    document.querySelector('.google-btn').addEventListener('click', handleGoogleLogin);
    document.querySelector('.apple-btn').addEventListener('click', handleAppleLogin);
    
    // Terms checkbox
    agreeTerms.addEventListener('change', updateSubmitButton);
}

// Form submission handler
function handleFormSubmission(e) {
    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous errors
    clearAllErrors();

    // Basic validation
    if (!name || !password) {
        e.preventDefault();
        showValidationErrors(name, password);
        return;
    }

    // Advanced validation
    const isNameValid = validateName();
    const isPasswordValid = validatePassword();
    const isTermsAccepted = agreeTerms.checked;

    if (!isNameValid || !isPasswordValid || !isTermsAccepted) {
        e.preventDefault();
        
        if (!isTermsAccepted) {
            showError(agreeTerms.parentNode, 'Please accept the terms of service');
        }
        return;
    }

    // Show loading state
    setLoadingState(true);

    // Let the form submit naturally to Flask backend
    // The loading state will be cleared when the page reloads or redirects
}

// Input handlers
function handleNameInput() {
    const name = nameInput.value.trim();
    clearError(nameError);
    
    if (name.length > 0) {
        nameInput.classList.remove('error');
        if (name.length >= 2) {
            nameInput.classList.add('success');
        } else {
            nameInput.classList.remove('success');
        }
    }
}

function handlePasswordInput() {
    const password = passwordInput.value.trim();
    clearError(passwordError);
    
    if (password.length > 0) {
        passwordInput.classList.remove('error');
        updatePasswordStrength(password);
        
        if (password.length >= 6) {
            passwordInput.classList.add('success');
        } else {
            passwordInput.classList.remove('success');
        }
    } else {
        passwordStrength.textContent = '';
        passwordInput.classList.remove('success');
    }
}

// Validation functions
function validateName() {
    const