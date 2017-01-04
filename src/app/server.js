import ElectronServer from "electron-rpc/server";
import * as Docker from "./docker";
import {COMMANDS} from "../rpc";

const server = new ElectronServer();

const serverTrigger = (command, body) => {
	server.methods[command]({body});
};

let updateInterval;

export const serverStart = async (menubar) => {
	server.configure(menubar.window.webContents);

	menubar.on("show", () => {
		clearInterval(updateInterval);

		serverTrigger(COMMANDS.VERSION);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);

		updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 5*1000);
	});

	menubar.on("hide", () => {
		clearInterval(updateInterval);

		updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 15*1000);
	});

	server.on(COMMANDS.APPLICATION_QUIT, () => {
		menubar.app.quit();
	});

	server.on(COMMANDS.VERSION, async () => {
		server.send(COMMANDS.VERSION, {version: await Docker.version()});
	});

	server.on(COMMANDS.CONTAINER_KILL, async ({body}) => {
		await Docker.containerCommand("kill", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_STOP, async ({body}) => {
		await Docker.containerCommand("stop", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_START, async ({body}) => {
		await Docker.containerCommand("start", body.id);

		setTimeout(() => {
			serverTrigger(COMMANDS.CONTAINER_GROUPS);
		}, 333);
	});

	server.on(COMMANDS.CONTAINER_PAUSE, async ({body}) => {
		await Docker.containerCommand("pause", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_UNPAUSE, async ({body}) => {
		await Docker.containerCommand("unpause", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_GROUPS, async () => {
		const containers = await Docker.containerList();
		const groups     = {};

		for (const container of containers) {
			const imageParts    = container.image.split("_");
			const groupName     = (imageParts.length < 2 ? "nogroup" : imageParts[0]);
			const containerName = (imageParts.length < 2 ? container.name : container.name.substr(imageParts[0].length + 1));

			container.active    = container.status.indexOf("Up") >= 0;
			container.paused    = container.status.indexOf("Paused") >= 0;
			container.ports     = ((container.port || "").match(/>([0-9]+)\//) || []).slice(1);
			container.shortName = containerName;

			groups[groupName] = Object.assign(
				groups[groupName] || {},
				{
					[containerName]: container,
				}
			);
		}

		server.send(COMMANDS.CONTAINER_GROUPS, {groups});
	});
};
