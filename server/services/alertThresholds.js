// server/services/alertThresholds.js
const PLAN_THRESHOLDS = {
  standard: {
    cpu: {
      high: 80,
      critical: 90
    },
    ram: {
      high: 85,
      critical: 95
    },
    disk: {
      high: 80,
      critical: 90
    },
    response_time: {
      high: 1000, // ms
      critical: 2000
    },
    uptime: {
      low: 98, // percentage
      critical: 95
    },
    bandwidth: {
      high: 80, // percentage of limit
      critical: 90
    }
  },
  pro: {
    cpu: {
      high: 85,
      critical: 95
    },
    ram: {
      high: 90,
      critical: 98
    },
    disk: {
      high: 85,
      critical: 95
    },
    response_time: {
      high: 800,
      critical: 1500
    },
    uptime: {
      low: 99,
      critical: 97
    },
    bandwidth: {
      high: 85,
      critical: 95
    }
  },
  pro_plus: {
    cpu: {
      high: 90,
      critical: 98
    },
    ram: {
      high: 95,
      critical: 98
    },
    disk: {
      high: 90,
      critical: 98
    },
    response_time: {
      high: 500,
      critical: 1000
    },
    uptime: {
      low: 99.9,
      critical: 99
    },
    bandwidth: {
      high: 90,
      critical: 98
    }
  }
};

function checkThreshold(metricType, value, plan = 'standard') {
  const thresholds = PLAN_THRESHOLDS[plan][metricType];
  
  if (metricType === 'uptime') {
    if (value < thresholds.critical) return 'critical';
    if (value < thresholds.low) return 'high';
    return null;
  }

  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.high) return 'high';
  return null;
}

function generateAlertMessage(metricType, value, threshold, plan) {
  const messages = {
    cpu: `High CPU usage: ${value}% (threshold: ${threshold}%)`,
    ram: `High RAM usage: ${value}% (threshold: ${threshold}%)`,
    disk: `High disk usage: ${value}% (threshold: ${threshold}%)`,
    response_time: `High response time: ${value}ms (threshold: ${threshold}ms)`,
    uptime: `Low uptime detected: ${value}% (minimum: ${threshold}%)`,
    bandwidth: `High bandwidth usage: ${value}% (threshold: ${threshold}%)`
  };

  return messages[metricType];
}

module.exports = {
  PLAN_THRESHOLDS,
  checkThreshold,
  generateAlertMessage
};