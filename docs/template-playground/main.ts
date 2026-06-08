import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { TemplatePlaygroundModule } from './template-playground.module';

// Bootstrap the Angular application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic()
    .bootstrapModule(TemplatePlaygroundModule)
    .catch(err => console.error('Error starting template playground:', err));
});
