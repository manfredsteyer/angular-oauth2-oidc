import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-date-component',
  template: `
        <div>
            {{day}}.{{month}}.{{year}} {{hour}}:{{minute}}
        </div>
    `
})
export class DateComponent implements OnInit, OnChanges {
  @Input() date: string;

  day;
  month;
  year;
  hour;
  minute;

  constructor() {
    console.log('ctrl');
  }

  ngOnInit() {
  }

  ngOnChanges(change) {
    // if(change.date) { ... }

    console.log('change', change);

    const date = new Date(this.date);

    this.day = date.getDate();
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();

    this.hour = date.getHours();
    this.minute = date.getMinutes();
  }
}
