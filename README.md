# constant-contact-oauth2-pkce-flow

##THIS IS NOT A FULLY DEVELOPED PAGE AND SHOULD NOT BE DEPLOYED IN THE WILD - ONLY RUN LOCALLY
Now that I have that out fo the way here is the purpose of my project - Analytics.
I do simple email anayltics for the company I work for and didn't like the layout of Constant Contact's (CC) reporting page. So I built a small page to connect to our CC account and get all the data necassary for a report. 
I highly suggest reading through CC developer Docs on their API. It's very comprehensive and well written. I have spent months as a noob putting this together so it's messy. BUT, I am open to questions and suggestions from whoever finds this. 
I have left comments through out the openAI.js file to help navigate it a bit. And no, ChatGPT did not write these files; I put a shit-ton of work and research into making it happen. ChatGPT was used to help make sense of what I couldn't, and provide springboards to keep going.

**Why only run locally?
Great question! It's not secure. Your developer key is completely exposed along with your redirect uri. Let a Node.js server make the connecttion for you make calls. 

**What doesn't it do?
A lot if I'm honest.
-No functionality for refresh token
-Only tested on Firefox (should work on Chrome? I don't have a mac to test on so . . .)
-Custom built for what I needed done
-No documentation (just comments and any support I can offer)
-Custom built for MY needs, but that doesn't mean you couldn't figure it out
-It uses DataTables 
  -Pros: super powerful, lots of functionality, clean look
  -Cons: documentation is kind of lacking, confusing at times, examples are not always useful (some don't seem updated)
  -Reason: I used it because it looked better than Bootstrap's basic table and I wanted the ability to search throught the data, highlight rows and export the data. DataTables provided that but at a cost
