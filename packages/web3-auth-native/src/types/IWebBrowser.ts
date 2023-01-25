export declare type RedirectEvent = {
  url: string
}
export declare type WebBrowserWindowFeatures = Record<string, number | boolean | string>
export declare type WebBrowserOpenOptions = {
  /**
   * Color of the toolbar in either `#AARRGGBB` or `#RRGGBB` format.
   */
  toolbarColor?: string
  /**
   * Package name of a browser to be used to handle Custom Tabs. List of
   * available packages is to be queried by [`getCustomTabsSupportingBrowsers`](#webbrowsergetcustomtabssupportingbrowsersasync) method.
   * @platform android
   */
  browserPackage?: string
  /**
   * A boolean determining whether the toolbar should be hiding when a user scrolls the website.
   */
  enableBarCollapsing?: boolean
  /**
   * Color of the secondary toolbar in either `#AARRGGBB` or `#RRGGBB` format.
   * @platform android
   */
  secondaryToolbarColor?: string
  /**
   * A boolean determining whether the browser should show the title of website on the toolbar.
   * @platform android
   */
  showTitle?: boolean
  /**
   * A boolean determining whether a default share item should be added to the menu.
   * @platform android
   */
  enableDefaultShareMenuItem?: boolean
  /**
   * A boolean determining whether browsed website should be shown as separate
   * entry in Android recents/multitasking view. Requires `createTask` to be `true` (default).
   * @default false
   * @platform android
   */
  showInRecents?: boolean
  /**
   * A boolean determining whether the browser should open in a new task or in
   * the same task as your app.
   * @default true
   * @platform android
   */
  createTask?: boolean
  /**
   * Tint color for controls in SKSafariViewController in `#AARRGGBB` or `#RRGGBB` format.
   * @platform ios
   */
  controlsColor?: string
  /**
   * The style of the dismiss button. Should be one of: `done`, `close`, or `cancel`.
   * @platform ios
   */
  dismissButtonStyle?: 'done' | 'close' | 'cancel'
  /**
   * A boolean determining whether Safari should enter Reader mode, if it is available.
   * @platform ios
   */
  readerMode?: boolean
  /**
   * Name to assign to the popup window.
   * @platform web
   */
  windowName?: string
  /**
   * Features to use with `window.open()`.
   * @platform web
   */
  windowFeatures?: string | WebBrowserWindowFeatures
}
export declare type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult
export declare type WebBrowserCustomTabsResults = {
  /**
   * Default package chosen by user, `null` if there is no such packages. Also `null` usually means,
   * that user will be prompted to choose from available packages.
   */
  defaultBrowserPackage?: string
  /**
   * Package preferred by `CustomTabsClient` to be used to handle Custom Tabs. It favors browser
   * chosen by user as default, as long as it is present on both `browserPackages` and
   * `servicePackages` lists. Only such browsers are considered as fully supporting Custom Tabs.
   * It might be `null` when there is no such browser installed or when default browser is not in
   * `servicePackages` list.
   */
  preferredBrowserPackage?: string
  /**
   * All packages recognized by `PackageManager` as capable of handling Custom Tabs. Empty array
   * means there is no supporting browsers on device.
   */
  browserPackages: string[]
  /**
   * All packages recognized by `PackageManager` as capable of handling Custom Tabs Service.
   * This service is used by [`warmUpAsync`](#webbrowserwarmupasyncbrowserpackage), [`mayInitWithUrlAsync`](#webbrowsermayinitwithurlasyncurl-browserpackage)
   * and [`coolDownAsync`](#webbrowsercooldownasyncbrowserpackage).
   */
  servicePackages: string[]
}
export declare enum WebBrowserResultType {
  /**
   * @platform ios
   */
  CANCEL = 'cancel',
  /**
   * @platform ios
   */
  DISMISS = 'dismiss',
  /**
   * @platform android
   */
  OPENED = 'opened',
  LOCKED = 'locked'
}
export declare type WebBrowserResult = {
  /**
   * Type of the result.
   */
  type: WebBrowserResultType
}
export declare type WebBrowserRedirectResult = {
  /**
   * Type of the result.
   */
  type: 'success'
  url: string
}
export declare type ServiceActionResult = {
  servicePackage?: string
}
export declare type WebBrowserMayInitWithUrlResult = ServiceActionResult
export declare type WebBrowserWarmUpResult = ServiceActionResult
export declare type WebBrowserCoolDownResult = ServiceActionResult
export declare type WebBrowserCompleteAuthSessionOptions = {
  /**
   * Attempt to close the window without checking to see if the auth redirect matches the cached redirect URL.
   */
  skipRedirectCheck?: boolean
}
export declare type WebBrowserCompleteAuthSessionResult = {
  /**
   * Type of the result.
   */
  type: 'success' | 'failed'
  /**
   * Additional description or reasoning of the result.
   */
  message: string
}

