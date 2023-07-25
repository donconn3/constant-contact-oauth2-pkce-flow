const key = "fdecc623-9afa-4746-b91f-4da34ab42902";
const redirectURI = "http://localhost:8080/login.html";
const state = Math.random().toString(36).slice(2);


//Generates verifier and challenge
function generateCodeVerifier() {
    function dec2hex(dec) {
        return ('0' + dec.toString(16)).substring(-2)
      }
      
      function generateRandomString() {
        var array = new Uint32Array(26/2);
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
async function generateLink(){
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

  //sends user to authorization endpoint
  async function initiateAuthorization() {  
    var codeVerifier = generateCodeVerifier();
    localStorage.setItem('verifier', codeVerifier);
    await generateChallenge(codeVerifier);
    await generateLink();
    
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


let bulkEmails = [];
let emails = [];

  async function makeApiRequest() {
    var apiReport = 'https://api.cc.email/v3/reports/summary_reports/email_campaign_summaries';
    var apiEmail = 'https://api.cc.email/v3/emails/'
    let accessToken = localStorage.getItem('accessToken');
    emails =[];
  
    await axios.get(apiReport, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
      .then(function(response1) {
        bulkEmails = response1.data.bulk_email_campaign_summaries;
      }).catch(function(error) {
          console.error(error);
      });

        for(let i = 0; i < bulkEmails.length; i++){
          setTimeout(function() {            
             axios
            .get(apiEmail + bulkEmails[i].campaign_id, {
                headers: {
                  'Authorization': 'Bearer ' + accessToken
                }
              })
              .then((response2) =>{
                   Promise.all([
                      axios.get(apiEmail + 'activities/' + response2.data.campaign_activities[0].campaign_activity_id, {
                        headers: {
                          'Authorization': 'Bearer ' + accessToken
                        }
                      }),
                      axios.get(apiEmail + 'activities/' + response2.data.campaign_activities[0].campaign_activity_id + '/send_history', {
                        headers: {
                          'Authorization': 'Bearer ' + accessToken
                        }
                      })
                ])
                .then(async([res1, res2]) => {
                  const value1 = await res1.data;
                  const value2 = await res2.data;

                  let email ={
                    activity_id:response2.data.campaign_activities[0].campaign_activity_id,
                    campaign_id:bulkEmails[i].campaign_id,
                    name:response2.data.name,
                    subject:value1.subject,
                    sends:bulkEmails[i].unique_counts.sends,
                    opens:bulkEmails[i].unique_counts.opens,
                    clicks:bulkEmails[i].unique_counts.clicks,
                    spam:bulkEmails[i].unique_counts.abuse,
                    unsubscribe:bulkEmails[i].unique_counts.optouts,
                    time_sent:new Date(value2[0].run_date)
                  };

                  emails.push(email);
                  
                })
              })
      }, "700" * i);
    };
    localStorage.setItem('data', JSON.stringify(emails));
  }
  //below will be broken until I can finish adding all calls for campaigns
  function displayData(){
    const emailTable = document.getElementById("myTable");
    if(emails.length === 0){
      emails = JSON.parse(localStorage.getItem("data"));
      console.log(emails);
    };
    
    let placeholder = document.querySelector('#data-output');
    let display = "";
    let counter = 1;
    for(let email of emails){
        display += `
        <tr>
        <td>${counter}</td>
        <td>${email.activity_id}</td>
        <td>${email.campaign_id}</td>
        <td>${email.name}</td>
        <td>${email.subject}</td>
        <td>${email.sends}</td>
        <td>${email.opens}</td>
        <td>${email.clicks}</td>
        <td>${email.spam}</td>
        <td>${email.unsubscribe}</td>
        <td>${email.time_sent}</td>
      </tr>`;
      counter++;
    }
    placeholder.innerHTML = display;
    
    let table = new DataTable(emailTable,{
        "columns": [
          {data: counter},
          { "visible": false},
          { "visible": false},
          { "data": 'name' },
          { "data": 'subject' },
          { "data": 'sends' },
          { "data": 'opens' },
          { "data": 'clicks' },
          { "data": 'spam' },
          { "data": 'unsubscribe' },
          { "data": 'time_sent' }
      ]
        
      });
  }

  function getSingleEmailCampaignDetails(id) {
    var apiUrl = 'https://api.cc.email/v3/emails/' + id;
    let accessToken = localStorage.getItem('accessToken');
  
    axios.get(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
      .then(function(response) {
        singleCampaignDataActivityId = response.data.campaign_activities[0].campaign_activity_id;
        // document.getElementById('dataReturn').textContent = JSON.stringify(bulkEmails[0].name);
        // console.log(bulkEmails)
      })
      .catch(function(error) {
        console.error(error);
      });
  }

//   async function individualData(this){
//     let singleCampaignDataActivityId = {};
//     let singleCampaignActivity = {};
//     let singleCampaignSendHistory = {};
// https://blog.skay.dev/custom-spa-router-vanillajs   // deals with path routing and state management
// // create popup and create api calls, make sure 2nd and 3rd calls are async/await

//   }
