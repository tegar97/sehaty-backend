const app = require('./src/app');
const config = require('./src/config/config');

app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
});
