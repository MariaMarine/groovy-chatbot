// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActionTypes, ActivityTypes, CardAction, CardFactory, ConversationState, MessageFactory, RecognizerResult, StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { DialogContext, DialogSet, DialogState, DialogTurnResult, DialogTurnStatus } from 'botbuilder-dialogs';
import { BotConfiguration, LuisService } from 'botframework-config';
import * as mongoose from 'mongoose';
import { GreetingDialog, UserProfile } from './dialogs/greeting';
import { WelcomeCard } from './dialogs/welcome';
import { Festivals } from './festivals';
import { FestivalLocations } from './locations';
import { ShoeModels } from './models';
import { ShoeDTO } from './shoeDTO';
import { ShoeTypes } from './shoeTypes';

// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'greetingStateProperty';

// this is the LUIS service type entry in the .bot file.
const LUIS_CONFIGURATION = 'groovyfoxbot';
export class BasicBot {
    private userProfileAccessor: StatePropertyAccessor<UserProfile>;
    private dialogState: StatePropertyAccessor<DialogState>;
    private luisRecognizer: LuisRecognizer;
    private readonly dialogs: DialogSet;
    private conversationState: ConversationState;
    private userState: UserState;
    private coversationId: string;

    /**
     * Constructs the three pieces necessary for this bot to operate:
     * 1. StatePropertyAccessor for conversation state
     * 2. StatePropertyAccess for user state
     * 3. LUIS client
     * 4. DialogSet to handle our GreetingDialog
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     * @param {BotConfiguration} botConfig contents of the .bot file
     */
    constructor(conversationState: ConversationState, userState: UserState, botConfig: BotConfiguration) {
        if (!conversationState) { throw new Error('Missing parameter.  conversationState is required'); }
        if (!userState) { throw new Error('Missing parameter.  userState is required'); }
        if (!botConfig) { throw new Error('Missing parameter.  botConfig is required'); }

        // add the LUIS recognizer
        let luisConfig: LuisService;
        luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION) as LuisService;
        if (!luisConfig || !luisConfig.appId) { throw new Error('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n'); }
        this.luisRecognizer = new LuisRecognizer({
          applicationId: luisConfig.appId,
          // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
          endpoint: luisConfig.getEndpoint(),
          endpointKey: luisConfig.authoringKey,
        });

