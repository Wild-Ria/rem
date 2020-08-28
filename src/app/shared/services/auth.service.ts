import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerUser, User} from '../interfaces';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(user: User): Observable<ServerUser> {
    return this.http.post<ServerUser>('https://d.sft.in.ua/api/login', {name: user.name});
  }

}
