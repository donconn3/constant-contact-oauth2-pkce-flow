//const axios = require('axios').default;

let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.error('crypto support is disabled!');
} 

const key = "fdecc623-9afa-4746-b91f-4da34ab42902";
const redirectURI = "http://localhost:8080/index.html";
const state = Math.random().toString(36).slice(2);

const test = document.getElementById('dataReturn');

// const http = axios.create({
//     baseURL: 'https://some-domain.com/api/'
//   });

 const authorizationRequest = () => {
    axios
        .get(authURL)
        .then(response => {
            let result = response.data;
            document.getElementById('dataReturn').innerHTML = result;
        })
        .catch(error => console.error(error))
}

// function dec2hex(dec) {
//     return ('0' + dec.toString(16)).substring(-2)
//   }
  
//   function generateRandomString() {
//     var array = new Uint32Array(56/2);
//     window.crypto.getRandomValues(array);
//     return Array.from(array, dec2hex).join('');
//   }
  
//   var verifier = generateRandomString();
  

//   function sha256(plain) { // returns promise ArrayBuffer
//     const encoder = new TextEncoder();
//     const data = encoder.encode(plain);
//     return window.crypto.subtle.digest('SHA-256', data);
//   }
  
//   function base64urlencode(a) {
//         var str = "";
//         var bytes = new Uint8Array(a);
//         var len = bytes.byteLength;
//         for (var i = 0; i < len; i++) {
//           str += String.fromCharCode(bytes[i]);
//         }
//         return btoa(str)
//           .replace(/\+/g, "-")
//           .replace(/\//g, "_")
//           .replace(/=+$/, "");
//       }
  
//   async function challenge_from_verifier(v) {
//     var hashed = await sha256(v);
//     var base64encoded = base64urlencode(hashed);
//     return base64encoded;

//   }

// //challenge_from_verifier(verifier).then(challenge => {return challenge});
// const result = async() =>{
//   await challenge_from_verifier(verifier)

// };


// Dependency: Node.js crypto module
// https://nodejs.org/api/crypto.html#crypto_crypto
function base64URLEncode(str) {
  return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}
var verifier = base64URLEncode(crypto.randomBytes(32));



const authorizationURL = new URL('https://authz.constantcontact.com/oauth2/default/v1/authorize')
authorizationURL.searchParams.set('client_id', key)
authorizationURL.searchParams.set('redirect_uri', redirectURI)
authorizationURL.searchParams.set('response_type', 'code')
authorizationURL.searchParams.set('code_challenge', )
authorizationURL.searchParams.set('code_challenge_method', 'SHA-256')
authorizationURL.searchParams.set('state', state)
authorizationURL.searchParams.set('scope', 'campaign_data offline_access')
test.textContent = verifier;