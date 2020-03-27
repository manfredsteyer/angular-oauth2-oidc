const fs = require('fs')
const path = require('path')
const markdownMagic = require('markdown-magic')

const config = {
  repo: 'manfredsteyer/angular-oauth-oidc',
  transforms: {
    CONTRIBUTORS: require('markdown-magic-github-contributors')
  }
}

const markdownPath = path.join(__dirname, 'test.md')
markdownMagic(markdownPath, config, config);
