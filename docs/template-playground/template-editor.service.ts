import { Injectable } from '@angular/core';

declare const monaco: any;

@Injectable({
  providedIn: 'root'
})
export class TemplateEditorService {
  private editor: any;
  private onChangeCallback: ((value: string) => void) | null = null;

  initializeEditor(container: HTMLElement) {
    // Initialize Monaco Editor
    this.editor = monaco.editor.create(container, {
      value: '',
      language: 'html',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: 'on',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        horizontal: 'visible',
        vertical: 'visible'
      },
      overviewRulerLanes: 2,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: {
        enabled: true
      },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: false
    });

    // Set up change listener
    this.editor.onDidChangeModelContent(() => {
      if (this.onChangeCallback) {
        this.onChangeCallback(this.editor.getValue());
      }
    });

    // Register custom language definitions
    this.registerHandlebarsLanguage();
  }

  setEditorContent(content: string, fileType: string) {
    if (this.editor) {
      const language = this.getLanguageFromFileType(fileType);
      const model = monaco.editor.createModel(content, language);
      this.editor.setModel(model);
    }
  }

  setOnChangeCallback(callback: (value: string) => void) {
    this.onChangeCallback = callback;
  }

  private getLanguageFromFileType(fileType: string): string {
    switch (fileType) {
      case 'hbs':
        return 'handlebars';
      case 'css':
      case 'scss':
        return 'css';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      default:
        return 'html';
    }
  }

  private registerHandlebarsLanguage() {
    // Register Handlebars language for Monaco Editor
    if (monaco.languages.getLanguages().find((lang: any) => lang.id === 'handlebars')) {
      return; // Already registered
    }

    monaco.languages.register({ id: 'handlebars' });

    monaco.languages.setMonarchTokensProvider('handlebars', {
      tokenizer: {
        root: [
          [/\{\{\{/, { token: 'keyword', next: '@handlebars_unescaped' }],
          [/\{\{/, { token: 'keyword', next: '@handlebars' }],
          [/<!DOCTYPE/, 'metatag', '@doctype'],
          [/<!--/, 'comment', '@comment'],
          [/(<)(\w+)/, ['delimiter', { token: 'tag', next: '@tag' }]],
          [/(<\/)(\w+)/, ['delimiter', { token: 'tag', next: '@tag' }]],
          [/</, 'delimiter'],
          [/[^<]+/]
        ],

        handlebars_unescaped: [
          [/\}\}\}/, { token: 'keyword', next: '@pop' }],
          [/[^}]+/, 'variable']
        ],

        handlebars: [
          [/\}\}/, { token: 'keyword', next: '@pop' }],
          [/#if|#unless|#each|#with|\/if|\/unless|\/each|\/with/, 'keyword'],
          [/[a-zA-Z_][\w]*/, 'variable'],
          [/[^}]+/, 'variable']
        ],

        comment: [
          [/-->/, 'comment', '@pop'],
          [/[^-]+/, 'comment'],
          [/./, 'comment']
        ],

        doctype: [
          [/[^>]+/, 'metatag.content'],
          [/>/, 'metatag', '@pop']
        ],

        tag: [
          [/[ \t\r\n]+/, 'white'],
          [/(\w+)(\s*=\s*)("([^"]*)")/, ['attribute.name', 'delimiter', 'attribute.value', 'attribute.value']],
          [/(\w+)(\s*=\s*)('([^']*)')/, ['attribute.name', 'delimiter', 'attribute.value', 'attribute.value']],
          [/\w+/, 'attribute.name'],
          [/>/, 'delimiter', '@pop']
        ]
      }
    });

    monaco.languages.setLanguageConfiguration('handlebars', {
      comments: {
        blockComment: ['<!--', '-->']
      },
      brackets: [
        ['<', '>'],
        ['{{', '}}'],
        ['{{{', '}}}']
      ],
      autoClosingPairs: [
        { open: '<', close: '>' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '<', close: '>' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });
  }

  destroy() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }
}
