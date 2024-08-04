class Chatbot {
    constructor() {
        this.threadId = ''; // Initialize with an empty thread ID
        this.assistantId = 'asst_rKvkEl86ZDWAfr2h7KE51tK2'; // Static Assistant ID
        this.baseUrl = 'internal-dev.decisions.com'; // Static Base URL
        this.addEventListeners();
        //this.addWelcomeMessage();
    }

    addEventListeners() {
        const sendButton = document.getElementById('send-button');
        const userInput = document.getElementById('user-input');
        const refreshButton = document.getElementById('refresh-button');
        const downloadButton = document.getElementById('download-button');

        sendButton.onclick = () => this.sendMessage();
        refreshButton.onclick = () => clearMessages();
        downloadButton.onclick = () => downloadMessages();

        userInput.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.keyCode === 13) {
                this.sendMessage();
            }
        });
    }

    addWelcomeMessage() {
        this.addMessage('bot', 'Welcome to DecisionsGPT. How can I help you today?');
    }

    sendMessage() {
        const userInput = document.getElementById('user-input');
        const userText = userInput.value.trim();
        if (userText !== '') {
            this.addMessage('user', userText);
            userInput.value = '';
            this.showTypingIndicator();
            const payload = {
                sessionid: "NS-08daf277-99f3-2854-1c3c-e50e30089599",
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
            .then(response => response.json())
            .then(data => {
                this.handleBotResponse(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    handleBotResponse(data) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            clearInterval(parseInt(typingIndicator.dataset.intervalId, 10));
            typingIndicator.remove();
        }

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
                            const fileUrl = `https://${this.baseUrl}/Primary/?FlowId=01HS6HN1Y88HKEDACEB1S06BQP&&sessionid=NS-08daf277-99f3-2854-1c3c-e50e30089599&ForceFormat=true&file_id=${annotation.file_path.file_id}&Location=Center&Chrome=Off&Shadow=true&BoxShadow=1px%201px%2010px%20rgba(0%2C0%2C0%2C0.3)`;
                            fileLinks += `<a href="${fileUrl}" target="_blank" style="text-decoration: underline; color: blue;">${annotation.text}</a><br>`;
                        }
                    });
                }

                const fullMessage = fileLinks ? messageText + "<br>" + fileLinks : messageText;
                this.addFormattedMessage('bot', fullMessage);
            }
        }
    }

    addMessage(sender, message, isTypingIndicator = false) {
        if (isTypingIndicator) {
            if (!document.getElementById('typing-indicator')) {
                const chatBox = document.getElementById('chat-box');
                const messageElement = document.createElement('div');
                messageElement.id = 'typing-indicator';
                messageElement.textContent = "Thinking....";
                messageElement.style.fontStyle = 'italic';
                chatBox.appendChild(messageElement);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            this.addFormattedMessage(sender, message);
        }
    }

    addFormattedMessage(sender, messageHtml) {
        const chatBox = document.getElementById('chat-box');
        messageHtml = messageHtml.replace(/```mermaid\n([\s\S]*?)\n```/g, '[mermaid]\n$1\n[/mermaid]');
        const [text, mermaidDiagram] = messageHtml.split(/\[mermaid\]([\s\S]*?)\[\/mermaid\]/);

        const textElement = this.createMessageElement(sender, text);
        chatBox.appendChild(textElement);

        if (mermaidDiagram) {
            const mermaidElement = document.createElement('div');
            mermaidElement.className = 'mermaid';
            mermaidElement.innerHTML = mermaidDiagram.trim();
            chatBox.appendChild(mermaidElement);
            mermaid.init(undefined, mermaidElement);
        }

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
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();
    chatbot.loadMermaidLibrary();
    chatbot.addWelcomeMessage();
});

function autoGrow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight) + "px";
    if (element.scrollHeight > 150) {
        element.style.height = "150px";
        element.style.overflowY = "scroll";
    } else {
        element.style.overflowY = "hidden";
    }
}

function clearMessages() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
}

function downloadMessages() {
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
