const key = "fdecc623-9afa-4746-b91f-4da34ab42902";
const redirectURI = "http://localhost:8080/login.html";
const state = Math.random().toString(36).slice(2);

//Generates verifier and challenge
function generateCodeVerifier() {
    function dec2hex(dec) {
        return ('0' + dec.toString(16)).substring(-2)
      }
      
      function generateRandomString() {
        var array = new Uint32Array(56/2);
        window.crypto.getRandomValues(array);
        
        return Array.from(array, dec2hex).join('');
        
      }
    return generateRandomString();
  }
  
  // function generateCodeChallenge(codeVerifier) {
  //   // var encoder = new TextEncoder();
  //   // var data = encoder.encode(codeVerifier);
  
  //   // return sha256(data)
  //   //   .then((hashBuffer) => {
  //   //     var hashArray = Array.from(new Uint8Array(hashBuffer));
  //   //     var hashHex = hashArray
  //   //       .map(function(byte) {
  //   //         return byte.toString(16).padStart(2, '0');
  //   //       })
  //   //       .join('');
  
  //   //     return base64UrlEncode(hashHex);
  //   //   });
  //   var codeChallenge = base64UrlEncode(sha256(codeVerifier));
  //   return codeChallenge;
  // }
  async function generateChallenge(){
  function sha256(plain) { // returns promise ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }
  
  function base64urlencode(a) {
    var str = "";
    var bytes = new Uint8Array(a);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }


  async function challenge_from_verifier(v) {
    hashed = await sha256(v);
    let base64encoded = base64urlencode(hashed);
    localStorage.setItem('challenge', base64encoded);
    return base64encoded;
  }
  
  var challenge = await challenge_from_verifier(localStorage.getItem('verifier'));
  };
  //sends user to authorization endpoint
  function initiateAuthorization() {  
    var codeVerifier = generateCodeVerifier();
    localStorage.setItem('verifier', codeVerifier);
    generateChallenge();
    var authorizationUrl = new URL('https://authz.constantcontact.com/oauth2/default/v1/authorize')
    authorizationUrl.searchParams.set('client_id', key)
    authorizationUrl.searchParams.set('redirect_uri', redirectURI)
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set('code_challenge', localStorage.getItem('challenge'))
    authorizationUrl.searchParams.set('code_challenge_method', 'S256')
    authorizationUrl.searchParams.set('state', state)
    authorizationUrl.searchParams.set('scope', 'campaign_data offline_access');
    document.getElementById('dataSent').textContent = authorizationUrl;
    window.location.href = authorizationUrl;
  }
  
//gets access token
let accessToken;

//grabs the authorization code
  function handleCallback() {
    var queryParams = new URLSearchParams(window.location.search);
    var authorizationCode = queryParams.get('code');
  
    // Exchange the authorization code for an access token
    exchangeCodeForToken(authorizationCode);
  }


  function exchangeCodeForToken(authorizationCode) {
    var tokenEndpoint = 'https://authz.constantcontact.com/oauth2/default/v1/token';
    var codeVerifier = localStorage.getItem('verifier');
//check, may need to build new link instead of using object
    var tokenData = {
      client_id: key,
      redirect_uri: redirectURI,
      code: authorizationCode,
      code_verifier: codeVerifier,
      grant_type:"authorization_code"
    };
  
    axios.post(tokenEndpoint, new URLSearchParams(tokenData), {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
      .then(function(response) {
        var data = response.data;
        // Handle the access token
        accessToken = data.access_token;
        localStorage.setItem('accessToken', data.access_token);
      })
      .catch(function(error) {
        // Handle error
        console.error(error);
      });
  }

  function makeApiRequest(accessToken) {
    var apiUrl = 'https://api.cc.email/v3/emails';
  
    axios.get(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
      .then(function(response) {
        let result = response.data;
        document.getElementById('dataReturn').textContent = result;
      })
      .catch(function(error) {
        console.error(error);
      });
  }
  
