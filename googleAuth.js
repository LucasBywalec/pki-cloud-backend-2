const OAuth2Data = require('../google_key.json');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

async function googleUser(idToken, accessToken) {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      }
    );
  
    const result = await response.json();
  
    if (response.status === 200) {
      return result;
    }
  }
  
  exports.googleUser = googleUser;
  

const googleAuthToken = async (code) => {
  const options = {
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URL,
    grant_type: 'authorization_code'
  };

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(options)
  });

  const result = await response.json();
  
  if (response.status === 200) {
    return result;
  }
};

exports.googleAuthToken = googleAuthToken;
