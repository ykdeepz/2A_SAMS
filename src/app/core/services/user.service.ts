import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models';
import { MOCK_USERS } from './mock-data';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  getUserById(id: string): Observable<User | undefined> {
    const user = MOCK_USERS.find(u => u.id === id);
    return of(user);
  }

  getAllUsers(): Observable<User[]> {
    return of(MOCK_USERS);
  }
}
