const path = require("path");

const dirConfig = path.join(__dirname, "../config_goatbot_v2.json");
const dirConfigCommands = path.join(__dirname, "../configCommands.json");

// Use our new unified config for global.GoatBot so old commands still work
const unifiedConfig = require("../config");

global.GoatBot = {
  config: Object.assign({}, require(dirConfig), unifiedConfig._raw),
  configCommands: require(dirConfigCommands)
};

// utils.js shim for old dashboard routes
try { global.utils = require("../utils.js"); } catch (_) {
  global.utils = require("../utils/goatcompat").createUtils();
}

global.client = {
  dirConfig,
  dirConfigCommands,
  dirAccount: path.join(__dirname, "../account.txt"),
  database: {
    creatingThreadData: [],
    creatingUserData: [],
    creatingDashBoardData: []
  }
};

global.db = {
  allThreadData: [],
  allUserData: [],
  globalData: []
};

module.exports = async function () {
  try {
    const controller = await require(path.join(__dirname, "..", "database/controller/index.js"))(null);
    const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData } = controller;

    // Sync globals for old dashboard routes
    global.db.allThreadData = [];
    global.db.allUserData = [];

    return { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData };
  } catch (err) {
    console.error("[connectDB] Database controller failed:", err.message);
    // Return stubs so dashboard routes don't crash
    const stub = async () => [];
    return {
      threadModel: null, userModel: null, dashBoardModel: null, globalModel: null,
      threadsData: { get: stub, getAll: stub, set: async () => {} },
      usersData:   { get: stub, getAll: stub, set: async () => {} },
      dashBoardData: null, globalData: null
    };
  }
};
