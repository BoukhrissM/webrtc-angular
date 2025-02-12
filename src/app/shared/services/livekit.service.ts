import {Injectable} from '@angular/core';
import {Room, RoomEvent} from 'livekit-client';
import {firstValueFrom, Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../environments/environment';

// const { AccessToken } = require('livekit-server-sdk');

@Injectable({
  providedIn: 'root'
})
export class LivekitService {
  private room: Room | null = null;
  private wsUrl = environment.liveKitEndpoint;     // WebSocket signaling server

  constructor(private http: HttpClient) {

  }

  async connectToRoom(roomName: string, userName: string) {
    try {
      const res = await firstValueFrom(this.generateRoomToken(userName,roomName));
      if (this.room == null) {
        this.room = new Room();
      }
      await this.room.connect(this.wsUrl, res.token);
      console.log('Connected to LiveKit room:', roomName);

      this.room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant joined:', participant.identity);
      });

      this.room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        this.room = null;
      });

    } catch (error) {
      console.error('Error connecting to room:', error);
    }
    return this.room;
  }


  disconnect() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
  }

  public generateRoomToken(nameParticipant: string, roomName: string) {
    return this.http.get<{ token: string }>("/livekit/generate-token", {
      params: {
        nameParticipant,
        roomName
      }
    })
  }
}
