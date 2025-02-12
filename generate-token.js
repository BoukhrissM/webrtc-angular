const { AccessToken } = require('livekit-server-sdk'); // Import LiveKit SDK

const apiKey = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Replace with your API Key
const apiSecret = 'q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'; // Replace with your API Secret
const roomName = 'my-room'; // Room name
const participantName = 'admin'; // Participant name

// Initialize the AccessToken from LiveKit Server SDK
async function generateToken() {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });
  // Set up the payload for the token (identity and room)
  token.addGrant({roomAdmin: true, roomJoin: true, room: roomName, roomCreate: true });

  // Await the generation of the token
  const jwtToken = await token.toJwt();  // Wait for the token to be generated
  console.log('Generated LiveKit Token:', jwtToken);  // Print the token
}

generateToken();  // Call the async function to generate the token
