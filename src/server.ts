import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const {AccessToken} = require('livekit-server-sdk'); // Import LiveKit SDK

const apiKey = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Replace with your API Key
const apiSecret = 'q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'; // Replace with your API Secret


// Initialize the AccessToken from LiveKit Server SDK
async function generateToken(participantName: string, roomName: string) {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });
  // Set up the payload for the token (identity and room)
  // roomAdmin: true
  token.addGrant({roomJoin: true, room: roomName, roomCreate: true});

  // Await the generation of the token
  // Wait for the token to be generated
  return await token.toJwt();
}

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use("/livekit/generate-token", async (req, res) => {
  const {nameParticipant, roomName} = req.query;
  if (!nameParticipant) {
    return res.status(404).send('Not Found');
  }
  try {
    // Wait for the token to be generated asynchronously
    const token = await generateToken(`${nameParticipant}`, `${roomName}`);
    return res.status(200).send({token});
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).send({error: "Failed to generate token"});
  }
});

// Handle dynamic routes for '/meet/**'
app.use('/meet/**', (req, res, next) => {
  const requestedUrl = req.originalUrl;
  const peerIdMatch = requestedUrl.match(/\/meet\/([^/]+)/); // Extract peerId from the URL

  if (peerIdMatch) {
    const peerId = peerIdMatch[1]; // Extracted peerId from URL
    const prerenderParams = [{ peerId }];

    // Render the dynamic route with prerender parameters
    angularApp
      .handle(req, prerenderParams) // Inject peerId into prerendering
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next()
      )
      .catch(next);
  } else {
    next(); // Proceed to the next handler if peerId is not found
  }
});


app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);

});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
