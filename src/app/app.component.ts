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
  connected:boolean = false;
  private currentCall?: MediaConnection;

  constructor(private webrtcService: WebrtcService) {}

  async ngOnInit() {
    // Initialisation du flux local
    const stream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = stream;

    // Récupération de l'instance Peer
    const peer = this.webrtcService.getPeer();
    peer.on('open', (id) => {
      this.peerId.set(id);
      console.log(`Your Peer ID: ${id}`);
    });

    // Réception des appels entrants
    peer.on('call', (call) => {
      call.answer(stream); // Répondre avec le flux local
      this.currentCall = call;
      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      });
    });
  }

  connectToRemote() {
    const peer = this.webrtcService.getPeer();
    const call = peer.call(this.remotePeerId(), this.localVideo.nativeElement.srcObject as MediaStream);

    if (call) {
      this.currentCall = call;
      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
        this.connectionStatus.set('Connected');
        this.connected = true;
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        this.connectionStatus.set('Error connecting');
      });
    } else {
      this.connectionStatus.set('Failed to initiate call');
    }
  }

  disconnectCall() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = undefined;
    }

    if (this.localVideo.nativeElement.srcObject) {
      (this.localVideo.nativeElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }

    if (this.remoteVideo.nativeElement.srcObject) {
      (this.remoteVideo.nativeElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;
    this.connectionStatus.set('Not connected');
    this.connected = false;
    console.log('Call disconnected');
  }
}
