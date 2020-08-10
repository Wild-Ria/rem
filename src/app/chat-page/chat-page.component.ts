import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'rms-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  @ViewChild('userVideo') userVideoRef: ElementRef;
  userVideo: HTMLVideoElement;
  stream: MediaStream;

  constructor() { }

  ngOnInit() {
    this.userVideo = this.userVideoRef.nativeElement;
    this.initUserVideoStream();
  }

  initUserVideoStream(): void {
    this.userVideo.muted = true;
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    }).then(stream => {
      this.stream = stream;
      this.addVideoStream(this.userVideo, this.stream);
    })
    .catch(error => {
      // TODO make UI for this
      console.error('Error accessing media devices.', error);
    });
  }

  addVideoStream(video: HTMLVideoElement, stream): void {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
  }

  hideUserVideo() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }
}
