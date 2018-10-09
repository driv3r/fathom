'use strict';

let queue = window.fathom.q || [];
let trackerUrl = '';

const commands = {
  "trackPageview": trackPageview,
  "setTrackerUrl": setTrackerUrl,
};

// convert object to query string
function stringifyObject(obj) {
  var keys = Object.keys(obj);

  return '?' +
      keys.map(function(k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
      }).join('&');
}

function randomString(n) {
  var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array(n).join().split(',').map(() => s.charAt(Math.floor(Math.random() * s.length))).join('');
}

function newVisitorData() {
  return {
    isNewVisitor: true,
    isNewSession: true,
    pagesViewed: [],
    previousPageviewId: '',
    lastSeen: +new Date(),
  }
}

function getData() {
  let thirtyMinsAgo = new Date();
  thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);

  let data = window.fathom.d;

  if (! data) {
    return newVisitorData();
  }

  if (data.lastSeen < (+thirtyMinsAgo)) {
    data.isNewSession = true;
  }

  return data;
}

function setData(data) {
  window.fathom.d = data;
}

function findTrackerUrl() {
  const el = document.getElementById('fathom-script')
  return el ? el.src.replace('tracker.js', 'collect') : '';
}

function setTrackerUrl(v) {
  trackerUrl = v;
}

function trackPageview() {
  if(trackerUrl === '') {
    trackerUrl = findTrackerUrl();
  }

  // Respect "Do Not Track" requests
  if('doNotTrack' in navigator && navigator.doNotTrack === "1") {
    return;
  }

  // ignore prerendered pages
  if( 'visibilityState' in document && document.visibilityState === 'prerender' ) {
    return;
  }

  let req = window.location;

  // parse canonical, if page has one
  let canonical = document.querySelector('link[rel="canonical"][href]');
  if(canonical) {
    let a = document.createElement('a');
    a.href = canonical.href;

    // use parsed canonical as location object
    req = a;
  }

  // get path and pathname from location or canonical
  let path = req.pathname + req.search;
  let hostname = req.protocol + "//" + req.hostname;

  // if parsing path failed, default to main page
  if(!path) {
    path = '/';
  }

  // only set referrer if not internal
  let referrer = '';
  if(document.referrer.indexOf(location.hostname) < 0) {
    referrer = document.referrer;
  }

  let data = getData();
  const d = {
    id: randomString(20),
    pid: data.previousPageviewId || '',
    p: path,
    h: hostname,
    r: referrer,
    u: data.pagesViewed.indexOf(path) == -1 ? 1 : 0,
    nv: data.isNewVisitor ? 1 : 0,
    ns: data.isNewSession ? 1 : 0,
  };

  let i = document.createElement('img');
  i.src = trackerUrl + stringifyObject(d);
  i.addEventListener('load', function() {
    let now = new Date();
    let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0);

    // update data
    if( data.pagesViewed.indexOf(path) == -1 ) {
      data.pagesViewed.push(path);
    }
    data.previousPageviewId = d.id;
    data.isNewVisitor = false;
    data.isNewSession = false;
    data.lastSeen = +new Date();
    setData(data);
  });
  document.body.appendChild(i);
  window.setTimeout(() => { document.body.removeChild(i)}, 1000);
}

// override global fathom object
window.fathom = function() {
  var args = [].slice.call(arguments);
  var c = args.shift();
  commands[c].apply(this, args);
};

// process existing queue
queue.forEach((i) => fathom.apply(this, i));
