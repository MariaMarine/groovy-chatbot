# Groovy Foxbot
A test project for a chatbot that helps the user find [Groovy Fox](https://groovyfox.bg/) shoe models and festival locations where they can be found.

Created with [Bot Framework](https://dev.botframework.com/), [Language Understanding using LUIS](https://www.luis.ai/) and [MongoDB](https://www.mongodb.com/).

# To run the bot
- Install modules
    ```bash
    npm install
    ```
- Build the bot source code
    ```bash
    npm run build
    ```

- Start the bot
    ```bash
    npm start
    ```

# To use the bot
- Make sure you have MongoDB running (for access to conversation history) 
- Install the [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases) 
- Launch the Bot Framework Emulator
- File -> Open Bot
- Navigate to the `groovy-foxbot` folder
- Select the `groovy-foxbot.bot` file
- Enjoy!
