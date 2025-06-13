import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Candidate, 
  CreateCandidateDto, 
  UpdateCandidateDto, 
  PaginatedResponse,
  CandidateFilters 
} from '../models/candidate.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = '/api';
  private http = inject(HttpClient);

  getCandidates(filters?: CandidateFilters): Observable<PaginatedResponse<Candidate>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Candidate>>(`${this.apiUrl}/candidates`, { params });
  }

  getCandidate(id: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/candidates/${id}`);
  }

  createCandidate(candidate: CreateCandidateDto): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/candidates`, candidate);
  }

  updateCandidate(id: string, candidate: UpdateCandidateDto): Observable<Candidate> {
    return this.http.patch<Candidate>(`${this.apiUrl}/candidates/${id}`, candidate);
  }

  deleteCandidate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/candidates/${id}`);
  }

  uploadCandidatesExcel(file: File): Observable<{ 
    message: string; 
    totalProcessed: number; 
    successCount: number; 
    errorCount: number; 
    errors: Array<{row: number; message: string}>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ 
      message: string; 
      totalProcessed: number; 
      successCount: number; 
      errorCount: number; 
      errors: Array<{row: number; message: string}>;
    }>(`${this.apiUrl}/candidates/upload`, formData);
  }
}