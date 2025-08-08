import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss']
})
export class ProductCategoriesAsCardsComponent implements OnInit {
  activeTab: string = 'chats';
  
  // Date range properties
  startDate: Date = new Date('2025-07-01');
  endDate: Date = new Date('2025-07-31');
  showDatePicker: boolean = false;
  
  // Calendar properties
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  isSelectingRange: boolean = false;
  
  // Calendar data
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Generate years array (current year ± 10 years)
  years: number[] = [];
  
  // Statuses for the CHATS tab summary cards
  chatStatuses = [
    { name: 'Open', color: '#56CCF2' },
    { name: 'Pending', color: '#F2994A' },
    { name: 'Resolved', color: '#27AE60' },
    { name: 'Overdue', color: '#EB5757' },
    { name: 'Closed', color: '#828282' }
  ];

  // Statuses for the TICKETS tab summary cards
  ticketStatuses = [
    { name: 'Open', color: '#56CCF2' },
    { name: 'Pending', color: '#F2994A' },
    { name: 'Resolved', color: '#27AE60' },
    { name: 'Overdue', color: '#EB5757' }
  ];

  constructor() {
    // Initialize years array
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    // Initialize calendar with current date range
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);
  }

  /**
   * Sets the currently active tab.
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Toggles the date picker visibility
   */
  toggleDatePicker(): void {
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      // Reset selection state
      this.selectedStartDate = new Date(this.startDate);
      this.selectedEndDate = new Date(this.endDate);
      this.isSelectingRange = false;
    }
  }

  /**
   * Gets calendar days for the current month
   */
  getCalendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(this.currentYear, this.currentMonth, -startingDayOfWeek + i + 1).getDate();
      days.push(null); // We'll show previous month days as null for now
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }

  /**
   * Handles day selection in calendar
   */
  selectDay(day: number | null): void {
    if (day === null) return;
    
    const selectedDate = new Date(this.currentYear, this.currentMonth, day);
    
    if (!this.isSelectingRange || !this.selectedStartDate) {
      // Start new selection
      this.selectedStartDate = selectedDate;
      this.selectedEndDate = null;
      this.isSelectingRange = true;
    } else {
      // Complete range selection
      if (selectedDate < this.selectedStartDate) {
        this.selectedEndDate = this.selectedStartDate;
        this.selectedStartDate = selectedDate;
      } else {
        this.selectedEndDate = selectedDate;
      }
      this.isSelectingRange = false;
    }
  }

  /**
   * Checks if a day is selected (start or end of range)
   */
  isDaySelected(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateStr = date.toDateString();
    
    return (this.selectedStartDate?.toDateString() === dateStr) ||
           (this.selectedEndDate?.toDateString() === dateStr);
  }

  /**
   * Checks if a day is in the selected range
   */
  isDayInRange(day: number | null): boolean {
    if (day === null || !this.selectedStartDate || !this.selectedEndDate) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return date > this.selectedStartDate && date < this.selectedEndDate;
  }

  /**
   * Checks if a day is the start of selection
   */
  isDayRangeStart(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return this.selectedStartDate?.toDateString() === date.toDateString();
  }

  /**
   * Checks if a day is the end of selection
   */
  isDayRangeEnd(day: number | null): boolean {
    if (day === null) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    return this.selectedEndDate?.toDateString() === date.toDateString();
  }

  /**
   * Checks if a day is today
   */
  isToday(day: number | null): boolean {
    if (day === null) return false;
    
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() && 
           this.currentYear === today.getFullYear();
  }

  /**
   * Navigates to previous month
   */
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  /**
   * Navigates to next month
   */
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  /**
   * Handles month selection change
   */
  onMonthChange(month: number): void {
    this.currentMonth = month;
  }

  /**
   * Handles year selection change
   */
  onYearChange(year: number): void {
    this.currentYear = year;
  }

  /**
   * Applies the selected date range
   */
  applyDateRange(): void {
    if (this.selectedStartDate && this.selectedEndDate) {
      this.startDate = new Date(this.selectedStartDate);
      this.endDate = new Date(this.selectedEndDate);
      this.showDatePicker = false;
      this.refreshData();
    }
  }

  /**
   * Cancels date selection
   */
  cancelDateSelection(): void {
    this.showDatePicker = false;
    this.selectedStartDate = new Date(this.startDate);
    this.selectedEndDate = new Date(this.endDate);
    this.isSelectingRange = false;
  }

  /**
   * Formats date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  }

  /**
   * Gets the formatted date range string
   */
  getDateRangeDisplay(): string {
    return `Date range: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
  }

  /**
   * Downloads data based on current tab and filters
   */
  downloadData(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `${this.activeTab}_data_${currentDate}.csv`;
    
    let csvData = this.generateCSVData();
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSVData(): string {
    const headers = this.getCSVHeaders();
    const rows = this.getCSVRows();
    
    return [headers, ...rows].join('\n');
  }

  private getCSVHeaders(): string {
    switch (this.activeTab) {
      case 'chats':
        return 'Date,Total New Chats,Open,Pending,Resolved,Overdue,Closed,Avg Live Agent Response Time,Avg AI Assistant Response Time';
      case 'tickets':
        return 'Date,Total New Tickets,Open,Pending,Resolved,Overdue,Avg Live Agent Response Time';
      case 'interactions':
        return 'Date,Total Interactions,By Channel,By Agent Type,By Status';
      default:
        return 'Date,Value';
    }
  }

  private getCSVRows(): string[] {
    const rows: string[] = [];
    const startTime = this.startDate.getTime();
    const endTime = this.endDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += dayMs) {
      const date = new Date(time);
      const dateStr = date.toISOString().split('T')[0];
      
      switch (this.activeTab) {
        case 'chats':
          rows.push(`${dateStr},${Math.floor(Math.random() * 100)},${Math.floor(Math.random() * 20)},${Math.floor(Math.random() * 15)},${Math.floor(Math.random() * 30)},${Math.floor(Math.random() * 10)},${Math.floor(Math.random() * 25)},${Math.floor(Math.random() * 60)} min,${Math.floor(Math.random() * 30)} sec`);
          break;
        case 'tickets':
          rows.push(`${dateStr},${Math.floor(Math.random() * 50)},${Math.floor(Math.random() * 15)},${Math.floor(Math.random() * 10)},${Math.floor(Math.random() * 20)},${Math.floor(Math.random() * 5)},${Math.floor(Math.random() * 45)} min`);
          break;
        case 'interactions':
          rows.push(`${dateStr},${Math.floor(Math.random() * 200)},Multiple,Mixed,Various`);
          break;
      }
    }
    
    return rows;
  }

  private refreshData(): void {
    console.log(`Refreshing ${this.activeTab} data for range: ${this.getDateRangeDisplay()}`);
  }
}