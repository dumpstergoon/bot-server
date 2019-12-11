# Bot Server
A simple server that routes `<component_name>/<session_id>` `POST` requests to bot components on the machine or hosted on a service.

## Install
Clone this repo and, from the root of the project directory, type `./bot-server install`.  This ensure all pckages are installed.

## Run
To run the bot-server, type `./bot-server start`. If you make changes to any of your components, the server will need to be restarted.
Press `CTRL + C` to exit and then type the start command again.

## Linking to CoCo components (or any component that implements the correct interface)
From the root directory of the project, type `./bot-server add <component_name> <component_uri> ?<api_key>?`. Which will take the form of something
like: `./bot-server add competition https://app.coco.imperson.com/api/exchange/CoCoScheduler_866d0f8b47971d/`. NOTE: do NOT pass a `session_id`. Let
whatever client you're using or building generate and pass the `session_id`.

## Creating custom components:
To create custom components for your server, execute `./bot-server create <component_name>`.  Let's do one together:

# Component Creation Tutorial (Hello, World)\

## Create a new component:

Let's walk through building a new component that hooks into other coco and custom components:

```bash
./bot-server create helloworld
cd ./bots/helloworld
./index # We can run our bots from the command-line
```

Give that `index` a test! Run `./bot-server start` from the root of the project directory before running `index` so that all
your other local and CoCo components that your bot uses are available.

### NOTE:
Once you create your component and run the bot-server, your bot is now available as a component for other components to use!!

## Customize your bots "actions"

In your favourite editor, open `./bots/helloworld/index`.  We should see a node executable like so:

```javascript
'use strict';

const {
	action,
	bot,
	bootstrap
} = require("../../component");

const nlp = require('../../nlp');

// Create a new bot (../../component/bot.js)
const component = bot(
	require("./responses.json"),
	{
		// A custom action example:
		action_name: (msg, state, responses, send, route) => {
			// Do some stuff with msg then maybe wait for an
			// API call or asynchronous operation... then call send.
			send(
				// Next action name:
				"action_name",
				// Response text. These are pulled from ./responses.json
				responses.random().render({ /* context for rendering variables within text strings */ })
			);
		},

		// Example predefined actions (../../component/actions.js):
		index: action.default("phonenumber"),
		phonenumber: action.bot("phonenumber", context => "reminder"),
		reminder: action.bot("reminder", () => "index")
	});

// Hooks our bot into the appropriate IO
// Terminal: command-prompt style chat
// Server: Runs as a forked process
bootstrap(component);

```

# TODO: Finish documentation
