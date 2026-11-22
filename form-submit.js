/* Sends forms marked data-form to /api/submit-form.
   If that fails for any reason other than a fixable input error, the form posts to its normal
   FormSubmit action instead, so a request is never lost. Without JavaScript that action is used. */
(function () {
  var TIMEOUT_MS = 14000; // longer than the server's own 8s + 3s email timeouts

  function setUpEmailOrPhone(form) {
    if (!form.hasAttribute('data-email-or-phone')) return;
    var email = form.querySelector('input[name="email"]');
    var phone = form.querySelector('input[name="phone"]');
    if (!email || !phone) return;
    var sync = function () { email.required = !phone.value.trim(); };
    phone.addEventListener('input', sync);
    phone.addEventListener('change', sync);
    window.addEventListener('pageshow', sync);
    sync();
  }

  function setUp(form) {
    setUpEmailOrPhone(form);

    var button = form.querySelector('[type="submit"]');
    var label = button && button.textContent;
    var sending = false;

    var status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'alert');
    form.appendChild(status);

    function setSending(value) {
      sending = value;
      if (!button) return;
      button.disabled = value;
      button.textContent = value ? 'Sending…' : label;
    }

    // Coming back with the Back button must not leave a dead "Sending…" button.
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) setSending(false);
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (sending) return;

      var fields = Object.create(null);
      var honey = '';
      new FormData(form).forEach(function (value, name) {
        if (name === '_honey') honey = value;
        else if (name.charAt(0) !== '_') fields[name] = String(value);
      });

      setSending(true);
      status.textContent = '';

      var response = null;
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
      try {
        response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: form.dataset.form, fields: fields, honey: honey }),
          signal: controller.signal
        });
        var data = await response.json();

        if (response.ok && data.ok === true) {
          window.location.assign(form.dataset.next || '/thanks.html');
          return;
        }
        if (response.status === 400 && data.error) {
          status.textContent = data.error;
          setSending(false);
          return;
        }
      } catch (error) {
        // Network error, timeout, or a response that wasn't JSON: use the fallback below.
      } finally {
        clearTimeout(timer);
      }

      HTMLFormElement.prototype.submit.call(form);
    });
  }

  function init() {
    document.querySelectorAll('form[data-form]').forEach(setUp);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
