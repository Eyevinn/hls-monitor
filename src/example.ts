import HLSMonitorService from './routes';

// initialise a new instance of HLSMonitorService
const hlsMonitorService = new HLSMonitorService();
// register the routes 
hlsMonitorService.listen(3000);
