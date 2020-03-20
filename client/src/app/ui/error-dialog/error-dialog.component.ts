import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss']
})
export class ErrorDialogComponent implements OnInit {

  @Output("dismiss") dismissEvent: EventEmitter<void> = new EventEmitter();
  @Input() message: string = null;

  constructor() { }

  ngOnInit() {

  }

}
