const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_PRIVATE_KEY = fs.readFileSync(path.join(__dirname, 'private-key.pem'), 'utf8');
const GITHUB_INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_PRIVATE_KEY,
    installationId: GITHUB_INSTALLATION_ID
  }
});

app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.action === 'opened' && event.issue) {
    const issueComment = event.issue.body;
    const issueNumber = event.issue.number;
    const repoOwner = event.repository.owner.login;
    const repoName = event.repository.name;

    const response = await getChatGPTResponse(issueComment);

    await octokit.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
      body: response
    });
  }

  res.sendStatus(200);
});

async function getChatGPTResponse(prompt) {
  const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: prompt,
    max_tokens: 150,
    n: 1,
    stop: null,
    temperature: 0.9,
  }, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
  });

  return response.data.choices[0].text.trim();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
