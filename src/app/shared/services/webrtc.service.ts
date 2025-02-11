import { Injectable } from '@angular/core';
import Peer from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {

  private peer!:Peer;
  private localStream!: MediaStream;
  private localScreenStream!:MediaStream;
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

  async initDisplayStream(){
    this.localScreenStream =  await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    return this.localScreenStream;
  }

  getPeer(){
    return this.peer;
  }

  connectToPeer(remotePeerId:string){
    return this.peer.connect(remotePeerId);
  }
}
