const { composePlugins, withNx } = require('@nx/webpack');

// Este es el hook para extender la configuración de Webpack de Nx.
module.exports = composePlugins(withNx(), (config) => {
  // Ajuste hot reload para desarrollo con poll.
  config.watchOptions = {
    poll: 500, // Revisa si hay cambios cada 500 milisegundos.
    aggregateTimeout: 300, // Espera 300ms después de un cambio antes de reconstruir.
  };
  return config;
});
