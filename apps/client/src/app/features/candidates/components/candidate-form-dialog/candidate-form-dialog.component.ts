import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../../core/services/api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExcelProcessorService } from '../../../../core/services/excel-processor.service';
import {
  Candidate,
  CreateCandidateDto,
  Seniority,
} from '../../../../core/models/candidate.model';

interface DialogData {
  mode: 'create' | 'edit';
  candidate?: Candidate;
}

@Component({
  selector: 'app-candidate-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Nuevo Candidato' : 'Editar Candidato' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="candidateForm" class="candidate-form">
        <!-- Campos manuales: Nombre y Apellido -->
        <div class="manual-fields">
          <h3 class="section-title">Información Personal</h3>

          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input
              matInput
              formControlName="name"
              placeholder="Ingrese el nombre"
            />
            <mat-error *ngIf="candidateForm.get('name')?.hasError('required')">
              El nombre es requerido
            </mat-error>
            <mat-error *ngIf="candidateForm.get('name')?.hasError('minlength')">
              Mínimo 2 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input
              matInput
              formControlName="surname"
              placeholder="Ingrese el apellido"
            />
            <mat-error
              *ngIf="candidateForm.get('surname')?.hasError('required')"
            >
              El apellido es requerido
            </mat-error>
            <mat-error
              *ngIf="candidateForm.get('surname')?.hasError('minlength')"
            >
              Mínimo 2 caracteres
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Datos desde Excel -->
        <div class="excel-fields">
          <h3 class="section-title">
            <mat-icon>table_chart</mat-icon>
            Datos desde Excel
          </h3>

          @if (!excelDataLoaded) {
          <div class="excel-upload-section">
            <p class="info-text">
              Para completar el registro, carga un archivo Excel con los datos
              profesionales del candidato.
            </p>

            <div
              class="upload-area"
              (drop)="onDrop($event)"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              [class.drag-over]="isDragging"
            >
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p>Arrastra el archivo Excel aquí o</p>
              <input
                type="file"
                #fileInput
                (change)="onFileSelected($event)"
                accept=".xlsx,.xls"
                style="display: none"
              />
              <button
                mat-stroked-button
                color="primary"
                (click)="fileInput.click()"
              >
                <mat-icon>attach_file</mat-icon>
                Seleccionar Excel
              </button>
            </div>

            <div class="format-info">
              <h4>Formato esperado del Excel:</h4>
              <div class="format-example">
                <table class="format-table">
                  <thead>
                    <tr>
                      <th>Seniority</th>
                      <th>Años Experiencia</th>
                      <th>Disponibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>senior</td>
                      <td>5</td>
                      <td>si</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul class="format-notes">
                <li>Solo debe contener una fila de datos</li>
                <li>Seniority: "junior" o "senior"</li>
                <li>Disponibilidad: "si" o "no"</li>
              </ul>
            </div>

            @if (selectedFile) {
            <div class="file-preview">
              <mat-icon>description</mat-icon>
              <span class="file-name">{{ selectedFile.name }}</span>
              <button
                mat-icon-button
                color="primary"
                (click)="processExcelFile()"
                [disabled]="processingFile"
              >
                <mat-icon>{{
                  processingFile ? 'hourglass_empty' : 'play_arrow'
                }}</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="removeFile()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            }
          </div>
          } @else {
          <div class="excel-data-display">
            <div class="data-row">
              <mat-icon class="field-icon">military_tech</mat-icon>
              <div class="field-content">
                <label>Seniority:</label>
                <mat-chip class="{{ excelData.seniority }}-chip">{{
                  excelData.seniority | titlecase
                }}</mat-chip>
              </div>
            </div>

            <div class="data-row">
              <mat-icon class="field-icon">work_history</mat-icon>
              <div class="field-content">
                <label>Años de experiencia:</label>
                <span class="value">{{ excelData.yearsExperience }} años</span>
              </div>
            </div>

            <div class="data-row">
              <mat-icon class="field-icon">{{
                excelData.availability ? 'check_circle' : 'cancel'
              }}</mat-icon>
              <div class="field-content">
                <label>Disponibilidad:</label>
                <span class="value availability-{{ excelData.availability }}">
                  {{ excelData.availability ? 'Disponible' : 'No disponible' }}
                </span>
              </div>
            </div>

            <button
              mat-stroked-button
              color="accent"
              (click)="clearExcelData()"
            >
              <mat-icon>refresh</mat-icon>
              Cargar otro archivo
            </button>
          </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!isFormValid() || loading"
        (click)="onSubmit()"
      >
        {{ loading ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .candidate-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
        min-width: 500px;
        padding: 16px 0;
        max-height: 70vh;
        overflow-y: auto;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        color: #1976d2;
        font-size: 16px;
        font-weight: 500;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
      }

      .manual-fields,
      .excel-fields {
        padding: 16px;
        border-radius: 8px;
        background-color: #fafafa;
      }

      .excel-fields {
        border: 2px dashed #e0e0e0;
      }

      mat-form-field {
        width: 100%;
      }

      .info-text {
        color: #666;
        margin: 0 0 16px 0;
        font-size: 14px;
      }

      .upload-area {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 32px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        background-color: white;
      }

      .upload-area.drag-over {
        border-color: #1976d2;
        background-color: #e3f2fd;
      }

      .upload-icon {
        font-size: 48px;
        color: #1976d2;
        margin-bottom: 16px;
      }

      .file-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding: 12px;
        background-color: #e3f2fd;
        border-radius: 8px;
      }

      .file-name {
        flex: 1;
        font-weight: 500;
      }

      .excel-data-display {
        background-color: white;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e0e0e0;
      }

      .data-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 8px;
      }

      .data-row:last-of-type {
        margin-bottom: 24px;
      }

      .field-icon {
        color: #1976d2;
        font-size: 24px;
      }

      .field-content {
        flex: 1;
      }

      .field-content label {
        display: block;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }

      .field-content .value {
        font-size: 16px;
        color: #555;
      }

      .availability-true {
        color: #4caf50;
        font-weight: 500;
      }

      .availability-false {
        color: #f44336;
        font-weight: 500;
      }

      .senior-chip {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .junior-chip {
        background-color: #2196f3 !important;
        color: white !important;
      }

      .format-info {
        margin-top: 16px;
        padding: 16px;
        background-color: #f0f8ff;
        border-radius: 8px;
        border: 1px solid #e3f2fd;
      }

      .format-info h4 {
        margin: 0 0 12px 0;
        color: #1976d2;
        font-size: 14px;
      }

      .format-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin-bottom: 12px;
      }

      .format-table th,
      .format-table td {
        padding: 8px;
        text-align: left;
        border: 1px solid #ddd;
      }

      .format-table th {
        background-color: #e3f2fd;
        font-weight: 500;
      }

      .format-table td {
        background-color: white;
      }

      .format-notes {
        margin: 0;
        padding-left: 16px;
        font-size: 12px;
        color: #666;
      }

      .format-notes li {
        margin-bottom: 4px;
      }

      @media (max-width: 600px) {
        .candidate-form {
          min-width: 350px;
        }

        .upload-area {
          padding: 24px 16px;
        }

        .data-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .format-table {
          font-size: 11px;
        }

        .format-table th,
        .format-table td {
          padding: 6px;
        }
      }
    `,
  ],
})
export class CandidateFormDialogComponent implements OnInit {
  candidateForm: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  processingFile = false;
  excelDataLoaded = false;
  isDragging = false;
  excelData: {
    seniority: Seniority;
    yearsExperience: number;
    availability: boolean;
  } = {
    seniority: 'junior',
    yearsExperience: 0,
    availability: false,
  };

  private dialogRef = inject(MatDialogRef<CandidateFormDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private excelProcessor = inject(ExcelProcessorService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.candidateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      surname: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.candidate) {
      this.candidateForm.patchValue({
        name: this.data.candidate.name,
        surname: this.data.candidate.surname,
      });

      this.excelData = {
        seniority: this.data.candidate.seniority,
        yearsExperience: this.data.candidate.yearsExperience,
        availability: this.data.candidate.availability,
      };
      this.excelDataLoaded = true;
    }
  }

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
      if (this.isValidExcelFile(file)) {
        this.selectedFile = file;
      }
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && this.isValidExcelFile(file)) {
      this.selectedFile = file;
    }
  }

  isValidExcelFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  }

  removeFile() {
    this.selectedFile = null;
  }

  processExcelFile() {
    if (!this.selectedFile) return;

    this.processingFile = true;

    this.excelProcessor
      .processIndividualCandidateFile(this.selectedFile)
      .subscribe({
        next: (data) => {
          this.excelData = data;
          this.excelDataLoaded = true;
          this.processingFile = false;
          this.selectedFile = null;
        },
        error: (error) => {
          this.processingFile = false;
          this.snackBar.open('Error procesando Excel', 'Cerrar', {
            duration: 3000,
          });
          console.error('Error procesando Excel:', error);
        },
      });
  }

  clearExcelData() {
    this.excelDataLoaded = false;
    this.selectedFile = null;
    this.excelData = {
      seniority: 'junior',
      yearsExperience: 0,
      availability: false,
    };
  }

  isFormValid(): boolean {
    return this.candidateForm.valid && this.excelDataLoaded;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.loading = true;

      const candidateData: CreateCandidateDto = {
        name: this.candidateForm.value.name,
        surname: this.candidateForm.value.surname,
        seniority: this.excelData.seniority,
        yearsExperience: this.excelData.yearsExperience,
        availability: this.excelData.availability,
      };

      if (this.data.mode === 'create') {
        this.apiService.createCandidate(candidateData).subscribe({
          next: (candidate) => {
            this.dialogRef.close(candidate);
          },
          error: (error) => {
            this.loading = false;
            this.snackBar.open('Error creando candidato', 'Cerrar', {
              duration: 3000,
            });
            console.error('Error creando candidato:', error);
          },
        });
      } else if (this.data.mode === 'edit' && this.data.candidate) {
        this.apiService
          .updateCandidate(this.data.candidate.id, candidateData)
          .subscribe({
            next: (candidate) => {
              this.dialogRef.close(candidate);
            },
            error: (error) => {
              this.loading = false;
              this.snackBar.open('Error actualizando candidato', 'Cerrar', {
                duration: 3000,
              });
              console.error('Error actualizando candidato:', error);
            },
          });
      }
    }
  }
}
