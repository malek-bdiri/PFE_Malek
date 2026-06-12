import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-analyse-detail',
  templateUrl: './analyse-detail.component.html',
  styleUrls: ['./analyse-detail.component.css']
})
export class AnalyseDetailComponent implements OnInit {
  analyseId!: number;
  constructor(private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.analyseId = Number(this.route.snapshot.paramMap.get('id'));
  }
  back(): void { this.router.navigate(['/admin/analyse']); }
}
