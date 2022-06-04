# Doomsday Season 2 Hit Confirm Bot

Nodejs script that looks for vulnerable bunkers and confirms hits.

### Requirements:

- [Nodejs](https://nodejs.org/en/)
- [Alchemy Account](https://www.alchemy.com) (free tier available) 

### Installing

`npm install`

### Preparation

Make sure you have a little bit of MATIC in your account. 0.5 MATIC would be more than enough.

Sign up for a free Alchemy account, and generate an API key for the Polygon (MATIC) network

Suggested to create a new ETH address from a new seed phrase for this, as it's never a good idea to trust you important 
keys to random stuff. 


### Config

Create a file called `.env` in the main directory (same directory as this readme file)

Copy the contents of `.env.example`, but replace `YOUR_ALCHEMY_KEY_GOES_HERE` and `YOUR_PRIVATE_KEY_GOES_HERE` with your
 Alchemy API key and Private key respectively. 

Note: keep the quotation marks in there.

With the private key, make sure you don't include the `0x` at the start.

### Running the Bot

in command console, in this directory, run this command:

`npm start`


The bot will start and do it's own thang until the game ends or until you close it