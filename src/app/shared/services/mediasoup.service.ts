import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MediasoupService {
  private socket: Socket;
  private socketUrl:string = environment.socketUrl;

  constructor() {
    this.socket = io(this.socketUrl); // Connect to your Mediasoup server
  }

  // Expose the emit method
  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  createTransport() {
    return new Promise((resolve, reject) => {
      this.socket.emit('createTransport', {}, (response: any) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }

  produce(kind: string, rtpParameters: any) {
    return new Promise((resolve, reject) => {
      this.socket.emit('produce', { kind, rtpParameters }, (response: any) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }

  consume(producerId: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('consume', { producerId }, (response: any) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.rtpParameters); // Return the RTP parameters for the consumer
        }
      });
    });
  }

  onNewConsumer(callback: (consumerInfo: any) => void) {
    this.socket.on('newConsumer', callback);
  }

  onNewProducer(callback: (data: any) => void) {
    this.socket.on('newProducer', callback);
  }

  onAddRemoteVideo(callback: (data: any) => void) {
    this.socket.on('addRemoteVideo', callback);
  }

  joinRoom(roomCode: string) {
    this.socket.emit('joinRoom', { roomCode });
  }

  onDisconnect() {
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }
}
