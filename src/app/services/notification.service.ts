import { Injectable, signal, inject, effect } from '@angular/core';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { AppNotification } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authService = inject(AuthService);
  private dataService = inject(DataService);

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal(0);

  private unsub?: () => void;

  constructor() {
    // React to user changes — subscribe/unsubscribe automatically
    effect(() => {
      const user = this.authService.currentUser();
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
      if (!user) {
        this.notifications.set([]);
        this.unreadCount.set(0);
        return;
      }
      this.subscribe(user.user_id);
    });
  }

  private subscribe(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    this.unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), _docId: d.id }) as AppNotification);
      this.notifications.set(items);
      this.unreadCount.set(items.filter(n => !n.read).length);
    }, (err) => {
      console.error('Notification listener error:', err);
    });
  }

  async markAllRead() {
    const user = this.authService.currentUser();
    if (!user) return;
    await this.dataService.markAllNotificationsRead(user.user_id);
  }

  async markOneRead(n: AppNotification) {
    if (n.read) return;
    await this.dataService.markNotificationRead(n);
  }
}
