// scripts.js
class MyControl {
    constructor() {
        this.threadId = null;
        this.assistantId = null;
        this.baseUrl = null;
    }
    
    initialize(host, component) {
        this.host = host instanceof jQuery ? host[0] : host;
        this.injectFontAwesome();
        this.loadMermaidLibrary();
        this.injectTextSelectionCSS();
        this.host.style.position = 'relative';
        this.host.style.height = '100%';

        const headerContainer = document.createElement('div');
        headerContainer.id = 'header-container';
        headerContainer.style.display = 'flex';
        headerContainer.style.justifyContent = 'flex-end';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.padding = '10px';
        headerContainer.style.backgroundColor = '#f0f0f0';
        headerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-container';
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'column';
        chatContainer.style.height = 'calc(100% - 60px)';
        chatContainer.style.position = 'relative';

        const chatBox = document.createElement('div');
        chatBox.id = 'chat-box';
        chatBox.style.flexGrow = 1;
        chatBox.style.position = 'relative';
        chatBox.style.overflowY = 'auto';
        chatBox.style.paddingTop = '50px';
        chatBox.style.padding = '10px';
        chatBox.style.background = 'transparent';
        chatBox.style.maxHeight = 'calc(100% - 120px)';
        chatBox.style.zIndex = '1';

        const inputContainer = document.createElement('div');
        inputContainer.id = 'input-container';
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'flex-start';
        inputContainer.style.padding = '10px';
        inputContainer.style.backgroundColor = '#fff';

        const userInput = document.createElement('textarea');
        userInput.id = 'user-input';
        userInput.style.flexGrow = 1;
        userInput.style.height = '100px';
        userInput.style.resize = 'none';
        userInput.style.padding = '10px';
        userInput.style.border = '1px solid #ccc';
        userInput.style.borderRadius = '4px';
        userInput.style.marginRight = '10px';
        userInput.style.fontSize = '16px';
        userInput.placeholder = 'Type your message here...';

        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.style.flexShrink = 0;
        sendButton.style.width = '100px';
        sendButton.style.height = '40px';
        sendButton.style.marginLeft = '10px';
        sendButton.style.borderRadius = '4px';
        sendButton.style.border = 'none';
        sendButton.style.background = '#4E85BC';
        sendButton.style.color = 'white';
        sendButton.style.cursor = 'pointer';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-upload';
        fileInput.style.display = 'none';

        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = '<i class="fas fa-upload"></i>';
        uploadButton.style.padding = '10px';
        uploadButton.style.flexShrink = 0;
        uploadButton.style.width = 'auto';
        uploadButton.style.height = '40px';
        uploadButton.style.marginLeft = '2px';
        uploadButton.style.marginRight = '2px';
        uploadButton.style.borderRadius = '4px';
        uploadButton.style.border = 'none';
        uploadButton.style.background = '#4E85BC';
        uploadButton.style.color = 'white';
        uploadButton.style.cursor = 'pointer';

        uploadButton.onclick = function() {
            fileInput.click();
        };

        inputContainer.appendChild(uploadButton);
        inputContainer.appendChild(fileInput);
        inputContainer.appendChild(userInput);
        inputContainer.appendChild(sendButton);

        const controlPanel = document.createElement('div');
        controlPanel.id = 'control-panel';
        controlPanel.style.position = 'absolute';
        controlPanel.style.top = '0';
        controlPanel.style.right = '0';
        controlPanel.style.left = '0';
        controlPanel.style.zIndex = '1';
        controlPanel.style.display = 'flex';
        controlPanel.style.justifyContent = 'flex-end';
        controlPanel.style.padding = '10px';

        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '<i class="fas fa-download"></i>';
        downloadButton.onclick = () => this.downloadChatHistory();
        downloadButton.style.marginRight = '10px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.style.border = 'none';
        downloadButton.style.background = 'transparent';
        downloadButton.style.fontSize = '24px';

        const refreshButton = document.createElement('button');
        refreshButton.innerHTML = '<i class="fas fa-home"></i>';
        refreshButton.onclick = () => this.refreshChatUI();
        refreshButton.style.cursor = 'pointer';
        refreshButton.style.border = 'none';
        refreshButton.style.background = 'transparent';
        refreshButton.style.fontSize = '24px';

        headerContainer.appendChild(downloadButton);
        headerContainer.appendChild(refreshButton);

        chatContainer.appendChild(controlPanel);
        chatContainer.appendChild(chatBox);
        chatContainer.appendChild(inputContainer);

        this.host.insertBefore(headerContainer, this.host.firstChild);
        this.host.appendChild(chatContainer);

        const thisControl = this;

        sendButton.onclick = function() {
            sendMessage.call(thisControl);
        };

        userInput.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.keyCode === 13) {
                sendMessage.call(thisControl);
            }
        });

        function sendMessage() {
            const userText = userInput.value.trim();
            const file = fileInput.files[0];

            if (userText !== '' || file) {
                this.addMessage('user', userText);
                userInput.value = '';

                this.showTypingIndicator();

                const payload = {
                    outputtype: 'Json',
                    UsersMessage: userText,
                    ThreadId: this.threadId,
                    AssistantId: this.assistantId,
                    UserFile: {}
                };

                if (file) {
                    const reader = new FileReader();
                    reader.onload = (function(thisControl) {
                        return function(e) {
                            payload.UserFile = {
                                Id: 'StringValue',
                                FileName: file.name,
                                Contents: e.target.result.split(',')[1]
                            };

                            thisControl.sendMessageToBot(payload);
                        };
                    })(this);

                    reader.readAsDataURL(file);
                } else {
                    this.sendMessageToBot(payload);
                }
            }
        }
    }

    setValue(data) {
        if(data && data.assistantId !== this.assistantId) {
            this.assistantId = data.assistantId;
        }

        if(data && data.baseUrl !== this.baseUrl) {
            this.baseUrl = data.baseUrl;
        }
    }

    showTypingIndicator() {
        const chatBox = document.getElementById('chat-box');
        let typingIndicator = document.getElementById('typing-indicator');

        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.textContent = '.';
            typingIndicator.style.fontStyle = 'italic';
            typingIndicator.style.padding = '10px 20px';
            typingIndicator.style.background = '#e5e5ea';
            typingIndicator.style.borderRadius = '15px';
            typingIndicator.style.marginBottom = '10px';
            typingIndicator.style.maxWidth = 'fit-content';
            typingIndicator.style.marginRight = 'auto';

            chatBox.appendChild(typingIndicator);

            let dotCount = 1;
            const interval = setInterval(function() {
                dotCount = dotCount % 3 + 1;
                typingIndicator.textContent = '.'.repeat(dotCount);
            }, 500);

            typingIndicator.dataset.intervalId = interval.toString();
        }

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendMessageToBot(payload) {
        const thisControl = this;
        const endpointPath = '/Primary/restapi/Flow/01HRZ8W5YCDAEZW516SDNBWQ23';
        const url = `https://${this.baseUrl}${endpointPath}`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                clearInterval(parseInt(typingIndicator.dataset.intervalId, 10));
                typingIndicator.remove();
            }

            if (data.Done && data.Done.ThreadId) {
                thisControl.threadId = data.Done.ThreadId;
            }

            if (data.Done && data.Done.MessageResponses && data.Done.MessageResponses.data.length > 0) {
                const latestMessageData = data.Done.MessageResponses.data[0];
                const messageContent = latestMessageData.content.find(c => c.type === 'text');
                if (messageContent && messageContent.text) {
                    const messageText = messageContent.text.value;
                    let fileLinks = '';

                    if (messageContent.text.annotations && messageContent.text.annotations.length > 0) {
                        messageContent.text.annotations.forEach(annotation => {
                            if (annotation.file_path && annotation.file_path.file_id && annotation.text) {
                                const fileUrl = `https://${this.baseUrl}/Primary/?FlowId=01HS6HN1Y88HKEDACEB1S06BQP&&sessionid=NS-08daf277-99f3-2854-1c3c-e50e30089599&ForceFormat=true&file_id=${annotation.file_path.file_id}&Location=Center&Chrome=Off&Shadow=true&BoxShadow=1px%201px%2010px%20rgba(0%2C0%2C0%2C0.3)`;
                                fileLinks += `<a href="${fileUrl}" target="_blank" style="text-decoration: underline; color: blue;">${annotation.text}</a><br>`;
                            }
                        });
                    }

                    const fullMessage = fileLinks ? messageText + '<br>' + fileLinks : messageText;
                    thisControl.addFormattedMessage('bot', fullMessage);
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    addMessage(sender, message, isTypingIndicator) {
        if (isTypingIndicator) {
            if (!document.getElementById('typing-indicator')) {
                const chatBox = document.getElementById('chat-box');
                const messageElement = document.createElement('div');
                messageElement.id = 'typing-indicator';
                messageElement.textContent = 'Thinking....';
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
        const [text, mermaidDiagram] = messageHtml.split(/\[mermaid\]([\s\S]*?)\[\/mermaid\]/);

        const textElement = document.createElement('div');
        textElement.style.marginBottom = '10px';
        textElement.style.padding = '10px';
        textElement.style.borderRadius = '22px';
        textElement.style.maxWidth = '80%';
        if (sender === 'user') {
            textElement.style.background = '#4E85BC';
            textElement.style.color = 'white';
            textElement.style.marginLeft = 'auto';
        } else {
            textElement.style.background = '#e5e5ea';
            textElement.style.color = 'black';
        }

        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/###\s*(.*?)<br>/g, '<h3 style="margin-top: 10px;">$1</h3>')
            .replace(/\[([^\]]+)]\((http[s]?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        textElement.innerHTML = formattedText;
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

    injectTextSelectionCSS() {
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML = `
            #chat-container, #chat-container * {
                user-select: text;
                -moz-user-select: text;
                -webkit-user-select: text;
                -ms-user-select: text;
            }

            #chat-container::before {
                content: '' !important;
                position: absolute !important;
                top: 15% !important;
                left: 25% !important;
                right: 25% !important;
                bottom: 25% !important;
                background: url('https://decisions.com/wp-content/uploads/2022/10/decisions_logo_bird.svg') no-repeat center center / contain !important;
                opacity: 0.2 !important;
                z-index: 1 !important;
                pointer-events: none !important;
            }
            
            #chat-box a {
                color: #007bff;
                text-decoration: underline;
                cursor: pointer;
            }
            
            #chat-box a:hover {
                color: #0056b3;
            }
            
            #chat-box ul, #chat-box ol {
                padding-left: 20px;
                margin: 0;
            }
            
            #chat-box li {
                margin-bottom: 5px;
            }
            
            #chat-box h1 {
                color: #000;
                margin-top: 10px;
                margin-bottom: 5px;
                font-size: 22px !important;
                text-decoration: none !important;
            }
            
            #chat-box h2 {
                color: #000;
                margin-top: 10px;
                margin-bottom: 5px;
                font-size: 20px !important;
                text-decoration: none !important;
            }

            #chat-box h3 {
                color: #000;
                text-decoration: underline;
                margin-top: 10px;
                margin-bottom: 5px;
                font-size: 18px !important;
            }
            
            #chat-box p {
                margin-top: 10px;
                margin-bottom: 10px;
            }
            
            #chat-box p:first-child {
                margin-top: 0;
            }
            
            #chat-box p:last-child {
                margin-bottom: 0;
            }
            
            #chat-box ul {
                margin-top: 10px;
                list-style-type: square;
            }

            #chat-box ol {
                padding-left: 20px;
                margin: 0;
                list-style-type: decimal;
            }
            
            #chat-box li {
                margin-bottom: 5px;
            }
            
            #chat-box em {
                font-style: italic;
            }
            
            #chat-box code {
                background-color: #f5f5f5;
                padding: 2px 4px;
                font-family: monospace;
                font-size: 90%;
                border-radius: 4px;
            }
            
            @media (max-width: 768px) {
                #header-container {
                    display: none;
                }
                #chat-container {
                    margin-top: 0;
                }
                #chat-box, #user-input, button {
                    width: 100%;
                }
                #user-input {
                    margin-bottom: 10px;
                }
                #input-container {
                    flex-direction: column;
                }
                button {
                    width: auto;
                    margin: 0;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }

    loadMermaidLibrary() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/mermaid/dist/mermaid.min.js';
        script.onload = () => {
            mermaid.initialize({ startOnLoad: true });
        };
        document.head.appendChild(script);
    }

    injectFontAwesome() {
        const link = document.createElement('link');
        link.href = 'https://use.fontawesome.com/releases/v5.15.4/css/all.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    downloadChatHistory() {
        const chatBox = document.getElementById('chat-box');
        const chatContent = chatBox.innerText;
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    refreshChatUI() {
        this.threadId = null;
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
    }
}

// Initialize MyControl
const myControl = new MyControl();
document.addEventListener('DOMContentLoaded', () => {
    myControl.initialize(document.getElementById('chat-container'), null);
});
