import {Component,  OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MediasoupService} from '../../shared/services/mediasoup.service';
import {RTCService} from '../../shared/services/rtc.service';

@Component({
  selector: 'app-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css'
})
export class RoomComponent implements  OnInit {
  localStream: MediaStream | null = null;
  remoteStreams: { [key: string]: MediaStream } = {};
  roomCode: string = '';

  constructor(
    private rtcService: RTCService,
    private mediasoupService: MediasoupService
  ) {}

  ngOnInit(): void {
    this.mediasoupService.onDisconnect();

    // Handle new remote streams
    this.mediasoupService.onAddRemoteVideo(({ userId, remoteStream }) => {
      this.addRemoteVideo(userId, remoteStream);
    });
  }

  async joinRoom() {
    if (!this.roomCode) {
      alert('Please enter a room code!');
      return;
    }

    try {
      // Start local video/audio stream
      this.localStream = await this.rtcService.startLocalStream();
      this.addLocalVideo(this.localStream);

      // Set up WebRTC transports and producers/consumers
      await this.rtcService.setupWebRTC(this.roomCode);

      // Notify server to join the room
      this.mediasoupService.joinRoom(this.roomCode);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    }
  }

  addLocalVideo(stream: MediaStream) {
    const videoContainer = document.getElementById('video-container');
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.muted = true; // Mute local video to avoid echo
    videoElement.classList.add('w-full', 'h-auto', 'rounded-lg');
    videoContainer?.appendChild(videoElement);
  }

  addRemoteVideo(userId: string, stream: MediaStream) {
    const videoContainer = document.getElementById('video-container');
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.classList.add('w-full', 'h-auto', 'rounded-lg');
    videoContainer?.appendChild(videoElement);

    // Store the remote stream for cleanup
    this.remoteStreams[userId] = stream;
  }

  ngOnDestroy() {
    // Clean up streams when the component is destroyed
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    Object.values(this.remoteStreams).forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
  }
}
