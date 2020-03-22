# Logging in With a Popup

Thanks to a great community contribution, this library also supports logging the user in via a popup. For this, you need to do two things:

- Use ``initLoginFlowInPopup`` instead of ``initLoginFlow``.
- Create and configure a ``silent-refresh.html`` as described [here](./silent-refresh.html) *.

\* Please note this does not mean that you have to use silent refresh too.

Also, for your ``silent-regfesh.html``, make sure you are also targeting
``window.opener`` and fall back to ``window.parent``:

**Please note**: IE sets opener to null under specific security settings. This prevents making this work.