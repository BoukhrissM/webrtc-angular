import { Injectable } from '@angular/core';
import { MediasoupService } from './mediasoup.service';

@Injectable({
  providedIn: 'root',
})
export class RTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: { [key: string]: RTCPeerConnection } = {};

  constructor(private socketService: MediasoupService) {}

  async startLocalStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return this.localStream;
  }

  async setupWebRTC(roomCode: string) {
    // Create WebRTC transport
    const transportInfo = await this.socketService.createTransport();

    // Produce local media tracks
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const audioTrack = this.localStream.getAudioTracks()[0];

      const videoRtpParameters = this.generateRtpParameters(videoTrack);
      const audioRtpParameters = this.generateRtpParameters(audioTrack);

      const videoProducerId = await this.socketService.produce('video', videoRtpParameters);
      const audioProducerId = await this.socketService.produce('audio', audioRtpParameters);

      // Notify the server about the new producers
      this.socketService.emit('newProducer', { roomCode, producerId: videoProducerId, kind: 'video' });
      this.socketService.emit('newProducer', { roomCode, producerId: audioProducerId, kind: 'audio' });
    }

    // Handle incoming producers (remote streams)
    this.socketService.onNewProducer(({ userId, producerId, kind }) => {
      this.handleRemoteStream(userId, producerId, kind);
    });
  }

  private generateRtpParameters(track: MediaStreamTrack): any {
    return {
      codecs: [
        {
          mimeType: track.kind === 'video' ? 'video/VP8' : 'audio/opus',
          clockRate: track.kind === 'video' ? 90000 : 48000,
          channels: track.kind === 'audio' ? 2 : undefined,
          payloadType: track.kind === 'video' ? 96 : 97,
        },
      ],
      encodings: [
        {
          ssrc: Math.floor(Math.random() * 1000000), // Random SSRC
        },
      ],
      rtcp: {
        cname: 'mediasoup-client',
      },
    };
  }

  private async handleRemoteStream(userId: string, producerId: string, kind: string) {
    const peerConnection = new RTCPeerConnection();
    this.peerConnections[userId] = peerConnection;

    // Add remote track to the video container
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.socketService.emit('addRemoteVideo', { userId, remoteStream });
    };

    // Get RTP parameters for the consumer
    const rtpParameters = await this.socketService.consume(producerId);

    // Set remote description and create answer
    await peerConnection.setRemoteDescription(rtpParameters as any);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer back to the server
    this.socketService.emit('consumerAnswer', { producerId, answer });
  }
}
