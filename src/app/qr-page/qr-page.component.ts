import { Component, OnInit } from '@angular/core';
import {User} from '../shared/interfaces';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {environment} from '../../environments/environment';

@Component({
  selector: 'rms-qr-page',
  templateUrl: './qr-page.component.html',
  styleUrls: ['./qr-page.component.scss']
})
export class QrPageComponent implements OnInit {
  public QRCode: string = null;
  public docHref: string;
  private roomId: string;

  constructor(private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.QRCode = params.qrString;
      this.roomId = this.QRCode.split('|')[0];
      this.docHref = `${environment.serverUrl}chat-room?id=${this.roomId}&doc=true`;
    });
  }

  onReadyButtonClick($event: MouseEvent) {
    this.router.navigate(['chat-room'], {
      queryParams: {
        id: this.roomId
      }
    });
  }
}
