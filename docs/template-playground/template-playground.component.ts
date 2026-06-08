import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateEditorService } from './template-editor.service';
import { ZipExportService } from './zip-export.service';
import { HbsRenderService } from './hbs-render.service';

interface Template {
  name: string;
  path: string;
  type: 'template' | 'partial';
}

interface Session {
  sessionId: string;
  success: boolean;
  message: string;
}

interface CompoDocConfig {
  hideGenerator?: boolean;
  disableSourceCode?: boolean;
  disableGraph?: boolean;
  disableCoverage?: boolean;
  disablePrivate?: boolean;
  disableProtected?: boolean;
  disableInternal?: boolean;
  disableLifeCycleHooks?: boolean;
  disableConstructors?: boolean;
  disableRoutesGraph?: boolean;
  disableSearch?: boolean;
  disableDependencies?: boolean;
  disableProperties?: boolean;
  disableDomTree?: boolean;
  disableTemplateTab?: boolean;
  disableStyleTab?: boolean;
  disableMainGraph?: boolean;
  disableFilePath?: boolean;
  disableOverview?: boolean;
  hideDarkModeToggle?: boolean;
  minimal?: boolean;
  customFavicon?: string;
  includes?: string;
  includesName?: string;
}

@Component({
  selector: 'template-playground-root',
  template: `
    <div class="template-playground">
      <div class="template-playground-header">
        <h2>Template Playground</h2>
        <div class="template-playground-status">
          <span *ngIf="sessionId" class="session-info">Session: {{sessionId.substring(0, 8)}}...</span>
          <span *ngIf="saving" class="saving-indicator">Saving...</span>
          <span *ngIf="lastSaved" class="last-saved">Last saved: {{lastSaved | date:'short'}}</span>
        </div>
        <div class="template-playground-actions">
          <button class="btn btn-secondary" (click)="toggleConfigPanel()">⚙️ Config</button>
          <button class="btn btn-primary" (click)="resetToDefault()">Reset to Default</button>
          <button class="btn btn-success" (click)="exportZip()">Download Templates</button>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="config-panel" [class.collapsed]="!showConfigPanel">
        <h3>CompoDoc Configuration</h3>
        <div class="config-options">
          <label><input type="checkbox" [(ngModel)]="config.hideGenerator" (change)="updateConfig()"> Hide Generator</label>
          <label><input type="checkbox" [(ngModel)]="config.hideDarkModeToggle" (change)="updateConfig()"> Hide Dark Mode Toggle</label>
          <label><input type="checkbox" [(ngModel)]="config.minimal" (change)="updateConfig()"> Minimal Mode</label>
          <label><input type="checkbox" [(ngModel)]="config.disableOverview" (change)="updateConfig()"> Disable Overview</label>
          <label><input type="checkbox" [(ngModel)]="config.disableFilePath" (change)="updateConfig()"> Disable File Path</label>
          <label><input type="checkbox" [(ngModel)]="config.disableSourceCode" (change)="updateConfig()"> Disable Source Code</label>
          <label><input type="checkbox" [(ngModel)]="config.disableGraph" (change)="updateConfig()"> Disable Graph</label>
          <label><input type="checkbox" [(ngModel)]="config.disableMainGraph" (change)="updateConfig()"> Disable Main Graph</label>
          <label><input type="checkbox" [(ngModel)]="config.disableRoutesGraph" (change)="updateConfig()"> Disable Routes Graph</label>
          <label><input type="checkbox" [(ngModel)]="config.disableCoverage" (change)="updateConfig()"> Disable Coverage</label>
          <label><input type="checkbox" [(ngModel)]="config.disableSearch" (change)="updateConfig()"> Disable Search</label>
          <label><input type="checkbox" [(ngModel)]="config.disableDependencies" (change)="updateConfig()"> Disable Dependencies</label>
          <label><input type="checkbox" [(ngModel)]="config.disablePrivate" (change)="updateConfig()"> Disable Private</label>
          <label><input type="checkbox" [(ngModel)]="config.disableProtected" (change)="updateConfig()"> Disable Protected</label>
          <label><input type="checkbox" [(ngModel)]="config.disableInternal" (change)="updateConfig()"> Disable Internal</label>
          <label><input type="checkbox" [(ngModel)]="config.disableLifeCycleHooks" (change)="updateConfig()"> Disable Lifecycle Hooks</label>
          <label><input type="checkbox" [(ngModel)]="config.disableConstructors" (change)="updateConfig()"> Disable Constructors</label>
          <label><input type="checkbox" [(ngModel)]="config.disableProperties" (change)="updateConfig()"> Disable Properties</label>
          <label><input type="checkbox" [(ngModel)]="config.disableDomTree" (change)="updateConfig()"> Disable DOM Tree</label>
          <label><input type="checkbox" [(ngModel)]="config.disableTemplateTab" (change)="updateConfig()"> Disable Template Tab</label>
          <label><input type="checkbox" [(ngModel)]="config.disableStyleTab" (change)="updateConfig()"> Disable Style Tab</label>
        </div>
      </div>

      <div class="template-playground-body">
        <div class="template-playground-sidebar">
          <div class="template-file-list">
            <h3>Templates</h3>
            <ul class="file-list">
              <li *ngFor="let template of templates; trackBy: trackByName"
                  [class.active]="selectedFile === template"
                  (click)="selectFile(template)">
                <i class="file-icon ion-document-text"></i>
                {{template.name}}
                <span class="file-type">{{template.type}}</span>
              </li>
            </ul>

            <div *ngIf="templates.length === 0" class="loading-templates">
              Loading templates...
            </div>
          </div>
        </div>

        <div class="template-playground-main">
          <div class="template-playground-editor">
            <div class="editor-header" *ngIf="selectedFile">
              <h4>{{selectedFile.path}}</h4>
              <span class="file-type-badge">{{selectedFile.type}}</span>
            </div>
            <div #editorContainer class="editor-container"></div>
          </div>

          <div class="template-playground-preview">
            <div class="preview-header">
              <h4>Live Preview</h4>
              <button class="btn btn-sm btn-secondary" (click)="refreshPreview()">🔄 Refresh</button>
            </div>
            <iframe #previewFrame class="preview-frame" [src]="previewUrl"></iframe>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .template-playground {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .template-playground-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .template-playground-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .session-info {
      color: #6c757d;
      font-family: monospace;
    }

    .saving-indicator {
      color: #ffc107;
      font-weight: bold;
    }

    .last-saved {
      color: #28a745;
    }

    .template-playground-actions {
      display: flex;
      gap: 0.5rem;
    }

    .config-panel {
      background: #e9ecef;
      padding: 1rem 2rem;
      border-bottom: 1px solid #dee2e6;
      transition: all 0.3s ease;
      max-height: 200px;
      overflow: hidden;
    }

    .config-panel.collapsed {
      max-height: 0;
      padding: 0 2rem;
    }

    .config-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .config-options label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .template-playground-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .template-playground-sidebar {
      width: 250px;
      background: #f8f9fa;
      border-right: 1px solid #dee2e6;
      overflow-y: auto;
    }

    .template-file-list {
      padding: 1rem;
    }

    .template-file-list h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .file-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
    }

    .file-list li {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.875rem;
      transition: background-color 0.15s ease;
    }

    .file-list li:hover {
      background: #e9ecef;
    }

    .file-list li.active {
      background: #007bff;
      color: white;
    }

    .file-icon {
      margin-right: 0.5rem;
      opacity: 0.7;
    }

    .file-type {
      margin-left: auto;
      font-size: 0.75rem;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .loading-templates {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 2rem;
    }

    .template-playground-main {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .template-playground-editor {
      width: 50%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #dee2e6;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .editor-header h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .file-type-badge {
      background: #6c757d;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .editor-container {
      flex: 1;
      position: relative;
    }

    .template-playground-preview {
      width: 50%;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .preview-header h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .preview-frame {
      flex: 1;
      border: none;
      background: white;
    }

    .btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid transparent;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #007bff;
      border-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
      border-color: #004085;
    }

    .btn-secondary {
      background: #6c757d;
      border-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
      border-color: #4e555b;
    }

    .btn-success {
      background: #28a745;
      border-color: #28a745;
      color: white;
    }

    .btn-success:hover {
      background: #1e7e34;
      border-color: #1c7430;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  `]
})
export class TemplatePlaygroundComponent implements OnInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @ViewChild('previewFrame', { static: true }) previewFrame!: ElementRef;

  sessionId: string = '';
  templates: Template[] = [];
  selectedFile: Template | null = null;
  config: CompoDocConfig = {};
  showConfigPanel: boolean = false;
  saving: boolean = false;
  lastSaved: Date | null = null;

  private saveTimeout?: number;
  private readonly SAVE_DELAY = 300; // 300ms debounce

  get previewUrl(): string {
    return this.sessionId ? `/api/session/${this.sessionId}/docs/` : '';
  }

  constructor(
    private http: HttpClient,
    private editorService: TemplateEditorService,
    private zipService: ZipExportService,
    private hbsService: HbsRenderService
  ) {}

  async ngOnInit() {
    try {
      await this.createSession();
      await this.loadSessionTemplates();
      await this.loadSessionConfig();
      this.initializeEditor();
    } catch (error) {
      console.error('Error initializing template playground:', error);
    }
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private async createSession(): Promise<void> {
    const response = await this.http.post<Session>('/api/session/create', {}).toPromise();
    if (response && response.success) {
      this.sessionId = response.sessionId;
      console.log('Session created:', this.sessionId);
    } else {
      throw new Error('Failed to create session');
    }
  }

  private async loadSessionTemplates(): Promise<void> {
    if (!this.sessionId) return;

    const response = await this.http.get<{templates: Template[], success: boolean}>(`/api/session/${this.sessionId}/templates`).toPromise();
    if (response && response.success) {
      this.templates = response.templates;

      // Auto-select the first template
      if (this.templates.length > 0 && !this.selectedFile) {
        this.selectFile(this.templates[0]);
      }
    }
  }

  private async loadSessionConfig(): Promise<void> {
    if (!this.sessionId) return;

    const response = await this.http.get<{config: CompoDocConfig, success: boolean}>(`/api/session/${this.sessionId}/config`).toPromise();
    if (response && response.success) {
      this.config = response.config;
    }
  }

  initializeEditor() {
    this.editorService.initializeEditor(this.editorContainer.nativeElement);

    // Set up debounced save on content change
    this.editorService.setOnChangeCallback((content: string) => {
      this.scheduleAutoSave(content);
    });
  }

  async selectFile(template: Template) {
    this.selectedFile = template;

    if (!this.sessionId) return;

    try {
      const response = await this.http.get<{content: string, success: boolean}>(`/api/session/${this.sessionId}/template/${template.path}`).toPromise();
      if (response && response.success) {
        this.editorService.setEditorContent(response.content, template.type === 'template' ? 'handlebars' : 'handlebars');
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }

  private scheduleAutoSave(content: string): void {
    if (!this.selectedFile || !this.sessionId) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set saving indicator
    this.saving = true;

    // Schedule new save
    this.saveTimeout = window.setTimeout(async () => {
      try {
        await this.saveTemplate(content);
        this.saving = false;
        this.lastSaved = new Date();
      } catch (error) {
        console.error('Error saving template:', error);
        this.saving = false;
      }
    }, this.SAVE_DELAY);
  }

  private async saveTemplate(content: string): Promise<void> {
    if (!this.selectedFile || !this.sessionId) return;

    const response = await this.http.post<{success: boolean}>(`/api/session/${this.sessionId}/template/${this.selectedFile.path}`, {
      content
    }).toPromise();

    if (!response || !response.success) {
      throw new Error('Failed to save template');
    }
  }

  async updateConfig(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const response = await this.http.post<{success: boolean}>(`/api/session/${this.sessionId}/config`, {
        config: this.config
      }).toPromise();

      if (response && response.success) {
        // Config updated, documentation will be regenerated automatically
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  }

  toggleConfigPanel(): void {
    this.showConfigPanel = !this.showConfigPanel;
  }

  refreshPreview(): void {
    if (this.previewFrame?.nativeElement) {
      this.previewFrame.nativeElement.src = this.previewFrame.nativeElement.src;
    }
  }

  resetToDefault(): void {
    // Implementation for resetting to default templates
    if (confirm('Are you sure you want to reset all templates to their default values? This action cannot be undone.')) {
      // TODO: Implement reset functionality
      console.log('Reset to default templates');
    }
  }

  async exportZip(): Promise<void> {
    try {
      if (!this.sessionId) {
        console.error('No active session. Please refresh the page and try again.');
        return;
      }

      console.log('Creating template package...');

      // Call server-side ZIP creation endpoint for all templates
      const response = await this.http.post(`/api/session/${this.sessionId}/download-all-templates`, {}, {
        responseType: 'blob',
        observe: 'response'
      }).toPromise();

      if (!response || !response.body) {
        throw new Error('Failed to create template package');
      }

      // Get the ZIP file as a blob
      const zipBlob = response.body;

      // Get filename from response headers or construct it
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `compodoc-templates-${this.sessionId}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Template package downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template package:', error);
    }
  }

  trackByName(index: number, item: Template): string {
    return item.name;
  }
}
