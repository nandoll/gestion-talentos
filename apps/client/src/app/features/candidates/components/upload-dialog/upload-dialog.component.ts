import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule
  ],
  template: `
    <h2 mat-dialog-title>Importar Candidatos desde Excel</h2>

    <mat-dialog-content>
      <div class="upload-container">
        @if (!selectedFile && !uploadResult) {
          <div class="drop-zone" 
               (drop)="onDrop($event)" 
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               [class.drag-over]="isDragging">
            <mat-icon class="upload-icon">cloud_upload</mat-icon>
            <p>Arrastra tu archivo Excel aquí o</p>
            <input type="file" 
                   #fileInput 
                   (change)="onFileSelected($event)" 
                   accept=".xlsx,.xls"
                   style="display: none">
            <button mat-raised-button color="primary" (click)="fileInput.click()">
              Seleccionar archivo
            </button>
            <p class="help-text">Formatos aceptados: .xlsx, .xls</p>
          </div>
        }

        @if (selectedFile && !uploading && !uploadResult) {
          <div class="file-selected">
            <mat-icon>description</mat-icon>
            <div class="file-info">
              <p class="file-name">{{selectedFile.name}}</p>
              <p class="file-size">{{formatFileSize(selectedFile.size)}}</p>
            </div>
            <button mat-icon-button color="warn" (click)="removeFile()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }

        @if (uploading) {
          <div class="uploading">
            <p>Procesando archivo...</p>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          </div>
        }

        @if (uploadResult) {
          <div class="upload-result">
            <div class="result-summary" [class.success]="uploadResult.errorCount === 0">
              <mat-icon>{{uploadResult.errorCount === 0 ? 'check_circle' : 'warning'}}</mat-icon>
              <h3>{{uploadResult.message}}</h3>
            </div>
            
            <div class="stats">
              <div class="stat">
                <span class="label">Total procesados:</span>
                <span class="value">{{uploadResult.totalProcessed}}</span>
              </div>
              <div class="stat success">
                <span class="label">Exitosos:</span>
                <span class="value">{{uploadResult.successCount}}</span>
              </div>
              <div class="stat error">
                <span class="label">Errores:</span>
                <span class="value">{{uploadResult.errorCount}}</span>
              </div>
            </div>

            @if (uploadResult.errors && uploadResult.errors.length > 0) {
              <div class="errors-section">
                <h4>Errores encontrados:</h4>
                <mat-list>
                  @for (error of uploadResult.errors; track error) {
                    <mat-list-item>
                      <mat-icon matListItemIcon color="warn">error</mat-icon>
                      <div matListItemTitle>Fila {{error.row}}</div>
                      <div matListItemLine>{{error.message}}</div>
                    </mat-list-item>
                  }
                </mat-list>
              </div>
            }
          </div>
        }
      </div>

      <div class="format-info">
        <h4>Formato esperado del archivo Excel:</h4>
        <table class="format-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Seniority</th>
              <th>Años Exp.</th>
              <th>Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Juan</td>
              <td>Pérez</td>
              <td>senior</td>
              <td>5</td>
              <td>si</td>
            </tr>
            <tr>
              <td>María</td>
              <td>García</td>
              <td>junior</td>
              <td>2</td>
              <td>no</td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!uploading) {
        @if (!uploadResult) {
          <button mat-button (click)="onCancel()">Cancelar</button>
          <button mat-raised-button color="primary" 
                  [disabled]="!selectedFile" 
                  (click)="uploadFile()">
            Importar
          </button>
        } @else {
          <button mat-raised-button color="primary" (click)="onClose()">
            Cerrar
          </button>
        }
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .upload-container {
      min-height: 200px;
      margin-bottom: 24px;
    }

    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .drop-zone.drag-over {
      border-color: #1976d2;
      background-color: #e3f2fd;
    }

    .upload-icon {
      font-size: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f5f5f5;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      margin: 0;
    }

    .file-size {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    .uploading {
      text-align: center;
      padding: 40px 0;
    }

    .upload-result {
      padding: 16px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }

    .result-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .result-summary.success {
      color: #4caf50;
    }

    .result-summary mat-icon {
      font-size: 32px;
    }

    .stats {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat .label {
      font-size: 12px;
      color: #666;
    }

    .stat .value {
      font-size: 24px;
      font-weight: 500;
    }

    .stat.success .value {
      color: #4caf50;
    }

    .stat.error .value {
      color: #f44336;
    }

    .errors-section {
      margin-top: 16px;
      max-height: 200px;
      overflow-y: auto;
    }

    .format-info {
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .format-info h4 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #666;
    }

    .format-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .format-table th,
    .format-table td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }

    .format-table th {
      background-color: #e0e0e0;
      font-weight: 500;
    }

    .format-table td {
      background-color: white;
    }
  `]
})
export class UploadDialogComponent {
  selectedFile: File | null = null;
  uploading = false;
  uploadResult: {
    message: string;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: Array<{row: number; message: string}>;
  } | null = null;
  isDragging = false;

  private dialogRef = inject(MatDialogRef<UploadDialogComponent>);
  private apiService = inject(ApiService);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidFile(file)) {
        this.selectedFile = file;
      }
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && this.isValidFile(file)) {
      this.selectedFile = file;
    }
  }

  isValidFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile() {
    this.selectedFile = null;
  }

  uploadFile() {
    if (this.selectedFile) {
      this.uploading = true;
      this.apiService.uploadCandidatesExcel(this.selectedFile).subscribe({
        next: (result) => {
          this.uploading = false;
          this.uploadResult = result;
        },
        error: (error) => {
          this.uploading = false;
          this.uploadResult = {
            message: 'Error al procesar el archivo',
            totalProcessed: 0,
            successCount: 0,
            errorCount: 1,
            errors: [{
              row: 0,
              message: error.error?.message || 'Error desconocido'
            }]
          };
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onClose() {
    this.dialogRef.close(this.uploadResult);
  }
}