import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, column: string): any[] {
    if (!items) return [];
    if (!searchText || !column) return items;
    searchText = searchText.toLowerCase();
    return items.filter(item => {
      const field = item[column];
      return field && field.toString().toLowerCase().includes(searchText);
    });
  }
}
