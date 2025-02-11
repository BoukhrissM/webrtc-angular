import {AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
import {WebrtcService} from './shared/services/webrtc.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MediaConnection} from 'peerjs';


@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  peerId = signal('');
  remotePeerId = signal('');
  connectionStatus = signal('Not connected');
  connected = false;
  private currentCall?: MediaConnection;
  private localStream?: MediaStream;

  constructor(private webrtcService: WebrtcService) {}

  async ngOnInit() {
    // Initialisation du flux local (Vidéo + Audio)
    this.localStream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = this.localStream;
    this.localVideo.nativeElement.muted = true;

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
    }
  }

  private handleCall(call: MediaConnection) {
    this.currentCall = call;
    call.on('stream', (remoteStream) => {
      this.remoteVideo.nativeElement.srcObject = remoteStream;
      this.remoteVideo.nativeElement.muted = false; // 🔥 S'assurer que le son est activé
      this.remoteVideo.nativeElement.volume = 1.0; // 🔊 Augmenter le volume

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
  }
}
