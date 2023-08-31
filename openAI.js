//** START OF OAUTH2 PKCE FLOW */
const key = YOUR_DEVELOPER_KEY;
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
    //document.getElementById('dataSent').textContent = authorizationUrl;
    window.location.href = authorizationUrl;
}

  //sends user to authorization endpoint
  async function initiateAuthorization() {  
    var codeVerifier = generateCodeVerifier();
    localStorage.setItem('verifier', codeVerifier);
    await generateChallenge(codeVerifier);
    await generateLink();
    
  }
//grabs the authorization code
  function handleCallback() {
    var queryParams = new URLSearchParams(window.location.search);
    var authorizationCode = queryParams.get('code');
  
    // Exchange the authorization code for an access token
    exchangeCodeForToken(authorizationCode);
  }
//gets access token
let accessToken;

  function exchangeCodeForToken(authorizationCode) {
    var tokenEndpoint = 'https://authz.constantcontact.com/oauth2/default/v1/token';
    var codeVerifier = localStorage.getItem('verifier');
//check, may need to build new link instead of using object
    var tokenData = {
      client_id: key,
      redirect_uri: redirectURI,
      code: authorizationCode,
      code_verifier: codeVerifier,
      grant_type:'authorization_code'
    };
  
    axios.post(tokenEndpoint, new URLSearchParams(tokenData), {
      headers: {
        "Accept": "application/json",
        'Content-Type': 'application/x-www-form-urlencoded'
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
      })
      .finally(function(){
        location.assign("http://localhost:8080/");
      }
  )}
//** END OF OAUTH2 PKCE FLOW*/
//If you're looking to MAKE a connection to Constant Contact, use the above code.

//**START OF FIRST API CALL*/
let bulkEmails = [];
let emails = [];
let emailCount = 0;
const progressBody = document.getElementById("load-body");
const progressBar = document.getElementById("load-bar");
const modalTitle = document.getElementById("load-title");

//Function makes 1 API call to get 50(default amount) emails
//Then loops through each campaign to make 3 more calls
  async function makeApiRequest() {
    var apiReport = 'https://api.cc.email/v3/reports/summary_reports/email_campaign_summaries';
    var apiEmail = 'https://api.cc.email/v3/emails/'
    let accessToken = localStorage.getItem('accessToken');
    emails =[];
    emailCount = 0;
  
    await axios.get(apiReport, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
      .then(function(response1) {
        bulkEmails = response1.data.bulk_email_campaign_summaries;
      }).catch(function(error) {
          console.error(error + ": Something went wrong with the first API call to Constant Contact.");
      });

        for(let i = 0; i < bulkEmails.length; i++){
          //The timeout is needed because of the number of asynchronus calls being made
          setTimeout(function() {
              emailCount += 2;
              progressBody.ariaValueNow = emailCount;
              progressBar.style.width = emailCount + "%";            
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
                  let options = {  
                    year: "numeric", month: "short",  
                    day: "numeric", hour: "2-digit", minute: "2-digit"  
                };  
                  
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
              //updates local storage with the data that was downloaded so you can search/view it with out having to make the api calls again
              localStorage.setItem('data', JSON.stringify(emails));
              emailCount == 100 ? modalTitle.innerHTML = "Download Complete" : null;
      }, "850" * i);
      
    }
    
  }
//** END OF FIRST API CALL */

  //displays the email data using DataTables, Moment, Bootstrap5
  function displayData(){  
    let open_rate;
    const emailTable = document.getElementById("myTable");
    if(emails.length === 0){
      emails = JSON.parse(localStorage.getItem("data"));
      console.log(emails);
    }
    //organizes the emails in order of time sent
    let sortedDates = emails.sort((p1, p2) => (p1.time_sent > p2.time_sent) ? 1 : (p1.time_sent < p2.time_sent) ? -1 : 0);
    //loops through the array and subtracts 4 hours to get the correct time for my timezone. Yours may differ
    for(let email of sortedDates){
        let newTime = moment(email.time_sent).subtract(4,'hours');
        email.time_sent = newTime.toISOString();
        
      }
    
    let placeholder = document.querySelector('#data-output');
    let display = "";
    
    for(let email of sortedDates){
        display += `
        <tr >
        <td>${email.activity_id}</td>
        <td>${email.campaign_id}</td>
        <td>${email.name}</td>
        <td>${email.subject}</td>
        <td>${email.sends}</td>
        <td>${open_rate}</td>
        <td>${email.opens}</td>
        <td>${open_rate}</td>
        <td>${email.clicks}</td>
        <td>${open_rate}</td>
        <td>${open_rate}</td>
        <td>${email.spam}</td>
        <td>${open_rate}</td>
        <td>${email.unsubscribe}</td>
        <td>${open_rate}</td>
        <td>${email.time_sent}</td>
      </tr>`;
     
    }
    placeholder.innerHTML = display;
   
// Custom filtering function which will search data in column four between two values
    let table = new DataTable(emailTable,{
      dom: "<'row'<'col'B><'col'fr>><t><'row'<'col'lip>>",
      'buttons': [
          {
            extend: 'copy',
            className:'btn btn-warning btn-md gap-1',
            exportOptions: { 
              orthogonal: 'export',
              columns: ':visible' 
            }
        },
       
        {
            extend: 'excel',
            className:'btn btn-warning btn-md gap-1',
            customize: function( xlsx ) {
              // see built in styles here: https://datatables.net/reference/button/excelHtml5
              //https://datatables.net/forums/discussion/43973/excel-customization-with-4-decimal-places#Comment_116636
                var sSh = xlsx.xl['styles.xml'];
              //below could be replaced with use of .innerHtml but that doesn't work in IE
                var newPercentageFormat =sSh.childNodes[0].childNodes[0].childNodes[3].cloneNode(false);
                newPercentageFormat.setAttribute('formatCode','##0.00%');
                newPercentageFormat.setAttribute('numFmtId','180');
                sSh.childNodes[0].childNodes[0].appendChild(newPercentageFormat);
                $(sSh).find('numFmts').attr('count', '7');
                $(sSh).find('xf[numFmtId="9"]').attr('numFmtId', '180');
                var sheet = xlsx.xl.worksheets['sheet1.xml'];
                $('row c[r^="B"]', sheet).attr( 's', '63' );
                $('row c[r^="C"]', sheet).attr( 's', '63' );
                $('row c[r^="D"]', sheet).attr( 's', '63' );
                $('row c[r^="F"]', sheet).attr( 's', '63' );
                $('row c[r^="K"]', sheet).attr( 's', '63' );
                
    
              },
            exportOptions: { 
              orthogonal: 'export',
              columns: [3,4,5,6,7,8,9,10,11,12,13,14,15] 
            }
        },
        {
            extend: 'pdf',
            className:'btn btn-warning btn-md gap-1',
            orientation: 'landscape',
            pageSize: 'LETTER',
            exportOptions: { 
              orthogonal: 'export',
              columns: [3,4,5,6,7,8,9,10,11,12,13,14,15] 
            }
        },       
            ],
           
        columns: [
          { "visible": false},
          { "visible": false},
          { "data": 'name',
          render: function(data, type, row, meta){
            return data.replaceAll('&amp;', '&');}
          },
          { "data": 'subject',
          render: function(data, type, row, meta){
            return data.replaceAll('&amp;', '&');
          } },
          { "data": 'sends',
          render: DataTable.render.number()  },
          {"data": "test"},
          { "data": 'opens',
          render: DataTable.render.number() },
          {"data": null,
          title: "Open %",
          "render": function(data, type, row){
            return Number.parseFloat((data["opens"] / data["sends"]) * 100).toFixed(2) + '%'}},
          { "data": 'clicks',
          render: DataTable.render.number()  },
          {"data": null,
          title: "Click %",
          "render": function(data, type, row){
            return Number.parseFloat((data["clicks"] / data["sends"]) * 100).toFixed(2) + '%'}},
          {"data": null,
          title: "C2O %",
          "render": function(data, type, row){
            return Number.parseFloat((data["clicks"] / data["opens"]) * 100).toFixed(2) + '%'}},
          { "data": 'spam',
          render: DataTable.render.number()  },
          {"data": null,
          title: "Spam %",
          "render": function(data, type, row){
            return Number.parseFloat((data["spam"] / data["sends"]) * 100).toFixed(2) + '%'}},
          { "data": 'unsubscribe',
          render: DataTable.render.number()  },
          {"data": null,
          title: "Unsub %",
          "render": function(data, type, row){
            return Number.parseFloat((data["unsubscribe"] / data["sends"]) * 100).toFixed(2) + '%'}},
          { "data": 'time_sent',
          render: DataTable.render.datetime('','MMM Do YYYY, ddd h:mm A', 'en') },
      ],
    
    order:[[15, 'desc']],
    select: {
        style: 'os'
        },
        
      }); 
      //below up is for the calendar search
      let minDate, maxDate;
      DataTable.ext.search.push(function (settings, data, dataIndex) {
    let min = minDate.val();
    let max = maxDate.val();
    let date = new Date(moment(data[15], 'MMM Do YYYY'));
 
    if (
        (min === null && max === null) ||
        (min === null && date <= max) ||
        (min <= date && max === null) ||
        (min <= date && date <= max)
    ) {
        return true;
    }
    return false;
});
 
// Create date inputs
minDate = new DateTime('#min', {
    format: 'MMM Do YYYY'
});
maxDate = new DateTime('#max', {
    format: 'MMM Do YYYY'
});
       // Refilter the table
document.querySelectorAll('#min, #max').forEach((el) => {
  el.addEventListener('change', () => table.draw());
  
});

//Highlights the row on click (makes it easier to keep track of the data you want to focus on)
table.on('click', 'tbody tr', (e) => {
  let classList = e.currentTarget.classList;

  if (classList.contains('selected')) {
      classList.remove('selected');
  }
  else {
      table.rows('.selected').nodes().each((row) => row.classList.remove('selected'));
      classList.add('selected');
  }
}); 

// This calculates the addition or loss of user emails sent between email campaigns
//**It does not recalculate live. It happens once on "Display" */
let summary = $('#myTable').DataTable();
   // Loop through the rows to add tracking column and update values
  // Update tracking values when the DataTable is sorted
function updateTrackingValues(){
    summary.rows({ order: 'current' }).every(function(rowIdx, tableLoop, rowLoop) {
        var rowData = this.data();
        var prevCellData = rowIdx > 0 ? summary.cell({ row: rowIdx - 1, column: summary.column('#sends').index() }).data() : 0;
  
        // Calculate and update the tracking value
        var trackingValue = rowIdx === 0 ? rowData['sends'] : (prevCellData - rowData['sends']) * -1;
        summary.cell(rowIdx, summary.column('#test').index()).data(trackingValue);
            // Redraw the table after updating tracking values
    summary.draw(false);
    });
  }
  updateTrackingValues();

  }