export interface IWebBrowser {
  /**
   * Returns a list of applications package names supporting Custom Tabs, Custom Tabs
   * service, user chosen and preferred one. This may not be fully reliable, since it uses
   * `PackageManager.getResolvingActivities` under the hood. (For example, some browsers might not be
   * present in browserPackages list once another browser is set to default.)
   *
   * @return The promise which fulfils with [`WebBrowserCustomTabsResults`](#webbrowsercustomtabsresults) object.
   * @platform android
   */
  // getCustomTabsSupportingBrowsersAsync(): Promise<WebBrowserCustomTabsResults>;
  /**
   * This method calls `warmUp` method on [CustomTabsClient](https://developer.android.com/reference/android/support/customtabs/CustomTabsClient.html#warmup(long))
   * for specified package.
   *
   * @param browserPackage Package of browser to be warmed up. If not set, preferred browser will be warmed.
   *
   * @return A promise which fulfils with `WebBrowserWarmUpResult` object.
   * @platform android
   */
  // warmUpAsync(browserPackage?: string): Promise<WebBrowserWarmUpResult>;
  /**
   * This method initiates (if needed) [CustomTabsSession](https://developer.android.com/reference/android/support/customtabs/CustomTabsSession.html#maylaunchurl)
   * and calls its `mayLaunchUrl` method for browser specified by the package.
   *
   * @param url The url of page that is likely to be loaded first when opening browser.
   * @param browserPackage Package of browser to be informed. If not set, preferred
   * browser will be used.
   *
   * @return A promise which fulfils with `WebBrowserMayInitWithUrlResult` object.
   * @platform android
   */
  // mayInitWithUrlAsync(
  //   url: string,
  //   browserPackage?: string
  // ): Promise<WebBrowserMayInitWithUrlResult>;
  /**
   * This methods removes all bindings to services created by [`warmUpAsync`](#webbrowserwarmupasyncbrowserpackage)
   * or [`mayInitWithUrlAsync`](#webbrowsermayinitwithurlasyncurl-browserpackage). You should call
   * this method once you don't need them to avoid potential memory leaks. However, those binding
   * would be cleared once your application is destroyed, which might be sufficient in most cases.
   *
   * @param browserPackage Package of browser to be cooled. If not set, preferred browser will be used.
   *
   * @return The promise which fulfils with ` WebBrowserCoolDownResult` when cooling is performed, or
   * an empty object when there was no connection to be dismissed.
   * @platform android
   */
  // coolDownAsync(browserPackage?: string): Promise<WebBrowserCoolDownResult>;
  /**
   * Opens the url with Safari in a modal on iOS using [`SFSafariViewController`](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller),
   * and Chrome in a new [custom tab](https://developer.chrome.com/multidevice/android/customtabs)
   * on Android. On iOS, the modal Safari will not share cookies with the system Safari. If you need
   * this, use [`openAuthSessionAsync`](#webbrowseropenauthsessionasyncurl-redirecturl-browserparams).
   *
   * @param url The url to open in the web browser.
   * @param browserParams A dictionary of key-value pairs.
   *
   * @return The promise behaves differently based on the platform.
   * On Android promise resolves with `{type: 'opened'}` if we were able to open browser.
   * On iOS:
   * - If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
   * - If the browser is closed using [`dismissBrowser`](#webbrowserdismissbrowser), the Promise resolves with `{ type: 'dismiss' }`.
   */
  // openBrowserAsync(
  //   url: string,
  //   browserParams?: WebBrowserOpenOptions
  // ): Promise<WebBrowserResult>;
  /**
   * Dismisses the presented web browser.
   *
   * @return The `void` on successful attempt, or throws error, if dismiss functionality is not avaiable.
   * @platform ios
   */
  // dismissBrowser(): void;
  /**
   * # On iOS:
   * Opens the url with Safari in a modal using `SFAuthenticationSession` on iOS 11 and greater,
   * and falling back on a `SFSafariViewController`. The user will be asked whether to allow the app
   * to authenticate using the given url.
   *
   * # On Android:
   * This will be done using a "custom Chrome tabs" browser, [AppState](../react-native/appstate/),
   * and [Linking](./linking/) APIs.
   *
   * # On web:
   * > This API can only be used in a secure environment (`https`). You can use expo `start:web --https`
   * to test this. Otherwise, an error with code [`ERR_WEB_BROWSER_CRYPTO`](#errwebbrowsercrypto) will be thrown.
   * This will use the browser's [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) API.
   * - _Desktop_: This will create a new web popup window in the browser that can be closed later using `WebBrowser.maybeCompleteAuthSession()`.
   * - _Mobile_: This will open a new tab in the browser which can be closed using `WebBrowser.maybeCompleteAuthSession()`.
   *
   * How this works on web:
   * - A crypto state will be created for verifying the redirect.
   *   - This means you need to run with `expo start:web --https`
   * - The state will be added to the window's `localstorage`. This ensures that auth cannot complete
   *   unless it's done from a page running with the same origin as it was started.
   *   Ex: if `openAuthSessionAsync` is invoked on `https://localhost:19006`, then `maybeCompleteAuthSession`
   *   must be invoked on a page hosted from the origin `https://localhost:19006`. Using a different
   *   website, or even a different host like `https://128.0.0.*:19006` for example will not work.
   * - A timer will be started to check for every 1000 milliseconds (1 second) to detect if the window
   *   has been closed by the user. If this happens then a promise will resolve with `{ type: 'dismiss' }`.
   *
   * > On mobile web, Chrome and Safari will block any call to [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
   * which takes too long to fire after a user interaction. This method must be invoked immediately
   * after a user interaction. If the event is blocked, an error with code [`ERR_WEB_BROWSER_BLOCKED`](#errwebbrowserblocked) will be thrown.
   *
   * @param url The url to open in the web browser. This should be a login page.
   * @param redirectUrl _Optional_ - The url to deep link back into your app. By default, this will be [`Constants.linkingUrl`](./constants/#expoconstantslinkinguri).
   * @param browserParams _Optional_ - An object with the same keys as [`WebBrowserOpenOptions`](#webbrowseropenoptions).
   * If there is no native AuthSession implementation available (which is the case on Android)
   * these params will be used in the browser polyfill. If there is a native AuthSession implementation,
   * these params will be ignored.
   *
   * @return
   * - If the user does not permit the application to authenticate with the given url, the Promise fulfills with `{ type: 'cancel' }` object.
   * - If the user closed the web browser, the Promise fulfills with `{ type: 'cancel' }` object.
   * - If the browser is closed using [`dismissBrowser`](#webbrowserdismissbrowser),
   * the Promise fulfills with `{ type: 'dismiss' }` object.
   */
  openAuthSessionAsync(
    url: string,
    redirectUrl: string,
    browserParams?: WebBrowserOpenOptions
  ): Promise<WebBrowserAuthSessionResult>
  // dismissAuthSession(): void;
  /**
   * Possibly completes an authentication session on web in a window popup. The method
   * should be invoked on the page that the window redirects to.
   *
   * @param options
   *
   * @return Returns an object with message about why the redirect failed or succeeded:
   *
   * If `type` is set to `failed`, the reason depends on the message:
   * - `Not supported on this platform`: If the platform doesn't support this method (iOS, Android).
   * - `Cannot use expo-web-browser in a non-browser environment`: If the code was executed in an SSR
   *   or node environment.
   * - `No auth session is currently in progress`: (the cached state wasn't found in local storage).
   *   This can happen if the window redirects to an origin (website) that is different to the initial
   *   website origin. If this happens in development, it may be because the auth started on localhost
   *   and finished on your computer port (Ex: `128.0.0.*`). This is controlled by the `redirectUrl`
   *   and `returnUrl`.
   * - `Current URL "<URL>" and original redirect URL "<URL>" do not match`: This can occur when the
   *   redirect URL doesn't match what was initial defined as the `returnUrl`. You can skip this test
   *   in development by passing `{ skipRedirectCheck: true }` to the function.
   *
   * If `type` is set to `success`, the parent window will attempt to close the child window immediately.
   *
   * If the error `ERR_WEB_BROWSER_REDIRECT` was thrown, it may mean that the parent window was
   * reloaded before the auth was completed. In this case you'll need to close the child window manually.
   *
   * @platform web
   */
  // maybeCompleteAuthSession(
  //   options?: WebBrowserCompleteAuthSessionOptions
  // ): WebBrowserCompleteAuthSessionResult;
}
