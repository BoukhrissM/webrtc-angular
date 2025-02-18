import {Injectable} from '@angular/core';
import {createLocalAudioTrack, createLocalVideoTrack, Room, RoomEvent, RoomOptions} from 'livekit-client';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

// const { AccessToken } = require('livekit-server-sdk');

@Injectable({
  providedIn: 'root'
})
export class LivekitService {
  private room: Room | null = null;
  private wsUrl = environment.liveKitEndpoint;     // WebSocket signaling server
  // private TOKEN_ENDPOINT = environment.tokenGeneratorEndpoint;

  constructor(private http: HttpClient) {
    this.room = new Room();
  }

  // async connectToRoom(roomName: string, userName: string) {
  //   try {
  //     const res = await firstValueFrom(this.generateRoomToken(userName,roomName));
  //     if (this.room == null) {
  //       this.room = new Room();
  //     }
  //     await this.room.connect(this.wsUrl, res.token);
  //     console.log('Connected to LiveKit room:', roomName);
  //
  //     this.room.on(RoomEvent.ParticipantConnected, (participant) => {
  //       console.log('Participant joined:', participant.identity);
  //     });
  //
  //     this.room.on(RoomEvent.Disconnected, () => {
  //       console.log('Disconnected from room');
  //       this.room = null;
  //     });
  //
  //   } catch (error) {
  //     console.error('Error connecting to room:', error);
  //   }
  //   return this.room;
  // }


  // async connectToRoom(roomName: string, userName: string): Promise<void> {
  //   let rtcConf: RTCConfiguration = {
  //     iceServers:[
  //       {urls:[
  //           'stun:stun.l.google.com:19302', // STUN server
  //           'turn:myturnserver.com:3478?transport=udp', // TURN server (UDP)
  //           'turn:myturnserver.com:3478?transport=tcp', // TURN server (TCP)
  //         ],
  //         username:"booukhriss",
  //         credential:"booukhriss"
  //       }
  //     ],
  //     iceTransportPolicy: "relay"
  //   }
  //   const resToken = await firstValueFrom(this.generateRoomToken(userName,roomName))
  //   // Connect to the room
  //   await this.room?.connect(this.wsUrl,resToken.token,{rtcConfig:rtcConf});
  //   // Create local audio and video tracks
  //   const audioTrack = await createLocalAudioTrack();
  //   const videoTrack = await createLocalVideoTrack();
  //   // Publish the tracks to the room
  //   await this.room?.localParticipant.publishTrack(audioTrack);
  //   await this.room?.localParticipant.publishTrack(videoTrack);
  //   console.log(`Room ${roomName} created successfully`);
  // }



  disconnect() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
  }

  // public generateRoomToken(nameParticipant: string, roomName: string) {
  //   return this.http.get<{ token: string }>(`${this.TOKEN_ENDPOINT}/livekit/generate-token`, {
  //     params: {
  //       nameParticipant,
  //       roomName
  //     }
  //   })
  // }
}
