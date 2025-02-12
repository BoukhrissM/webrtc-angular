import {Component, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {WebrtcService} from '../../shared/services/webrtc.service';
import {LivekitService} from '../../shared/services/livekit.service';

@Component({
  selector: 'app-meet',
  imports: [CommonModule, FormsModule],
  templateUrl: './meet.component.html',
  styleUrl: './meet.component.css'
})
export class MeetComponent {
  remotePeerId = signal('');
  roomName: string = "test-room";

  constructor(
    private webRtcService: WebrtcService,
    private router: Router,
    private livekitService: LivekitService,

  ) {
  }

  newMeeting() {
    const peer = this.webRtcService.getPeer()
    console.log(peer)
    this.router.navigate([`/meet/${peer.id}`], {state: {isNew: true, peerId: peer.id}});
  }

  newRoom() {
    this.router.navigate(['/room']);
  }

  participateToMeet() {
    this.router.navigate([`/meet/${this.remotePeerId()}`]);
  }
}
