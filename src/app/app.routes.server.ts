import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'meet/:peerId',
    renderMode: RenderMode.Client
  },
  {
    path: 'room',
    renderMode: RenderMode.Client
  }

];
