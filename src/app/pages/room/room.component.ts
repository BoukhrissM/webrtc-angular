import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {LivekitService} from '../../shared/services/livekit.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Participant, Room, RoomEvent, Track} from 'livekit-client';

@Component({
  selector: 'app-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css'
})
export class RoomComponent implements AfterViewInit {
  @ViewChild('localVideo') localVideoRef!: ElementRef;
  @ViewChild('remoteVideos') remoteVideosRef!: ElementRef;  // Container for remote videos

  roomName: string = 'test-room';
  userName: string = '';
  room: Room | null = null;
  isConnected: boolean = false;
  localTrack: any;
  remoteTracks: Track[] = [];  // Store remote tracks for multiple participants

  constructor(private livekitService: LivekitService) {
  }

  ngAfterViewInit() {
  }

  async joinRoom() {
    if (this.roomName && this.userName) {
      this.room = await this.livekitService.connectToRoom(this.roomName, this.userName);
      console.log("room is : ", this.room);
      this.isConnected = true;

      // Get local media track (video and audio)
      this.localTrack = await this.getLocalMedia();
      if (this.localVideoRef) {
        this.localVideoRef.nativeElement.srcObject = this.localTrack;
        this.localVideoRef.nativeElement.muted = true;
      }

      // Listen for participants joining
      this.room?.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
        console.log('Participant joined:', participant.identity);
        // Loop through each track publication and get the underlying track
        participant.trackPublications.forEach((publication) => {
          if (publication.kind === 'video') {
            // Access the track from the publication and pass it to addRemoteTrack
            this.addRemoteTrack(publication.track as Track);
          }
        });
      });

      // Listen for remote track (when another participant starts publishing video/audio)
      this.room?.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'video') {
          this.addRemoteTrack(track);
        }
      });

      // Listen for disconnect events
      this.room?.on(RoomEvent.Disconnected, () => {
        this.isConnected = false;
        this.room = null;
        this.localTrack.stop();
        this.localVideoRef.nativeElement.srcObject = null;
      });
    }
  }

  // Get local media (audio and video)
  async getLocalMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }

  // Handle remote tracks (participants' video/audio)
  addRemoteTrack(track: Track) {
    if (track.kind === 'video') {
      this.remoteTracks.push(track);
      const remoteVideo = document.createElement('video');
      remoteVideo.autoplay = true;
      remoteVideo.srcObject = track.mediaStream as MediaStream;
      this.remoteVideosRef.nativeElement.appendChild(remoteVideo);
    }
  }

  disconnect() {
    this.livekitService.disconnect();
    this.isConnected = false;
  }
}
