import {Component, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgIf} from "@angular/common";
import {MediaConnection} from 'peerjs';
import {WebrtcService} from '../../shared/services/webrtc.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-video-call',
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css'
})
export class VideoCallComponent implements OnInit {
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
  isMuted = false;
  isPlaying = true;
  isScreenSharig = false;

  constructor(private webrtcService: WebrtcService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  async ngOnInit() {
    await this.initLocalFlux()
    this.getPeerInstance()
    if (!history.state.isNew) {
      console.log("this is an existing meet")
      const remotePeerId = this.activatedRoute.snapshot.paramMap.get('peerId')
      if (remotePeerId) {
        this.remotePeerId.set(remotePeerId);
        this.connectToRemote();
      }
    } else {
      console.log("this is a new meet")
    }
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
    const call = peer.call(this.remotePeerId(), this.localStream!);

    if (call) {
      this.currentCall = call;
      this.handleCall(call);
    } else {
      this.connectionStatus.set('Failed to initiate call');
      console.log(`the code is not valid failed to initiate call`, this.remotePeerId(), this.localStream);
    }
  }

  private handleCall(call: MediaConnection) {
    this.currentCall = call;
    call.on('stream', (remoteStream) => {
      this.remoteVideo.nativeElement.srcObject = remoteStream;
      this.remoteVideo.nativeElement.muted = false;
      this.remoteVideo.nativeElement.volume = 1.0;

      this.connectionStatus.set('Connected');
      this.connected = true;
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      this.connectionStatus.set('Error connecting');
    });
  }

  disconnectCall() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = undefined;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    if (this.remoteVideo.nativeElement.srcObject) {
      (this.remoteVideo.nativeElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      this.remoteVideo.nativeElement.srcObject = null;
    }

    this.localVideo.nativeElement.srcObject = null;
    this.connectionStatus.set('Not connected');
    this.connected = false;
    console.log('Call disconnected');
    this.router.navigate(['/']);
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

      // Replace the screen track with the camera track
      const videoTrack = this.localStream?.getVideoTracks()[0];
      this.replaceTrack(videoTrack);
    } else {
      try {
        this.localDisplayStream = await this.webrtcService.initDisplayStream();
        this.localVideo.nativeElement.srcObject = this.localDisplayStream;
        this.isScreenSharig = true;

        // Replace the camera video track with the screen share track
        const screenTrack = this.localDisplayStream.getVideoTracks()[0];
        screenTrack.onended = () => this.shareScreen(); // Handle stop event
        this.replaceTrack(screenTrack);
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
        console.log('Video track replaced successfully');
      }).catch(err => console.error('Error replacing track:', err));
    }
  }


  protected readonly history = history;
}
