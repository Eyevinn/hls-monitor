const { HLSMonitorService } = require("./dist/index.js");

// initialize a new instance of HLSMonitorService
const hlsMonitorService = new HLSMonitorService();
// register the routes
hlsMonitorService.listen(process.env.PORT || 3000, '0.0.0.0');
