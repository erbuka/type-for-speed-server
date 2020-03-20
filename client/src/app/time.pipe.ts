import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appTime'
})
export class TimePipe implements PipeTransform {

  transform(millis: number): string {


    let minutes = Math.floor(millis / 60000);
    let seconds = Math.floor((millis  - minutes * 60000) / 1000);

    return `${ minutes }:${ seconds < 10 ? "0" + seconds : seconds }`;
  }

}
