const levels = ['error', 'warn', 'info', 'http', 'debug'];

const getLevelIndex = (level) => levels.indexOf(level);

const resolveMinLevelIndex = () => {
  const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();

  if (levels.includes(envLevel)) {
    return getLevelIndex(envLevel);
  }

  return process.env.NODE_ENV === 'production'
    ? getLevelIndex('info')
    : getLevelIndex('debug');
};

const minLevelIndex = resolveMinLevelIndex();

const baseLog = (level, message, meta) => {
  const idx = getLevelIndex(level);
  if (idx === -1 || idx > minLevelIndex) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && typeof meta === 'object' ? meta : {}),
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const logger = {
  error: (message, meta) => baseLog('error', message, meta),
  warn: (message, meta) => baseLog('warn', message, meta),
  info: (message, meta) => baseLog('info', message, meta),
  http: (message, meta) => baseLog('http', message, meta),
  debug: (message, meta) => baseLog('debug', message, meta),
};

module.exports = logger;
