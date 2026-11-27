window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * Shared Online Classroom Leaderboard + LocalStorage Fallback
 * Syncs Top 15 player bests via CORS-enabled KV store so everyone opening the
 * GitHub Pages link can compete on the same live leaderboard.
 */
(function () {
  var CLOUD_URL = 'https://textdb.dev/api/data/mcr-nhom3-bxh-8f42a9c1e7';
  var LOCAL_BOARD_KEY = 'mcr_leaderboard_v1';
  var LOCAL_NAME_KEY = 'mcr_player_name_v1';
  var MAX_STORED = 15;

  var SEED_ENTRIES = [
    { id: 'seed-duoi', name: 'Cụ Cây Duối Già', score: 850, monkeys: 2, coins: 10, dist: 120, seed: true },
    { id: 'seed-khi', name: 'Khỉ Con Nam Xung', score: 480, monkeys: 1, coins: 6, dist: 65, seed: true }
  ];

  function sanitizeName(raw) {
    var clean = String(raw || '')
      .replace(/[\r\n\t<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.slice(0, 22) || 'Người Đi Rừng';
  }

  function normalizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    var score = Math.max(0, Math.min(999999, Math.round(Number(e.score) || 0)));
    if (score <= 0) return null;
    return {
      id: String(e.id || Date.now().toString(36)),
      name: sanitizeName(e.name),
      score: score,
      monkeys: Math.max(0, Math.min(999, Math.round(Number(e.monkeys) || 0))),
      coins: Math.max(0, Math.min(9999, Math.round(Number(e.coins) || 0))),
      dist: Math.max(0, Math.min(99999, Math.round(Number(e.dist) || 0))),
      seed: Boolean(e.seed),
      ts: Number(e.ts) || 0
    };
  }

  function mergeAndRank(lists) {
    var byPlayer = {};
    lists.forEach(function (arr) {
      if (!Array.isArray(arr)) return;
      arr.forEach(function (item) {
        var norm = normalizeEntry(item);
        if (!norm) return;
        var key = norm.name.toLowerCase();
        var prev = byPlayer[key];
        if (
          !prev ||
          norm.score > prev.score ||
          (norm.score === prev.score && norm.monkeys > prev.monkeys)
        ) {
          byPlayer[key] = norm;
        }
      });
    });

    var merged = Object.keys(byPlayer).map(function (k) {
      return byPlayer[k];
    });

    merged.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (b.monkeys !== a.monkeys) return b.monkeys - a.monkeys;
      return b.dist - a.dist;
    });

    return merged.slice(0, MAX_STORED);
  }

  function EasterLeaderboard() {
    this.cached = this.loadLocal();
  }

  EasterLeaderboard.prototype.getSavedName = function () {
    try {
      return window.localStorage.getItem(LOCAL_NAME_KEY) || '';
    } catch (e) {
      return '';
    }
  };

  EasterLeaderboard.prototype.saveName = function (name) {
    try {
      window.localStorage.setItem(LOCAL_NAME_KEY, sanitizeName(name));
    } catch (e) {}
  };

  EasterLeaderboard.prototype.loadLocal = function () {
    try {
      var raw = window.localStorage.getItem(LOCAL_BOARD_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return mergeAndRank([SEED_ENTRIES, parsed]);
        }
      }
    } catch (e) {}
    return mergeAndRank([SEED_ENTRIES]);
  };

  EasterLeaderboard.prototype.saveLocal = function (entries) {
    this.cached = entries;
    try {
      window.localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(entries));
    } catch (e) {}
  };

  EasterLeaderboard.prototype.fetchBoard = function () {
    var self = this;
    var localList = this.loadLocal();

    return window
      .fetch(CLOUD_URL, { method: 'GET', cache: 'no-store' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function (txt) {
        var remoteList = [];
        if (txt && txt.trim()) {
          var parsed = JSON.parse(txt);
          if (Array.isArray(parsed)) remoteList = parsed;
        }
        var merged = mergeAndRank([SEED_ENTRIES, localList, remoteList]);
        self.saveLocal(merged);
        return { entries: merged, online: true };
      })
      .catch(function () {
        return { entries: localList, online: false };
      });
  };

  EasterLeaderboard.prototype.submitScore = function (rawEntry) {
    var self = this;
    var entry = normalizeEntry({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: rawEntry.name,
      score: rawEntry.score,
      monkeys: rawEntry.monkeys,
      coins: rawEntry.coins,
      dist: rawEntry.dist,
      ts: Date.now()
    });
    if (!entry) return Promise.resolve({ entries: this.loadLocal(), online: false, highlightName: '' });

    this.saveName(entry.name);
    var localMerged = mergeAndRank([SEED_ENTRIES, this.loadLocal(), [entry]]);
    this.saveLocal(localMerged);

    return this.fetchBoard()
      .then(function (res) {
        var finalBoard = mergeAndRank([res.entries, [entry]]);
        self.saveLocal(finalBoard);
        // Push only non-seed entries to cloud to keep payload compact & clean
        var toUpload = finalBoard.filter(function (x) {
          return !x.seed;
        });
        return window
          .fetch(CLOUD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(toUpload)
          })
          .then(function (postResp) {
            return {
              entries: finalBoard,
              online: postResp.ok,
              highlightName: entry.name.toLowerCase()
            };
          });
      })
      .catch(function () {
        return {
          entries: localMerged,
          online: false,
          highlightName: entry.name.toLowerCase()
        };
      });
  };

  window.MuoiCuaRung.EasterLeaderboard = EasterLeaderboard;
})();