        // Create the property accessors for user and conversation state
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Create top-level dialog(s)
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));

        this.conversationState = conversationState;
        this.userState = userState;
    }

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity
     * 2. Use LUIS to recognize intents for incoming user message
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    public onTurn = async (context: TurnContext) => {
        const botResponses = [];
        this.coversationId = context.activity.conversation.id;
        if (context.activity.type === ActivityTypes.Message) {
            let dialogResult: DialogTurnResult;

            // Create a dialog context
            const dc = await this.dialogs.createContext(context);

            // Perform a call to LUIS to retrieve results for the current activity message.
            const results = await this.luisRecognizer.recognize(context);
            const topIntent = LuisRecognizer.topIntent(results);
            const entities = results.entities;
            dialogResult = await dc.continueDialog();
            context.onSendActivities(async (ctx, activities, next) => {
                const msgs = activities.filter((a) => a.type === 'message');
                for (const msg of msgs ) {
                    if (msg.text) {
                        botResponses.push(msg.text);
                    }
                    if (msg.suggestedActions) {
                        botResponses.push(msg.suggestedActions.actions.map((act) => act.value).join(', '));
                    }
                    if (msg.attachments) {
                        botResponses.push(msg.attachments.map((att) => att.content).map((c) => c.title).join(', '));
                    }
                }
                return await next();
            });

            // If no active dialog or no active dialog has responded,
            if (!dc.context.responded) {
                // Switch on return results from any active dialog.
                switch (dialogResult.status) {
                // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                case DialogTurnStatus.empty:
                    // Determine what we should do based on the top intent from LUIS.
                    switch (topIntent) {
                    case 'SmallTalk_Greet':
                      await context.sendActivity('Hello, Foxy at your service here');
                      await context.sendActivity('Here`s what I can do for you:');
                      await context.sendActivity(MessageFactory.suggestedActions(['Show shoes',
                        'Find festivals']));
                      break;
                    case 'SmallTalk_ChitChat':
                      await context.sendActivity('Awesome, how may I help you today?');
                      break;
                    case 'SmallTalk_Thank':
                      await context.sendActivity('No problem! Anything else I can do for you?');
                      break;
                    case 'SmallTalk_EndConversation':
                      await context.sendActivity('See you soon!');
                      break;
                    case 'FindShoes':
                    let colours = [];
                    let shoeTypes = [];
                    if (entities.Colours) {
                        colours = [...entities.Colours[0], ...entities.Colours.slice(1, entities.Colours.length)]
                            .map((colour) => colour.toLowerCase());
                    }
                    if (entities.ShoeTypes) {
                        shoeTypes = [...entities.ShoeTypes[0], ...entities.ShoeTypes.slice(1, entities.ShoeTypes.length)]
                            .map((shoe) => shoe.toLowerCase());
                        }
                    if (colours.length === 0 && shoeTypes.length === 0) {
                        const listAllShoeTypes = MessageFactory.suggestedActions([...Object.keys(ShoeTypes)
                        .map((shoe) => shoe[0].toUpperCase().concat(shoe.slice(1, shoe.length).toLowerCase()))],
                            'I have the following types of shoes:');
                        await context.sendActivity(listAllShoeTypes);
                        } else {
                        const models = ShoeModels.models;
                        const colourMatches = models.filter((shoe) => (colours.indexOf(shoe.colour) >= 0));
                        const shoeTypeMatches = models.filter((shoe) => (shoeTypes.indexOf(shoe.type) >= 0));
                        const intersections = (color, type) => color.filter((shoe) => ((type.map((s) => s.id))).indexOf(shoe.id) >= 0 );
                        let suggestedItems: ShoeDTO [];
                        let message: string;
                        if (colourMatches.length > 0 && shoeTypeMatches.length > 0 && intersections(colourMatches, shoeTypeMatches).length > 0) {
                            suggestedItems = intersections(colourMatches, shoeTypeMatches);
                            message = `I have exactly what you're looking for!`;
                        } else {
                            suggestedItems = colourMatches.concat(shoeTypeMatches);
                            if (suggestedItems.length <= 0) {
                                message = `Sorry, I don't have any of these. Hers's a small sample of what I have in my den:`;
                                while (suggestedItems.length < 3) {
                                    const itemToAdd = models[Math.floor(Math.random() * models.length)];
                                    if (!(suggestedItems.map((item) => item.id).some((id) => id === itemToAdd.id))) {
                                        suggestedItems.push(itemToAdd);
                                    }
                                }
                            } else {
                                message = `Hmm, may I interest you in one of these?`;
                            }
                        }
                        const messageWithCarouselOfCards = MessageFactory.carousel(
                                suggestedItems.map((model) => CardFactory.heroCard(model.name, `€${model.price}`, [model.imgurl],
                                    [{
                                        title: 'Show locations',
                                        type: ActionTypes.PostBack,
                                        value: `select model ${model.id}`,
                                    }],
                                )));
                        await context.sendActivity(message);
                        await context.sendActivity(messageWithCarouselOfCards);
                        }
                    break;

                    case 'SelectModel':
                    const shoeId: number = entities.number[0];
                    const selectedModel = ShoeModels.models.filter((model) => model.id === shoeId);
                    if (!selectedModel.length) {
                        await context.sendActivity(`Sorry, I cannot find such a model in my den`);
                        break;
                    }
                    const foundLocations = FestivalLocations.locations.filter((loc) => loc.modelIds.indexOf(shoeId) >= 0);
                    const foundLocationsCarousel = MessageFactory.carousel(foundLocations.map((loc) => CardFactory.heroCard(loc.name, [loc.imgurl],
                        [{
                            title: 'Show stock',
                            type: ActionTypes.PostBack,
                            value: `select festival ${loc.id}`,
                        }] )));
                    await context.sendActivity(`Click on the location to see all groovy models that I'm bringing with me!`);
                    await context.sendActivity(foundLocationsCarousel);
                    break;

                    case 'SelectFestival':
                    const festId: number = entities.number[0];
                    const selectedFest = FestivalLocations.locations.filter((loc) => loc.id === festId);
                    if (!selectedFest.length) {
                        await context.sendActivity(`Sorry, I cannot find such a festival in my den`);
                        break;
                    }
                    const foundShoes = FestivalLocations.locations.filter((fest) => fest.id === festId)[0].modelIds;
                    const foundShoesPerLocationCarousel = MessageFactory.carousel(ShoeModels.models.filter((shoe) => foundShoes.indexOf(shoe.id) >= 0)
                        .map((res) => CardFactory.heroCard(res.name, [res.imgurl],
                        [{
                            title: 'Show all locations',
                            type: ActionTypes.PostBack,
                            value: `select model ${res.id}`,
                        }] )));
                    await context.sendActivity(`I'll be here ${selectedFest[0].period.startDate.toDateString()} -
                        ${selectedFest[0].period.endDate.toDateString()}, with those groovy foxes:`);
                    await context.sendActivity(foundShoesPerLocationCarousel);
                    break;

                    case 'FindLocations':
                    const recognizedLocations = [];
                    let recognizedAvailableLocations = [];
                    const suggestedFestivals = [];
                    let festivalsFoundMessage: string;
                    if (entities.AvailableLocations) {
                        recognizedAvailableLocations = [...entities.AvailableLocations[0],
                            ...entities.AvailableLocations.slice(1, entities.AvailableLocations.length)];
                    }
                    if (entities.geographyV2_city) {
                        recognizedLocations.push(entities.geographyV2_city);
                    }
                    if (entities.geographyV2_continent) {
                        recognizedLocations.push(entities.geographyV2_continent);
                    }
                    if (entities.geographyV2_countryRegion) {
                        recognizedLocations.push(entities.geographyV2_countryRegion);
                    }
                    if (entities.geographyV2_state) {
                        recognizedLocations.push(entities.geographyV2_state);
                    }

                    if (recognizedAvailableLocations.length === 0) {
                        suggestedFestivals.push(...FestivalLocations.locations);
                        (recognizedLocations.length === 0) ?
                        festivalsFoundMessage = 'You can find me at the following festivals:' :
                        festivalsFoundMessage = `Ahh, ${recognizedLocations[0]
                            .map((loc) => loc[0].toUpperCase().concat(loc.slice(1, loc.length).toLowerCase()))
                            .join('/')} is not on my calendar yet but you can check me out at:`;
                    } else {
                        suggestedFestivals.push(...FestivalLocations.locations
                            .filter((fest) => recognizedAvailableLocations.indexOf(fest.city) >= 0));
                        festivalsFoundMessage = 'Click on the location to see all groovy models that I`m bringing with me!';
                    }
                    const messageWithCarouselOfFests = MessageFactory.carousel(
                        suggestedFestivals.map((fest) => CardFactory.heroCard(fest.name, [fest.imgurl],
                            [{
                                title: 'Show all shoes',
                                type: ActionTypes.PostBack,
                                value: `select festival ${fest.id}`,
                            }],
                        )));
                    await context.sendActivity(festivalsFoundMessage);
                    await context.sendActivity(messageWithCarouselOfFests);
                    break;

                    case 'ShowHistory':
                    const url = 'mongodb://localhost:27017/groovyfox';
                    const mongo = mongoose.createConnection(url);
                    // tslint:disable-next-line:no-shadowed-variable
                    const Schema = mongoose.Schema;
                    const findSchema = new Schema({
                    chatId: String,
                    // tslint:disable-next-line:object-literal-sort-keys
                    chat: [],
                    });

                    // tslint:disable-next-line:no-shadowed-variable
                    const ChatHistory = mongo.model('log', findSchema);
                    await mongo.once('connected', (error) => {
                      ChatHistory.findOne({chatId: this.coversationId}, async (e, c) => {
                        const history = await c.get('chat');
                        await context.sendActivity(history.join('\n'));

                    });
                });
                    await context.sendActivity(`Here's our history so far`);
                    break;

                    case 'None':
                    default:
                      await dc.context.sendActivity(`Sorry, I'm only a fox. Could you please rephrase that?`);
                      break;
                    }
                    break;
                case DialogTurnStatus.waiting:
                    // The active dialog is waiting for a response from the user, so do nothing.
                    break;
                case DialogTurnStatus.complete:
                    // All child dialogs have ended. so do nothing.
                    break;
                default:
                    // Unrecognized status from child dialog. Cancel all dialogs.
                    await dc.cancelAllDialogs();
                    break;
                }
            }
        }

        // make sure to persist state at the end of a turn.
        await this.conversationState.saveChanges(context);
        await this.userState.saveChanges(context);

        let userUtterance: string;
        const botUtterance: string [] = [];
        if (context.activity.text) {
            userUtterance = `${context.activity.from.id} at ${context.activity.timestamp}: ${ context.activity.text}`;
            botResponses.forEach((res) => botUtterance.push(`Foxy: ${res}`));
        }
        const uri = 'mongodb://localhost:27017/groovyfox';
        const db = mongoose.createConnection(uri);
        const Schema = mongoose.Schema;
        const historySchema = new Schema({
            chatId: String,
            // tslint:disable-next-line:object-literal-sort-keys
            chat: [],
            });

        const ChatHistory = db.model('log', historySchema);
        const historyLog = new ChatHistory({ chatId: context.activity.conversation.id, chat: [userUtterance, ...botUtterance]});

        db.once('connected', (error) => {
            if (error) { return console.error(error); }
            if (botResponses.length) {
                ChatHistory.findOne({chatId: this.coversationId}, (e, conversationFound) => {
                    if (!conversationFound) {
                        ChatHistory.create(historyLog, (err, doc) => {
                            if (err) { return console.error(e); }
                            });
                    } else {
                        const currentChat = conversationFound.get(`chat`);
                        const updatedChat = [...currentChat, userUtterance, ...botUtterance];
                        ChatHistory.findOneAndUpdate({chatId: this.coversationId}, {chat: updatedChat}, {upsert: true}, (err, doc) => {
                            if (err) { return console.error(e); }
                        });

                    }
                });
            }
            });
    }

}
