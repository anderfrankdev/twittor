importScripts("https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js");
importScripts("js/sw-utils.js");

const presenters = [
  { event: "install", presenter: installPresenter },
  { event: "activate", presenter: activatePresenter },
  { event: "fetch", presenter: fetchPresenter },
  { event: "sync", presenter: syncPresenter },
  { event: "push", presenter: pushPresenter },
  //{ event: "notificationclose", presenter: closeNotification },
  { event: "notificationclick", presenter: clickNotification }

];

presenters.forEach((p) => self.addEventListener(p.event, p.presenter));
