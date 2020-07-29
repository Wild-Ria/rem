import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {User} from '../shared/interfaces';

@Component({
  selector: 'rms-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  form: FormGroup;

  constructor() { }

  ngOnInit(): void {
    this.form = new FormGroup({
      userName: new FormControl(null, [Validators.required]),
      wifiName: new FormControl(null, [Validators.required]),
      wifiPassword: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const user: User = this.form.value;
    console.log(user);
  }
}
