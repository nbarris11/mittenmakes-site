/* Order form helpers: occasion prefill + "Need it by" date floor.
   - ?occasion=holiday|hanukkah|stocking|bulk pre-selects the Occasion dropdown.
   - Links with data-occasion="..." set it on click (same values).
   - need_by date inputs can't be set to a past date. */
(function () {
  var MAP = {
    holiday: 'Holiday / Christmas gift',
    christmas: 'Holiday / Christmas gift',
    hanukkah: 'Hanukkah gift',
    stocking: 'Stocking stuffer',
    bulk: 'Holiday party favors / bulk'
  };

  function setOccasion(key) {
    var value = MAP[key];
    if (!value) return;
    document.querySelectorAll('select[name="occasion"]').forEach(function (sel) {
      sel.value = value;
    });
  }

  function init() {
    try {
      var key = new URLSearchParams(window.location.search).get('occasion');
      if (key) setOccasion(key.toLowerCase());
    } catch (e) { /* older browsers: no prefill, form still works */ }

    document.querySelectorAll('[data-occasion]').forEach(function (link) {
      link.addEventListener('click', function () {
        setOccasion(link.getAttribute('data-occasion'));
      });
    });

    var d = new Date();
    var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    document.querySelectorAll('input[name="need_by"]').forEach(function (input) {
      input.min = today;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
