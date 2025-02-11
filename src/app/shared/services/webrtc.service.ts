import { Injectable } from '@angular/core';
import Peer from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {

  private peer!:Peer;
  private localStream!: MediaStream;
  constructor() {
    this.peer = new Peer();
  }

  async initLocalStream() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    return this.localStream;
  }

  getPeer(){
    return this.peer;
  }

  connectToPeer(remotePeerId:string){
    return this.peer.connect(remotePeerId);
  }
}
