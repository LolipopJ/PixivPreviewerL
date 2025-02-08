import { iLog } from "./logger";

const JQUERY_VERSION = "3.7.1";

// https://greasyfork.org/zh-CN/scripts/417760-checkjquery
export const checkJQuery = function () {
  const jqueryCdns = [
    `http://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`,
    `https://ajax.aspnetcdn.com/ajax/jquery/jquery-${JQUERY_VERSION}.min.js`,
    `https://ajax.googleapis.com/ajax/libs/jquery/${JQUERY_VERSION}/jquery.min.js`,
    `https://cdn.staticfile.org/jquery/${JQUERY_VERSION}/jquery.min.js`,
    `https://apps.bdimg.com/libs/jquery/${JQUERY_VERSION}/jquery.min.js`,
  ];
  function isJQueryValid() {
    try {
      const wd = unsafeWindow;
      if (wd.jQuery && !wd.$) {
        wd.$ = wd.jQuery;
      }
      $();
      return true;
    } catch (exception) {
      iLog.i(`JQuery is not available: ${exception}`);
      return false;
    }
  }
  function insertJQuery(url) {
    const script = document.createElement("script");
    script.src = url;
    document.head.appendChild(script);
    return script;
  }
  function converProtocolIfNeeded(url) {
    const isHttps = location.href.indexOf("https://") != -1;
    const urlIsHttps = url.indexOf("https://") != -1;

    if (isHttps && !urlIsHttps) {
      return url.replace("http://", "https://");
    } else if (!isHttps && urlIsHttps) {
      return url.replace("https://", "http://");
    }
    return url;
  }
  function waitAndCheckJQuery(cdnIndex, resolve) {
    if (cdnIndex >= jqueryCdns.length) {
      iLog.e("无法加载 jQuery，正在退出。");
      resolve(false);
      return;
    }
    const url = converProtocolIfNeeded(jqueryCdns[cdnIndex]);
    iLog.i("尝试第 " + (cdnIndex + 1) + " 个 jQuery CDN：" + url + "。");
    const script = insertJQuery(url);
    setTimeout(function () {
      if (isJQueryValid()) {
        iLog.i("已加载 jQuery。");
        resolve(true);
      } else {
        iLog.w("无法访问。");
        script.remove();
        waitAndCheckJQuery(cdnIndex + 1, resolve);
      }
    }, 100);
  }
  return new Promise(function (resolve) {
    if (isJQueryValid()) {
      iLog.i("已加载 jQuery。");
      resolve(true);
    } else {
      iLog.i("未发现 jQuery，尝试加载。");
      waitAndCheckJQuery(0, resolve);
    }
  });
};
