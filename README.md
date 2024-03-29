# Constant Contact PKCE Flow Webpage

## Good to run locally
Now that I have that out of the way here is the purpose of my project - Analytics.
I do simple email analytics at the company I work for and didn't like the layout of Constant Contact's (CC) reporting page. So I built a small page to connect to our CC account and get all the data necessary for a report. 

I highly suggest reading through CC developer Docs on their API. It's very comprehensive and well-written. I have spent months as a noob putting this together so it's messy. BUT, I am open to questions and suggestions from whoever finds this. 
I have left comments throughout the openAI.js file to help navigate. And no, ChatGPT did not write these files; I put a lot of work and research into making it happen. ChatGPT was used to help make sense of what I couldn't, and provide springboards to keep going.

## Why only run locally?
Great question! It's not secure. Your developer credentials are completely exposed. Throw the authentication on a Node.js server to be more secure. 

## What can it do?
- Make a connection to CC server to grab email campaign data
- Displays that data in a nice table to look through
- Search emails in the search bar
- Only show emails between certain dates
- Sort the table by any metric displayed up top (default is date)
- Allows you to download the table as an Excel file or PDF
- Allows for SINGLE select or MULTI-select
	- Any row(s) that are selected will be the only rows saved as a pdf/excel
	- The same goes for any row(s) that are "hidden" when searching for emails between certain dates

## What doesn't it do?
A lot if I'm honest.
- No functionality for a refresh token
- Only tested on Firefox (Chrome/Edge testing coming soon. Safari is trickier.)
- No documentation (just comments and any support I can offer)
- Custom built for MY needs, but that doesn't mean you couldn't figure it out
- It uses DataTables 
  - Pros: super powerful, lots of functionality, clean look
  - Cons: Documentation is kind of lacking, confusing at times, examples are not always useful (some don't seem updated)
  - Reason: I used it because it looked better than Bootstrap's basic table and I wanted the ability to search through the data, highlight rows, and export the data. 

## How it works in short
1. Follow CC [Quick Start Guide](https://developer.constantcontact.com/api_guide/getting_started.html)
2. Set the redirect URI to your localhost:[port]/login.html
3. Download the project and open it in VS Code
4. Put the developer key in the openAI.js file where indicated (at the top)
5. Run Live Server (extension) on VS Code
6. Press "Connect to Constant Contact"
   - If it doesn't take you to a verification page to sign in to CC and/or you don't see a spinner icon, something went wrong. Check the console log
7. Press "Get Data". A Modal will pop up with a loading bar.
	- If it doesn't say completed, don't worry. Close the model and go to the next step.
8. Click "Display Data"
	- If the table fills out, great! If not, open up the Browser Inspect/Dev Tools, click Console, repeat step 6, Debug
