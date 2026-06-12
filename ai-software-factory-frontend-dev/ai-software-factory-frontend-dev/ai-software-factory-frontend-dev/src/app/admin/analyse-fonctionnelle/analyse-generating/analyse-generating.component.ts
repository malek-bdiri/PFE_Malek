import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-analyse-generating',
  templateUrl: './analyse-generating.component.html',
  styleUrls: ['./analyse-generating.component.css']
})
export class AnalyseGeneratingComponent {
  constructor(private router: Router) {}
  back(): void { this.router.navigate(['/admin/analyse']); }
}
