import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'rms-qr-page',
  templateUrl: './qr-page.component.html',
  styleUrls: ['./qr-page.component.scss']
})
export class QrPageComponent implements OnInit {
  public QRCode: string = null;

  constructor() { }

  ngOnInit() {
    this.QRCode = 'http://google.com';
  }

}
