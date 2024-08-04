// scripts.js
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    const chatBox = document.getElementById('chat-box');

    // Add user message to chat
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    // Clear input field
    document.getElementById('user-input').value = '';

    // Scroll chat to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Generate bot response
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.classList.add('message', 'bot-message');
        botMessage.textContent = generateBotResponse(userInput);
        chatBox.appendChild(botMessage);

        // Scroll chat to the bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

function generateBotResponse(input) {
    // Simple bot logic
    const responses = {
        'hello': 'Hi there! How can I assist you?',
        'how are you': 'I am just a bot, but I am here to help you!',
        'bye': 'Goodbye! Have a great day!',
    };

    const cleanedInput = input.toLowerCase().trim();
    return responses[cleanedInput] || "I'm not sure how to respond to that.";
}
