// server/config/planResources.js
const PLAN_RESOURCES = {
  standard: {
    storage: {
      total: 10  // GB
    },
    ram: {
      total: 1024  // MB
    }
  },
  pro: {
    storage: {
      total: 50  // GB
    },
    ram: {
      total: 2048  // MB
    }
  },
  pro_plus: {
    storage: {
      total: 100  // GB
    },
    ram: {
      total: 4096  // MB
    }
  }
};

module.exports = PLAN_RESOURCES;