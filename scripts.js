class Chatbot {
  constructor() {
    this.threadId = ''; // Initialize with an empty thread ID
    this.assistantId = "asst_naTC6ByqvURKXMJqrJRRsveC";
    this.baseUrl = "internal.decisions.com"; // Ensure this matches your API endpoint
    this.nameSpace = "NS-08daf277-99f3-2854-1c3c-e50e30089599";
    this.addEventListeners();
    this.addWelcomeMessage(); // Send the initial blank message on load
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
    const welcomeMessages = [
      "Hello! How can I assist you with the Decisions platform today?",
      "Welcome to Decisions DocBot! How can I support your work today?",
      "Hi there! Need help with workflows or features in Decisions?",
      "Good day! How can I assist you with the Decisions platform?",
      "Welcome! What can I help you explore in Decisions today?",
      "Greetings! How can I assist with your Decisions platform needs?",
      "Hello! How can I help with your Decisions platform questions?",
      "Welcome! How can I support your use of the Decisions platform?",
      "Hi! How can I assist with workflows or features today?",
      "Good to see you! What can I help you with in Decisions?",
      "Hello! How can I assist you with the Decisions platform today?",
      "Welcome to Decisions DocBot! How can I help you today?",
      "Hi there! Ready to explore the Decisions platform together?",
      "Greetings! Need assistance with anything on the Decisions platform?",
      "Hello! How can I enhance your experience with Decisions today?"
    ];

    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    const selectedMessage = welcomeMessages[randomIndex];

    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('message', 'bot-message');
    welcomeMessage.textContent = selectedMessage;
    chatBox.appendChild(welcomeMessage);
  }

  sendWelcomeMessage() {
    const payload = {
      sessionid: this.nameSpace,
      outputtype: "Json",
      UsersMessage: "", // Send an empty message
      ThreadId: this.threadId,
      AssistantId: this.assistantId
    };
    this.sendMessageToBot(payload);
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
    const errorMessage = `Oops! Something went wrong.`;
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
      console.error('Error: ', error);
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

    // Replace encoded characters for Mermaid diagrams
    html = html.replace(/&amp;gt;/g, '>').replace(/&amp;lt;/g, '<');

    // Insert the cleaned HTML into the element
    element.innerHTML = html;

    // Make all links open in a new window
    const links = element.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // Define mermaidBlocks here
    const mermaidBlocks = element.querySelectorAll('code.language-mermaid');
    mermaidBlocks.forEach(block => {
      const parent = block.parentElement;
      const mermaidContainer = document.createElement('div');
      mermaidContainer.classList.add('mermaid');

      // Extract the Mermaid content and replace encoded characters
      let mermaidContent = block.textContent;
      mermaidContainer.textContent = mermaidContent;

      parent.replaceWith(mermaidContainer);

      if (window.mermaid) {
        mermaid.init(undefined, mermaidContainer);
      }
    });

    // Only add feedback buttons if questionAnswerEntityId is present and valid
    if (sender === 'bot' && questionAnswerEntityId) {
      const feedbackContainer = document.createElement('div');
      feedbackContainer.classList.add('feedback-container');

      const thumbsUp = document.createElement('i');
      thumbsUp.classList.add('fas', 'fa-thumbs-up', 'feedback-button');
      thumbsUp.title = 'Thumbs Up';
      thumbsUp.setAttribute('aria-label', 'Thumbs Up');
      thumbsUp.onclick = () => this.sendFeedback(questionAnswerEntityId, 'Positive', feedbackContainer);

      const thumbsDown = document.createElement('i');
      thumbsDown.classList.add('fas', 'fa-thumbs-down', 'feedback-button');
      thumbsDown.title = 'Thumbs Down';
      thumbsDown.setAttribute('aria-label', 'Thumbs Down');
      thumbsDown.onclick = () => this.sendFeedback(questionAnswerEntityId, 'Negative', feedbackContainer);

      feedbackContainer.appendChild(thumbsUp);
      feedbackContainer.appendChild(thumbsDown);

      element.appendChild(feedbackContainer);
    }

    return element;
  }

  async sendFeedback(questionAnswerEntityId, feedbackResponse, feedbackContainer) {
    // Validate that questionAnswerEntityId is not empty or null
    if (!questionAnswerEntityId || typeof questionAnswerEntityId !== 'string' || questionAnswerEntityId.trim() === '') {
      console.error('sendFeedback called with an invalid or empty questionAnswerEntityId.');
      return;
    }

    const payload = {
      sessionid: this.nameSpace,
      outputtype: "Json",
      QuestionAnswerEntityId: questionAnswerEntityId,
      FeedbackResponse: feedbackResponse
    };

    const url = `https://${this.baseUrl}/Primary/restapi/Flow/01J4Q40YS76HYWF9C1R40F1HYS`; // Update if different

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

      // Optionally handle the response data
      const data = await response.json();
      console.log('Feedback submitted successfully:', data);

      // Disable feedback buttons after submission
      if (feedbackContainer) {
        feedbackContainer.querySelectorAll('.feedback-button').forEach(button => {
          button.classList.add('disabled');
          button.style.pointerEvents = 'none';
          button.style.opacity = '0.6';
        });

        // Optionally show a confirmation message
        const confirmation = document.createElement('span');
        confirmation.classList.add('feedback-confirmation');
        confirmation.textContent = 'Feedback received!';
        feedbackContainer.appendChild(confirmation);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Optionally notify the user about the error
      if (feedbackContainer) {
        const errorMsg = document.createElement('span');
        errorMsg.classList.add('feedback-error');
        errorMsg.textContent = 'Failed to submit feedback.';
        feedbackContainer.appendChild(errorMsg);
      }
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
    this.addWelcomeMessage(); // Send the initial blank message on load
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

// Initialize the chatbot when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new Chatbot();
  chatbot.loadMermaidLibrary();
});

// Function to auto-grow the textarea
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
