/**
 * Compodoc Template Playground Application
 * Main JavaScript file that handles all playground functionality
 */

class TemplatePlayground {
    constructor() {
        this.editor = null;
        this.currentTemplate = null;
        this.currentData = {};
        this.originalData = {};
        this.customVariables = {};
        this.debounceTimer = null;
        this.sessionId = null;

        // Track last visited doc URL in the iframe
        this.lastVisitedDocUrl = null;
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'compodoc-iframe-navigate') {
                this.lastVisitedDocUrl = event.data.url;
                // Optionally persist in sessionStorage
                sessionStorage.setItem('compodocLastVisitedDocUrl', this.lastVisitedDocUrl);
            }
        });
        // Restore from sessionStorage if available
        const storedUrl = sessionStorage.getItem('compodocLastVisitedDocUrl');
        if (storedUrl) {
            this.lastVisitedDocUrl = storedUrl;
        }

        this.init();
    }

    async init() {
        try {
            // Check JSZip availability on startup
            setTimeout(() => {
                if (typeof JSZip !== 'undefined') {
                    console.log('✅ JSZip loaded successfully');
                } else if (window.JSZipLoadError) {
                    console.error('❌ JSZip failed to load from all CDNs');
                } else {
                    console.warn('⚠️ JSZip still loading...');
                }
            }, 2000);

            // First create a session
            await this.createSession();
            await this.initializeMonacoEditor();
            this.setupEventListeners();
            this.setupResizer();
            await this.loadTemplateList();
            console.log('🎨 Template Playground initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Template Playground:', error);
            this.showError('Failed to initialize editor. Please refresh the page.');
        }
    }

    async createSession() {
        try {
            const response = await fetch('/api/session/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const result = await response.json();
            this.sessionId = result.sessionId;
            console.log('Session created:', this.sessionId);
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    async loadTemplateList() {
        try {
            const response = await fetch(`/api/session/${this.sessionId}/templates`);
            if (!response.ok) {
                throw new Error('Failed to load templates');
            }

            const result = await response.json();
            const templates = result.templates;

            // Update the template dropdown
            const dropdown = document.getElementById('templateSelect');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select a template...</option>';

                // Group templates by type
                const mainTemplates = templates.filter(t => t.type === 'template');
                const partials = templates.filter(t => t.type === 'partial');

                if (mainTemplates.length > 0) {
                    const mainGroup = document.createElement('optgroup');
                    mainGroup.label = 'Main Templates';
                    mainTemplates.forEach(template => {
                        const option = document.createElement('option');
                        option.value = template.path;
                        option.textContent = template.name;
                        mainGroup.appendChild(option);
                    });
                    dropdown.appendChild(mainGroup);
                }

                if (partials.length > 0) {
                    const partialsGroup = document.createElement('optgroup');
                    partialsGroup.label = 'Partials';
                    partials.forEach(template => {
                        const option = document.createElement('option');
                        option.value = template.path;
                        option.textContent = template.name;
                        partialsGroup.appendChild(option);
                    });
                    dropdown.appendChild(partialsGroup);
                }
            }
        } catch (error) {
            console.error('Error loading template list:', error);
            this.showError('Failed to load template list');
        }
    }

    async initializeMonacoEditor() {
        return new Promise((resolve, reject) => {
            require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});

            require(['vs/editor/editor.main'], () => {
                try {
                    // Register Handlebars language
                    monaco.languages.register({ id: 'handlebars' });

                    // Define Handlebars syntax highlighting
                    monaco.languages.setMonarchTokensProvider('handlebars', {
                        tokenizer: {
                            root: [
                                [/\{\{\{.*?\}\}\}/, 'string.html'],
                                [/\{\{.*?\}\}/, 'keyword'],
                                [/<[^>]+>/, 'tag'],
                                [/<!--.*?-->/, 'comment'],
                                [/"[^"]*"/, 'string'],
                                [/'[^']*'/, 'string'],
                                [/[{}[\]()]/, 'delimiter.bracket'],
                                [/[a-zA-Z_$][\w$]*/, 'identifier'],
                            ]
                        }
                    });

                    // Create the editor
                    this.editor = monaco.editor.create(document.getElementById('templateEditor'), {
                        value: '<!-- Select a template to start editing -->',
                        language: 'handlebars',
                        theme: 'vs',
                        automaticLayout: true,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection'
                    });

                    // Setup editor change listener with debouncing
                    this.editor.onDidChangeModelContent(() => {
                        this.debouncePreviewUpdate();
                    });

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    setupEventListeners() {
        // Template selection
        document.getElementById('templateSelect').addEventListener('change', (e) => {
            this.loadTemplate(e.target.value);
        });

        // Variable management
        document.getElementById('resetVariables').addEventListener('click', () => {
            this.resetVariables();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Template actions
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.updatePreview();
        });

        document.getElementById('copyTemplate').addEventListener('click', () => {
            this.copyTemplate();
        });

        document.getElementById('downloadTemplate').addEventListener('click', () => {
            this.downloadTemplate();
        });

        // Enter key for adding variables
        // ['newVariableName', 'newVariableType', 'newVariableValue'].forEach(id => {
        //     document.getElementById(id).addEventListener('keypress', (e) => {
        //         if (e.key === 'Enter' && !e.shiftKey) {
        //             e.preventDefault();
        //             this.addCustomVariable();
        //         }
        //     });
        // });
    }

    setupResizer() {
        const resizer = document.getElementById('resizer');
        const variablesPanel = document.querySelector('.variables-panel');
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        function handleMouseMove(e) {
            if (!isResizing) return;

            const containerRect = document.querySelector('.playground-content').getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            if (newWidth >= 250 && newWidth <= containerRect.width - 400) {
                variablesPanel.style.width = newWidth + 'px';
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    async loadTemplate(templatePath) {
        if (!templatePath) {
            this.clearTemplate();
            return;
        }

        try {
            this.showLoading('Loading template and configuration...');

            // Load configuration data instead of template-specific data
            const configResponse = await fetch(`/api/session/${this.sessionId}/config`);
            if (!configResponse.ok) {
                throw new Error('Failed to load configuration data');
            }

            const { config } = await configResponse.json();

            // Format config data to match expected structure
            this.currentData = {
                categories: {
                    compodocConfig: {
                        title: 'Compodoc Configuration Options',
                        description: 'Edit these configuration options to customize the generated documentation. Changes will automatically regenerate the documentation.',
                        data: config
                    }
                }
            };
            this.originalData = JSON.parse(JSON.stringify(this.currentData));

            // Load template content - try specific template first, then fallback
            let templateContent = '';
            try {
                const encodedTemplatePathForContent = encodeURIComponent(templatePath);
                const templateResponse = await fetch(`/api/session/${this.sessionId}/template/${encodedTemplatePathForContent}`);
                if (templateResponse.ok) {
                    const template = await templateResponse.json();
                    templateContent = template.content;
                } else {
                    // Use a generic template based on type
                    templateContent = this.getGenericTemplate(templatePath);
                }
            } catch (error) {
                console.warn('Could not load specific template, using generic:', error);
                templateContent = this.getGenericTemplate(templatePath);
            }

            this.currentTemplate = {
                path: templatePath,
                content: templateContent
            };

            // Defensive: Only update metadata if config data is present
            if (this.currentData && this.currentData.categories && this.currentData.categories.compodocConfig && this.currentData.categories.compodocConfig.data) {
                this.updateTemplateMetadata(templatePath, this.currentData.categories.compodocConfig.data);
            } else {
                this.updateTemplateMetadata(templatePath, {});
            }
            this.editor.setValue(templateContent);
            this.renderVariables();
            this.updatePreview();

            this.hideLoading();

        } catch (error) {
            console.error('Error loading template:', error);
            this.showError(`Failed to load template: ${error.message}`);
        }
    }

    getGenericTemplate(templatePath) {
        const templates = {
            component: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "components" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="component-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if selector}}
  <p><strong>Selector:</strong> <code>{{selector}}</code></p>
  {{/if}}

  {{#if inputs}}
  <h4>Inputs</h4>
  <ul>
    {{#each inputs}}
    <li><strong>{{name}}</strong> ({{type}}): {{description}}</li>
    {{/each}}
  </ul>
  {{/if}}

  {{#if outputs}}
  <h4>Outputs</h4>
  <ul>
    {{#each outputs}}
    <li><strong>{{name}}</strong> ({{type}}): {{description}}</li>
    {{/each}}
  </ul>
  {{/if}}
</div>`,
            module: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "modules" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="module-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if declarations}}
  <h4>Declarations</h4>
  <ul>
    {{#each declarations}}
    <li>{{name}} ({{type}})</li>
    {{/each}}
  </ul>
  {{/if}}

  {{#if imports}}
  <h4>Imports</h4>
  <ul>
    {{#each imports}}
    <li>{{name}}</li>
    {{/each}}
  </ul>
  {{/if}}
</div>`,
            interface: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "interfaces" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="interface-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if properties}}
  <h4>Properties</h4>
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Optional</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {{#each properties}}
      <tr>
        <td><code>{{name}}</code></td>
        <td><code>{{type}}</code></td>
        <td>{{#if optional}}Yes{{else}}No{{/if}}</td>
        <td>{{description}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/if}}
</div>`,
            class: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "classes" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="class-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if methods}}
  <h4>Methods</h4>
  {{#each methods}}
  <div class="method">
    <h5>{{name}}</h5>
    <p>{{description}}</p>
    <p><strong>Returns:</strong> <code>{{type}}</code></p>
  </div>
  {{/each}}
  {{/if}}
</div>`
        };

        return templates[templatePath] || `<h3>{{name}}</h3>
<p>{{description}}</p>
<p><strong>Type:</strong> ${templatePath}</p>`;
    }

    updateTemplateMetadata(templatePath, data) {
        const metadata = document.getElementById('templateMetadata');
        document.getElementById('templateName').textContent = data.name || templatePath;
        document.getElementById('templateFile').textContent = data.file || `${templatePath}.hbs`;
        document.getElementById('templateDescription').textContent = data.description || `Template for ${templatePath}`;
        metadata.style.display = 'block';
    }

    renderVariables() {
        const container = document.getElementById('variablesList');
        container.innerHTML = '';

        // Check if we have the new categorized data format
        if (this.currentData && this.currentData.categories) {
            this.renderCategorizedVariables(container);
        } else {
            // Fallback to legacy format
            this.renderLegacyVariables(container);
        }

        // Remove custom variables section
        // this.renderCustomVariables(container);
    }

        renderCategorizedVariables(container) {
        const categories = this.currentData.categories;

        // Only render Compodoc Configuration section
        if (categories.compodocConfig) {
            // Add a special header for config section
            const configHeader = document.createElement('div');
            configHeader.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    padding: 8px 16px;
                    margin-bottom: 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    <i class="fas fa-cog"></i> Editable Configuration
                </div>
            `;
            container.appendChild(configHeader);

            this.createCategorySection(
                container,
                'compodoc-config',
                categories.compodocConfig.title,
                categories.compodocConfig.description,
                categories.compodocConfig.data,
                '#2196F3', // Blue for config
                'config' // Mark as config category - these will be editable
            );
        }

        // Template variables section removed - only show config options
    }

    createCategorySection(container, categoryId, title, description, data, accentColor, categoryType = 'template') {
        const section = document.createElement('div');
        section.className = 'variable-category';
        section.style.marginBottom = '20px';

        section.innerHTML = `
            <div class="category-header" style="
                background: linear-gradient(135deg, ${accentColor}15, ${accentColor}05);
                border-left: 4px solid ${accentColor};
                padding: 12px 16px;
                margin-bottom: 10px;
                border-radius: 0 6px 6px 0;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h3 style="
                            margin: 0;
                            color: ${accentColor};
                            font-size: 14px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">${title}</h3>
                        <p style="
                            margin: 4px 0 0 0;
                            color: #666;
                            font-size: 12px;
                            line-height: 1.4;
                        ">${description}</p>
                    </div>
                    <button class="category-toggle" style="
                        background: ${accentColor};
                        color: white;
                        border: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 12px;
                        transition: transform 0.3s ease;
                    ">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="category-content" style="
                padding: 0 16px;
                max-height: 400px;
                overflow-y: auto;
                border-left: 4px solid ${accentColor}20;
                margin-left: 12px;
            ">
                <div class="category-variables"></div>
            </div>
        `;

        // Add toggle functionality
        const header = section.querySelector('.category-header');
        const content = section.querySelector('.category-content');
        const toggle = section.querySelector('.category-toggle');

        header.addEventListener('click', () => {
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            toggle.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-180deg)';
        });

        container.appendChild(section);

        // Populate variables in this category
        const variableContainer = section.querySelector('.category-variables');
        this.createVariableElements(data, '', variableContainer, 0, accentColor, categoryType);
    }

    renderLegacyVariables(container) {
        // Legacy rendering for backward compatibility
        const section = document.createElement('div');
        section.innerHTML = `
            <div class="category-header" style="padding: 12px 16px; background: #f8f9fa; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #333; font-size: 14px;">Template Data</h3>
                <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Available template variables and context</p>
            </div>
            <div class="category-variables"></div>
        `;

        container.appendChild(section);
        const variableContainer = section.querySelector('.category-variables');
        this.createVariableElements(this.currentData, '', variableContainer);
    }

    renderCustomVariables(container) {
        if (Object.keys(this.customVariables).length === 0) return;

        const section = document.createElement('div');
        section.className = 'variable-category custom-variables';
        section.style.marginTop = '20px';

        section.innerHTML = `
            <div class="category-header" style="
                background: linear-gradient(135deg, #FF9800 15%, #FF9800 05%);
                border-left: 4px solid #FF9800;
                padding: 12px 16px;
                margin-bottom: 10px;
                border-radius: 0 6px 6px 0;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h3 style="
                            margin: 0;
                            color: #FF9800;
                            font-size: 14px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">Custom Variables</h3>
                        <p style="
                            margin: 4px 0 0 0;
                            color: #666;
                            font-size: 12px;
                            line-height: 1.4;
                        ">User-defined variables for template customization</p>
                    </div>
                    <button class="btn-icon" id="addCustomVariableBtn" style="
                        background: #FF9800;
                        color: white;
                        border: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 12px;
                    " onclick="templatePlayground.addCustomVariable()" title="Add Custom Variable">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="custom-variables-content" style="
                padding: 0 16px;
                border-left: 4px solid #FF980020;
                margin-left: 12px;
            "></div>
        `;

        container.appendChild(section);

        // Add custom variables
        const customContainer = section.querySelector('.custom-variables-content');
        Object.entries(this.customVariables).forEach(([key, value]) => {
            this.createVariableElement(key, typeof value, value, customContainer, true, null, '#FF9800');
        });
    }

        createVariableElements(obj, prefix, container, depth = 0, accentColor = '#007bff', categoryType = 'template') {
        if (depth > 3) return; // Prevent too deep nesting

        const sortedEntries = Object.entries(obj).sort(([a], [b]) => {
            // Sort by importance: put functions and complex objects at the end
            const aIsSimple = typeof obj[a] !== 'object' && typeof obj[a] !== 'function';
            const bIsSimple = typeof obj[b] !== 'object' && typeof obj[b] !== 'function';
            if (aIsSimple && !bIsSimple) return -1;
            if (!aIsSimple && bIsSimple) return 1;
            return a.localeCompare(b);
        });

        sortedEntries.forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Create expandable object
                if (depth < 3) {
                    const objectElement = document.createElement('div');
                    objectElement.className = 'variable-item expandable-object';
                    objectElement.style.marginBottom = '8px';

                    const isExpanded = depth === 0; // Expand top-level objects by default

                    objectElement.innerHTML = `
                        <div class="variable-header" style="
                            display: flex;
                            align-items: center;
                            padding: 8px 12px;
                            background: ${depth === 0 ? '#f8f9fa' : '#ffffff'};
                            border: 1px solid #e9ecef;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            <button class="expand-toggle" style="
                                background: none;
                                border: none;
                                color: ${accentColor};
                                font-size: 12px;
                                margin-right: 8px;
                                cursor: pointer;
                                transform: ${isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
                                transition: transform 0.2s ease;
                            ">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <div class="variable-name" style="
                                font-weight: ${depth === 0 ? '600' : '500'};
                                color: ${depth === 0 ? '#333' : '#555'};
                                flex: 1;
                                font-size: ${depth === 0 ? '13px' : '12px'};
                            ">${key}</div>
                            <div class="variable-type" style="
                                font-size: 10px;
                                color: #888;
                                background: #f1f3f4;
                                padding: 2px 6px;
                                border-radius: 10px;
                                text-transform: uppercase;
                                letter-spacing: 0.3px;
                            ">object</div>
                        </div>
                        <div class="nested-variables" style="
                            margin-top: 4px;
                            padding-left: ${(depth + 1) * 16}px;
                            border-left: 2px solid ${accentColor}20;
                            margin-left: 20px;
                            display: ${isExpanded ? 'block' : 'none'};
                        "></div>
                    `;

                    // Add click handler for expansion
                    const header = objectElement.querySelector('.variable-header');
                    const toggle = objectElement.querySelector('.expand-toggle');
                    const nested = objectElement.querySelector('.nested-variables');

                    header.addEventListener('click', () => {
                        const isCurrentlyExpanded = nested.style.display !== 'none';
                        nested.style.display = isCurrentlyExpanded ? 'none' : 'block';
                        toggle.style.transform = isCurrentlyExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
                    });

                    container.appendChild(objectElement);

                    const nestedContainer = objectElement.querySelector('.nested-variables');
                    this.createVariableElements(value, fullKey, nestedContainer, depth + 1, accentColor, categoryType);
                }
            } else {
                this.createVariableElement(key, typeof value, value, container, false, fullKey, accentColor, categoryType);
            }
        });
    }

        createVariableElement(name, type, value, container, isCustom = false, fullPath = null, accentColor = '#007bff', categoryType = 'template') {
        const variableElement = document.createElement('div');
        variableElement.className = 'variable-item simple-variable';
        variableElement.style.marginBottom = '6px';

        let displayValue = value;
        let rows = 1;

        if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value, null, 2);
            rows = Math.min(displayValue.split('\n').length, 6);
        } else if (typeof value === 'string') {
            displayValue = value;
            rows = Math.min(displayValue.split('\n').length, 4);
        } else if (typeof value === 'function') {
            displayValue = value.toString().substring(0, 100) + '...';
            type = 'function';
            rows = 2;
        } else {
            displayValue = String(value);
        }

                // Determine if variable should be editable
        // Config variables are editable, template variables are read-only, custom variables are always editable
        const isEditable = isCustom || categoryType === 'config';

        // Determine type color
        const getTypeColor = (type) => {
            switch (type) {
                case 'string': return '#4CAF50';
                case 'number': return '#2196F3';
                case 'boolean': return '#FF9800';
                case 'function': return '#9C27B0';
                case 'object': return '#607D8B';
                default: return '#666';
            }
        };

        // Render dropdown for string config variables with known options
        let inputElement = '';
        const selectOptions = {
            theme: [
                'gitbook', 'laravel', 'material', 'readthedocs', 'postmark', 'vagrant', 'minimal', 'default', 'plain', 'stripe', 'aglio', 'book', 'github', 'vuepress', 'docusaurus', 'mkdocs', 'slate', 'swagger', 'modern', 'clean', 'classic', 'simple', 'bootstrap', 'angular', 'react', 'vue', 'bulma', 'tailwind', 'windicss', 'dracula', 'solarized', 'nord', 'night', 'light', 'dark', 'custom'
            ],
            language: [
                'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pl-PL', 'pt-BR', 'ru-RU', 'sk-SK', 'zh-CN', 'zh-TW', 'bg-BG', 'hu-HU', 'ka-GE'
            ],
            exportFormat: [
                'html', 'json', 'pdf'
            ]
        };
        if (isEditable && type === 'string' && selectOptions[name]) {
            inputElement = `<select class="variable-value" onchange="templatePlayground.updateVariable('${fullPath || name}', this.value, ${isCustom}, '${categoryType}')">
                ${selectOptions[name].map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>`;
        } else if (isEditable && type === 'boolean') {
            inputElement = `<input type="checkbox" class="variable-value" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;" ${value ? 'checked' : ''} onchange="templatePlayground.updateVariable('${fullPath || name}', this.checked, ${isCustom}, '${categoryType}')">`;
        } else {
            inputElement = `<textarea class="variable-value" style="
                width: 100%;
                min-height: ${rows * 16}px;
                border: 1px solid #ddd;
                border-radius: 3px;
                padding: 6px 8px;
                font-size: 11px;
                font-family: 'Consolas', 'Monaco', monospace;
                resize: vertical;
                background: #f8f9fa;
                ${isEditable ? '' : 'background: #f1f3f4; cursor: not-allowed;'}
            }"
            ${isEditable ? `onchange=\"templatePlayground.updateVariable('${fullPath || name}', this.value, ${isCustom}, '${categoryType}')\"` : 'readonly'}
            rows="${rows}">${displayValue}</textarea>`;
        }

        variableElement.innerHTML = `
            <div style="
                display: flex;
                align-items: flex-start;
                padding: 8px 12px;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                transition: all 0.2s ease;
            " onmouseover="this.style.borderColor='${accentColor}'" onmouseout="this.style.borderColor='#e9ecef'">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <div class="variable-name" style="
                            font-weight: 500;
                            color: #333;
                            font-size: 12px;
                            margin-right: 8px;
                            font-family: 'Consolas', 'Monaco', monospace;
                        ">${name}</div>
                        <div class="variable-type" style="
                            font-size: 9px;
                            color: ${getTypeColor(type)};
                            background: ${getTypeColor(type)}15;
                            padding: 2px 6px;
                            border-radius: 8px;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                            font-weight: 600;
                        ">${type}</div>
                        ${isCustom ? `
                            <button class="btn-icon" style="
                                background: #ffebee;
                                color: #d32f2f;
                                border: none;
                                width: 18px;
                                height: 18px;
                                border-radius: 50%;
                                margin-left: auto;
                                cursor: pointer;
                                font-size: 10px;
                            " onclick="templatePlayground.removeVariable('${name}')" title="Remove variable">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                    ${inputElement}
                </div>
            </div>
        `;

        container.appendChild(variableElement);
    }

    updateVariable(path, value, isCustom = false, categoryType = 'template') {
        try {
            let parsedValue;

            // Try to parse as JSON first
            try {
                parsedValue = JSON.parse(value);
            } catch {
                // If not valid JSON, treat as string
                parsedValue = value;
            }

            if (isCustom) {
                this.customVariables[path] = parsedValue;
                this.debouncePreviewUpdate();
            } else if (categoryType === 'config') {
                // Handle config variable updates
                this.updateSessionConfig(path, parsedValue);
            } else {
                // Update nested property for template variables
                this.setNestedProperty(this.currentData, path, parsedValue);
                this.debouncePreviewUpdate();
            }

        } catch (error) {
            console.error('Error updating variable:', error);
        }
    }

    async updateSessionConfig(configPath, newValue) {
        try {
            // Update the local config data immediately for responsiveness
            this.setNestedProperty(this.currentData.categories.compodocConfig.data, configPath, newValue);

            // Prepare config update for server
            const configUpdate = {};
            this.setNestedProperty(configUpdate, configPath, newValue);

            this.showMessage('💾 Saving configuration...', 'info');

            // Send config update to server
            const response = await fetch(`/api/session/${this.sessionId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: configUpdate
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showSuccess('✅ Configuration saved! Documentation regenerating...');
                // Automatically update the preview after config is saved
                this.updatePreview();
            } else {
                throw new Error(result.message || 'Failed to save configuration');
            }

        } catch (error) {
            console.error('Error updating session config:', error);
            this.showError(`❌ Failed to save configuration: ${error.message}`);

            // Revert the local change if save failed
            this.renderVariables();
        }
    }

    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => current && current[key], obj);

        if (target && lastKey) {
            target[lastKey] = value;
        }
    }

    addCustomVariable() {
        const nameInput = document.getElementById('newVariableName');
        const typeInput = document.getElementById('newVariableType');
        const valueInput = document.getElementById('newVariableValue');

        const name = nameInput.value.trim();
        const type = typeInput.value.trim() || 'string';
        const valueStr = valueInput.value.trim();

        if (!name) {
            this.showError('Variable name is required');
            return;
        }

        let value;
        try {
            if (valueStr) {
                value = JSON.parse(valueStr);
            } else {
                value = type === 'boolean' ? false : type === 'number' ? 0 : '';
            }
        } catch {
            value = valueStr;
        }

        this.customVariables[name] = value;

        // Clear inputs
        nameInput.value = '';
        typeInput.value = '';
        valueInput.value = '';

        this.renderVariables();
        this.debouncePreviewUpdate();
        this.showSuccess('Variable added successfully');
    }

    removeVariable(name) {
        delete this.customVariables[name];
        this.renderVariables();
        this.debouncePreviewUpdate();
    }

    resetVariables() {
        this.currentData = JSON.parse(JSON.stringify(this.originalData));
        this.customVariables = {};
        this.renderVariables();
        this.updatePreview();
        this.showSuccess('Variables reset to default values');
    }

    debouncePreviewUpdate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 300);
    }

    async updatePreview() {
        if (!this.currentTemplate) return;

        try {
            this.setPreviewStatus('🚀 Generating documentation with CompoDoc CLI...', true);

            const templateContent = this.editor.getValue();

            // Use CompoDoc CLI generation API
            const response = await fetch(`/api/session/${this.sessionId}/generate-docs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customTemplateContent: templateContent,
                    templatePath: this.currentTemplate ? this.currentTemplate.path : null,
                    mockData: { ...this.currentData, ...this.customVariables }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || `Server responded with ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Documentation generated successfully, now load it in iframe
                this.setPreviewStatus('📄 Loading generated documentation...', true);

                // Point iframe to the last visited documentation page if available
                const iframe = document.getElementById('templatePreviewFrame');
                if (iframe) {
                    let url = `/docs/${this.sessionId}/index.html?t=` + Date.now();
                    if (this.lastVisitedDocUrl) {
                        // Remove /docs/<sessionId>/ prefix if present
                        let docPath = this.lastVisitedDocUrl.replace(new RegExp(`^/docs/${this.sessionId}/?`), '');
                        url = `/docs/${this.sessionId}/${docPath}`;
                        url += (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    }
                    iframe.src = url;

                    iframe.onload = () => {
                        this.setPreviewStatus('✅ Documentation loaded successfully', false);
                        setTimeout(() => {
                            this.setPreviewStatus('', false);
                        }, 2000);
                    };

                    iframe.onerror = () => {
                        this.setPreviewStatus('❌ Failed to load generated documentation', false);
                    };
                } else {
                    this.setPreviewStatus('❌ Preview iframe not found', false);
                }
            } else {
                throw new Error('Documentation generation failed');
            }

        } catch (error) {
            console.error('Error generating documentation:', error);
            this.setPreviewStatus(`❌ Error: ${error.message}`, false);

            // Show error in iframe
            const iframe = document.getElementById('templatePreviewFrame');
            if (iframe) {
                const errorHtml = `
                    <html>
                        <head>
                            <title>Documentation Generation Error</title>
                            <style>
                                body {
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    padding: 40px;
                                    background: #f8f9fa;
                                    color: #333;
                                    line-height: 1.6;
                                }
                                .error-container {
                                    background: white;
                                    padding: 30px;
                                    border-radius: 8px;
                                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                    max-width: 600px;
                                    margin: 0 auto;
                                }
                                .error-icon {
                                    color: #dc3545;
                                    font-size: 48px;
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                                .error-title {
                                    color: #dc3545;
                                    margin-bottom: 15px;
                                    text-align: center;
                                }
                                .error-message {
                                    background: #f8d7da;
                                    border: 1px solid #f5c6cb;
                                    color: #721c24;
                                    padding: 15px;
                                    border-radius: 4px;
                                    margin-bottom: 20px;
                                    font-family: monospace;
                                }
                                .suggestions {
                                    background: #d1ecf1;
                                    border: 1px solid #bee5eb;
                                    color: #0c5460;
                                    padding: 15px;
                                    border-radius: 4px;
                                }
                                .suggestions h4 {
                                    margin-top: 0;
                                    margin-bottom: 10px;
                                }
                                .suggestions ul {
                                    margin-bottom: 0;
                                    padding-left: 20px;
                                }
                                .retry-button {
                                    background: #007bff;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    margin-top: 15px;
                                    display: block;
                                    margin-left: auto;
                                    margin-right: auto;
                                }
                                .retry-button:hover {
                                    background: #0056b3;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="error-container">
                                <div class="error-icon">⚠️</div>
                                <h2 class="error-title">Documentation Generation Failed</h2>
                                <div class="error-message">
                                <div class="suggestions">
                                    <h4>Possible solutions:</h4>
                                    <ul>
                                        <li>Check if your Handlebars template syntax is valid</li>
                                        <li>Ensure all referenced partials exist</li>
                                        <li>Verify that template variables match the expected data structure</li>
                                        <li>Try refreshing the page and loading a different template</li>
                                    </ul>
                                </div>
                                <button class="retry-button" onclick="parent.templatePlayground.updatePreview()">
                                    🔄 Retry Generation
                                </button>
                            </div>
                        </body>
                    </html>
                `;
                iframe.srcdoc = errorHtml;
            }
        }
    }

    setPreviewStatus(text, isLoading) {
        const statusElement = document.getElementById('previewStatus');
        statusElement.innerHTML = isLoading ?
            `<div class="spinner"></div> ${text}` : text;
    }

    async copyTemplate() {
        try {
            await navigator.clipboard.writeText(this.editor.getValue());
            this.showSuccess('Template copied to clipboard');
        } catch (error) {
            console.error('Error copying template:', error);
            this.showError('Failed to copy template');
        }
    }

        async downloadTemplate() {
        try {
            if (!this.sessionId) {
                this.showError('No active session. Please refresh the page and try again.');
                return;
            }

            // Show loading state
            this.showLoading('Creating complete template package...');

            // Call server-side ZIP creation endpoint for all templates
            const response = await fetch(`/api/session/${this.sessionId}/download-all-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            this.hideLoading();

            if (!response.ok) {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create template package');
                } else {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }

            // Get the ZIP file as a blob
            const zipBlob = await response.blob();

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

            this.showSuccess('Complete template package downloaded successfully');

        } catch (error) {
            console.error('Error downloading template:', error);
            this.hideLoading();

            let errorMessage = 'Failed to download complete template package';

            if (error.message) {
                errorMessage = error.message;
            }

            this.showError(errorMessage);
        }
    }

    exportData() {
        try {
            // Generate the CompoDoc CLI command based on current config
            const config = this.currentData.categories?.compodocConfig?.data || {};
            const booleanFlags = [
                'hideGenerator', 'disableSourceCode', 'disableGraph', 'disableCoverage', 'disablePrivate', 'disableProtected', 'disableInternal',
                'disableLifeCycleHooks', 'disableConstructors', 'disableRoutesGraph', 'disableSearch', 'disableDependencies', 'disableProperties',
                'disableDomTree', 'disableTemplateTab', 'disableStyleTab', 'disableMainGraph', 'disableFilePath', 'disableOverview',
                'hideDarkModeToggle', 'minimal', 'serve', 'open', 'watch', 'silent',
                'coverageTest', 'coverageTestThresholdFail', 'coverageTestShowOnlyFailed'
            ];
            const valueFlags = [
                'theme', 'language', 'base', 'customFavicon', 'customLogo', 'assetsFolder', 'extTheme', 'includes', 'includesName', 'output', 'port', 'hostname',
                'exportFormat', 'coverageTestThreshold', 'coverageMinimumPerFile', 'unitTestCoverage', 'gaID', 'gaSite', 'maxSearchResults', 'toggleMenuItems', 'navTabConfig'
            ];
            let cmd = ['npx compodoc'];
            for (const flag of booleanFlags) {
                if (config[flag] === true) {
                    cmd.push(`--${flag}`);
                }
            }
            for (const flag of valueFlags) {
                if (config[flag] !== undefined && config[flag] !== "") {
                    let value = config[flag];
                    if (Array.isArray(value) || typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    cmd.push(`--${flag} \"${value}\"`);
                }
            }
            // Always include -p and -d
            cmd.push(`-p \"tsconfig.json\"`);
            cmd.push(`-d \"${config.output || './documentation/'}\"`);
            const commandString = cmd.join(' ');

            const blob = new Blob([commandString], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compodoc-command.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('CompoDoc CLI command exported successfully');
        } catch (error) {
            console.error('Error exporting command:', error);
            this.showError('Failed to export command');
        }
    }

    clearTemplate() {
        this.currentTemplate = null;
        this.currentData = {};
        this.originalData = {};
        this.customVariables = {};

        this.editor.setValue('<!-- Select a template to start editing -->');
        document.getElementById('templateMetadata').style.display = 'none';
        document.getElementById('variablesList').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Select a template to see variables
            </div>
        `;
        // Clear iframe
        const iframe = document.getElementById('templatePreviewFrame');
        if (iframe) {
            iframe.src = 'data:text/html,<div style="padding: 20px; text-align: center; color: #666;"><div style="font-size: 18px; margin-bottom: 10px;">📝</div>Select a template to see preview</div>';
        }
    }

    showLoading(message) {
        document.getElementById('variablesList').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                ${message}
            </div>
        `;
    }

    hideLoading() {
        // Loading will be replaced by renderVariables()
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const className = type === 'error' ? 'error-message' : 'success-message';
        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.textContent = message;

        const container = document.querySelector('.variables-panel .panel-content');
        container.insertBefore(messageElement, container.firstChild);

        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.parentElement.removeChild(messageElement);
            }
        }, 3000);
    }
}

// Initialize the playground when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.templatePlayground = new TemplatePlayground();
});
