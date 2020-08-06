import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {User} from '../shared/interfaces';
import {AuthService} from '../shared/services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'rms-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  form: FormGroup;

  constructor(private auth: AuthService,
              private router: Router) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null, [Validators.required]),
      wifiName: new FormControl(null, [Validators.required]),
      wifiPassword: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const user: User = this.form.value;
    this.auth.login(user).subscribe(
      (res) => {
        console.log(res);
        this.form.reset();
        // TODO make navigation and QR code generation
        this.router.navigate(['qr-code']);
      }
    );
    //this.router.navigate(['qr-code']);
  }
}
