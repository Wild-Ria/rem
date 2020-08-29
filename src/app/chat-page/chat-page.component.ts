import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Janus} from 'janus-gateway';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
  selector: 'rms-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  @ViewChild('userVideo', { static: true }) userVideoRef: ElementRef;
  @ViewChild('docVideo', { static: true }) docVideoRef: ElementRef;
  userVideo: HTMLVideoElement;
  docVideo: HTMLVideoElement;
  private janus = null;
  private sfutest = null;
  private opaqueId = 'videoroomtest-' + Janus.randomString(12);

  private myroom: number;
  private myusername = null;
  private myid = null;
  private mystream = null;
  private mypvtid = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.myroom = Number(params.params.split('|')[0]);
    });
    this.initJanus();
    this.userVideo = this.userVideoRef.nativeElement;
    this.docVideo = this.docVideoRef.nativeElement;
  }

  initJanus(): void {
    Janus.init({
      debug: 'all',
      callback: () => {
        if (!Janus.isWebrtcSupported()) {
          console.error('No WebRTC support... ');
          return;
        }
        this.createNewJanusSession();
      }
    });
  }

  private createNewJanusSession(): void {
    const server = [
      // TODO: change to environment variable
      'https://d.sft.in.ua/janus'
    ];
    this.janus = new Janus({
      server: server,
      success: () => {
        this.janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: this.opaqueId,
          success: (pluginHandle) => {
            this.sfutest = pluginHandle;
            this.registerUser(this.myroom.toString());
          },
          error: (error) => {
            console.log('error', error);
          },
          onmessage: (msg, jsep) => {
            const event = msg.videoroom;
            switch (event) {
              case 'joined':
                this.myid = msg.id;
                this.mypvtid = msg.private_id;
                this.publishOwnFeed(true);
                if (msg.publishers && msg.publishers.length) {
                  msg.publishers.forEach(feed => {
                    const { id, display, audio, video } = feed;
                    this.newRemoteFeed(id, display, audio, video);
                  });
                }
                break;
              case 'event':
                if (msg.publishers && msg.publishers.length) {
                  msg.publishers.forEach(feed => {
                    console.log(feed);
                    const { id, display, audio, video } = feed;
                    this.newRemoteFeed(id, display, audio, video);
                  });
                }
                break;
              case 'destroyed':
                Janus.warn('The room has been destroyed!');
                break;
              default:
                console.log('No handler for event');
            }
          },
          onlocalstream: (stream: MediaStream) => {
            this.mystream = stream;
            Janus.attachMediaStream(this.userVideo, stream);
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  private registerUser(username): void {
    const register = {
      request: 'join',
      room: this.myroom,
      ptype: 'publisher',
      display: username
    };
    this.myusername = username;
    this.sfutest.send({ message: register });
  }

  public publishOwnFeed(useAudio): void {
    this.sfutest.createOffer({
      media: {
        audioRecv: false,
        videoRecv: false,
        audioSend: useAudio,
        videoSend: true
      },
      success: (jsep) => {
        Janus.debug('Got publisher SDP!', jsep);
        const publish = {
          request: 'configure',
          audio: useAudio,
          video: true
        };
        this.sfutest.send({ message: publish, jsep: jsep });
      },
      error: (error) => {
        Janus.error('WebRTC error:', error);
      }
    });
  }

  public unpublishOwnFeed(): void {
    const unpublish = { request: 'unpublish' };
    this.sfutest.send({ message: unpublish });
  }

  public newRemoteFeed(id, display, audio, video): void {
    let remoteFeed = null;
    this.janus.attach({
      plugin: 'janus.plugin.videoroom',
      opaqueId: this.opaqueId,
      success: (pluginHandle) => {
        remoteFeed = pluginHandle;
        const subscribe = {
          request: 'join',
          room: this.myroom,
          ptype: 'subscriber',
          feed: id,
          private_id: this.mypvtid
        };

        remoteFeed.videoCodec = video;
        remoteFeed.send({ message: subscribe });
      },
      error: (error) => {
        Janus.error('  -- Error attaching plugin...', error);
      },
      onmessage: (msg, jsep) => {
        console.log('onmessage', msg, jsep);
      },
      webrtcState: (on) => {
        console.log('webrtcState', on);
      },
      onlocalstream: (stream) => {
        console.log('onlocalstream', stream);
      },
      onremotestream: (stream) => {
        Janus.attachMediaStream(this.docVideo, stream);
      },
      oncleanup: () => {
        console.log('oncleanup');
      }
    });
  }

}
