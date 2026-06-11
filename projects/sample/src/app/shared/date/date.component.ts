import {
  Component,
  Input,
  OnChanges,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'date-component',
  template: `
    <div>{{ day }}.{{ month }}.{{ year }} {{ hour }}:{{ minute }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DateComponent implements OnInit, OnChanges {
  @Input() date: string;

  day;
  month;
  year;
  hour;
  minute;

  constructor() {
    console.debug('ctrl');
  }

  ngOnInit() {}

  ngOnChanges(change) {
    // if(change.date) { ... }

    console.debug('change', change);

    let date = new Date(this.date);

    this.day = date.getDate();
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();

    this.hour = date.getHours();
    this.minute = date.getMinutes();
  }
}
