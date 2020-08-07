import { Component, OnInit } from '@angular/core';
import {User} from '../shared/interfaces';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
  selector: 'rms-qr-page',
  templateUrl: './qr-page.component.html',
  styleUrls: ['./qr-page.component.scss']
})
export class QrPageComponent implements OnInit {
  public QRCode: string = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.QRCode = params.qrString;
    });
  }

}
