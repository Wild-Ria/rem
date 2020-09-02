import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Janus} from 'janus-gateway';
import {ActivatedRoute, Params} from '@angular/router';
import {environment} from '../../environments/environment';
import 'webrtc-adapter';
import {userType} from '../shared/interfaces';

@Component({
  selector: 'rms-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  @ViewChild('myVideo', { static: true }) myVideoRef: ElementRef;
  @ViewChild('otherVideo', { static: true }) otherVideoRef: ElementRef;
  @ViewChild('deviceVideo', { static: true }) deviceVideoRef: ElementRef;
  private janus = null;
  private sfutest = null;
  private opaqueId = 'videoroomtest-' + Janus.randomString(12);

  private myroom: number;
  private myusername = null;
  private myid = null;
  private mystream = null;
  private mypvtid = null;
  private user: userType;

  private remoteFeed = null;
  public message: any = '';
  public isUserRegistered = false;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.myroom = Number(params.id);
      this.user = params.user;
      this.myusername = this.user;
    });
    this.initJanus();
  }

  initJanus(): void {
    Janus.init({
      // debug: 'all',
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
      environment.serverUrl + 'janus',
      // 'wss://janus.conf.meetecho.com:8188/janus'
    ];
    this.janus = new Janus({
      server: server[0],
      success: () => {
        this.attachJanus();
      },
      error: (err) => {
        this.message = 'Error: ' + err;
      },
      destroyed: () => {
        window.location.reload();
      }
    });
  }

  private attachJanus(): void {
    // Attach to VideoRoom plugin
    this.janus.attach({
      plugin:  'janus.plugin.videoroom',
      opaqueId: this.opaqueId,
      success: (pluginHandle) => {
        this.sfutest = pluginHandle;
        this.message = 'Click create session to start';

        // so start connection
        if (this.user === userType.DEVICE) {
          this.registerUser(this.myusername);
        }
        // this.registerUser(this.myusername);
      },
      error: (error) => {
        this.message = error;
      },
      consentDialog: (on) => {
        this.message = 'Consent dialog should be ' + (on ? 'on' : 'off') + ' now';
      },
      iceState: (state) => {
        this.message = 'ICE state changed to ' + state;
      },
      mediaState: (medium, on) => {
        this.message = 'Janus ' + (on ? 'started' : 'stopped') + ' receiving our ' + medium;
      },
      webrtcState: (on) => {
        this.message = 'Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now';
      },
      onremotestream: (stream) => {
        // The publisher stream is sendonly, we don't expect anything here
      },
      oncleanup: () => {
        this.message  = '::: Got a cleanup notification: we are unpublished now :::';
        this.mystream = null;
      },

      onlocalstream: (stream) => {
        this.message  = ' ::: Got a local stream :::';
        this.mystream = stream;

        const videoElement = this.getVideoElm(this.user);
        Janus.attachMediaStream(videoElement, stream);

        if (
          this.sfutest.webrtcStuff.pc.iceConnectionState !== 'completed'
          && this.sfutest.webrtcStuff.pc.iceConnectionState !== 'connected'
        ) {
          this.message = 'Publishing...';
        }
      },

      onmessage: (msg, jsep) => {
        this.message = '::: Got a message (publisher) :::';

        if (msg['videoroom']) {
          this.parseVideoRoomEvent(msg, jsep);
        }

        if (jsep) {
          this.connectRemoteVideo(msg, jsep);
        }
      }
    });
  }

  private parseVideoRoomEvent(msg, jsep) {
    switch (msg['videoroom']) {
      case 'joined':
        this.processJoined(msg, jsep);
        break;
      case 'destroyed':
        this.message = 'The room has been destroyed!';
        window.location.reload();
        break;
      case 'event':
        this.processRoomStatusUpdateEvent(msg, jsep);
        break;
    }
  }

  /**
   * Apply events updates
   * @param msg
   * @param jsep
   * @private
   */
  private processRoomStatusUpdateEvent(msg, jsep) {
    if (msg['publishers']) {
      this.parseFeedList(msg['publishers']);
    }

    if (msg['leaving']) {
      // code for deattach here
    }

    if (msg['unpublished']) {
      if (msg['unpublished'] === 'ok') {
        // That's us
        this.sfutest.hangup();
      } else {
        // code remove feeds here
      }
    }

    if (msg['error']) {
      this.message = msg['error'];

      if (msg['error_code'] === 426) {
        this.message = `
                      Apparently room <${this.myroom}> (the one this demo uses as a test room)
                      does not exist...
                      Do you have an updated < janus.plugin.videoroom.jcfg >
                      configuration file? If not, make sure you copy the details of room < ${this.myroom} >
                      from that sample in your current configuration file, then restart Janus and try again.
            `;
      }
    }
  }

  /**
   * Get native container for local video
   */
  private getVideoElm(user: userType): HTMLVideoElement {
    switch (user) {
      case userType.DOC:
        return this.otherVideoRef.nativeElement;
      case userType.USER:
        return this.myVideoRef.nativeElement;
      default:
        return this.deviceVideoRef.nativeElement;
    }
    // return !this.isDoc ? this.otherVideoRef.nativeElement : this.myVideoRef.nativeElement;
  }

  /**
   * behaviour for joining
   * @param msg
   * @param jsep
   * @private
   */
  private processJoined(msg, jsep) {
    this.message = 'Successfully joined room ' + msg['room'] + ' with ID ' + msg['id'];

    this.myid    = msg['id'];
    this.mypvtid = msg['private_id'];

    this.publishOwnFeed(true);


    if (msg['publishers']) {
      this.parseFeedList(msg['publishers']);
    }
  }

  /**
   * Get received feed and attach them
   * @param list
   * @private
   */
  private parseFeedList(list) {
    list.forEach (
      (feed) => {
        const id = feed['id'];
        const display = feed['display'];
        const audio = feed['audio_codec'];
        const video = feed['video_codec'];

        this.message = ' >> [' + id + '] ' + display + ' (audio: ' + audio + ', video: ' + video + ')';

        this.newRemoteFeed(id, display, audio, video);
      }
    );
  }

  private connectRemoteVideo(msg, jsep) {
    this.message = 'Handling SDP as well...';
    this.sfutest.handleRemoteJsep({ jsep: jsep });

    const audio = msg['audio_codec'];
    if (
      this.mystream
      && this.mystream.getAudioTracks()
      && this.mystream.getAudioTracks().length > 0
      && !audio
    ) {
      // Audio has been rejected
      this.message = 'Our audio stream has been rejected, viewers won\'t hear us';
    }

    const video = msg['video_codec'];
    if (
      this.mystream
      && this.mystream.getVideoTracks()
      && this.mystream.getVideoTracks().length > 0
      && !video
    ) {
      // Audio has been rejected
      this.message = 'Our video stream has been rejected, viewers won\'t see us';
    }
  }

  private registerUser(username): void {
    const register = {
      request: 'join',
      room: this.myroom,
      ptype: 'publisher',
      display: username
    };
    if (this.user !== userType.DEVICE) {
      this.isUserRegistered = true;
    }
    this.myusername = username;
    this.sfutest.send({ message: register });
  }

  public publishOwnFeed(useAudio: boolean): void {
    this.sfutest.createOffer({
      media: {
        audioRecv: false,
        videoRecv: false,
        audioSend: useAudio,
        videoSend: true
      },
      success: (jsep) => {
        this.message = 'Got publisher SDP!';
        const publish = {
          request: 'configure',
          audio: useAudio,
          video: true
        };
        this.sfutest.send({ message: publish, jsep: jsep });
      },
      error: (error) => {
        this.message = 'WebRTC error:' + error.message;
        if (useAudio) {
          this.publishOwnFeed(false);
        }
      }
    });
  }

  public unpublishOwnFeed(): void {
    const unpublish = { request: 'unpublish' };
    this.sfutest.send({ message: unpublish });
  }

  public newRemoteFeed(id, display, audio, video): void {
    this.janus.attach({
      plugin: 'janus.plugin.videoroom',
      opaqueId: this.opaqueId,
      success: (pluginHandle) => {
        this.remoteFeed = pluginHandle;
        this.remoteFeed.simulcastStarted = false;
        const subscribe = {
          request: 'join',
          room: this.myroom,
          ptype: 'subscriber',
          feed: id,
          private_id: this.mypvtid
        };

        this.remoteFeed.videoCodec = video;
        this.remoteFeed.send({ message: subscribe });
      },
      error: (error) => {
        Janus.error('  -- Error attaching plugin...', error);
      },
      onmessage: (msg, jsep) => {
        const event = msg['videoroom'];
        if (event === 'attached') {
          this.remoteFeed.rfid = msg['id'];
          this.remoteFeed.rfdisplay = msg['display'];
          if (!this.remoteFeed.spinner) {
            const target = this.getVideoElm(this.remoteFeed.rfdisplay);
          } else {
          }
        } else if (event === 'event') {
          // Check if we got an event on a simulcast-related event from this publisher
        } else {
          // What has just happened?
        }
        if (jsep) {
          this.message = 'Handling SDP as well...';
          // Answer and attach
          this.remoteFeed.createAnswer(
            {
              jsep: jsep,
              // Add data:true here if you want to subscribe to datachannels as well
              // (obviously only works if the publisher offered them in the first place)
              media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
              success: (jsep2) => {
                this.message = 'Got SDP!';
                const body = { request: 'start', room: this.myroom };
                this.remoteFeed.send({ message: body, jsep: jsep2 });
              },
              error: function(error) {
                this.message = `WebRTC error: ${error}`;
              }
            });
        }
      },
      iceState: (state) => {
        this.message = 'ICE state of this WebRTC PeerConnection (feed #' + this.remoteFeed.rfindex + ') changed to ' + state;
      },
      webrtcState: (on) => {
        this.message = 'Janus says this WebRTC PeerConnection (feed #' + this.remoteFeed.rfindex + ') is ' + (on ? 'up' : 'down') + ' now';
      },
      onlocalstream: (stream) => {
        console.log('onlocalstream', stream);
      },
      onremotestream: (stream) => {
        if (this.remoteFeed.spinner) {
          this.remoteFeed.spinner.stop();
        }
        this.remoteFeed.spinner = null;
        Janus.attachMediaStream(this.getVideoElm(this.remoteFeed.rfdisplay), stream);
      },
      oncleanup: () => {
        this.message = '::: Got a cleanup notification (remote feed)';
        if (this.remoteFeed.spinner) {
          this.remoteFeed.spinner.stop();
        }
        this.remoteFeed.spinner = null;
        this.remoteFeed.simulcastStarted = false;
      }
    });
  }

  public callEnd() {
    if (this.janus) {
      this.janus.destroy();
    }
  }

}
