import AppKit
import WebKit

final class CircoWindowController: NSWindowController,
  NSWindowDelegate,
  WKNavigationDelegate,
  WKUIDelegate,
  WKDownloadDelegate
{
  private let appURL = URL(string: "http://localhost:1204")!
  private let logURL: URL
  private let webView: WKWebView
  private let loadingView = NSVisualEffectView()
  private let statusLabel = NSTextField(labelWithString: "正在启动 Circo…")
  private let detailLabel = NSTextField(labelWithString: "首次启动可能需要一些时间")
  private let progress = NSProgressIndicator()
  private var retryWorkItem: DispatchWorkItem?
  private var loadAttempts = 0
  private(set) var hasLoaded = false

  init(logURL: URL) {
    self.logURL = logURL
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.preferences.isElementFullscreenEnabled = true
    webView = WKWebView(frame: .zero, configuration: configuration)
    let window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1360, height: 860),
      styleMask: [.titled, .closable, .miniaturizable, .resizable],
      backing: .buffered,
      defer: false
    )
    window.title = "Circo"
    window.titlebarAppearsTransparent = false
    window.minSize = NSSize(width: 920, height: 640)
    window.center()
    super.init(window: window)
    window.delegate = self
    configureWebView()
    configureLoadingView()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func beginLoading() {
    hasLoaded = false
    loadAttempts = 0
    loadingView.isHidden = false
    progress.startAnimation(nil)
    statusLabel.stringValue = "正在启动 Circo…"
    detailLabel.stringValue = "正在连接本地应用 · localhost:1204"
    loadApplication()
  }

  func reloadApplication() {
    if hasLoaded {
      webView.reload()
    } else {
      retryWorkItem?.cancel()
      beginLoading()
    }
  }

  func showLaunchError(_ message: String) {
    guard !hasLoaded else { return }
    statusLabel.stringValue = "Circo 启动失败"
    detailLabel.stringValue = message
    progress.stopAnimation(nil)
    progress.isHidden = true
    loadingView.isHidden = false
  }

  private func configureWebView() {
    guard let contentView = window?.contentView else { return }
    webView.navigationDelegate = self
    webView.uiDelegate = self
    webView.allowsMagnification = true
    webView.setValue(false, forKey: "drawsBackground")
    webView.translatesAutoresizingMaskIntoConstraints = false
    contentView.addSubview(webView)
    NSLayoutConstraint.activate([
      webView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
      webView.topAnchor.constraint(equalTo: contentView.topAnchor),
      webView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
    ])
  }

  private func configureLoadingView() {
    guard let contentView = window?.contentView else { return }
    loadingView.material = .windowBackground
    loadingView.blendingMode = .withinWindow
    loadingView.state = .active
    loadingView.translatesAutoresizingMaskIntoConstraints = false

    let icon = NSImageView(image: NSApp.applicationIconImage)
    icon.imageScaling = .scaleProportionallyUpOrDown
    icon.translatesAutoresizingMaskIntoConstraints = false
    icon.widthAnchor.constraint(equalToConstant: 84).isActive = true
    icon.heightAnchor.constraint(equalToConstant: 84).isActive = true

    let title = NSTextField(labelWithString: "Circo")
    title.font = .systemFont(ofSize: 28, weight: .semibold)
    statusLabel.font = .systemFont(ofSize: 14, weight: .medium)
    detailLabel.font = .systemFont(ofSize: 12)
    detailLabel.textColor = .secondaryLabelColor
    detailLabel.alignment = .center

    progress.style = .spinning
    progress.controlSize = .small
    let retry = NSButton(title: "重新加载", target: self, action: #selector(retryLoading))
    retry.bezelStyle = .rounded
    let log = NSButton(title: "查看启动日志", target: self, action: #selector(showLog))
    log.bezelStyle = .rounded
    let buttons = NSStackView(views: [retry, log])
    buttons.orientation = .horizontal
    buttons.spacing = 8

    let stack = NSStackView(views: [icon, title, statusLabel, detailLabel, progress, buttons])
    stack.orientation = .vertical
    stack.alignment = .centerX
    stack.spacing = 12
    stack.translatesAutoresizingMaskIntoConstraints = false
    loadingView.addSubview(stack)
    contentView.addSubview(loadingView)
    NSLayoutConstraint.activate([
      loadingView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
      loadingView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
      loadingView.topAnchor.constraint(equalTo: contentView.topAnchor),
      loadingView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
      stack.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
      stack.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor),
    ])
  }

  private func loadApplication() {
    loadAttempts += 1
    webView.load(URLRequest(url: appURL, cachePolicy: .reloadIgnoringLocalCacheData))
  }

  private func scheduleRetry(after seconds: TimeInterval = 0.7) {
    guard !hasLoaded else { return }
    retryWorkItem?.cancel()
    if loadAttempts >= 130 {
      showLaunchError("连接超时。请查看启动日志后重试。")
      return
    }
    let work = DispatchWorkItem { [weak self] in self?.loadApplication() }
    retryWorkItem = work
    DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: work)
  }

  @objc private func retryLoading() {
    progress.isHidden = false
    beginLoading()
  }

  @objc private func showLog() {
    NSWorkspace.shared.open(logURL)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    hasLoaded = true
    retryWorkItem?.cancel()
    progress.stopAnimation(nil)
    loadingView.isHidden = true
  }

  func webView(
    _ webView: WKWebView,
    didFailProvisionalNavigation navigation: WKNavigation!,
    withError error: Error
  ) {
    scheduleRetry()
  }

  func webView(
    _ webView: WKWebView,
    didFail navigation: WKNavigation!,
    withError error: Error
  ) {
    scheduleRetry()
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }
    if navigationAction.shouldPerformDownload {
      decisionHandler(.download)
    } else if isAllowed(url) {
      decisionHandler(.allow)
    } else {
      if ["http", "https", "mailto"].contains(url.scheme ?? "") {
        NSWorkspace.shared.open(url)
      }
      decisionHandler(.cancel)
    }
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationResponse: WKNavigationResponse,
    decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
  ) {
    decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
  }

  func webView(
    _ webView: WKWebView,
    createWebViewWith configuration: WKWebViewConfiguration,
    for navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    if let url = navigationAction.request.url {
      if isAllowed(url) { webView.load(URLRequest(url: url)) }
      else { NSWorkspace.shared.open(url) }
    }
    return nil
  }

  func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
    download.delegate = self
  }

  func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
    download.delegate = self
  }

  func download(
    _ download: WKDownload,
    decideDestinationUsing response: URLResponse,
    suggestedFilename: String,
    completionHandler: @escaping (URL?) -> Void
  ) {
    let panel = NSSavePanel()
    panel.nameFieldStringValue = suggestedFilename
    panel.beginSheetModal(for: window!) { result in
      completionHandler(result == .OK ? panel.url : nil)
    }
  }

  private func isAllowed(_ url: URL) -> Bool {
    if ["about", "blob", "data"].contains(url.scheme ?? "") { return true }
    return ["127.0.0.1", "localhost"].contains(url.host ?? "") &&
      (url.port == nil || url.port == 1204)
  }
}
