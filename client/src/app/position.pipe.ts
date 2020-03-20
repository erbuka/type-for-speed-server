import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appPosition'
})
export class PositionPipe implements PipeTransform {

  transform(value: number): string {
    value = Math.round(value);

    let postfix = null;

    switch (value % 10) {
      case 1: postfix = "st"; break;
      case 2: postfix = "nd"; break;
      case 3: postfix = "rd"; break;
      default: postfix = "th";
    }

    return value + postfix;

  }

}
