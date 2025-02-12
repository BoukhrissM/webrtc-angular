import {Routes} from '@angular/router';



export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/meet/meet.component').then(m => m.MeetComponent),
  },
  {
    path: 'meet/:peerId',
    loadComponent: () => import('./pages/video-call/video-call.component').then(p => p.VideoCallComponent),

  },
  {
    path: 'room',
    loadComponent: () => import('./pages/room/room.component').then(p => p.RoomComponent),
  }
];
