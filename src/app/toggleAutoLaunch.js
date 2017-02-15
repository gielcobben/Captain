import AutoLaunch from "auto-launch";

const autoLauncher = new AutoLaunch({
  name: "Captain",
  mac: {
    useLaunchAgent: false,
  },
});

export const toggleAutoLaunch = async () => {
  if (process.title && process.title.indexOf("Electron.app") >= 0) {
    return;
  }

  try {
    const isEnabled = await autoLauncher.isEnabled();

    if (isEnabled) {
      await autoLauncher.disable();
    } else {
      await autoLauncher.enable();
    }
  } catch (error) {
    debug("captain-auto-launch")("Failed to toggle auto launch");
  }
};

export const autoLaunchEnabled = async () => {
  try {
    return await autoLauncher.isEnabled();
  } catch (error) {
    return false;
  }
}