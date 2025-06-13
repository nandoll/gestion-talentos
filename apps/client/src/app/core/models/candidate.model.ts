export type Seniority = 'junior' | 'senior';

export interface Candidate {
  id: string;
  name: string;
  surname: string;
  seniority: Seniority;
  yearsExperience: number;
  availability: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateDto {
  name: string;
  surname: string;
  seniority: Seniority;
  yearsExperience: number;
  availability: boolean;
}

export type UpdateCandidateDto = Partial<CreateCandidateDto>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CandidateFilters {
  page?: number;
  limit?: number;
  search?: string;
  seniority?: Seniority;
  availability?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}