(() => {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(requestUrl, window.location.href);
    const match = url.pathname.match(/^\/p\/(m|[a-f0-9]{10})\.bin$/i);

    if (url.origin === window.location.origin && match) {
      const proxyUrl = new URL(
        `/api/game-assets/${match[1]}.bin${url.search}`,
        window.location.href,
      );
      const proxiedRequest =
        input instanceof Request
          ? new Request(proxyUrl, input)
          : new Request(proxyUrl, init);
      return nativeFetch(proxiedRequest);
    }

    return nativeFetch(input, init);
  };
})();
