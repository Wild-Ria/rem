import { Injectable } from '@angular/core';
import { Janus } from 'janus-gateway';

@Injectable({
  providedIn: 'root'
})
export class ConferenceService {

  constructor() {
  }

  tryJanus(): void {
    console.log(Janus);
  }

}
