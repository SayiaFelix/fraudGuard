import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InboxItem } from '../../views/pages/mobile-banking/requests/list-requests/list-requests.component'; // Adjust path if your inbox component is in a different folder

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  
  private notificationsSource = new BehaviorSubject<InboxItem[]>([]);
  
  
  public currentNotifications = this.notificationsSource.asObservable();

  // Alerts (transactions) observable - used to broadcast new alerts into the live feed
  private alertsSource = new BehaviorSubject<any | null>(null);
  public currentAlerts = this.alertsSource.asObservable();

  constructor() { }

  /**
   
   * @param unreadItems T
   */
  updateNotifications(unreadItems: InboxItem[]): void {
    this.notificationsSource.next(unreadItems);
  }

  /**
   * Broadcast a new alert (transaction payload) to listeners.
   */
  sendAlert(alertPayload: any): void {
    this.alertsSource.next(alertPayload);
  }
}