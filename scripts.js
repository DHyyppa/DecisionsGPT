const assistantId = "asst_OQvpPG4t6U6UBFTSk6NMzT20";
const baseUrl = "internal-dev.decisions.com";
const nameSpace = "NS-01J4JHRTZGYCSHDHVNBB1X192P";

class Chatbot {
    constructor() {
        this.threadId = ''; // Initialize with an empty thread ID
        this.assistantId = assistantId; // Static Assistant ID
        this.baseUrl = baseUrl; // Static Base URL
        this.nameSpace = nameSpace; // Static Name Space
        this.addEventListeners();
        this.addWelcomeMessage();
    }

    addEventListeners() {
        const sendButton = document.getElementById('send-button');
        const userInput = document.getElementById('user-input');
        const refreshButton = document.getElementById('refresh-button');
        const downloadButton = document.getElementById('download-button');

        sendButton.onclick = () => this.sendMessage();
        refreshButton.onclick = () => this.clearMessages();
        downloadButton.onclick = () => this.downloadMessages();

        userInput.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.keyCode === 13) {
                this.sendMessage();
            }
        });
    }

    addWelcomeMessage() {
        const chatBox = document.getElementById('chat-box');
        const welcomeMessage = document.createElement('div');
        welcomeMessage.classList.add('message', 'bot-message');
        welcomeMessage.textContent = 'Welcome to DecisionsGPT. How can I help you today?';
        chatBox.appendChild(welcomeMessage);
    }

    sendMessage() {
        const userInput = document.getElementById('user-input');
        const userText = userInput.value.trim();
        if (userText !== '') {
            this.addMessage('user', userText);
            userInput.value = '';
            userInput.style.height = 'auto'; // Reset textarea height
            this.showTypingIndicator();
            const payload = {
                sessionid: this.nameSpace,
                outputtype: "Json",
                UsersMessage: userText,
                ThreadId: this.threadId,
                AssistantId: this.assistantId
            };
            this.sendMessageToBot(payload);
        }
    }

    setValue(data) {
        if (data && data.assistantId !== this.assistantId) {
            this.assistantId = data.assistantId;
        }
        if (data && data.baseUrl !== this.baseUrl) {
            this.baseUrl = data.baseUrl;
        }
    }

    showTypingIndicator() {
        const chatBox = document.getElementById('chat-box');
        let typingIndicator = document.getElementById('typing-indicator');

        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.classList.add('message', 'bot-message');
            typingIndicator.textContent = '...';
            chatBox.appendChild(typingIndicator);

            let dotCount = 1;
            const interval = setInterval(() => {
                dotCount = dotCount % 3 + 1;
                typingIndicator.textContent = '.'.repeat(dotCount);
            }, 500);

            typingIndicator.dataset.intervalId = interval.toString();
        }

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendMessageToBot(payload) {
        const url = `https://${this.baseUrl}/Primary/restapi/Flow/01HRZ8W5YCDAEZW516SDNBWQ23`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            this.handleBotResponse(data);
        })
        .catch(error => {
            console.error('Error:', error);
            this.addMessage('bot', `Error: ${error.message}`);
            this.removeTypingIndicator();
        });
    }

    handleBotResponse(data) {
        this.removeTypingIndicator();

        if (data.Done && data.Done.ThreadId) {
            this.threadId = data.Done.ThreadId;
        }

        if (data.Done && data.Done.MessageResponses && data.Done.MessageResponses.data.length > 0) {
            const latestMessageData = data.Done.MessageResponses.data[0];
            const messageContent = latestMessageData.content.find(c => c.type === 'text');
            if (messageContent && messageContent.text) {
                let messageText = messageContent.text.value;

                // Replace ```mermaid with [mermaid] and ``` with [/mermaid]
                messageText = messageText.replace(/```mermaid/g, '[mermaid]').replace(/```/g, '[/mermaid]');

                // Split the messageText to separate normal text and mermaid code
                const parts = messageText.split(/\[mermaid\]([\s\S]*?)\[\/mermaid\]/);

                parts.forEach((part, index) => {
                    if (index % 2 === 0) {
                        // Remove leading whitespace
                        part = part.replace(/^\s+/, '');
                        if (part.trim()) {
                            this.addFormattedMessage('bot', part);
                        }
                    } else {
                        this.addMermaidMessage('bot', part.trim());
                    }
                });
            }
        }
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            clearInterval(parseInt(typingIndicator.dataset.intervalId, 10));
            typingIndicator.remove();
        }
    }

    addMessage(sender, message) {
        const chatBox = document.getElementById('chat-box');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        messageElement.innerHTML = message.replace(/\n/g, '<br>');
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    addFormattedMessage(sender, messageHtml) {
        const chatBox = document.getElementById('chat-box');
        const textElement = this.createMessageElement(sender, messageHtml);
        chatBox.appendChild(textElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    addMermaidMessage(sender, mermaidCode) {
        const chatBox = document.getElementById('chat-box');
        const mermaidElement = document.createElement('div');
        mermaidElement.classList.add('message', 'bot-message'); // Make it look like a message
        const contentElement = document.createElement('div');
        contentElement.className = 'mermaid';
        contentElement.innerHTML = mermaidCode;
        mermaidElement.appendChild(contentElement);
        chatBox.appendChild(mermaidElement);
        mermaid.init(undefined, contentElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    createMessageElement(sender, text) {
        const element = document.createElement('div');
        element.classList.add('message');
        element.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

        element.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/###\s*(.*?)<br>/g, '<h3 style="margin-top: 10px;">$1</h3>')
            .replace(/\[([^\]]+)]\((http[s]?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        return element;
    }

    loadMermaidLibrary() {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/mermaid/dist/mermaid.min.js";
        script.onload = () => {
            mermaid.initialize({ startOnLoad: true });
        };
        document.head.appendChild(script);
    }

    clearMessages() {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        this.addWelcomeMessage();
    }

    downloadMessages() {
        const chatBox = document.getElementById('chat-box');
        const messages = chatBox.querySelectorAll('.message');
        let text = '';
        messages.forEach(message => {
            text += message.textContent + '\n';
        });

        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'chat_history.txt';
        link.click();
    }

    stripMarkdownAndHTML(input) {
        // Remove HTML tags
        let output = input.replace(/<\/?[^>]+(>|$)/g, "");
        // Remove markdown syntax for bold and links
        output = output.replace(/\*\*(.*?)\*\*/g, "$1"); // bold
        output = output.replace(/\[(.*?)\]\(.*?\)/g, "$1"); // links
        // Remove markdown syntax for headers
        output = output.replace(/^### /gm, "\n");
        return output.trim();
    }

    addPlainTextMessage(sender, messageHtml) {
        const plainText = this.stripMarkdownAndHTML(messageHtml);
        this.addMessage(sender, plainText);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();
    chatbot.loadMermaidLibrary();
});

function autoGrow(element) {
    const minHeight = 46; // Minimum height of the textarea
    const maxHeight = 150; // Maximum height of the textarea

    // Reset the height to allow for correct measurement of scrollHeight
    element.style.height = 'auto';

    // Calculate the new height based on scrollHeight
    let newHeight = element.scrollHeight;

    // Ensure the new height is at least the minimum height
    if (newHeight < minHeight) {
        newHeight = minHeight;
    }

    // Expand the textarea only if the content height exceeds the current height
    if (newHeight > element.clientHeight && element.clientHeight < maxHeight) {
        element.style.height = newHeight + 'px';
    }

    // Add or remove overflow based on the new height
    if (element.clientHeight >= maxHeight) {
        element.style.height = maxHeight + 'px';
        element.style.overflowY = 'scroll';
    } else {
        element.style.overflowY = 'hidden';
    }
}
