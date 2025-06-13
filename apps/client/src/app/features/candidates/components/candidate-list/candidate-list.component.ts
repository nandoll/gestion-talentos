import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Candidate, CandidateFilters } from '../../../../core/models/candidate.model';
import { CandidateFormDialogComponent } from '../candidate-form-dialog/candidate-form-dialog.component';
import { UploadDialogComponent } from '../upload-dialog/upload-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Candidatos</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Toolbar con filtros y acciones -->
        <div class="toolbar">
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Buscar</mat-label>
              <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" placeholder="Nombre o apellido">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Seniority</mat-label>
              <mat-select [(ngModel)]="seniorityFilter" (selectionChange)="applyFilter()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="junior">Junior</mat-option>
                <mat-option value="senior">Senior</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Disponibilidad</mat-label>
              <mat-select [(ngModel)]="availabilityFilter" (selectionChange)="applyFilter()">
                <mat-option value="">Todos</mat-option>
                <mat-option [value]="true">Disponible</mat-option>
                <mat-option [value]="false">No disponible</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          
          <div class="actions">
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Nuevo Candidato
            </button>
            
            <button mat-raised-button color="accent" (click)="openUploadDialog()">
              <mat-icon>upload</mat-icon>
              Importar Excel
            </button>
          </div>
        </div>

        <!-- Tabla de candidatos -->
        <div class="table-container">
          @if (loading) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
            </div>
          } @else {
            <table mat-table [dataSource]="dataSource" matSort>
              <!-- Columna Nombre -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
                <td mat-cell *matCellDef="let candidate">{{candidate.name}}</td>
              </ng-container>

              <!-- Columna Apellido -->
              <ng-container matColumnDef="surname">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Apellido</th>
                <td mat-cell *matCellDef="let candidate">{{candidate.surname}}</td>
              </ng-container>

              <!-- Columna Seniority -->
              <ng-container matColumnDef="seniority">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Seniority</th>
                <td mat-cell *matCellDef="let candidate">
                  <mat-chip [ngClass]="candidate.seniority === 'senior' ? 'senior-chip' : 'junior-chip'">
                    {{candidate.seniority | titlecase}}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Columna Experiencia -->
              <ng-container matColumnDef="yearsExperience">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Años Exp.</th>
                <td mat-cell *matCellDef="let candidate">{{candidate.yearsExperience}}</td>
              </ng-container>

              <!-- Columna Disponibilidad -->
              <ng-container matColumnDef="availability">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Disponibilidad</th>
                <td mat-cell *matCellDef="let candidate">
                  <mat-icon [ngClass]="candidate.availability ? 'available' : 'unavailable'">
                    {{candidate.availability ? 'check_circle' : 'cancel'}}
                  </mat-icon>
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let candidate">
                  <button mat-icon-button color="primary" (click)="openEditDialog(candidate)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCandidate(candidate)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </div>

        <mat-paginator [length]="totalItems"
                      [pageSize]="pageSize"
                      [pageSizeOptions]="[10, 25, 50, 100]"
                      (page)="onPageChange($event)"
                      showFirstLastButtons>
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .table-container {
      overflow-x: auto;
      min-height: 400px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    table {
      width: 100%;
    }

    .mat-mdc-form-field {
      width: 200px;
    }

    .senior-chip {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .junior-chip {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .available {
      color: #4caf50;
    }

    .unavailable {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        flex-direction: column;
      }

      .actions {
        flex-direction: column;
      }

      .mat-mdc-form-field {
        width: 100%;
      }
    }
  `]
})
export class CandidateListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<Candidate>([]);
  displayedColumns: string[] = ['name', 'surname', 'seniority', 'yearsExperience', 'availability', 'actions'];
  
  loading = false;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  
  searchTerm = '';
  seniorityFilter = '';
  availabilityFilter: boolean | '' = '';

  ngOnInit() {
    this.loadCandidates();
  }

  loadCandidates() {
    this.loading = true;
    
    const filters: CandidateFilters = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      search: this.searchTerm || undefined,
      seniority: (this.seniorityFilter as 'junior' | 'senior') || undefined,
      availability: this.availabilityFilter === '' ? undefined : this.availabilityFilter
    };

    this.apiService.getCandidates(filters)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalItems = response.total;
        },
        error: (error) => {
          this.snackBar.open('Error al cargar candidatos', 'Cerrar', { duration: 3000 });
          console.error(error);
        }
      });
  }

  applyFilter() {
    this.currentPage = 0;
    this.loadCandidates();
  }

  onPageChange(event: {pageSize: number; pageIndex: number}) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadCandidates();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CandidateFormDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCandidates();
        this.snackBar.open('Candidato creado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(candidate: Candidate) {
    const dialogRef = this.dialog.open(CandidateFormDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { mode: 'edit', candidate }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCandidates();
        this.snackBar.open('Candidato actualizado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(UploadDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCandidates();
        this.snackBar.open(result.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  deleteCandidate(candidate: Candidate) {
    if (confirm(`¿Está seguro de eliminar a ${candidate.name} ${candidate.surname}?`)) {
      this.apiService.deleteCandidate(candidate.id).subscribe({
        next: () => {
          this.loadCandidates();
          this.snackBar.open('Candidato eliminado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error al eliminar candidato', 'Cerrar', { duration: 3000 });
          console.error(error);
        }
      });
    }
  }
}