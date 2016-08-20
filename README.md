# Oikotie Guard

Keeps track of Oikotie listings with a specific search terms. Sends a mail notification when new listings found.

## Usage

1. Install node@4
2. `cp config.json.sample config.json`
3. Modify `config.json` to include your gmail address and proper API URL for Oikotie search. Oikotie search API can be most easily found by searching on Oikotie with Chrome network inspector open, and filtering with "api".
4. `npm install`
5. EMAIL_PW="your-gmail-password" `npm start`. Please note that app-specific passwords may need to be used if 2 factor auth is enabled for the account.


## Motivation

Implemented because Oikotie guards do not support free text search.
