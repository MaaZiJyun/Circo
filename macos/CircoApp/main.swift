import AppKit
import Darwin
import Foundation

final class CircoAppDelegate: NSObject, NSApplicationDelegate {
  private var windowController: CircoWindowController!
  private var serverProcess: Process?
  private var serverPipe: Pipe?
  private var logHandle: FileHandle?
  private var ownsServer = false
  private var isTerminating = false
  private var terminationSources: [DispatchSourceSignal] = []

  private var projectPath: String {
    Bundle.main.object(forInfoDictionaryKey: "CircoProjectPath") as? String ?? ""
  }

  private var logURL: URL {
    FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Logs/Circo/circo.log")
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.regular)
    configureSignalHandling()
    configureMenu()
    prepareLog()
    windowController = CircoWindowController(logURL: logURL)
    windowController.showWindow(nil)
    windowController.window?.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
    launchServer()
    windowController.beginLoading()
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  func applicationWillTerminate(_ notification: Notification) {
    isTerminating = true
    stopOwnedServer()
    serverPipe?.fileHandleForReading.readabilityHandler = nil
    try? logHandle?.close()
  }

  private func configureMenu() {
    let mainMenu = NSMenu()
    let appItem = NSMenuItem()
    mainMenu.addItem(appItem)
    let appMenu = NSMenu()
    appMenu.addItem(withTitle: "关于 Circo", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "退出 Circo", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appItem.submenu = appMenu

    let viewItem = NSMenuItem()
    mainMenu.addItem(viewItem)
    let viewMenu = NSMenu(title: "显示")
    let reload = NSMenuItem(title: "重新加载 Circo", action: #selector(reloadWebApp), keyEquivalent: "r")
    reload.target = self
    viewMenu.addItem(reload)
    viewMenu.addItem(.separator())
    viewMenu.addItem(withTitle: "进入全屏幕", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
    viewItem.submenu = viewMenu
    NSApp.mainMenu = mainMenu
  }

  private func configureSignalHandling() {
    for value in [SIGTERM, SIGINT] {
      signal(value, SIG_IGN)
      let source = DispatchSource.makeSignalSource(signal: value, queue: .main)
      source.setEventHandler { NSApp.terminate(nil) }
      source.resume()
      terminationSources.append(source)
    }
  }

  private func prepareLog() {
    do {
      try FileManager.default.createDirectory(
        at: logURL.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )
      if !FileManager.default.fileExists(atPath: logURL.path) {
        FileManager.default.createFile(atPath: logURL.path, contents: nil)
      }
      logHandle = try FileHandle(forWritingTo: logURL)
      try logHandle?.seekToEnd()
      appendLog("\n\n=== Circo \(ISO8601DateFormatter().string(from: Date())) ===\n")
    } catch {
      NSLog("Unable to create Circo log: \(error.localizedDescription)")
    }
  }

  private func appendLog(_ text: String) {
    guard let data = text.data(using: .utf8) else { return }
    try? logHandle?.write(contentsOf: data)
  }

  private func launchServer() {
    guard FileManager.default.fileExists(atPath: "\(projectPath)/package.json") else {
      windowController.showLaunchError("找不到项目目录。请重新生成 Circo.app。")
      return
    }
    appendLog("Project: \(projectPath)\nCommand: npm run dev:all\n")
    let command = """
      export PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
      cd \(shellQuote(projectPath))
      exec npm run dev:all
      """
    let process = Process()
    let pipe = Pipe()
    process.executableURL = URL(fileURLWithPath: "/bin/zsh")
    process.arguments = ["-lc", command]
    process.currentDirectoryURL = URL(fileURLWithPath: projectPath)
    process.standardOutput = pipe
    process.standardError = pipe
    pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
      let data = handle.availableData
      guard !data.isEmpty else {
        handle.readabilityHandler = nil
        return
      }
      try? self?.logHandle?.write(contentsOf: data)
    }
    process.terminationHandler = { [weak self] process in
      DispatchQueue.main.async {
        guard let self, !self.isTerminating else { return }
        self.appendLog("Server process exited with code \(process.terminationStatus).\n")
        self.ownsServer = false
        self.serverProcess = nil
        if !self.windowController.hasLoaded && process.terminationStatus != 0 {
          self.windowController.showLaunchError(
            "后台服务退出（code \(process.terminationStatus)）。请查看日志。"
          )
        }
      }
    }
    do {
      try process.run()
      _ = setpgid(process.processIdentifier, process.processIdentifier)
      serverProcess = process
      serverPipe = pipe
      ownsServer = true
    } catch {
      appendLog("Launch failed: \(error.localizedDescription)\n")
      windowController.showLaunchError("无法启动后台服务：\(error.localizedDescription)")
    }
  }

  private func stopOwnedServer() {
    guard ownsServer, let process = serverProcess, process.isRunning else { return }
    appendLog("Stopping server…\n")
    if kill(-process.processIdentifier, SIGTERM) != 0 {
      process.terminate()
    }
    ownsServer = false
    serverProcess = nil
  }

  @objc private func reloadWebApp() {
    windowController.reloadApplication()
  }
}

private func shellQuote(_ value: String) -> String {
  "'" + value.replacingOccurrences(of: "'", with: "'\\''") + "'"
}

let application = NSApplication.shared
let applicationDelegate = CircoAppDelegate()
application.delegate = applicationDelegate
application.run()
