class Chatbot {
    constructor() {
      this.threadId = ''; // Initialize with an empty thread ID
      this.assistantId = "asst_OQvpPG4t6U6UBFTSk6NMzT20";
      this.baseUrl = "internal.decisions.com";
      this.nameSpace = "NS-08daf277-99f3-2854-1c3c-e50e30089599";
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

    // Function to display an error message
    displayErrorMessage() {
      const errorMessage = `
            Oops! Something went wrong. 
            Please try again and see if the error persists. 
            An administrator has been notified. 
            Thank you for your understanding.
      `;
      this.addMessage('bot', errorMessage);
    }
  
    async sendMessageToBot(payload) {
      const url = `https://${this.baseUrl}/Primary/restapi/Flow/01HRZ8W5YCDAEZW516SDNBWQ23`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        this.handleBotResponse(data);
      } catch (error) {
        console.error('Error:', error);
        this.displayErrorMessage();
        this.removeTypingIndicator();
      }
    }
  
    handleBotResponse(data) {
        this.removeTypingIndicator();
    
        if (data.Done && data.Done.ThreadId) {
            this.threadId = data.Done.ThreadId;
        }
    
        const questionAnswerEntityId = data.Done.QuestionAnswerEntityId || "";
    
        if (data.Done && data.Done.MessageResponses && data.Done.MessageResponses.data.length > 0) {
            const latestMessageData = data.Done.MessageResponses.data[0];
            const messageContent = latestMessageData.content.find(c => c.type === 'text');
            
            if (messageContent && messageContent.text) {
                let messageText = messageContent.text.value;
    
                this.addFormattedMessage('bot', messageText.trim(), questionAnswerEntityId);
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
  
    addFormattedMessage(sender, messageHtml, questionAnswerEntityId = '') {
      const chatBox = document.getElementById('chat-box');
      const textElement = this.createMessageElement(sender, messageHtml, questionAnswerEntityId);
      chatBox.appendChild(textElement);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    createMessageElement(sender, text, questionAnswerEntityId = '') {
        const element = document.createElement('div');
        element.classList.add('message');
        element.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
        // Convert Markdown to HTML
        let html = marked(text);
    
        // Handle Mermaid rendering
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
    
        // Select all <pre><code> blocks to preserve formatting
        const codeBlocks = doc.querySelectorAll('pre code');
        codeBlocks.forEach(codeBlock => {
            // Skip cleaning for <pre><code> blocks
            const codeContent = codeBlock.outerHTML;
            html = html.replace(codeBlock.outerHTML, codeContent);
        });
    
        // Clean the rest of the HTML outside of <pre><code> blocks
        html = html.replace(/>\s+</g, '><').trim();
    
        // Insert the cleaned HTML into the element
        element.innerHTML = html;
    
        // Render Mermaid diagrams if any
        const mermaidBlocks = element.querySelectorAll('code.language-mermaid');
        mermaidBlocks.forEach(block => {
            const parent = block.parentElement;
            const mermaidContainer = document.createElement('div');
            mermaidContainer.classList.add('mermaid');
            mermaidContainer.textContent = block.textContent;
    
            parent.replaceWith(mermaidContainer);
    
            if (window.mermaid) {
                mermaid.init(undefined, mermaidContainer);
            }
        });
    
        if (sender === 'bot' && questionAnswerEntityId) {
            const feedbackContainer = document.createElement('div');
            feedbackContainer.classList.add('feedback-container');
    
            const thumbsUp = document.createElement('i');
            thumbsUp.classList.add('fas', 'fa-thumbs-up');
            thumbsUp.onclick = () => this.sendFeedback(questionAnswerEntityId, 'Positive');
    
            const thumbsDown = document.createElement('i');
            thumbsDown.classList.add('fas', 'fa-thumbs-down');
            thumbsDown.onclick = () => this.sendFeedback(questionAnswerEntityId, 'Negative');
    
            feedbackContainer.appendChild(thumbsUp);
            feedbackContainer.appendChild(thumbsDown);
    
            element.appendChild(feedbackContainer);
        }
    
        return element;
    }
  
    async sendFeedback(questionAnswerEntityId, feedbackResponse) {
      const url = `https://${this.baseUrl}/Primary/restapi/Flow/01J4Q40YS76HYWF9C1R40F1HYS`;
      const payload = {
        sessionid: this.nameSpace,
        outputtype: "Json",
        QuestionAnswerEntityId: questionAnswerEntityId,
        FeedbackResponse: feedbackResponse
      };
  
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        this.addMessage('bot', 'Thank you for your feedback, we appreciate your help!');
      } catch (error) {
        console.error('Error sending feedback:', error);
        this.displayErrorMessage();
      }
    }
  
    loadMermaidLibrary() {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/mermaid/dist/mermaid.min.js";
      script.onload = () => {
        mermaid.initialize({
          startOnLoad: true
        });
      };
      document.head.appendChild(script);
    }
  
    clearMessages() {
      const chatBox = document.getElementById('chat-box');
      chatBox.innerHTML = '';
      this.threadId = ''; // Reset the thread ID
      this.addWelcomeMessage();
    }
  
    downloadMessages() {
      const chatBox = document.getElementById('chat-box');
      const messages = chatBox.querySelectorAll('.message');
      let text = '';
      messages.forEach(message => {
        text += message.textContent + '\n';
      });
  
      const blob = new Blob([text], {
        type: 'text/plain'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'chat_history.txt';
      link.click();
    }
  }
  
  // Example from scripts.js
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
  