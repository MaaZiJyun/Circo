import AppKit
import WebKit

extension CircoWindowController {
  func webView(
    _ webView: WKWebView,
    runJavaScriptAlertPanelWithMessage message: String,
    initiatedByFrame frame: WKFrameInfo,
    completionHandler: @escaping () -> Void
  ) {
    presentJavaScriptAlert(message: message, confirmButtonOnly: true) { _ in
      completionHandler()
    }
  }

  func webView(
    _ webView: WKWebView,
    runJavaScriptConfirmPanelWithMessage message: String,
    initiatedByFrame frame: WKFrameInfo,
    completionHandler: @escaping (Bool) -> Void
  ) {
    presentJavaScriptAlert(message: message, confirmButtonOnly: false) {
      completionHandler($0)
    }
  }

  private func presentJavaScriptAlert(
    message: String,
    confirmButtonOnly: Bool,
    completion: @escaping (Bool) -> Void
  ) {
    guard let window else {
      completion(false)
      return
    }
    let alert = NSAlert()
    alert.messageText = "Circo"
    alert.informativeText = message
    alert.alertStyle = .informational
    alert.addButton(withTitle: "OK")
    if !confirmButtonOnly { alert.addButton(withTitle: "Cancel") }
    alert.beginSheetModal(for: window) { response in
      completion(response == .alertFirstButtonReturn)
    }
  }
}
