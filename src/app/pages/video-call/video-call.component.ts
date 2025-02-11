import {AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {MediaConnection} from 'peerjs';
import {WebrtcService} from '../../shared/services/webrtc.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-video-call',
  imports: [
    CommonModule,
    FormsModule,
    CdkDrag,
  ],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css'
})
export class VideoCallComponent implements OnInit, AfterViewInit {
  @ViewChild('source1') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('source2') remoteVideo!: ElementRef<HTMLVideoElement>;
  peerId = signal('');
  remotePeerId = signal('');
  connectionStatus = signal('Not connected');
  connected = false;
  private currentCall?: MediaConnection;
  private localStream?: MediaStream;
  private localDisplayStream?: MediaStream;
  protected readonly window = window;
  protected readonly history = history;

  isMuted = false;
  isPlaying = true;
  isScreenSharig = false;
  isLocalPrimary = true;

  constructor(private webrtcService: WebrtcService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  async ngOnInit() {

  }

  async ngAfterViewInit() {
    await this.initLocalFlux().then(() => {
      this.getPeerInstance()
      if (!history.state.isNew) {
        console.log("this is an existing meet")
        const remote_peer_id = this.activatedRoute.snapshot.paramMap.get('peerId')
        if (remote_peer_id) {
          this.remotePeerId.set(remote_peer_id);
          console.log("remotePeerId ", this.remotePeerId())
          this.connectToRemote();
        }
      } else {
        console.log("this is a new meet")
      }

      console.log(this.connected)
    })
  }

  async initLocalFlux() {
    // Initialisation du flux local (Vidéo + Audio)
    this.localStream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = this.localStream;
    this.localVideo.nativeElement.muted = true;
  }

  getPeerInstance() {
    // Récupération de l'instance Peer
    const peer = this.webrtcService.getPeer();
    peer.on('open', (id) => {
      this.peerId.set(id);
      console.log(`Your Peer ID: ${id}`);
    });

    // Écouter les appels entrants et répondre avec le flux local
    peer.on('call', (call) => {
      call.answer(this.localStream!); // Répondre avec le flux local
      this.handleCall(call);
    });
  }

  connectToRemote() {
    const peer = this.webrtcService.getPeer();

    if (!this.remotePeerId() || !this.localStream) {
      console.log("Remote Peer ID or local stream is missing, cannot initiate call.");
      this.connectionStatus.set('Failed to initiate call');
      return;
    }

    console.log(`Attempting to connect to remote peer: ${this.remotePeerId()}`);

    const call = peer.call(this.remotePeerId(), this.localStream);

    if (call) {
      this.currentCall = call;
      this.handleCall(call);
    } else {
      this.connectionStatus.set('Failed to initiate call');
      console.log("The code is not valid, failed to initiate call", this.remotePeerId(), this.localStream);
      this.remotePeerId.set('');
    }
  }

  private handleCall(call: MediaConnection) {
    this.currentCall = call;

    call.on('stream', (remoteStream) => {
      console.log("Received remote stream", this.remoteVideo);

      this.localVideo.nativeElement.srcObject = remoteStream;
      this.localVideo.nativeElement.muted = false;
      this.localVideo.nativeElement.volume = 1.0;
      if (this.localStream) {
        this.remoteVideo.nativeElement.srcObject = this.localStream;
        this.remoteVideo.nativeElement.muted = true;
      }

      this.connectionStatus.set('Connected');
      this.connected = true;
    });

    call.on('close', () => {
      console.log("Call ended by the remote peer.");
      this.cleanupCall();
    });

    call.on('error', (err) => {
      console.error("Call error:", err);
      this.connectionStatus.set('Error connecting');
      this.cleanupCall();
    });
  }

  disconnectCall() {
    console.log("Disconnecting call...");

    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = undefined;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    if (this.localDisplayStream) {
      this.localDisplayStream.getTracks().forEach(track => track.stop());
      this.localDisplayStream = undefined;
    }

    this.connectionStatus.set('Not connected');
    this.connected = false;
    this.remotePeerId.set('');
    console.log("Call disconnected successfully.");
    this.router.navigate(['/']);
  }


  private cleanupCall() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = undefined;
    }
    this.connectionStatus.set('Not connected');
    this.connected = false;
  }

  copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.showCopiedText()
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  isTextCopyActive: boolean = false;

  showCopiedText() {
    this.isTextCopyActive = true;
    setTimeout(() => {
      this.isTextCopyActive = false
    }, 2000);
  }


  muteMicrophone() {
    if (this.isMuted) {
      this.localStream?.getAudioTracks().forEach(track => track.enabled = true);
      this.isMuted = false;
    } else {
      this.localStream?.getAudioTracks().forEach(track => track.enabled = false);
      this.isMuted = true;
    }
  }

  hideCamera() {
    if (this.isPlaying) {
      this.localStream?.getVideoTracks().forEach(track => track.enabled = false);
      this.isPlaying = false;
    } else {
      this.localStream?.getVideoTracks().forEach(track => track.enabled = true);
      this.isPlaying = true;
    }
  }

  async shareScreen() {
    if (this.isScreenSharig) {
      // Stop screen sharing and revert to the local camera stream
      await this.initLocalFlux();
      this.isScreenSharig = false;

      // Restore the correct video
      const videoTarget = this.isLocalPrimary ? this.localVideo : this.remoteVideo;
      this.setVideoStream(this.localStream!, videoTarget);
      this.replaceTrack(this.localStream?.getVideoTracks()[0]);
    } else {
      try {
        this.localDisplayStream = await this.webrtcService.initDisplayStream();
        this.isScreenSharig = true;

        // Show screen share on the correct video element
        const videoTarget = this.isLocalPrimary ? this.localVideo : this.remoteVideo;
        this.setVideoStream(this.localDisplayStream, videoTarget);

        // Replace the camera video track with the screen share track in WebRTC
        this.replaceTrack(this.localDisplayStream.getVideoTracks()[0]);

        // Stop sharing when the user exits
        this.localDisplayStream.getVideoTracks()[0].onended = () => this.shareScreen();
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    }
  }

  replaceTrack(newTrack: MediaStreamTrack | undefined) {
    if (!newTrack || !this.currentCall) return;

    // Get the sender from the peer connection
    const sender = this.currentCall.peerConnection
      .getSenders()
      .find(s => s.track?.kind === 'video');

    if (sender) {
      sender.replaceTrack(newTrack).then(() => {
      }).catch(err => console.error('Error replacing track:', err));
    }
  }

  setVideoStream(stream: MediaStream, videoElement: ElementRef<HTMLVideoElement>) {
    videoElement.nativeElement.srcObject = stream;
  }


}
