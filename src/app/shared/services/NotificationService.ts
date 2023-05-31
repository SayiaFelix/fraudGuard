import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Notification} from './Notification'


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([
    {process: "Approve User creation", stagerDetails: "Andrew Mukaya", createdOn: "20-05-2023"},
    {process: "Approve Bank Branch creation", stagerDetails: "Festus Nzioka", createdOn: "10-05-2023"}
  ]);
  castNotifications = this.notifications.asObservable();

  constructor() {
  }

  updateNotifications(newNotifications: Notification[]) {
    this.notifications.next(newNotifications);
  }
}
