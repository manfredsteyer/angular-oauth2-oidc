import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TemplatePlaygroundComponent } from './template-playground.component';
import { TemplateEditorService } from './template-editor.service';
import { ZipExportService } from './zip-export.service';
import { HbsRenderService } from './hbs-render.service';

@NgModule({
  declarations: [
    TemplatePlaygroundComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    TemplateEditorService,
    ZipExportService,
    HbsRenderService
  ],
  bootstrap: [TemplatePlaygroundComponent]
})
export class TemplatePlaygroundModule { }
