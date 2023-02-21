// Developed by PS8 Network

const Discord = require('discord.js');
const Twitter = require('twitter');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');

// Set up Twitter API credentials
const twitterClient = new Twitter({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token_key: config.twitter.access_token_key,
    access_token_secret: config.twitter.access_token_secret
});

// Set up Discord bot credentials
const discordClient = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ]
  })
const discordToken = config.discord.token;

// Define global variables for tracking already posted tweets
let lastTweetId = null;
let postedTweetIds = [];

// Define function to read the temporary file of already posted tweet IDs
function readPostedTweetIds() {
  try {
    const data = fs.readFileSync('posted_tweet_ids.txt', 'utf8');
    postedTweetIds = data.split('\n').filter(id => id !== '');
    lastTweetId = postedTweetIds[0];
  } catch (err) {
    console.error(err);
  }
}

// Define function to write the temporary file of already posted tweet IDs
function writePostedTweetIds() {
  fs.writeFile('posted_tweet_ids.txt', postedTweetIds.join('\n'), (err) => {
    if (err) console.error(err);
  });
}

// Define function to check for new tweets from a specific user
function checkForNewTweets() {
  // Retrieve the latest tweet from the user's timeline
  twitterClient.get('statuses/user_timeline', { screen_name: 'user_id', count: 1, tweet_mode: 'extended' }, function(error, tweets, response) {
    if (!error) {
      const latestTweet = tweets[0];
      // Exclude retweets, quoted tweets, reply tweets, and already posted tweets
      if (!latestTweet.retweeted_status && !latestTweet.in_reply_to_status_id && !latestTweet.quoted_status && latestTweet.id_str !== lastTweetId && !postedTweetIds.includes(latestTweet.id_str)) {
        // Post the tweet in Discord
        discordClient.channels.cache.get('channel_id').send(`https://twitter.com/${latestTweet.user.screen_name}/status/${latestTweet.id_str} <@& discord_role_id>`);

        // Add the posted tweet ID to the list of already posted tweets
        postedTweetIds.push(latestTweet.id_str);

        // Update the last tweet ID for tracking purposes
        lastTweetId = latestTweet.id_str;

        // Write the updated list of already posted tweet IDs to the temporary file
        writePostedTweetIds();
      }
    }
  });
}

// Set up a loop to check for new tweets on a regular interval
setInterval(checkForNewTweets, 6000);  // Check for new tweets every 6 second

// Start the Discord bot
discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  readPostedTweetIds();
});
discordClient.login(discordToken);

// Developed by PS8 Network