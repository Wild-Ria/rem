import { Injectable } from '@angular/core';
import { Janus } from 'janus-gateway';

@Injectable({
  providedIn: 'root'
})
export class ConferenceService {
  private janus = null;
  private sfutest = null;
  private opaqueId = 'videoroomtest-' + Janus.randomString(12);

  private myroom = 1234;
  private myusername = null;
  private myid = null;
  private mystream = null;
  private mypvtid = null;

  constructor() {
  }

  init(): void {
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
            Janus.log('Plugin attached! (' + this.sfutest.getPlugin() + ', id=' + this.sfutest.getId() + ')');
            Janus.log('  -- This is a publisher/manager');
            this.registerUser('test');
          },
          error: (error) => {
            console.log('error', error);
          },
          webrtcState: (on) => {
            console.log('webrtcState', on);
          },
          onmessage: (msg, jsep) => {
            console.log('onmessage', msg, jsep);
          },
          onlocalstream: (stream) => {
            console.log('onlocalstream', stream);
          },
          onremotestream: (stream) => {
            console.log('onremotestream', stream);
          },
          oncleanup: () => {
            console.log('oncleanup');
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
        console.log('onremotestream', stream);
      },
      oncleanup: () => {
        console.log('oncleanup');
      }
    });
  }

}
