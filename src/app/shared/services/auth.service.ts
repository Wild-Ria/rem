import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerUser, User} from '../interfaces';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(user: User): Observable<ServerUser> {
    return this.http.post<ServerUser>(`${environment.serverUrl}api/login`, {name: user.name});
  }

}
