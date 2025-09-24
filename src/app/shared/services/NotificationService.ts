import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InboxItem } from '../../views/pages/mobile-banking/requests/list-requests/list-requests.component'; // Adjust path if your inbox component is in a different folder

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  
  private notificationsSource = new BehaviorSubject<InboxItem[]>([]);
  
  
  public currentNotifications = this.notificationsSource.asObservable();

  constructor() { }

  /**
   
   * @param unreadItems T
   */
  updateNotifications(unreadItems: InboxItem[]): void {
    this.notificationsSource.next(unreadItems);
  }
}