import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'candidates',
    pathMatch: 'full',
  },
  {
    path: 'candidates',
    loadComponent: () => 
      import('./features/candidates/components/candidate-list/candidate-list.component')
        .then(m => m.CandidateListComponent),
  },
  {
    path: '**',
    redirectTo: 'candidates'
  }
];
