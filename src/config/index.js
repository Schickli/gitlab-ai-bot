const config = {
  gitlab: {
    secret: process.env.GITLAB_SECRET,
    apiUrl: process.env.GITLAB_API_URL,
    accessToken: process.env.GITLAB_ACCESS_TOKEN,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  app: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },
  changelog: {
    location: process.env.CHANGELOG_LOCATION || 'docs/changelog.md',
  },
  jira: {
    format: /PBUZIOT-\d{5}/,
  },
};

function validateConfig() {
  const required = [
    'GITLAB_SECRET',
    'GITLAB_API_URL', 
    'GITLAB_ACCESS_TOKEN',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export { config, validateConfig };