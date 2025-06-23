export const Subscriber = {

  KEYS: {
    SECONDARY_DATA: 'SECONDARY_DATA'
  },
  __subscriptions: {},

  subscribe: (key, subscription) => {
    if (!(key in Subscriber.__subscriptions)) Subscriber.__subscriptions[key] = [];
    if (Subscriber.__subscriptions[key].includes(subscription)) return;
    Subscriber.__subscriptions[key].push(subscription);
  },

  unSubscribe: (key, subscription) => {
    if (!(key in Subscriber.__subscriptions)) return;
    const index = Subscriber.__subscriptions[key].indexOf(subscription);
    if (index > -1) Subscriber.__subscriptions[key].splice(index, 1);
  },

  report(key, ...data) {
    if (!(key in Subscriber.__subscriptions)) return;
    Subscriber.__subscriptions[key].forEach((subscription) => subscription(...data));
  },

  subscriptions: (key) => (key ? Subscriber.__subscriptions[key] : Subscriber.__subscriptions),

};
