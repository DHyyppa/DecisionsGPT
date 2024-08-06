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
                let fileLinks = '';

                if (messageContent.text.annotations && messageContent.text.annotations.length > 0) {
                    messageContent.text.annotations.forEach(annotation => {
                        if (annotation.file_path && annotation.file_path.file_id && annotation.text) {
                            const fileUrl = `https://${this.baseUrl}/Primary/?FlowId=01HS6HN1Y88HKEDACEB1S06BQP&&sessionid=${this.nameSpace}&ForceFormat=true&file_id=${annotation.file_path.file_id}&Location=Center&Chrome=Off&Shadow=true&BoxShadow=1px%201px%2010px%20rgba(0%2C0%2C0%2C0.3)`;
                            fileLinks += `<a href="${fileUrl}" target="_blank" style="text-decoration: underline; color: blue;">${annotation.text}</a><br>`;
                        }
                    });
                }

                const fullMessage = fileLinks ? messageText + "<br>" + fileLinks : messageText;
                this.addFormattedMessage('bot', fullMessage);
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
        const parts = messageHtml.split(/\[mermaid\]([\s\S]*?)\[\/mermaid\]/);

        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                const textElement = this.createMessageElement(sender, part);
                chatBox.appendChild(textElement);
            } else {
                const mermaidElement = document.createElement('div');
                mermaidElement.className = 'mermaid';
                mermaidElement.innerHTML = part.trim();
                chatBox.appendChild(mermaidElement);
                mermaid.init(undefined, mermaidElement);
            }
        });

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
