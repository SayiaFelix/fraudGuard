// filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filter: {[key: string]: any}): any {
    if (!items || !filter) {
      return items;
    }
    const key = Object.keys(filter)[0];
    const value = filter[key];
    return items.filter(item => item[key] === value);
  }
}