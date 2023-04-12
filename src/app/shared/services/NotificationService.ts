import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Notification} from './Notification'


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([
    {myTaskName: "Approve User creation", createdBy: "Andrew Mukaya", createdOn: "20-05-2023"},
    {myTaskName: "Approve Bank Branch creation", createdBy: "Festus Nzioka", createdOn: "10-05-2023"}
  ]);
  castNotifications = this.notifications.asObservable();

  constructor() {
  }

  updateNotifications(newNotifications: Notification[]) {
    this.notifications.next(newNotifications);
  }
}
