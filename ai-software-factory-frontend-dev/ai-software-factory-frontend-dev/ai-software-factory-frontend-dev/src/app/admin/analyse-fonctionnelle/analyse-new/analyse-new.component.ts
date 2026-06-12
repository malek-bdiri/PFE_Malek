import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-analyse-new',
  templateUrl: './analyse-new.component.html',
  styleUrls: ['./analyse-new.component.css']
})
export class AnalyseNewComponent {
  constructor(private router: Router) {}
  cancel(): void { this.router.navigate(['/admin/analyse']); }
}
