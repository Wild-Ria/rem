import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {LoginPageComponent} from './login-page/login-page.component';
import {QrPageComponent} from './qr-page/qr-page.component';
import {ChatPageComponent} from './chat-page/chat-page.component';
import {ErrorPageComponent} from './error-page/error-page.component';

const routes: Routes = [
  {path: '', component: LoginPageComponent},
  {path: 'qr-code', component: QrPageComponent},
  {path: 'chat-room', component: ChatPageComponent},
  {path: 'error', component: ErrorPageComponent},
  {path: '**', redirectTo: '/error'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
